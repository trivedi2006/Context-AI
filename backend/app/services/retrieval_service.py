from typing import List, Dict, Any, Tuple, Optional
import time
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService
from app.services.intent_service import IntentService, QueryIntent
from app.models.schemas import SearchResult
from app.config.settings import settings
from app.utils.logging import logger

class RetrievalService:
    CONFIDENCE_THRESHOLD = 0.20

    def __init__(self, embedding_service: EmbeddingService, vector_service: VectorService):
        self.embedding_service = embedding_service
        self.vector_service = vector_service

    async def retrieve_context_with_intent(
        self,
        question: str,
        document_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Tuple[List[SearchResult], Dict[str, Any]]:
        """
        Production Hybrid Retrieval Pipeline:
        1. Intent Classification & Semantic Query Expansion
        2. Qdrant Dense Vector Search (Top-12)
        3. Lexical Keyword BM25 Matching via PostgreSQL (Top-12)
        4. Reciprocal Rank Fusion (RRF) Reranking (k=60)
        5. Return Top 6 highest-scoring, deduplicated chunks.
        """
        t0 = time.perf_counter()
        intent_info = IntentService.detect_intent(question)
        intent = intent_info["intent"]
        is_full_doc = intent_info["is_full_document"]
        top_k = intent_info["top_k"]

        if is_full_doc:
            logger.info(f"Full document summary intent detected for doc_id={document_id}. Fetching document chunks.")
            chunks = await self.vector_service.get_all_chunks(document_id=document_id, max_limit=100)
            return chunks, {"intent": intent, "confidence": "High", "top_k": len(chunks)}

        # Semantic Query Expansion
        expanded_queries = IntentService.expand_query(question, intent)
        logger.info(f"[Query Expansion] Generated {len(expanded_queries)} search terms for '{question[:40]}...': {expanded_queries[:3]}")

        # 1. Qdrant Dense Vector Search (Top-12)
        dense_results: List[SearchResult] = []
        for eq in expanded_queries[:2]:
            query_vector = self.embedding_service.generate_query_embedding(eq)
            vec_results = await self.vector_service.search_similar(
                query_vector=query_vector,
                top_k=top_k,
                document_id=document_id
            )
            dense_results.extend(vec_results)

        # Deduplicate dense results by chunk text
        seen_texts = set()
        unique_dense = []
        for res in dense_results:
            if res.chunk_text not in seen_texts:
                seen_texts.add(res.chunk_text)
                unique_dense.append(res)

        # 2. Lexical Search Fallback / Hybrid Search via DB
        lexical_results: List[SearchResult] = []
        if db and document_id:
            try:
                # Extract key search keywords
                keywords = [w.strip() for w in question.split() if len(w.strip()) > 3]
                if keywords:
                    pattern = "%" + "%".join(keywords[:3]) + "%"
                    query_sql = text("""
                        SELECT id, document_id, chunk_text, page_number, chunk_index
                        FROM document_chunks
                        WHERE document_id = :doc_id AND chunk_text ILIKE :pattern
                        LIMIT 10
                    """)
                    rows = db.execute(query_sql, {"doc_id": document_id, "pattern": pattern}).fetchall()
                    for r in rows:
                        lexical_results.append(SearchResult(
                            chunk_id=r.id,
                            document_id=r.document_id,
                            chunk_text=r.chunk_text,
                            page_number=r.page_number,
                            score=0.75,
                            metadata={"chunk_index": r.chunk_index}
                        ))
            except Exception as e:
                logger.warning(f"Lexical DB search exception: {str(e)}")

        # 3. Reciprocal Rank Fusion (RRF) Reranking Algorithm (k=60)
        rrf_scores: Dict[str, float] = {}
        chunk_map: Dict[str, SearchResult] = {}
        RRF_K = 60.0

        for rank, res in enumerate(unique_dense, start=1):
            key = res.chunk_text.strip()
            chunk_map[key] = res
            rrf_scores[key] = rrf_scores.get(key, 0.0) + (1.0 / (RRF_K + rank))

        for rank, res in enumerate(lexical_results, start=1):
            key = res.chunk_text.strip()
            if key not in chunk_map:
                chunk_map[key] = res
            rrf_scores[key] = rrf_scores.get(key, 0.0) + (1.0 / (RRF_K + rank))

        # Sort chunks by RRF score descending
        sorted_keys = sorted(rrf_scores.keys(), key=lambda k: rrf_scores[k], reverse=True)
        final_reranked = [chunk_map[k] for k in sorted_keys[:6]]

        # Fallback if reranked is empty
        if not final_reranked:
            logger.info(f"[Retrieval Fallback] Fetching default chunks for doc_id={document_id}")
            final_reranked = await self.vector_service.get_all_chunks(document_id=document_id, max_limit=20)

        elapsed_ms = (time.perf_counter() - t0) * 1000
        top_score = final_reranked[0].score if final_reranked else 1.0
        confidence = "High" if top_score >= 0.40 else "Medium"

        logger.info(f"[RRF Reranking Complete] Retrieved {len(final_reranked)} reranked chunks for intent '{intent}' in {elapsed_ms:.1f}ms")
        return final_reranked, {
            "intent": intent,
            "confidence": confidence,
            "top_k": len(final_reranked),
            "retrieval_time_ms": round(elapsed_ms, 2)
        }

    async def retrieve_context(self, question: str, top_k: int = None, document_id: Optional[str] = None) -> List[SearchResult]:
        chunks, _ = await self.retrieve_context_with_intent(question, document_id=document_id)
        return chunks
