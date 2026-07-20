from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.config.settings import settings
from app.utils.logging import logger

def get_db_url() -> str:
    db_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is missing or empty.")
    
    # Standardize postgresql driver scheme to postgresql+psycopg
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
        
    return db_url

try:
    DATABASE_URL = get_db_url()
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=300,
    )
    logger.info("SQLAlchemy PostgreSQL engine initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize PostgreSQL engine: {str(e)}")
    engine = None

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None

def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise RuntimeError("Database engine is not initialized. Check DATABASE_URL configuration.")
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
