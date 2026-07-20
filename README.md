# Context AI

Understand Every Context of Every Project.

Context AI is a production-ready Retrieval-Augmented Generation platform that enables users to upload documents and interact with them using context-aware AI conversations.

---

## 🛠️ Built With

- **React** — Desktop-grade responsive user interface
- **FastAPI** — High-performance Python backend server
- **PostgreSQL** — Primary relational database storage (Neon Cloud)
- **Qdrant** — Vector database for semantic search & retrieval
- **Groq** — LLM engine for fast token streaming (`llama-3.3-70b-versatile`)
- **SQLAlchemy** — ORM and database repository layer

---

## ✨ Key Features

- 🔒 **Full Authentication**: Email/Password + Google OAuth 2.0 with JWT session security
- 📑 **Paragraph-Aware Document Parsing**: 600-800 token chunking preserving context and headings
- ⚡ **Local CPU Embeddings**: 384-dimensional dense vectors (`BAAI/bge-small-en-v1.5`)
- 🤖 **Contextual AI Retrieval**: Intent-based retrieval pipeline delivering zero-hallucination responses with page citations

---

## 🚀 Quickstart Guide

See **[STARTUP_GUIDE.md](file:///d:/RAG/STARTUP_GUIDE.md)** for detailed installation, environment setup, and startup instructions.

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

## 📄 License
Licensed under the MIT License.
