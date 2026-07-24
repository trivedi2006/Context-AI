import os
import time
import tempfile
from typing import Generator, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.config.settings import settings
from app.utils.logging import logger

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_safe_sqlite_url() -> str:
    """
    Returns an absolute, writable SQLite connection URL ensuring parent directory exists.
    """
    try:
        db_path = os.path.join(BASE_DIR, "context_ai.db")
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        # Test writable
        with open(db_path, "a"):
            pass
        return f"sqlite:///{db_path.replace('\\', '/')}"
    except Exception:
        # Fall back to system temp directory if application directory is read-only
        tmp_dir = tempfile.gettempdir()
        tmp_path = os.path.join(tmp_dir, "context_ai.db").replace("\\", "/")
        return f"sqlite:///{tmp_path}"

def create_db_engine():
    """
    Initializes database engine. Connects to Neon PostgreSQL when configured,
    and falls back safely to a writable SQLite file without raising startup crashes.
    """
    raw_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""

    # Standardize postgresql driver scheme
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)

    # 1. Attempt PostgreSQL connection if URL is provided
    if raw_url and "postgresql" in raw_url:
        masked_url = raw_url
        if "@" in raw_url:
            prefix, rest = raw_url.split("@", 1)
            if ":" in prefix:
                scheme_user, _ = prefix.rsplit(":", 1)
                masked_url = f"{scheme_user}:****@{rest}"

        print("\n==================================================")
        print("ACTIVE DATABASE")
        print(f"{masked_url}")
        print("==================================================\n")

        try:
            logger.info("Initializing production Neon PostgreSQL database engine...")
            eng = create_engine(
                raw_url,
                pool_pre_ping=True,
                pool_recycle=300,
                future=True,
                echo=False,
            )
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Successfully connected to Neon PostgreSQL database server.")
            return eng
        except Exception as e:
            logger.error(f"Failed to connect to Neon PostgreSQL database: {str(e)}. Initializing fallback database.")

    # 2. Local / Fallback SQLite Engine
    sqlite_url = get_safe_sqlite_url()
    print("\n==================================================")
    print("ACTIVE DATABASE (LOCAL / FALLBACK)")
    print(f"{sqlite_url}")
    print("==================================================\n")

    logger.warning(f"Initializing local SQLite database engine at {sqlite_url}")
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})

# Create single global database engine
engine = create_db_engine()

# Create single sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

# Automatically create tables for SQLite / Local fallback
try:
    from app.models.user import User
    from app.database.base import Base
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.error(f"Schema verification note: {str(e)}")

def get_db() -> Generator[Session, None, None]:
    """
    Dependency yielding a database session with automatic cleanup and rollback on error.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"[DB SESSION ROLLBACK] Session execution error: {str(e)}")
        raise
    finally:
        db.close()

def check_database_health() -> Tuple[bool, float]:
    """
    Health check executing 'SELECT 1' against database and returning (is_healthy, latency_ms).
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
