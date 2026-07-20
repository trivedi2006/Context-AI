from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class ServiceHealth(BaseModel):
    status: str
    details: Optional[str] = None

class ChunkMetadata(BaseModel):
    chunk_id: str
    document_name: str
    page_number: int
    source: str
    chunk_text: str

class UploadResponse(BaseModel):
    status: str
    document_name: str
    total_pages: int
    total_chunks: int
    timing_ms: Dict[str, float]

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="User question about the uploaded PDF")

class Citation(BaseModel):
    page_number: int
    source: str
    chunk_id: str
    excerpt: str

class SearchResult(BaseModel):
    chunk_id: str
    document_name: str
    page_number: int
    source: str
    chunk_text: str
    score: float

class ChatResponse(BaseModel):
    answer: str
    citations: List[Citation]
    timing_ms: Dict[str, float]
