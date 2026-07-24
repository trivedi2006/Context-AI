import os
import time
from typing import Generator, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.config.settings import settings
from app.utils.logging import logger
from app.database.base import Base

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, "context_ai.db").replace("\\", "/")
DEFAULT_SQLITE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH}"

def create_db_engine():
    """
    Initializes a production-grade PostgreSQL database engine with connection pooling.
    Enforces PostgreSQL in production environments (Render) and falls back to absolute local SQLite path in local dev.
    """
    is_production = bool(os.getenv("RENDER") or os.getenv("ENVIRONMENT") == "production")
    raw_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""

    # Standardize postgresql driver scheme
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)

    if not raw_url or raw_url.startswith("sqlite:///./"):
        if is_production:
            raise RuntimeError("CRITICAL: DATABASE_URL environment variable is missing or invalid in production deployment! PostgreSQL is required.")
        logger.warning(f"Using single absolute local SQLite database engine: {DEFAULT_SQLITE_URL}")
        return create_engine(DEFAULT_SQLITE_URL, connect_args={"check_same_thread": False})

    # If PostgreSQL URL is provided
    if "postgresql" in raw_url:
        try:
            logger.info("Initializing production PostgreSQL database engine...")
            eng = create_engine(
                raw_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                pool_recycle=300,
            )
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Successfully established connection to PostgreSQL database server.")
            return eng
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL database: {str(e)}")
            if is_production:
                raise RuntimeError(f"Production PostgreSQL connection failure: {str(e)}")
            logger.warning(f"Falling back to single absolute local SQLite engine: {DEFAULT_SQLITE_URL}")
            return create_engine(DEFAULT_SQLITE_URL, connect_args={"check_same_thread": False})

    # Local SQLite fallback
    return create_engine(DEFAULT_SQLITE_URL, connect_args={"check_same_thread": False})

engine = create_db_engine()

# Automatically create tables if not present
try:
    from app.models.user import User  # Import models to register schemas
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified and initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database schemas: {str(e)}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    Dependency yielding a database session. Guaranteed connection cleanup and automatic rollback on error.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session error (rolled back): {str(e)}")
        raise
    finally:
        db.close()

def check_database_health() -> Tuple[bool, float]:
    """
    Health check executing 'SELECT 1' against the database and returning (is_healthy, latency_ms).
    """
    if engine is None:
        return False, 0.0
    t0 = time.perf_counter()
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        latency_ms = (time.perf_counter() - t0) * 1000
        return True, round(latency_ms, 2)
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False, 0.0
