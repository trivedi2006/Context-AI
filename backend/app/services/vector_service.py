import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient, AsyncQdrantClient
from qdrant_client.http import models as rest_models
from app.core.config import settings
from app.core.logging import logger, log_execution_time
from app.models.schemas import ChunkMetadata, SearchResult

class VectorService:
    def __init__(self):
        self.url = settings.QDRANT_URL
        self.api_key = settings.QDRANT_API_KEY
        self.collection_name = settings.COLLECTION_NAME
        self.vector_size = settings.EMBEDDING_VECTOR_DIM

        if self.url and self.api_key:
            self.client = QdrantClient(url=self.url, api_key=self.api_key)
            self.async_client = AsyncQdrantClient(url=self.url, api_key=self.api_key)
        elif self.url:
            self.client = QdrantClient(url=self.url)
            self.async_client = AsyncQdrantClient(url=self.url)
        else:
            # Fallback to in-memory Qdrant instance for development / test fallback
            logger.warning("No QDRANT_URL provided. Falling back to local in-memory Qdrant storage.")
            self.client = QdrantClient(":memory:")
            self.async_client = AsyncQdrantClient(":memory:")

    async def check_health(self) -> bool:
        try:
            collections = await self.async_client.get_collections()
            return True
        except Exception as e:
            logger.error(f"Qdrant health check failed: {str(e)}")
            return False

    async def init_collection(self, force_recreate: bool = True):
        """
        Creates or resets the Qdrant collection for single-document isolated state.
        """
        try:
            exists = await self.async_client.collection_exists(self.collection_name)
            if exists and force_recreate:
                await self.async_client.delete_collection(self.collection_name)
                logger.info(f"Deleted existing Qdrant collection '{self.collection_name}'")

            if not exists or force_recreate:
                await self.async_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=rest_models.VectorParams(
                        size=self.vector_size,
                        distance=rest_models.Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection '{self.collection_name}' (dim={self.vector_size})")
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant collection: {str(e)}")
            raise

    async def upsert_chunks(self, chunks: List[ChunkMetadata], embeddings: List[List[float]]):
        """
        Stores chunks and vector embeddings into Qdrant Cloud.
        """
        if not chunks or not embeddings:
            return

        with log_execution_time(f"Upserting {len(chunks)} vectors to Qdrant"):
            points = []
            for chunk, emb in zip(chunks, embeddings):
                # Ensure a valid UUID for Qdrant point ID
                point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.chunk_id))
                payload = {
                    "chunk_id": chunk.chunk_id,
                    "document_name": chunk.document_name,
                    "page_number": chunk.page_number,
                    "source": chunk.source,
                    "chunk_text": chunk.chunk_text
                }
                points.append(
                    rest_models.PointStruct(
                        id=point_id,
                        vector=emb,
                        payload=payload
                    )
                )

            await self.async_client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info(f"Successfully upserted {len(points)} vectors to Qdrant Cloud.")

    async def search_similar(self, query_vector: List[float], top_k: int = 5) -> List[SearchResult]:
        """
        Executes Dense Retrieval in Qdrant.
        """
        with log_execution_time(f"Searching Qdrant for top {top_k} vectors"):
            try:
                if hasattr(self.async_client, "query_points"):
                    res = await self.async_client.query_points(
                        collection_name=self.collection_name,
                        query=query_vector,
                        limit=top_k
                    )
                    results = res.points
                else:
                    results = await self.async_client.search(
                        collection_name=self.collection_name,
                        query_vector=query_vector,
                        limit=top_k
                    )

                search_results = []
                for point in results:
                    payload = point.payload or {}
                    search_results.append(SearchResult(
                        chunk_id=payload.get("chunk_id", ""),
                        document_name=payload.get("document_name", ""),
                        page_number=payload.get("page_number", 0),
                        source=payload.get("source", ""),
                        chunk_text=payload.get("chunk_text", ""),
                        score=float(point.score if hasattr(point, 'score') else 1.0)
                    ))
                return search_results
            except Exception as e:
                logger.error(f"Error during Qdrant vector search: {str(e)}", exc_info=True)
                return []

    async def get_page_chunks(self, page_number: int = 1, limit: int = 3) -> List[SearchResult]:
        """
        Retrieves text chunks for a specific page number (e.g. Page 1 for paper overview/title/first topic).
        """
        try:
            scroll_filter = rest_models.Filter(
                must=[
                    rest_models.FieldCondition(
                        key="page_number",
                        match=rest_models.MatchValue(value=page_number)
                    )
                ]
            )
            records, _ = await self.async_client.scroll(
                collection_name=self.collection_name,
                scroll_filter=scroll_filter,
                limit=limit
            )

            results = []
            for point in records:
                payload = point.payload or {}
                results.append(SearchResult(
                    chunk_id=payload.get("chunk_id", ""),
                    document_name=payload.get("document_name", ""),
                    page_number=payload.get("page_number", page_number),
                    source=payload.get("source", ""),
                    chunk_text=payload.get("chunk_text", ""),
                    score=1.0
                ))
            return results
        except Exception as e:
            logger.error(f"Error fetching page {page_number} chunks: {str(e)}")
    async def get_all_chunks(self, max_limit: int = 100) -> List[SearchResult]:
        """
        Retrieves all available document chunks from Qdrant for full document summaries.
        """
        try:
            records, _ = await self.async_client.scroll(
                collection_name=self.collection_name,
                limit=max_limit
            )
            results = []
            for point in records:
                payload = point.payload or {}
                results.append(SearchResult(
                    chunk_id=payload.get("chunk_id", ""),
                    document_name=payload.get("document_name", ""),
                    page_number=payload.get("page_number", 1),
                    source=payload.get("source", ""),
                    chunk_text=payload.get("chunk_text", ""),
                    score=1.0
                ))
            # Sort by page number & chunk_id for logical reading order
            results.sort(key=lambda x: (x.page_number, x.chunk_id))
            return results
        except Exception as e:
            logger.error(f"Error fetching all document chunks: {str(e)}")
            return []

    async def delete_collection(self):
        """
        Deletes the document vector collection for resetting state.
        """
        try:
            exists = await self.async_client.collection_exists(self.collection_name)
            if exists:
                await self.async_client.delete_collection(self.collection_name)
                logger.info(f"Successfully deleted Qdrant collection '{self.collection_name}'")
        except Exception as e:
            logger.error(f"Error deleting collection: {str(e)}")
            raise
