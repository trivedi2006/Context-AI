from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.document_chunk import DocumentChunk
from app.utils.logging import logger

class DocumentChunkRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_batch(self, document_id: str, chunks_data: List[dict]) -> List[DocumentChunk]:
        """
        Bulk inserts document chunks into PostgreSQL.
        """
        try:
            chunks = []
            for idx, c_data in enumerate(chunks_data):
                chunk = DocumentChunk(
                    document_id=document_id,
                    chunk_text=c_data.get("chunk_text", ""),
                    page_number=c_data.get("page_number", 1),
                    embedding_id=c_data.get("embedding_id"),
                    chunk_index=idx
                )
                chunks.append(chunk)
            self.db.add_all(chunks)
            self.db.commit()
            logger.info(f"Inserted {len(chunks)} DocumentChunk records for doc_id={document_id}")
            return chunks
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to bulk insert DocumentChunks for doc_id={document_id}: {str(e)}")
            raise

    def get_by_document(self, document_id: str) -> List[DocumentChunk]:
        return (
            self.db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index)
            .all()
        )

    def delete_by_document(self, document_id: str) -> int:
        count = (
            self.db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == document_id)
            .delete(synchronize_session=False)
        )
        self.db.commit()
        return count
