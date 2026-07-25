import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class ChatMessageModel(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chat_session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'user' | 'assistant'
    content = Column(Text, nullable=False)
    citations = Column(JSON, nullable=True, default=[])
    timing_ms = Column(JSON, nullable=True, default={})
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    chat_session = relationship("ChatSession", back_populates="messages")

    def to_dict(self):
        return {
            "id": self.id,
            "chat_session_id": self.chat_session_id,
            "role": self.role,
            "content": self.content,
            "citations": self.citations or [],
            "timing_ms": self.timing_ms or {},
            "timestamp": self.created_at.strftime("%I:%M %p") if self.created_at else "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
