import gc
import threading
from typing import List
from app.config.settings import settings
from app.utils.logging import logger

class EmbeddingService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(EmbeddingService, cls).__new__(cls)
                    cls._instance._model = None
        return cls._instance

    def _get_model(self):
        """
        Lazily loads the SentenceTransformer model on first usage.
        Does NOT load model during server startup or module import.
        """
        if self._model is None:
            with self._lock:
                if self._model is None:
                    logger.info(f"Lazily loading embedding model: {settings.EMBEDDING_MODEL_NAME}...")
                    
                    # Import PyTorch and cap CPU thread memory overhead
                    import torch
                    torch.set_num_threads(1)
                    torch.set_num_interop_threads(1)
                    
                    from sentence_transformers import SentenceTransformer
                    self._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME, device="cpu")
                    logger.info(f"Successfully loaded embedding model. Vector dimension: {settings.EMBEDDING_VECTOR_DIM}")
        return self._model

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates dense vector embeddings for a list of text strings lazily on CPU.
        """
        if not texts:
            return []
        
        model = self._get_model()
        embeddings = model.encode(
            texts,
            batch_size=16,
            show_progress_bar=False,
            normalize_embeddings=True
        )
        result = embeddings.tolist()
        
        # Trigger explicit garbage collection to release intermediate tensors
        gc.collect()
        return result

    def generate_query_embedding(self, query_text: str) -> List[float]:
        """
        Generates dense vector embedding for a query string lazily on CPU.
        """
        if not query_text.strip():
            return [0.0] * settings.EMBEDDING_VECTOR_DIM
            
        model = self._get_model()
        embedding = model.encode(
            query_text,
            show_progress_bar=False,
            normalize_embeddings=True
        )
        result = embedding.tolist()
        
        gc.collect()
        return result
