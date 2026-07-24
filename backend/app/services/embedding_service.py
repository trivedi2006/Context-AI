import gc
import threading
from typing import List
from fastembed import TextEmbedding
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

    def _get_model(self) -> TextEmbedding:
        """
        Lazily loads the FastEmbed ONNX model on first request.
        Zero memory overhead at application startup, zero PyTorch dependency.
        """
        if self._model is None:
            with self._lock:
                if self._model is None:
                    model_name = settings.EMBEDDING_MODEL_NAME or "BAAI/bge-small-en-v1.5"
                    logger.info(f"Lazily loading ONNX FastEmbed model: {model_name}...")
                    self._model = TextEmbedding(model_name=model_name)
                    logger.info(f"Successfully loaded ONNX FastEmbed model. Vector dimension: {settings.EMBEDDING_VECTOR_DIM}")
        return self._model

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates dense vector embeddings for a batch of text strings using ONNX Runtime.
        Returns a list of float vector arrays (dim=384).
        """
        if not texts:
            return []

        model = self._get_model()
        # FastEmbed model.embed returns a generator yielding numpy arrays
        embeddings_generator = model.embed(texts, batch_size=16)
        embeddings_list = [emb.tolist() for emb in embeddings_generator]

        gc.collect()
        return embeddings_list

    def generate_query_embedding(self, query_text: str) -> List[float]:
        """
        Generates dense vector embedding for a single query string using ONNX Runtime.
        """
        if not query_text or not query_text.strip():
            return [0.0] * settings.EMBEDDING_VECTOR_DIM

        model = self._get_model()
        embeddings_generator = model.embed([query_text])
        result = list(embeddings_generator)[0].tolist()

        gc.collect()
        return result
