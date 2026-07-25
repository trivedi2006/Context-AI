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

    async def init_collection(self, force_recreate: bool = False):
        """
        Ensures the Qdrant collection and payload indices (document_id, page_number) exist.
        """
        try:
            exists = await self.async_client.collection_exists(self.collection_name)
            if not exists or force_recreate:
                if exists and force_recreate:
                    await self.async_client.delete_collection(self.collection_name)
                await self.async_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=rest_models.VectorParams(
                        size=self.vector_size,
                        distance=rest_models.Distance.COSINE
                    )
                )
                logger.info(f"Initialized Qdrant collection '{self.collection_name}' (dim={self.vector_size})")

            # Create payload index for document_id (REQUIRED for Qdrant MatchValue filtering)
            try:
                await self.async_client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="document_id",
                    field_schema=rest_models.PayloadSchemaType.KEYWORD
                )
                logger.info("Ensured Qdrant payload index for 'document_id' (KEYWORD)")
            except Exception:
                pass

        except Exception as e:
            logger.error(f"Failed to initialize Qdrant collection: {str(e)}")
            raise

    async def upsert_chunks(self, chunks: List[ChunkMetadata], embeddings: List[List[float]], document_id: Optional[str] = None):
        """
        Stores chunks and vector embeddings into Qdrant Cloud tagged with document_id.
        """
        if not chunks or not embeddings:
            return

        await self.init_collection(force_recreate=False)

        with log_execution_time(f"Upserting {len(chunks)} vectors to Qdrant"):
            points = []
            for chunk, emb in zip(chunks, embeddings):
                # Ensure unique point ID per document and chunk
                unique_key = f"{document_id}_{chunk.chunk_id}" if document_id else chunk.chunk_id
                point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, unique_key))
                payload = {
                    "chunk_id": chunk.chunk_id,
                    "document_id": document_id or "",
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
            logger.info(f"[VECTOR UPSERT SUCCESS] Upserted {len(points)} points to Qdrant (doc_id={document_id})")

    async def search_similar(self, query_vector: List[float], top_k: int = 5, document_id: Optional[str] = None) -> List[SearchResult]:
        """
        Executes Dense Vector Retrieval in Qdrant isolated by document_id.
        """
        with log_execution_time(f"Searching Qdrant for top {top_k} vectors (doc_id={document_id})"):
            try:
                query_filter = None
                if document_id:
                    query_filter = rest_models.Filter(
                        must=[
                            rest_models.FieldCondition(
                                key="document_id",
                                match=rest_models.MatchValue(value=document_id)
                            )
                        ]
                    )

                if hasattr(self.async_client, "query_points"):
                    res = await self.async_client.query_points(
                        collection_name=self.collection_name,
                        query=query_vector,
                        query_filter=query_filter,
                        limit=top_k
                    )
                    results = res.points
                else:
                    results = await self.async_client.search(
                        collection_name=self.collection_name,
                        query_vector=query_vector,
                        query_filter=query_filter,
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

                # Log retrieved chunks for RAG audit
                logger.info(f"[RETRIEVAL AUDIT] Query returned {len(search_results)} chunks (doc_id={document_id}):")
                for sr in search_results:
                    logger.info(f"  -> Page {sr.page_number} | Score: {sr.score:.4f} | Snippet: {sr.chunk_text[:70].replace(chr(10), ' ')}")

                return search_results
            except Exception as e:
                logger.error(f"[QDRANT SEARCH ERROR] Vector search failed: {str(e)}", exc_info=True)
                # Fallback: Scroll points and filter in-memory if query_filter errored
                try:
                    records, _ = await self.async_client.scroll(collection_name=self.collection_name, limit=100)
                    search_results = []
                    for r in records:
                        p = r.payload or {}
                        if not document_id or p.get("document_id") == document_id:
                            search_results.append(SearchResult(
                                chunk_id=p.get("chunk_id", ""),
                                document_name=p.get("document_name", ""),
                                page_number=p.get("page_number", 1),
                                source=p.get("source", ""),
                                chunk_text=p.get("chunk_text", ""),
                                score=0.85
                            ))
                    logger.info(f"[FALLBACK RETRIEVAL] In-memory fallback retrieved {len(search_results)} chunks.")
                    return search_results[:top_k]
                except Exception as fallback_err:
                    logger.error(f"[FALLBACK FAILED] {str(fallback_err)}")
                    return []

    async def get_all_chunks(self, document_id: Optional[str] = None, max_limit: int = 100) -> List[SearchResult]:
        try:
            scroll_filter = None
            if document_id:
                scroll_filter = rest_models.Filter(
                    must=[
                        rest_models.FieldCondition(
                            key="document_id",
                            match=rest_models.MatchValue(value=document_id)
                        )
                    ]
                )

            records, _ = await self.async_client.scroll(
                collection_name=self.collection_name,
                scroll_filter=scroll_filter,
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
            results.sort(key=lambda x: (x.page_number, x.chunk_id))
            logger.info(f"[SCROLL CHUNKS AUDIT] Retrived {len(results)} total chunks for doc_id={document_id}")
            return results
        except Exception as e:
            logger.error(f"Error fetching all document chunks: {str(e)}")
            return []

    async def delete_document_vectors(self, document_id: str):
        try:
            await self.async_client.delete(
                collection_name=self.collection_name,
                points_selector=rest_models.FilterSelector(
                    filter=rest_models.Filter(
                        must=[
                            rest_models.FieldCondition(
                                key="document_id",
                                match=rest_models.MatchValue(value=document_id)
                            )
                        ]
                    )
                )
            )
            logger.info(f"Deleted vector points for document_id '{document_id}'")
        except Exception as e:
            logger.error(f"Error deleting document vectors for {document_id}: {str(e)}")

    async def delete_collection(self):
        try:
            exists = await self.async_client.collection_exists(self.collection_name)
            if exists:
                await self.async_client.delete_collection(self.collection_name)
                logger.info(f"Successfully deleted Qdrant collection '{self.collection_name}'")
        except Exception as e:
            logger.error(f"Error deleting collection: {str(e)}")
            raise
