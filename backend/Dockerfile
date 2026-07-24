# Python 3.12 slim base image for ultra-lightweight container footprint
FROM python:3.12-slim

# Prevent Python from writing .pyc files & enable unbuffered logging output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Memory & Threading Optimizations for 512 MB Render Containers
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV FASTEMBED_CACHE_PATH=/app/.fastembed_cache

WORKDIR /app

# Install minimal system dependencies for PDF parsing & HTTP tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements (FastEmbed ONNX runtime without heavy PyTorch)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download ONNX model during container build time so ZERO network requests happen at runtime
RUN python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='BAAI/bge-small-en-v1.5')"

# Copy application source code
COPY . .

# Expose port
EXPOSE 8000

# Health check for Render
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Launch single-worker Uvicorn web server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
