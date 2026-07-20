from typing import List
from sentence_transformers import SentenceTransformer
from app.core.config import settings
from app.core.logging import logger, log_execution_time

class EmbeddingService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._init_model()
        return cls._instance

    def _init_model(self):
        logger.info(f"Loading local embedding model: {settings.EMBEDDING_MODEL_NAME}...")
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        logger.info(f"Loaded embedding model successfully. Dimension: {settings.EMBEDDING_VECTOR_DIM}")

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates dense vector embeddings for a list of text strings locally on CPU.
        """
        if not texts:
            return []
        
        with log_execution_time(f"Generating embeddings for {len(texts)} chunks"):
            embeddings = self.model.encode(texts, batch_size=32, show_progress_bar=False, normalize_embeddings=True)
            return embeddings.tolist()

    def generate_query_embedding(self, query_text: str) -> List[float]:
        """
        Generates dense vector embedding for a query string.
        """
        with log_execution_time("Generating query embedding"):
            embedding = self.model.encode(query_text, normalize_embeddings=True)
            return embedding.tolist()
