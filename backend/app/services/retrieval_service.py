from typing import List, Dict, Any, Tuple, Optional
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService
from app.services.intent_service import IntentService, QueryIntent
from app.models.schemas import SearchResult
from app.core.config import settings
from app.core.logging import logger, log_execution_time

class RetrievalService:
    CONFIDENCE_THRESHOLD = 0.20

    def __init__(self, embedding_service: EmbeddingService, vector_service: VectorService):
        self.embedding_service = embedding_service
        self.vector_service = vector_service

    async def retrieve_context_with_intent(
        self,
        question: str,
        document_id: Optional[str] = None
    ) -> Tuple[List[SearchResult], Dict[str, Any]]:
        """
        Adaptive vector retrieval guided by query intent classification & document_id isolation.
        """
        intent_info = IntentService.detect_intent(question)
        intent = intent_info["intent"]
        is_full_doc = intent_info["is_full_document"]
        top_k = intent_info["top_k"]

        with log_execution_time(f"Adaptive retrieval (intent={intent}, k={top_k}, doc_id={document_id}) for: '{question[:50]}...'"):
            if is_full_doc:
                logger.info(f"Full document summary intent detected for doc_id={document_id}. Scrolling chunks.")
                chunks = await self.vector_service.get_all_chunks(document_id=document_id, max_limit=100)
                return chunks, {"intent": intent, "confidence": "High", "top_k": len(chunks)}

            # Semantic Dense Search
            query_vector = self.embedding_service.generate_query_embedding(question)
            results = await self.vector_service.search_similar(
                query_vector=query_vector,
                top_k=top_k,
                document_id=document_id
            )

            # Fallback to fetching document chunks if search returned no results
            if not results:
                logger.info(f"Dense search returned 0 results for doc_id={document_id}. Falling back to document chunks.")
                results = await self.vector_service.get_all_chunks(document_id=document_id, max_limit=20)

            top_score = results[0].score if results else 1.0
            confidence = "High" if top_score >= 0.50 else "Medium"

            logger.info(f"Retrieved {len(results)} chunks for intent '{intent}'. Top Score: {top_score:.3f}, Confidence: {confidence}")
            return results, {"intent": intent, "confidence": confidence, "top_k": len(results), "top_score": top_score}

    async def retrieve_context(self, question: str, top_k: int = None, document_id: Optional[str] = None) -> List[SearchResult]:
        chunks, _ = await self.retrieve_context_with_intent(question, document_id=document_id)
        return chunks
