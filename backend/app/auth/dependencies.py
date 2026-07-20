from typing import Optional
from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.auth.jwt import decode_access_token
from app.repositories.user_repository import UserRepository

def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Retrieves current user from HTTP-only cookie or Authorization header without raising 401.
    """
    token = request.cookies.get("access_token")

    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    user_id = payload["sub"]
    return UserRepository.get_by_id(db, user_id)

def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    """
    Strict dependency enforcing authenticated user state (raises 401 if unauthenticated).
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to access this resource."
        )
    return user
