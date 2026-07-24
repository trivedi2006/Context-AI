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
    try:
        redirect_uri = get_callback_uri(request)
        logger.info(f"[Google OAuth Callback Started] Redirect URI: {redirect_uri}")

        google_data = await exchange_google_code_for_token(code, redirect_uri)

        if not google_data:
            logger.error(f"[Google OAuth Failed] Token exchange returned empty payload for code.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to authenticate with Google. Invalid or expired authorization code."
            )

        user = AuthService.find_or_create_google_user(db, google_data)
        user_id_str = str(user.id)
        token = create_access_token(user_id_str, user.email)

        # Determine target frontend URL matching current origin host
        target_frontend = "https://context-ai-v1.vercel.app"
        if settings.FRONTEND_URL and "localhost" not in settings.FRONTEND_URL and "127.0.0.1" not in settings.FRONTEND_URL:
            target_frontend = settings.FRONTEND_URL.rstrip('/')

        if "127.0.0.1" in str(request.base_url) or "localhost" in str(request.base_url):
            target_frontend = "http://127.0.0.1:3000"

        redirect_url = f"{target_frontend}/?token={token}"
        logger.info(f"[Google OAuth Success] User: {user.email} (id={user_id_str}). Redirecting to: {redirect_url}")

        redirect_response = RedirectResponse(url=redirect_url)
        set_auth_cookie(redirect_response, token, remember_me=True)
        return redirect_response
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[Google OAuth Internal Error]: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal error occurred during Google authentication: {str(e)}"
        )

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
    Returns the currently authenticated user profile.
    """
    return UserResponse.model_validate(user)

@router.get("/admin/users")
def get_all_registered_users(db: Session = Depends(get_db)):
    """
    Returns a list of all registered user accounts stored in the active database.
    """
    from app.models.user import User
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "provider": u.provider,
            "profile_picture": u.profile_picture,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]

@router.get("/admin/database")
def get_database_info(db: Session = Depends(get_db)):
    """
    Diagnostic probe returning active database connection parameters, engine dialect, server version, and pool metrics.
    """
    from datetime import datetime
    from sqlalchemy import text
    from app.database.session import engine

    raw_url = str(engine.url)
    masked_url = raw_url
    if "@" in raw_url:
        prefix, rest = raw_url.split("@", 1)
        if ":" in prefix:
            scheme_user, _ = prefix.rsplit(":", 1)
            masked_url = f"{scheme_user}:****@{rest}"

    server_version = "Unknown"
    try:
        res = db.execute(text("SELECT version();")).fetchone()
        if res:
            server_version = res[0]
    except Exception as e:
        server_version = str(e)

    pool_size = 5
    if hasattr(engine.pool, "size"):
        try:
            pool_size = engine.pool.size()
        except Exception:
            pool_size = 5

    return {
        "database": masked_url,
        "dialect": engine.dialect.name,
        "server_version": server_version,
        "pool_size": pool_size,
        "checked_at": datetime.utcnow().isoformat() + "Z"
    }

@router.post("/admin/test-user")
def create_test_user_probe(db: Session = Depends(get_db)):
    """
    Temporary diagnostic endpoint creating a test user record directly in Neon PostgreSQL and confirming immediate persistence.
    """
    import uuid
    from app.repositories.user_repository import UserRepository

    test_email = f"test_neon_{uuid.uuid4().hex[:6]}@example.com"
    user_data = {
        "name": "Test User",
        "email": test_email,
        "password_hash": "$2b$10$test_hash_sample_verification_key",
        "provider": "local"
    }
    user = UserRepository.create(db, user_data)
    
    # Query back immediately
    queried_user = UserRepository.get_by_email(db, test_email)
    
    return {
        "status": "success",
        "message": "Test user created and verified in Neon PostgreSQL",
        "created_user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "provider": user.provider,
            "created_at": user.created_at.isoformat() if user.created_at else None
        },
        "queried_user_found": queried_user is not None
    }

@router.post("/admin/test-db")
def test_database_persistence_probe(db: Session = Depends(get_db)):
    """
    Test endpoint creating a test user directly in Neon PostgreSQL, querying back the inserted row, and returning row details.
    """
    import uuid
    from app.repositories.user_repository import UserRepository

    test_email = f"test_db_probe_{uuid.uuid4().hex[:6]}@example.com"
    user_data = {
        "name": "Neon Test User",
        "email": test_email,
        "password_hash": "$2b$10$probe_hash_verification_sample",
        "provider": "local"
    }
    user = UserRepository.create(db, user_data)
    
    # Query back immediately
    queried_user = UserRepository.get_by_email(db, test_email)
    
    return {
        "status": "success",
        "message": "User inserted into Neon PostgreSQL and verified",
        "inserted_row": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "provider": user.provider,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        },
        "queried_row_exists": queried_user is not None
    }
