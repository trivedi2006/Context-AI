from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.document import Document
from app.utils.logging import logger

class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        user_id: str,
        filename: str,
        file_hash: str,
        file_size: int = 0,
        page_count: int = 1,
        display_name: Optional[str] = None,
        mime_type: str = "application/pdf",
        storage_url: Optional[str] = None,
        processing_status: str = "processing",
        embedding_status: str = "processing"
    ) -> Document:
        doc = Document(
            user_id=user_id,
            filename=filename,
            display_name=display_name or filename,
            file_hash=file_hash,
            storage_url=storage_url,
            file_size=file_size,
            page_count=page_count,
            mime_type=mime_type,
            processing_status=processing_status,
            embedding_status=embedding_status
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        logger.info(f"Created Document record '{filename}' (id={doc.id}, user_id={user_id})")
        return doc

    def get_by_id(self, document_id: str) -> Optional[Document]:
        return self.db.query(Document).filter(Document.id == document_id).first()

    def get_ready_by_hash_and_user(self, file_hash: str, user_id: str) -> Optional[Document]:
        """
        SHA-256 Deduplication Lookup: Checks if a document with matching hash exists and is ready for the user.
        """
        return (
            self.db.query(Document)
            .filter(
                Document.file_hash == file_hash,
                Document.user_id == user_id,
                Document.embedding_status == "ready"
            )
            .order_by(Document.created_at.desc())
            .first()
        )

    def get_user_documents(self, user_id: str) -> List[Document]:
        return (
            self.db.query(Document)
            .options(joinedload(Document.chat_sessions))
            .filter(Document.user_id == user_id)
            .order_by(Document.updated_at.desc())
            .all()
        )

    def update_status(
        self,
        document_id: str,
        processing_status: str,
        embedding_status: Optional[str] = None,
        page_count: Optional[int] = None,
        error_message: Optional[str] = None
    ) -> Optional[Document]:
        doc = self.get_by_id(document_id)
        if doc:
            doc.processing_status = processing_status
            if embedding_status:
                doc.embedding_status = embedding_status
            if page_count is not None:
                doc.page_count = page_count
            if error_message is not None:
                doc.error_message = error_message
            self.db.commit()
            self.db.refresh(doc)
        return doc

    def delete(self, document_id: str) -> bool:
        doc = self.get_by_id(document_id)
        if doc:
            self.db.delete(doc)
            self.db.commit()
            logger.info(f"Deleted Document record (id={document_id})")
            return True
        return False
