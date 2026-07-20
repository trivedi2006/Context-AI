import uuid
from typing import Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User
from app.utils.logging import logger

class UserRepository:
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        if not email:
            return None
        stmt = select(User).where(User.email == email.lower().strip())
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_by_google_id(db: Session, google_id: str) -> Optional[User]:
        if not google_id:
            return None
        stmt = select(User).where(User.google_id == google_id)
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_by_id(db: Session, user_id: Union[uuid.UUID, str]) -> Optional[User]:
        if not user_id:
            return None
        if isinstance(user_id, str):
            try:
                user_id = uuid.UUID(user_id)
            except ValueError:
                return None
        stmt = select(User).where(User.id == user_id)
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def exists(db: Session, email: str) -> bool:
        user = UserRepository.get_by_email(db, email)
        return user is not None

    @staticmethod
    def create(db: Session, user_data: Dict[str, Any]) -> User:
        user = User(
            name=user_data.get("name", "").strip(),
            email=user_data.get("email", "").lower().strip(),
            password_hash=user_data.get("password_hash"),
            google_id=user_data.get("google_id"),
            profile_picture=user_data.get("profile_picture"),
            provider=user_data.get("provider", "local")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"User Created: {user.email} (id={user.id})")
        return user

    @staticmethod
    def update(db: Session, user: User, update_data: Dict[str, Any]) -> User:
        updated = False
        for key, value in update_data.items():
            if hasattr(user, key) and getattr(user, key) != value:
                setattr(user, key, value)
                updated = True
        if updated:
            db.commit()
            db.refresh(user)
            logger.info(f"User Updated: {user.email} (id={user.id})")
        return user

    @staticmethod
    def delete(db: Session, user_id: Union[uuid.UUID, str]) -> bool:
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            return False
        email = user.email
        db.delete(user)
        db.commit()
        logger.info(f"User Deleted: {email} (id={user_id})")
        return True
