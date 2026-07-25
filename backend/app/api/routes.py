import time
import json
import gc
import hashlib
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status, BackgroundTasks, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.session import get_db, check_database_health
from app.schemas.health import SystemHealthResponse
from app.schemas.rag import UploadResponse, ChatRequest, Citation
from app.config.settings import settings
from app.utils.logging import logger

from app.services.pdf_service import PDFService
from app.services.chunk_service import ChunkService
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService
from app.services.retrieval_service import RetrievalService
from app.services.prompt_service import PromptService
from app.services.llm_service import LLMService
from app.services.citation_service import CitationService
from app.services.response_formatter import ResponseFormatter
from app.services.background_ingestion_service import process_document_background

from app.api.deps import (
    get_pdf_service, get_chunk_service, get_embedding_service,
    get_vector_service, get_retrieval_service, get_prompt_service,
    get_llm_service, get_citation_service, get_response_formatter
)
from app.auth.dependencies import get_current_user, get_current_user_optional
from app.models.user import User

from app.repositories.document_repository import DocumentRepository
from app.repositories.document_chunk_repository import DocumentChunkRepository
from app.repositories.chat_repository import ChatRepository
from app.repositories.message_repository import MessageRepository

router = APIRouter()

@router.get("/health", response_model=SystemHealthResponse)
async def health_check(
    groq_service: LLMService = Depends(get_llm_service),
    vector_service: VectorService = Depends(get_vector_service)
):
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
    db_ok, db_latency = check_database_health()
    if not db_ok:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")
    return {"status": "ready", "db_latency_ms": db_latency}

@router.get("/live")
async def liveness_probe():
    return {"status": "live"}

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    pdf_service: PDFService = Depends(get_pdf_service),
    chunk_service: ChunkService = Depends(get_chunk_service),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_service: VectorService = Depends(get_vector_service)
):
    start_time = time.perf_counter()
    logger.info(f"\n==================== [STAGE 1: UPLOAD INIT] ====================")
    logger.info(f"File Received: '{file.filename}', User: '{current_user.email}' (id={current_user.id})")

    file_bytes = await file.read()
    file_size_bytes = len(file_bytes)
    file_size_mb = file_size_bytes / (1024 * 1024)
    logger.info(f"File Size: {file_size_bytes} bytes ({file_size_mb:.2f} MB)")

    if file_size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of {settings.MAX_FILE_SIZE_MB}MB."
        )

    try:
        user_id = str(current_user.id)
        file_hash = hashlib.sha256(file_bytes).hexdigest()
        logger.info(f"Computed SHA-256 Hash: {file_hash[:16]}...")

        doc_repo = DocumentRepository(db)
        chat_repo = ChatRepository(db)

        # 1. User-Scoped SHA-256 Deduplication Lookup
        existing_doc = doc_repo.get_ready_by_hash_and_user(file_hash, user_id)
        if existing_doc:
            logger.info(f"[SHA-256 REUSE SUCCESS] Found existing document '{existing_doc.filename}' for user '{current_user.email}'. Reusing vectors instantly!")
            chat_session = chat_repo.create_session(
                user_id=user_id,
                document_id=existing_doc.id,
                title="General Discussion"
            )
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            return {
                "status": "success",
                "document_id": existing_doc.id,
                "chat_session_id": chat_session.id,
                "document_name": existing_doc.filename,
                "total_pages": existing_doc.page_count,
                "total_chunks": 0,
                "is_cached": True,
                "document_status": "ready",
                "timing_ms": {
                    "hash_lookup": round(elapsed_ms, 2),
                    "total_processing": round(elapsed_ms, 2)
                }
            }

        # 2. Save Document Record ('processing')
        doc = doc_repo.create(
            user_id=user_id,
            filename=file.filename,
            display_name=file.filename,
            file_hash=file_hash,
            file_size=file_size_bytes,
            page_count=1,
            mime_type="application/pdf",
            processing_status="processing",
            embedding_status="processing"
        )

        # 3. Create Initial Chat Session
        chat_session = chat_repo.create_session(
            user_id=user_id,
            document_id=doc.id,
            title="General Discussion"
        )

        # 4. Enqueue Background Processing Task
        background_tasks.add_task(
            process_document_background,
            document_id=doc.id,
            file_bytes=file_bytes,
            filename=file.filename,
            pdf_service=pdf_service,
            chunk_service=chunk_service,
            embedding_service=embedding_service,
            vector_service=vector_service
        )

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        logger.info(f"Upload and background enqueue finished in {elapsed_ms:.2f}ms\n================================================================\n")
        return {
            "status": "processing",
            "document_id": doc.id,
            "chat_session_id": chat_session.id,
            "document_name": doc.filename,
            "total_pages": 1,
            "total_chunks": 0,
            "is_cached": False,
            "document_status": "processing",
            "timing_ms": {
                "upload_and_enqueue": round(elapsed_ms, 2),
                "total_processing": round(elapsed_ms, 2)
            }
        }
    except Exception as e:
        logger.exception(f"[UPLOAD ERROR] Failed to upload file '{file.filename}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while uploading the file: {str(e)}"
        )

@router.get("/documents")
async def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc_repo = DocumentRepository(db)
    docs = doc_repo.get_user_documents(str(current_user.id))
    return [d.to_dict() for d in docs]

@router.get("/documents/{document_id}")
async def get_document_details(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc_repo = DocumentRepository(db)
    chunk_repo = DocumentChunkRepository(db)

    doc = doc_repo.get_by_id(document_id)
    if not doc or str(doc.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    doc_data = doc.to_dict()
    doc_data["chunks"] = [c.to_dict() for c in chunk_repo.get_by_document(document_id)]
    return doc_data

@router.post("/documents/{document_id}/chats")
async def create_document_chat_session(
    document_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc_repo = DocumentRepository(db)
    chat_repo = ChatRepository(db)

    doc = doc_repo.get_by_id(document_id)
    if not doc or str(doc.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    title = payload.get("title") or f"Conversation {len(doc.chat_sessions) + 1}"
    chat_session = chat_repo.create_session(
        user_id=str(current_user.id),
        document_id=doc.id,
        title=title
    )
    return chat_session.to_dict()

@router.get("/chats")
async def list_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat_repo = ChatRepository(db)
    sessions = chat_repo.get_by_user(str(current_user.id))
    return [s.to_dict() for s in sessions]

@router.get("/chats/{session_id}")
async def get_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat_repo = ChatRepository(db)
    msg_repo = MessageRepository(db)

    session = chat_repo.get_by_id(session_id)
    if not session or str(session.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    messages = msg_repo.get_session_messages(session_id)
    session_data = session.to_dict()
    session_data["messages"] = [m.to_dict() for m in messages]
    return session_data

@router.patch("/chats/{session_id}")
async def rename_chat_session(
    session_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    title = payload.get("title", "").strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title cannot be empty")

    chat_repo = ChatRepository(db)
    session = chat_repo.get_by_id(session_id)
    if not session or str(session.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    updated_session = chat_repo.update_title(session_id, title)
    return updated_session.to_dict()

@router.delete("/chats/{session_id}")
async def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat_repo = ChatRepository(db)
    session = chat_repo.get_by_id(session_id)
    if not session or str(session.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    chat_repo.delete_session(session_id)
    return {"status": "success", "message": "Conversation deleted successfully. Document preserved."}

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_service: VectorService = Depends(get_vector_service)
):
    doc_repo = DocumentRepository(db)
    chunk_repo = DocumentChunkRepository(db)

    doc = doc_repo.get_by_id(document_id)
    if not doc or str(doc.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    await vector_service.delete_document_vectors(document_id)
    chunk_repo.delete_by_document(document_id)
    doc_repo.delete(document_id)

    return {"status": "success", "message": "Document and all associated conversations deleted successfully."}

@router.post("/chats/{session_id}/chat")
@router.post("/chat")
async def chat_with_session(
    request: ChatRequest,
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    retrieval_service: RetrievalService = Depends(get_retrieval_service),
    prompt_service: PromptService = Depends(get_prompt_service),
    llm_service: LLMService = Depends(get_llm_service),
    citation_service: CitationService = Depends(get_citation_service),
    response_formatter: ResponseFormatter = Depends(get_response_formatter),
    vector_service: VectorService = Depends(get_vector_service)
):
    question = request.question.strip()
    logger.info(f"\n==================== [RAG REQUEST: QUESTION] ====================")
    logger.info(f"Question: '{question}', User: '{current_user.email}', Session ID: {session_id}")

    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question string cannot be empty."
        )

    chat_repo = ChatRepository(db)
    msg_repo = MessageRepository(db)
    doc_repo = DocumentRepository(db)
    target_session = None
    document_id = None
    doc = None
    conversation_history: List[str] = []

    if session_id:
        target_session = chat_repo.get_by_id(session_id)
        if target_session:
            if str(target_session.user_id) != str(current_user.id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this chat session")
            document_id = target_session.document_id
            doc = doc_repo.get_by_id(document_id)
            if doc and doc.processing_status == "processing":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Document is still processing in the background. Please wait a moment."
                )

            # Retrieve past conversation history context (last 6 turns)
            past_messages = msg_repo.get_session_messages(session_id)
            recent_turns = past_messages[-6:]
            for m in recent_turns:
                conversation_history.append(f"{m.role.upper()}: {m.content[:300]}")

    if target_session:
        msg_repo.add_message(
            chat_session_id=target_session.id,
            role="user",
            content=question
        )
        chat_repo.update_last_message_at(target_session.id)

        # Automatic Titling
        if target_session.title in ["General Discussion", "New Conversation"] or target_session.title.endswith("Notes"):
            words = question.split()
            auto_title = " ".join(words[:4]).strip("?,.!")
            if auto_title:
                auto_title = auto_title[:30].title()
                chat_repo.update_title(target_session.id, auto_title)

    try:
        t0 = time.perf_counter()

        # Execute Hybrid Retrieval Pipeline (Qdrant Dense + PostgreSQL BM25 + RRF Reranking)
        retrieved_chunks, metadata_info = await retrieval_service.retrieve_context_with_intent(
            question,
            document_id=document_id,
            db=db
        )

        if not retrieved_chunks and document_id:
            logger.info(f"[RETRIEVAL FALLBACK] Fetching document chunks for doc_id={document_id}")
            retrieved_chunks = await vector_service.get_all_chunks(document_id=document_id, max_limit=30)

        retrieval_time_ms = (time.perf_counter() - t0) * 1000

        from app.services.metadata_extractor import MetadataExtractor
        doc_text = " ".join([c.chunk_text for c in retrieved_chunks]) if retrieved_chunks else ""
        extracted_entities = MetadataExtractor.extract_document_entities(doc_text)
        direct_match = MetadataExtractor.match_entity_query(question, extracted_entities)

        citations = citation_service.process_citations(retrieved_chunks)
        system_prompt = prompt_service.get_system_prompt()
        
        doc_name = doc.display_name if doc else None
        doc_pages = doc.page_count if doc else None

        user_prompt = prompt_service.build_prompt(
            question,
            retrieved_chunks,
            intent=metadata_info["intent"],
            doc_filename=doc_name,
            doc_page_count=doc_pages,
            conversation_history=conversation_history
        )

        async def stream_generator():
            meta_event = {
                "type": "metadata",
                "citations": [c.model_dump() for c in citations],
                "intent": metadata_info["intent"],
                "confidence": metadata_info["confidence"],
                "retrieval_time_ms": round(retrieval_time_ms, 2)
            }
            yield f"data: {json.dumps(meta_event)}\n\n"

            final_answer = ""
            total_time_ms = 0.0

            if direct_match:
                final_answer = direct_match
                yield f"data: {json.dumps({'type': 'token', 'content': direct_match})}\n\n"
                total_time_ms = (time.perf_counter() - t0) * 1000
            elif not retrieved_chunks and not doc:
                final_answer = "The uploaded document does not mention this."
                yield f"data: {json.dumps({'type': 'token', 'content': final_answer})}\n\n"
                total_time_ms = (time.perf_counter() - t0) * 1000
            else:
                t_llm_start = time.perf_counter()
                accumulated_text = ""

                async for token in llm_service.generate_response_stream(system_prompt, user_prompt):
                    accumulated_text += token
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

                llm_time_ms = (time.perf_counter() - t_llm_start) * 1000
                total_time_ms = (time.perf_counter() - t0) * 1000
                final_answer = response_formatter.format_final_answer(
                    accumulated_text,
                    citations,
                    intent=metadata_info["intent"]
                )

            if target_session and final_answer:
                try:
                    msg_repo.add_message(
                        chat_session_id=target_session.id,
                        role="assistant",
                        content=final_answer,
                        citations=[c.model_dump() for c in citations],
                        timing_ms={
                            "retrieval_time": round(retrieval_time_ms, 2),
                            "total_response_time": round(total_time_ms, 2)
                        }
                    )
                except Exception as e:
                    logger.error(f"Failed to persist assistant response in DB: {str(e)}")

            done_event = {
                "type": "done",
                "content": final_answer,
                "timing_ms": {
                    "retrieval_time": round(retrieval_time_ms, 2),
                    "total_response_time": round(total_time_ms, 2)
                }
            }
            yield f"data: {json.dumps(done_event)}\n\n"

        return StreamingResponse(stream_generator(), media_type="text/event-stream")
    except Exception as e:
        logger.error(f"Error executing chat stream: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate response for the requested document."
        )
