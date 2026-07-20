import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Union
import uuid
from app.config.settings import settings
from app.utils.logging import logger

def hash_password(password: str) -> str:
    """
    Hashes raw password string using bcrypt directly.
    """
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies plain password against stored bcrypt hash.
    """
    if not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

def create_access_token(user_id: Union[str, uuid.UUID], email: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates signed JWT access token for user payload.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRE_DAYS)

    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    token = jwt.encode(payload, settings.SECRET_KEY or settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates JWT token string.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY or settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT Access token has expired.")
        return None
    except jwt.PyJWTError as e:
        logger.warning(f"Invalid JWT Token: {str(e)}")
        return None
