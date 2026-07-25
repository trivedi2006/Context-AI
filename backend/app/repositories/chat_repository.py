from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from app.models.chat_session import ChatSession
from app.utils.logging import logger

class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_session(self, user_id: str, document_id: str, title: str) -> ChatSession:
        now = datetime.now(timezone.utc)
        session = ChatSession(
            user_id=user_id,
            document_id=document_id,
            title=title,
            created_at=now,
            updated_at=now,
            last_message_at=now
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        logger.info(f"Created ChatSession '{title}' (id={session.id}, doc_id={document_id})")
        return session

    def get_by_id(self, session_id: str) -> Optional[ChatSession]:
        return (
            self.db.query(ChatSession)
            .options(joinedload(ChatSession.document), joinedload(ChatSession.messages))
            .filter(ChatSession.id == session_id)
            .first()
        )

    def get_by_user(self, user_id: str) -> List[ChatSession]:
        return (
            self.db.query(ChatSession)
            .options(joinedload(ChatSession.document), joinedload(ChatSession.messages))
            .filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.last_message_at.desc())
            .all()
        )

    def get_document_sessions(self, document_id: str, user_id: str) -> List[ChatSession]:
        return (
            self.db.query(ChatSession)
            .filter(ChatSession.document_id == document_id, ChatSession.user_id == user_id)
            .order_by(ChatSession.last_message_at.desc())
            .all()
        )

    def update_title(self, session_id: str, new_title: str) -> Optional[ChatSession]:
        session = self.get_by_id(session_id)
        if session:
            session.title = new_title
            session.updated_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(session)
            logger.info(f"Updated title for ChatSession (id={session_id}) to '{new_title}'")
        return session

    def update_last_message_at(self, session_id: str) -> Optional[ChatSession]:
        session = self.get_by_id(session_id)
        if session:
            now = datetime.now(timezone.utc)
            session.last_message_at = now
            session.updated_at = now
            self.db.commit()
            self.db.refresh(session)
        return session

    def delete_session(self, session_id: str) -> bool:
        session = self.get_by_id(session_id)
        if session:
            self.db.delete(session)
            self.db.commit()
            logger.info(f"Deleted ChatSession record (id={session_id})")
            return True
        return False
