import uuid
from app.database.session import SessionLocal
from app.repositories.document_repository import DocumentRepository
from app.repositories.document_chunk_repository import DocumentChunkRepository
from app.services.pdf_service import PDFService
from app.services.chunk_service import ChunkService
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService
from app.utils.logging import logger

async def process_document_background(
    document_id: str,
    file_bytes: bytes,
    filename: str,
    pdf_service: PDFService,
    chunk_service: ChunkService,
    embedding_service: EmbeddingService,
    vector_service: VectorService
):
    """
    Background worker for PDF ingestion:
    1. Extracts page text using PyMuPDF.
    2. Chunks text into 700-1000 character overlapping blocks.
    3. Generates 384d FastEmbed vector embeddings.
    4. Upserts points to Qdrant Cloud tagged with document_id.
    5. Inserts DocumentChunk records into PostgreSQL.
    6. Updates Document processing_status and embedding_status to 'ready'.
    """
    logger.info(f"\n==================== [BACKGROUND INGESTION STARTED] ====================")
    logger.info(f"Target Document ID: {document_id}, Filename: '{filename}'")

    db = SessionLocal()
    doc_repo = DocumentRepository(db)
    chunk_repo = DocumentChunkRepository(db)

    try:
        # 1. Page Extraction
        pages_gen = pdf_service.extract_pages_generator(file_bytes, filename)
        pages_list = list(pages_gen)
        page_count = len(pages_list)
        logger.info(f"[STAGE 1: EXTRACTED PAGES] Total Pages: {page_count}")

        # 2. Text Chunking
        chunks_gen = chunk_service.create_chunks_generator(iter(pages_list), filename)
        all_chunks = list(chunks_gen)
        chunk_count = len(all_chunks)
        logger.info(f"[STAGE 2: CREATED CHUNKS] Total Chunks: {chunk_count}")

        if chunk_count == 0:
            doc_repo.update_status(
                document_id=document_id,
                processing_status="error",
                embedding_status="error",
                error_message="No readable text could be extracted from the PDF file."
            )
            return

        # 3. Vector Embeddings & Micro-batch Insertion
        batch_size = 16
        db_chunk_records = []

        for i in range(0, chunk_count, batch_size):
            batch_chunks = all_chunks[i:i + batch_size]
            batch_texts = [c.chunk_text for c in batch_chunks]
            batch_embeddings = embedding_service.generate_embeddings(batch_texts)

            # Generate unique Qdrant point IDs
            for chunk, emb in zip(batch_chunks, batch_embeddings):
                unique_key = f"{document_id}_{chunk.chunk_id}"
                point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, unique_key))
                db_chunk_records.append({
                    "chunk_text": chunk.chunk_text,
                    "page_number": chunk.page_number,
                    "embedding_id": point_id
                })

            await vector_service.upsert_chunks(batch_chunks, batch_embeddings, document_id=document_id)

        # 4. Save DocumentChunks in PostgreSQL
        chunk_repo.create_batch(document_id, db_chunk_records)

        # 5. Update Document status to 'ready'
        doc_repo.update_status(
            document_id=document_id,
            processing_status="ready",
            embedding_status="ready",
            page_count=page_count
        )

        logger.info(f"[BACKGROUND INGESTION SUCCESS] Document doc_id={document_id} is READY!")
        logger.info(f"=======================================================================\n")

    except Exception as e:
        logger.exception(f"[BACKGROUND INGESTION FAILED] Error processing document doc_id={document_id}: {str(e)}")
        try:
            doc_repo.update_status(
                document_id=document_id,
                processing_status="error",
                embedding_status="error",
                error_message=str(e)[:500]
            )
        except Exception:
            pass
    finally:
        db.close()
