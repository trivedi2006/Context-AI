import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # Relational Database
    DATABASE_URL: str = Field("", description="PostgreSQL connection string")
    
    # Secrets & Authentication
    JWT_SECRET_KEY: str = Field("scope_jwt_secret_key_production_2026_super_secure", description="JWT secret key")
    SECRET_KEY: str = Field("", description="General secret key alias")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7
    
    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    # LLM & Vector Search
    GROQ_API_KEY: str = ""
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    
    # RAG Settings
    TOP_K: int = 5
    COLLECTION_NAME: str = "projectbrain_v1_docs"
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_VECTOR_DIM: int = 384
    GROQ_MODEL_NAME: str = "llama-3.3-70b-versatile"
    MAX_FILE_SIZE_MB: int = 25
    LOG_LEVEL: str = "INFO"
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def model_post_init(self, __context):
        if not self.SECRET_KEY and self.JWT_SECRET_KEY:
            self.SECRET_KEY = self.JWT_SECRET_KEY
        elif not self.JWT_SECRET_KEY and self.SECRET_KEY:
            self.JWT_SECRET_KEY = self.SECRET_KEY

settings = Settings()
