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
        user_id_str = str(user_id)
        stmt = select(User).where(User.id == user_id_str)
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def exists(db: Session, email: str) -> bool:
        user = UserRepository.get_by_email(db, email)
        return user is not None

    @staticmethod
    def create(db: Session, user_data: Dict[str, Any]) -> User:
        """
        Inserts a new User into Neon PostgreSQL with explicit commit, refresh, and rollback error handling.
        """
        try:
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
            logger.info(f"[DB COMMIT SUCCESS] User inserted into Neon PostgreSQL: {user.email} (id={user.id})")
            return user
        except Exception as e:
            db.rollback()
            logger.exception(f"[DB ROLLBACK] User creation failed for email={user_data.get('email')}: {str(e)}")
            raise

    @staticmethod
    def update(db: Session, user: User, update_data: Dict[str, Any]) -> User:
        """
        Modifies a User object with explicit commit, refresh, and rollback error handling.
        """
        try:
            updated = False
            for key, value in update_data.items():
                if hasattr(user, key) and getattr(user, key) != value:
                    setattr(user, key, value)
                    updated = True
            if updated:
                db.commit()
                db.refresh(user)
                logger.info(f"[DB COMMIT SUCCESS] User updated in Neon PostgreSQL: {user.email} (id={user.id})")
            return user
        except Exception as e:
            db.rollback()
            logger.exception(f"[DB ROLLBACK] User update failed for {user.email}: {str(e)}")
            raise

    @staticmethod
    def delete(db: Session, user_id: Union[uuid.UUID, str]) -> bool:
        """
        Deletes a User from Neon PostgreSQL with explicit commit and rollback error handling.
        """
        try:
            user = UserRepository.get_by_id(db, user_id)
            if not user:
                return False
            email = user.email
            db.delete(user)
            db.commit()
            logger.info(f"[DB COMMIT SUCCESS] User deleted from Neon PostgreSQL: {email} (id={user_id})")
            return True
        except Exception as e:
            db.rollback()
            logger.exception(f"[DB ROLLBACK] User deletion failed for user_id={user_id}: {str(e)}")
            raise
