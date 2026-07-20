from typing import List, Dict, Any, Tuple
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService
from app.services.intent_service import IntentService, QueryIntent
from app.models.schemas import SearchResult
from app.core.config import settings
from app.core.logging import logger, log_execution_time

class RetrievalService:
    def __init__(self, embedding_service: EmbeddingService, vector_service: VectorService):
        self.embedding_service = embedding_service
        self.vector_service = vector_service

    async def retrieve_context_with_intent(self, question: str) -> Tuple[List[SearchResult], Dict[str, Any]]:
        """
        Adaptive retrieval based on query intent classification.
        Returns retrieved chunks along with intent metadata & confidence estimation.
        """
        intent_info = IntentService.detect_intent(question)
        intent = intent_info["intent"]
        is_full_doc = intent_info["is_full_document"]
        top_k = intent_info["top_k"]

        with log_execution_time(f"Adaptive retrieval (intent={intent}, k={top_k}) for: '{question[:50]}...'"):
            if is_full_doc:
                logger.info("Full document summary intent detected. Scrolling all document chunks from Qdrant.")
                chunks = await self.vector_service.get_all_chunks(max_limit=100)
                confidence = "High" if len(chunks) > 0 else "Low"
                return chunks, {"intent": intent, "confidence": confidence, "top_k": len(chunks)}

            # Semantic Dense Search
            query_vector = self.embedding_service.generate_query_embedding(question)
            results = await self.vector_service.search_similar(query_vector=query_vector, top_k=top_k)

            # Ensure Page 1 is present for broad overview context if missing
            has_page_1 = any(r.page_number == 1 for r in results)
            if not has_page_1 and results:
                page_1_chunks = await self.vector_service.get_page_chunks(page_number=1, limit=2)
                existing_ids = {r.chunk_id for r in results}
                for p1 in page_1_chunks:
                    if p1.chunk_id not in existing_ids:
                        results.append(p1)

            # Internal Confidence Estimation
            top_score = results[0].score if results else 0.0
            if top_score >= 0.70 or len(results) >= 5:
                confidence = "High"
            elif top_score >= 0.50:
                confidence = "Medium"
            else:
                confidence = "Low"

            logger.info(f"Retrieved {len(results)} chunks for intent '{intent}'. Confidence: {confidence}")
            return results, {"intent": intent, "confidence": confidence, "top_k": top_k}

    async def retrieve_context(self, question: str, top_k: int = None) -> List[SearchResult]:
        chunks, _ = await self.retrieve_context_with_intent(question)
        return chunks
