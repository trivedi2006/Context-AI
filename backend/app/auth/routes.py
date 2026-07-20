from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.auth import UserSignup, UserLogin, UserResponse, AuthMessageResponse
from app.services.auth_service import AuthService
from app.auth.jwt import create_access_token
from app.auth.oauth import get_google_auth_url, exchange_google_code_for_token
from app.auth.dependencies import get_current_user
from app.config.settings import settings
from app.utils.logging import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])

COOKIE_NAME = "access_token"

def set_auth_cookie(response: Response, token: str, remember_me: bool = True):
    max_age = (7 * 24 * 3600) if remember_me else (24 * 3600)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=max_age,
        expires=max_age,
        samesite="lax",
        secure=False,
        path="/"
    )

@router.post("/signup", response_model=AuthMessageResponse)
async def signup(
    signup_data: UserSignup,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Registers a new local user with bcrypt password and sets HTTP-only JWT cookie.
    """
    existing_user = AuthService.get_user_by_email(db, signup_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in."
        )

    user = AuthService.create_user(db, signup_data)
    token = create_access_token(user.id, user.email)
    set_auth_cookie(response, token, remember_me=True)

    return AuthMessageResponse(
        status="success",
        message="Account created successfully.",
        token=token,
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=AuthMessageResponse)
async def login(
    login_data: UserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Authenticates user credentials and sets HTTP-only JWT cookie.
    """
    user = AuthService.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password. Please try again."
        )

    token = create_access_token(user.id, user.email)
    set_auth_cookie(response, token, remember_me=login_data.remember_me or False)

    return AuthMessageResponse(
        status="success",
        message="Logged in successfully.",
        token=token,
        user=UserResponse.model_validate(user)
    )

@router.get("/google/login")
async def google_login(request: Request):
    """
    Redirects user directly to Google OAuth consent screen.
    """
    redirect_uri = f"{request.base_url}auth/google/callback"
    redirect_uri = redirect_uri.replace("//auth", "/auth")
    auth_url = get_google_auth_url(redirect_uri)
    return RedirectResponse(url=auth_url)

@router.get("/google/callback")
async def google_callback(
    code: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handles Google OAuth redirect code, authenticates user, and redirects to frontend.
    """
    redirect_uri = f"{request.base_url}auth/google/callback"
    redirect_uri = redirect_uri.replace("//auth", "/auth")

    google_data = await exchange_google_code_for_token(code, redirect_uri)

    if not google_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to authenticate with Google."
        )

    user = AuthService.find_or_create_google_user(db, google_data)
    token = create_access_token(user.id, user.email)

    # Determine target frontend URL matching current origin host
    target_frontend = settings.FRONTEND_URL
    if "127.0.0.1" in str(request.base_url):
        target_frontend = "http://127.0.0.1:3000"
    elif "localhost" in str(request.base_url):
        target_frontend = "http://localhost:3000"

    redirect_url = f"{target_frontend}/?token={token}"
    redirect_response = RedirectResponse(url=redirect_url)
    set_auth_cookie(redirect_response, token, remember_me=True)
    return redirect_response

@router.post("/logout")
async def logout(response: Response):
    """
    Clears the access_token HTTP-only cookie.
    """
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"status": "success", "message": "Logged out successfully."}

@router.get("/me", response_model=UserResponse)
async def get_me(user = Depends(get_current_user)):
    """
    Returns the currently authenticated user profile from PostgreSQL.
    """
    return UserResponse.model_validate(user)
