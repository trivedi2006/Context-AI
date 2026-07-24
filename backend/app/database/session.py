import os
import time
from typing import Generator, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.config.settings import settings
from app.utils.logging import logger

def create_db_engine():
    """
    Initializes a production-grade Neon PostgreSQL database engine with connection pooling.
    Enforces PostgreSQL exclusively. Missing or non-PostgreSQL URLs will halt startup immediately.
    """
    raw_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""

    # Standardize postgresql driver scheme
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)

    if not raw_url or "postgresql" not in raw_url:
        logger.critical("CRITICAL ERROR: DATABASE_URL environment variable is missing or invalid! Neon PostgreSQL is required.")
        raise RuntimeError("CRITICAL: DATABASE_URL environment variable is missing or invalid! PostgreSQL connection is required.")

    # Mask credentials for startup print
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
        logger.info("Successfully established connection to Neon PostgreSQL database server.")
        return eng
    except Exception as e:
        logger.critical(f"Failed to connect to Neon PostgreSQL database: {str(e)}")
        raise RuntimeError(f"CRITICAL: Production PostgreSQL connection failure: {str(e)}")

# Create single global database engine
engine = create_db_engine()

# Create single sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

def get_db() -> Generator[Session, None, None]:
    """
    Dependency yielding a database session. Guaranteed cleanup and automatic rollback on error.
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
    Health check executing 'SELECT 1' against Neon PostgreSQL and returning (is_healthy, latency_ms).
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
