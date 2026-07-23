import os
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.config.settings import settings
from app.utils.logging import logger
from app.database.base import Base

def create_db_engine():
    """
    Initializes a production-ready database engine with pre-ping validation.
    Falls back gracefully to local SQLite if DATABASE_URL is missing or unreachable.
    """
    db_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""
    
    if not db_url:
        logger.warning("No DATABASE_URL provided. Defaulting to local SQLite database.")
        return create_engine("sqlite:///./context_ai.db", connect_args={"check_same_thread": False})

    # Standardize postgresql driver scheme
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    try:
        if "sqlite" in db_url:
            eng = create_engine(db_url, connect_args={"check_same_thread": False})
        else:
            eng = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                pool_recycle=300,
            )
        # Verify connection
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database engine initialized and connected successfully.")
        return eng
    except Exception as e:
        logger.error(f"Failed to connect to primary database ({str(e)}). Falling back to local SQLite database.")
        return create_engine("sqlite:///./context_ai.db", connect_args={"check_same_thread": False})

engine = create_db_engine()

# Automatically create tables if not present
try:
    from app.models.user import User  # Import models to register schemas
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified and initialized.")
except Exception as e:
    logger.error(f"Error initializing database tables: {str(e)}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    Dependency returning a database session. Guaranteed to yield an active session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_database_health() -> bool:
    if engine is None:
        return False
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False
