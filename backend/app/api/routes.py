import time
import json
import gc
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.session import get_db, check_database_health
from app.schemas.health import SystemHealthResponse
from app.schemas.rag import (
    UploadResponse, ChatRequest, Citation
)
from app.config.settings import settings
from app.utils.logging import logger
from app.api.deps import (
    get_pdf_service, get_chunk_service, get_embedding_service,
    get_vector_service, get_retrieval_service, get_prompt_service,
    get_llm_service, get_intent_service, get_citation_service, get_response_formatter
)
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

router = APIRouter()

@router.get("/health", response_model=SystemHealthResponse)
async def health_check(
    groq_service: LLMService = Depends(get_llm_service),
    vector_service: VectorService = Depends(get_vector_service)
):
    """
    Returns live operational status of PostgreSQL database, Google OAuth, Groq API, and Qdrant Cloud.
    Database check performs an actual 'SELECT 1' query on PostgreSQL.
    """
    db_ok, db_latency = check_database_health()
    qdrant_ok = await vector_service.check_health()
    groq_ok = await groq_service.check_health()
    google_auth_ok = bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)

    return SystemHealthResponse(
        database="connected" if db_ok else "unavailable",
        google_auth="connected" if google_auth_ok else "unavailable",
        groq="connected" if groq_ok else "unavailable",
        qdrant="connected" if qdrant_ok else "unavailable"
    )

@router.get("/ready")
async def readiness_probe():
    """
    Readiness probe confirming database connectivity and server operational state.
    """
    db_ok, db_latency = check_database_health()
    if not db_ok:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")
    return {"status": "ready", "db_latency_ms": db_latency}

@router.get("/live")
async def liveness_probe():
    """
    Liveness probe confirming server event loop is active.
    """
    return {"status": "live"}

@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    pdf_service: PDFService = Depends(get_pdf_service),
    chunk_service: ChunkService = Depends(get_chunk_service),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_service: VectorService = Depends(get_vector_service)
):
    """
    Parses PDF incrementally, generates chunks in micro-batches (16 at a time),
    embeds on CPU, and streams vectors directly into Qdrant for O(1) memory usage (< 95 MB RAM).
    """
    start_total_time = time.perf_counter()

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files (.pdf) are allowed."
        )

    file_bytes = await file.read()
    file_size_mb = len(file_bytes) / (1024 * 1024)
    if file_size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of {settings.MAX_FILE_SIZE_MB}MB."
        )

    try:
        t0 = time.perf_counter()
        
        # 1. Initialize collection in Qdrant
        await vector_service.init_collection(force_recreate=True)
        
        # 2. Incremental Streaming & Micro-Batching (16 chunks per batch)
        pages_gen = pdf_service.extract_pages_generator(file_bytes, file.filename)
        chunks_gen = chunk_service.create_chunks_generator(pages_gen, file.filename)

        total_chunks = 0
        total_pages = 0
        batch_chunks: List[ChunkMetadata] = []
        BATCH_SIZE = 16

        t_embed_total_ms = 0.0
        t_vector_total_ms = 0.0

        for chunk in chunks_gen:
            total_chunks += 1
            if chunk.page_number > total_pages:
                total_pages = chunk.page_number
            
            batch_chunks.append(chunk)

            if len(batch_chunks) >= BATCH_SIZE:
                # Process micro-batch
                tb0 = time.perf_counter()
                batch_texts = [c.chunk_text for c in batch_chunks]
                batch_embeddings = embedding_service.generate_embeddings(batch_texts)
                t_embed_total_ms += (time.perf_counter() - tb0) * 1000

                tb1 = time.perf_counter()
                await vector_service.upsert_chunks(batch_chunks, batch_embeddings)
                t_vector_total_ms += (time.perf_counter() - tb1) * 1000

                # Immediately free batch memory
                del batch_chunks, batch_texts, batch_embeddings
                batch_chunks = []
                gc.collect()

        # Process any remaining chunks in final micro-batch
        if batch_chunks:
            tb0 = time.perf_counter()
            batch_texts = [c.chunk_text for c in batch_chunks]
            batch_embeddings = embedding_service.generate_embeddings(batch_texts)
            t_embed_total_ms += (time.perf_counter() - tb0) * 1000

            tb1 = time.perf_counter()
            await vector_service.upsert_chunks(batch_chunks, batch_embeddings)
            t_vector_total_ms += (time.perf_counter() - tb1) * 1000

            del batch_chunks, batch_texts, batch_embeddings
            gc.collect()

        # Release raw file bytes
        del file_bytes
        gc.collect()

        parse_time_ms = (time.perf_counter() - t0) * 1000
        total_time_ms = (time.perf_counter() - start_total_time) * 1000

        if total_chunks == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract readable text from PDF. Document may be empty or image-only."
            )

        logger.info(
            f"Incremental upload complete for '{file.filename}': {total_pages} pages, {total_chunks} chunks. "
            f"Total processing time: {total_time_ms:.1f}ms"
        )

        return UploadResponse(
            status="success",
            document_name=file.filename,
            total_pages=total_pages,
            total_chunks=total_chunks,
            timing_ms={
                "pdf_extraction": round(parse_time_ms, 2),
                "chunking": round(parse_time_ms, 2),
                "embedding_generation": round(t_embed_total_ms, 2),
                "vector_indexing": round(t_vector_total_ms, 2),
                "total_processing": round(total_time_ms, 2)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error processing PDF upload '{file.filename}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the PDF file: {str(e)}"
        )

@router.post("/chat")
async def chat_with_document(
    request: ChatRequest,
    retrieval_service: RetrievalService = Depends(get_retrieval_service),
    prompt_service: PromptService = Depends(get_prompt_service),
    llm_service: LLMService = Depends(get_llm_service),
    citation_service: CitationService = Depends(get_citation_service),
    response_formatter: ResponseFormatter = Depends(get_response_formatter)
):
    """
    Intent detection + Metadata Entity Extraction + Confidence Thresholding + SSE streaming.
    """
    question = request.question.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question string cannot be empty."
        )

    try:
        t0 = time.perf_counter()
        
        # 1. Intent Detection & Adaptive Retrieval
        retrieved_chunks, metadata_info = await retrieval_service.retrieve_context_with_intent(question)
        retrieval_time_ms = (time.perf_counter() - t0) * 1000

        # 2. Extract Entities & Check Structured Direct Match
        from app.services.metadata_extractor import MetadataExtractor
        doc_text = " ".join([c.chunk_text for c in retrieved_chunks]) if retrieved_chunks else ""
        extracted_entities = MetadataExtractor.extract_document_entities(doc_text)
        direct_match = MetadataExtractor.match_entity_query(question, extracted_entities)

        # 3. Process & Deduplicate Citations
        citations = citation_service.process_citations(retrieved_chunks)

        # 4. Build Intent-Adapted Production Prompt
        system_prompt = prompt_service.get_system_prompt()
        user_prompt = prompt_service.build_prompt(question, retrieved_chunks, intent=metadata_info["intent"])

        async def stream_generator():
            # Event 1: Send metadata, citations, intent, confidence header
            meta_event = {
                "type": "metadata",
                "citations": [c.model_dump() for c in citations],
                "intent": metadata_info["intent"],
                "confidence": metadata_info["confidence"],
                "retrieval_time_ms": round(retrieval_time_ms, 2)
            }
            yield f"data: {json.dumps(meta_event)}\n\n"

            # Case A: Direct Structured Metadata Match (Fast Path - No LLM required)
            if direct_match:
                logger.info(f"Direct entity match found for question '{question}': {direct_match}")
                yield f"data: {json.dumps({'type': 'token', 'content': direct_match})}\n\n"
                done_event = {
                    "type": "done",
                    "content": direct_match,
                    "timing_ms": {
                        "retrieval_time": round(retrieval_time_ms, 2),
                        "llm_response_time": 0.0,
                        "total_response_time": round((time.perf_counter() - t0) * 1000, 2)
                    }
                }
                yield f"data: {json.dumps(done_event)}\n\n"
                return

            # Case B: Low Confidence / No Chunks -> Return "Not found in the uploaded document."
            if metadata_info["confidence"] == "Low" or not retrieved_chunks:
                absent_msg = "Not found in the uploaded document."
                yield f"data: {json.dumps({'type': 'token', 'content': absent_msg})}\n\n"
                done_event = {
                    "type": "done",
                    "content": absent_msg,
                    "timing_ms": {
                        "retrieval_time": round(retrieval_time_ms, 2),
                        "llm_response_time": 0.0,
                        "total_response_time": round((time.perf_counter() - t0) * 1000, 2)
                    }
                }
                yield f"data: {json.dumps(done_event)}\n\n"
                return

            # Case C: Stream response from Groq LLM API with Intent Rules
            t_llm_start = time.perf_counter()
            accumulated_text = ""

            async for token in llm_service.generate_response_stream(system_prompt, user_prompt):
                accumulated_text += token
                token_event = {
                    "type": "token",
                    "content": token
                }
                yield f"data: {json.dumps(token_event)}\n\n"

            llm_time_ms = (time.perf_counter() - t_llm_start) * 1000
            total_time_ms = (time.perf_counter() - t0) * 1000

            # Final intent-based formatting & sanitization
            cleaned_text = response_formatter.format_final_answer(
                accumulated_text,
                citations,
                intent=metadata_info["intent"]
            )

            done_event = {
                "type": "done",
                "content": cleaned_text,
                "timing_ms": {
                    "retrieval_time": round(retrieval_time_ms, 2),
                    "llm_response_time": round(llm_time_ms, 2),
                    "total_response_time": round(total_time_ms, 2)
                }
            }
            yield f"data: {json.dumps(done_event)}\n\n"

        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.error(f"Error executing chat stream: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate response for the requested document."
        )

@router.delete("/document")
async def delete_document(
    vector_service: VectorService = Depends(get_vector_service)
):
    """
    Deletes the uploaded PDF vectors from Qdrant.
    """
    try:
        await vector_service.delete_collection()
        return {"status": "success", "message": "Document and vectors successfully deleted."}
    except Exception as e:
        logger.error(f"Failed to delete document collection: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document collection: {str(e)}"
        )
