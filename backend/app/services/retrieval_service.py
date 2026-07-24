from typing import List, Dict, Any, Tuple
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService
from app.services.intent_service import IntentService, QueryIntent
from app.models.schemas import SearchResult
from app.core.config import settings
from app.core.logging import logger, log_execution_time

class RetrievalService:
    # Minimum vector similarity threshold to avoid guesswork and hallucinations
    CONFIDENCE_THRESHOLD = 0.35

    def __init__(self, embedding_service: EmbeddingService, vector_service: VectorService):
        self.embedding_service = embedding_service
        self.vector_service = vector_service

    async def retrieve_context_with_intent(self, question: str) -> Tuple[List[SearchResult], Dict[str, Any]]:
        """
        Adaptive vector retrieval guided by query intent classification & confidence thresholding.
        """
        intent_info = IntentService.detect_intent(question)
        intent = intent_info["intent"]
        is_full_doc = intent_info["is_full_document"]
        top_k = intent_info["top_k"]

        with log_execution_time(f"Adaptive retrieval (intent={intent}, k={top_k}) for: '{question[:50]}...'"):
            if is_full_doc:
                logger.info("Full document summary intent detected. Scrolling document chunks from Qdrant.")
                chunks = await self.vector_service.get_all_chunks(max_limit=100)
                confidence = "High" if len(chunks) > 0 else "Low"
                return chunks, {"intent": intent, "confidence": confidence, "top_k": len(chunks)}

            # Semantic Dense Search
            query_vector = self.embedding_service.generate_query_embedding(question)
            results = await self.vector_service.search_similar(query_vector=query_vector, top_k=top_k)

            # Confidence Threshold Evaluation
            top_score = results[0].score if results else 0.0
            if not results or top_score < self.CONFIDENCE_THRESHOLD:
                logger.warning(f"Retrieval confidence low (top_score={top_score:.3f} < threshold {self.CONFIDENCE_THRESHOLD}).")
                confidence = "Low"
                return results, {"intent": intent, "confidence": confidence, "top_k": top_k, "top_score": top_score}

            if top_score >= 0.70:
                confidence = "High"
            elif top_score >= 0.50:
                confidence = "Medium"
            else:
                confidence = "Low"

            logger.info(f"Retrieved {len(results)} chunks for intent '{intent}'. Top Score: {top_score:.3f}, Confidence: {confidence}")
            return results, {"intent": intent, "confidence": confidence, "top_k": top_k, "top_score": top_score}

    async def retrieve_context(self, question: str, top_k: int = None) -> List[SearchResult]:
        chunks, _ = await self.retrieve_context_with_intent(question)
        return chunks
