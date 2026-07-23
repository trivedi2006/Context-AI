from app.services.pdf_service import PDFService
from app.services.chunk_service import ChunkService
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService
from app.services.retrieval_service import RetrievalService
from app.services.prompt_service import PromptService
from app.services.llm_service import LLMService
from app.services.intent_service import IntentService
from app.services.citation_service import CitationService
from app.services.response_formatter import ResponseFormatter

# Global Lazy Singletons
_pdf_service = None
_chunk_service = None
_embedding_service = None
_vector_service = None
_retrieval_service = None
_prompt_service = None
_llm_service = None
_intent_service = None
_citation_service = None
_response_formatter = None

def get_pdf_service() -> PDFService:
    global _pdf_service
    if _pdf_service is None:
        _pdf_service = PDFService()
    return _pdf_service

def get_chunk_service() -> ChunkService:
    global _chunk_service
    if _chunk_service is None:
        _chunk_service = ChunkService()
    return _chunk_service

def get_embedding_service() -> EmbeddingService:
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service

def get_vector_service() -> VectorService:
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorService()
    return _vector_service

def get_retrieval_service() -> RetrievalService:
    global _retrieval_service
    if _retrieval_service is None:
        _retrieval_service = RetrievalService(get_embedding_service(), get_vector_service())
    return _retrieval_service

def get_prompt_service() -> PromptService:
    global _prompt_service
    if _prompt_service is None:
        _prompt_service = PromptService()
    return _prompt_service

def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service

def get_intent_service() -> IntentService:
    global _intent_service
    if _intent_service is None:
        _intent_service = IntentService()
    return _intent_service

def get_citation_service() -> CitationService:
    global _citation_service
    if _citation_service is None:
        _citation_service = CitationService()
    return _citation_service

def get_response_formatter() -> ResponseFormatter:
    global _response_formatter
    if _response_formatter is None:
        _response_formatter = ResponseFormatter()
    return _response_formatter
