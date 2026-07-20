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

_embedding_service = EmbeddingService()
_vector_service = VectorService()
_llm_service = LLMService()
_pdf_service = PDFService()
_chunk_service = ChunkService()
_retrieval_service = RetrievalService(_embedding_service, _vector_service)
_prompt_service = PromptService()
_intent_service = IntentService()
_citation_service = CitationService()
_response_formatter = ResponseFormatter()

def get_pdf_service() -> PDFService:
    return _pdf_service

def get_chunk_service() -> ChunkService:
    return _chunk_service

def get_embedding_service() -> EmbeddingService:
    return _embedding_service

def get_vector_service() -> VectorService:
    return _vector_service

def get_retrieval_service() -> RetrievalService:
    return _retrieval_service

def get_prompt_service() -> PromptService:
    return _prompt_service

def get_llm_service() -> LLMService:
    return _llm_service

def get_intent_service() -> IntentService:
    return _intent_service

def get_citation_service() -> CitationService:
    return _citation_service

def get_response_formatter() -> ResponseFormatter:
    return _response_formatter
