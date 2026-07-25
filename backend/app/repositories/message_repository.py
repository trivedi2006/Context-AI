from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.message import ChatMessageModel
from app.utils.logging import logger

class MessageRepository:
    def __init__(self, db: Session):
        self.db = db

    def add_message(
        self,
        chat_session_id: str,
        role: str,
        content: str,
        citations: Optional[List[Dict[str, Any]]] = None,
        timing_ms: Optional[Dict[str, Any]] = None
    ) -> ChatMessageModel:
        msg = ChatMessageModel(
            chat_session_id=chat_session_id,
            role=role,
            content=content,
            citations=citations or [],
            timing_ms=timing_ms or {}
        )
        try:
            self.db.add(msg)
            self.db.commit()
            self.db.refresh(msg)
            return msg
        except Exception as e:
            self.db.rollback()
            logger.exception(f"Failed to save message in session '{chat_session_id}': {str(e)}")
            raise

    def get_session_messages(self, chat_session_id: str) -> List[ChatMessageModel]:
        return self.db.query(ChatMessageModel).filter(
            ChatMessageModel.chat_session_id == chat_session_id
        ).order_by(ChatMessageModel.created_at.asc()).all()
