from typing import Optional, Dict, Any
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
        user_data = {
            "name": signup_data.name,
            "email": signup_data.email,
            "password_hash": hash_password(signup_data.password),
            "provider": "local"
        }
        return UserRepository.create(db, user_data)

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        user = UserRepository.get_by_email(db, email)
        if not user or not user.password_hash:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    def find_or_create_google_user(db: Session, google_data: Dict[str, Any]) -> User:
        google_id = google_data.get("sub")
        email = google_data.get("email", "").lower().strip()
        name = google_data.get("name", "Google User")
        picture = google_data.get("picture")

        if not google_id or not email:
            raise ValueError("Google user profile is missing sub or email")

        # 1. Match by google_id
        user = UserRepository.get_by_google_id(db, google_id)
        if user:
            update_data = {}
            if user.name != name:
                update_data["name"] = name
            if user.profile_picture != picture:
                update_data["profile_picture"] = picture
            if user.email != email:
                update_data["email"] = email
            
            if update_data:
                user = UserRepository.update(db, user, update_data)
                logger.info(f"Google User Updated: {user.email} (id={user.id})")
            else:
                logger.info(f"Google Login (Existing User): {user.email} (id={user.id})")
            return user

        # 2. Match by email if registered locally before
        user = UserRepository.get_by_email(db, email)
        if user:
            update_data = {
                "google_id": google_id,
                "profile_picture": picture,
            }
            if user.name != name:
                update_data["name"] = name
            user = UserRepository.update(db, user, update_data)
            logger.info(f"Google Login (Linked existing account): {user.email} (id={user.id})")
            return user

        # 3. Create new Google user
        user_data = {
            "name": name,
            "email": email,
            "google_id": google_id,
            "profile_picture": picture,
            "provider": "google"
        }
        user = UserRepository.create(db, user_data)
        logger.info(f"Google Login (Created new user): {user.email} (id={user.id})")
        return user
