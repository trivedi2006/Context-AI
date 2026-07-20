# ProjectBrain AI Backend

FastAPI Clean Architecture backend for single-PDF Retrieval-Augmented Generation (RAG).

## Features
- **PDF Extraction**: PyMuPDF (`fitz`) with page-number preservation.
- **Chunking**: Recursive Character Text Splitter (500 size / 100 overlap).
- **Local Embeddings**: `SentenceTransformers` (`BAAI/bge-small-en-v1.5`, 384 dimensions).
- **Vector DB**: Qdrant Cloud.
- **LLM**: Groq API (`llama-3.3-70b-versatile`) with Server-Sent Events (SSE) streaming.
- **Zero Hallucination**: Grounded system prompt with strictly page citations.

## Setup & Running Locally

1. Install Dependencies:
```bash
pip install -r requirements.txt
```

2. Configure Environment:
Copy `.env.example` to `.env` and fill in:
- `GROQ_API_KEY`
- `QDRANT_URL`
- `QDRANT_API_KEY`

3. Start Uvicorn Server:
```bash
uvicorn app.main:app --reload --port 8000
```
Visit http://localhost:8000/docs for Swagger UI documentation.
