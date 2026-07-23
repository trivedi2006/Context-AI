import time
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
def signup(
    signup_data: UserSignup,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Registers a new local user with bcrypt password and sets HTTP-only JWT cookie.
    Offloaded to FastAPI threadpool worker to prevent blocking event loop.
    """
    t_start = time.perf_counter()
    logger.info(f"[Signup Request Started] Email: {signup_data.email}")

    # 1. Existing user check
    t0 = time.perf_counter()
    existing_user = AuthService.get_user_by_email(db, signup_data.email)
    t_lookup_ms = (time.perf_counter() - t0) * 1000

    if existing_user:
        logger.warning(f"[Signup Failed] Email already registered: {signup_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in."
        )

    # 2. User Creation (Password Hashing + DB Insert & Commit)
    t1 = time.perf_counter()
    user = AuthService.create_user(db, signup_data)
    t_create_ms = (time.perf_counter() - t1) * 1000

    # 3. JWT Token Generation & Cookie Set
    t2 = time.perf_counter()
    token = create_access_token(user.id, user.email)
    set_auth_cookie(response, token, remember_me=True)
    t_token_ms = (time.perf_counter() - t2) * 1000

    t_total_ms = (time.perf_counter() - t_start) * 1000
    logger.info(
        f"[Signup Request Complete] User: {user.email} (id={user.id}). "
        f"Metrics: lookup={t_lookup_ms:.1f}ms, create={t_create_ms:.1f}ms, "
        f"jwt={t_token_ms:.1f}ms, total={t_total_ms:.1f}ms"
    )

    return AuthMessageResponse(
        status="success",
        message="Account created successfully.",
        token=token,
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=AuthMessageResponse)
def login(
    login_data: UserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Authenticates user credentials and sets HTTP-only JWT cookie.
    Offloaded to FastAPI threadpool worker.
    """
    t_start = time.perf_counter()
    logger.info(f"[Login Request Started] Email: {login_data.email}")

    user = AuthService.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        logger.warning(f"[Login Failed] Invalid credentials for email: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password. Please try again."
        )

    token = create_access_token(user.id, user.email)
    set_auth_cookie(response, token, remember_me=login_data.remember_me or False)

    t_total_ms = (time.perf_counter() - t_start) * 1000
    logger.info(f"[Login Request Complete] User: {user.email} in {t_total_ms:.1f}ms")

    return AuthMessageResponse(
        status="success",
        message="Logged in successfully.",
        token=token,
        user=UserResponse.model_validate(user)
    )

def get_callback_uri(request: Request) -> str:
    """
    Constructs accurate OAuth callback URI, enforcing HTTPS scheme on production reverse proxies (Render).
    """
    base = str(request.base_url).rstrip('/')
    if "localhost" not in base and "127.0.0.1" not in base and base.startswith("http://"):
        base = base.replace("http://", "https://", 1)
    return f"{base}/auth/google/callback"

@router.get("/google/login")
async def google_login(request: Request):
    """
    Redirects user directly to Google OAuth consent screen.
    """
    redirect_uri = get_callback_uri(request)
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
    redirect_uri = get_callback_uri(request)
    google_data = await exchange_google_code_for_token(code, redirect_uri)

    if not google_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to authenticate with Google."
        )

    user = AuthService.find_or_create_google_user(db, google_data)
    token = create_access_token(user.id, user.email)

    # Determine target frontend URL matching current origin host
    target_frontend = settings.FRONTEND_URL.rstrip('/')
    if "127.0.0.1" in str(request.base_url) or "localhost" in str(request.base_url):
        target_frontend = "http://127.0.0.1:3000"

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
