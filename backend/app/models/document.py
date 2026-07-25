import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.database.base import Base

class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_user_hash", "user_id", "file_hash"),
        Index("ix_documents_user_created", "user_id", "created_at"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)
    storage_url = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=False, default=0)
    page_count = Column(Integer, nullable=False, default=1)
    mime_type = Column(String(100), nullable=False, default="application/pdf")
    processing_status = Column(String(20), nullable=False, default="processing")
    embedding_status = Column(String(20), nullable=False, default="processing")
    error_message = Column(String(500), nullable=True)
    qdrant_collection = Column(String(100), nullable=False, default="projectbrain_v1_docs")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", backref="documents")
    chat_sessions = relationship("ChatSession", back_populates="document", cascade="all, delete-orphan", order_by="ChatSession.updated_at.desc()")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan", order_by="DocumentChunk.chunk_index")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "display_name": self.display_name or self.filename,
            "file_hash": self.file_hash,
            "storage_url": self.storage_url,
            "file_size": self.file_size,
            "page_count": self.page_count,
            "mime_type": self.mime_type,
            "processing_status": self.processing_status or "ready",
            "embedding_status": self.embedding_status or "ready",
            "error_message": self.error_message,
            "qdrant_collection": self.qdrant_collection,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "chat_session_count": len(self.chat_sessions) if self.chat_sessions else 0
        }
