from typing import Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import UserSignup
from app.auth.jwt import hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.utils.logging import logger

class AuthService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return UserRepository.get_by_email(db, email)

    @staticmethod
    def get_user_by_id(db: Session, user_id: Any) -> Optional[User]:
        return UserRepository.get_by_id(db, user_id)

    @staticmethod
    def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
        return UserRepository.get_by_google_id(db, google_id)

    @staticmethod
    def create_user(db: Session, signup_data: UserSignup) -> User:
        """
        Signup Flow: Hashes password with bcrypt and calls UserRepository.create().
        """
        logger.info(f"[Signup Started] Email: {signup_data.email}")
        user_data = {
            "name": signup_data.name,
            "email": signup_data.email,
            "password_hash": hash_password(signup_data.password),
            "provider": "local",
            "last_login": datetime.now(timezone.utc)
        }
        user = UserRepository.create(db, user_data)
        logger.info(f"[Signup Success] User inserted into Neon PostgreSQL: {user.email} (id={user.id})")
        return user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """
        Login Flow: Finds user and verifies password. NEVER inserts a user on login.
        """
        user = UserRepository.get_by_email(db, email)
        if not user or not user.password_hash:
            logger.warning(f"[Login Failed] User not found or password empty for: {email}")
            return None
        if not verify_password(password, user.password_hash):
            logger.warning(f"[Login Failed] Password mismatch for: {email}")
            return None
        
        # Update last login timestamp
        user = UserRepository.update_last_login(db, user)
        logger.info(f"[Login Successful] User authenticated: {user.email} (id={user.id})")
        return user

    @staticmethod
    def find_or_create_google_user(db: Session, google_data: Dict[str, Any]) -> User:
        """
        Google OAuth Flow:
        1. Search google_id -> Found -> Update profile -> Commit -> Return user
        2. Otherwise Search email -> Found -> Link Google account -> Commit -> Return user
        3. Otherwise -> Create user -> Commit -> Return user
        """
        google_id = google_data.get("sub")
        email = google_data.get("email", "").lower().strip()
        name = google_data.get("name", "Google User")
        picture = google_data.get("picture")

        if not google_id or not email:
            raise ValueError("Google user profile is missing sub or email")

        # 1. Search by google_id
        user = UserRepository.get_by_google_id(db, google_id)
        if user:
            update_data = {"last_login": datetime.now(timezone.utc)}
            if user.name != name:
                update_data["name"] = name
            if user.profile_picture != picture:
                update_data["profile_picture"] = picture
            if user.email != email:
                update_data["email"] = email

            user = UserRepository.update(db, user, update_data)
            logger.info(f"[Google Login Successful] User authenticated: {user.email} (id={user.id})")
            return user

        # 2. Search by email (Link account if registered locally before)
        user = UserRepository.get_by_email(db, email)
        if user:
            update_data = {
                "google_id": google_id,
                "profile_picture": picture,
                "last_login": datetime.now(timezone.utc)
            }
            if user.name != name:
                update_data["name"] = name
            user = UserRepository.update(db, user, update_data)
            logger.info(f"[Google Account Linked] User authenticated: {user.email} (id={user.id})")
            return user

        # 3. Create new Google user (password_hash=None)
        user_data = {
            "name": name,
            "email": email,
            "google_id": google_id,
            "profile_picture": picture,
            "provider": "google",
            "last_login": datetime.now(timezone.utc)
        }
        user = UserRepository.create(db, user_data)
        logger.info(f"[Google User Created] User inserted into Neon PostgreSQL: {user.email} (id={user.id})")
        return user
