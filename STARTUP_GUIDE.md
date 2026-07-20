# 🚀 Context AI — Complete Project Startup & Setup Guide

Welcome to **Context AI** (*"Understand Every Context of Every Project."*), a production-grade Retrieval-Augmented Generation (RAG) platform featuring:
- **Calm, Minimal, Desktop-Grade UI & Aesthetics**
- **Full Authentication System**: Email/Password + Google OAuth 2.0 + HTTP-Only JWT Cookies
- **Intent-Based Dynamic Retrieval**: Contextual RAG grounding
- **FastAPI + Next.js + PostgreSQL + Qdrant Cloud + Groq LLM Stack**

---

## 📋 Table of Contents
1. [Prerequisites](#-prerequisites)
2. [Project Architecture](#-project-architecture)
3. [Environment Configuration (`.env`)](#-environment-configuration-env)
4. [Backend Startup (FastAPI + Python)](#-backend-startup-fastapi--python)
5. [Frontend Startup (Next.js + React)](#-frontend-startup-nextjs--react)
6. [Google OAuth 2.0 Setup](#-google-oauth-20-setup)
7. [Database Setup (PostgreSQL)](#-database-setup-postgresql)
8. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🛠️ Prerequisites

Ensure you have the following installed on your operating system:
- **Python 3.10+** (Python 3.12 or 3.13 recommended)
- **Node.js 18+** & `npm`
- **Git**

---

## 🏗️ Project Architecture

```
d:\RAG/
├── backend/                  # FastAPI Python Server
│   ├── app/
│   │   ├── api/              # Document & Chat Streaming Endpoints
│   │   ├── auth/             # Authentication (JWT, Google OAuth, Models, DB)
│   │   ├── core/             # Configuration & Logging Engine
│   │   ├── models/           # SQLAlchemy 2.0 DB Models
│   │   ├── repositories/     # Repository Pattern Layer
│   │   └── services/         # RAG Services (Intent, Retrieval, Chunker, LLM)
│   ├── .env                  # Backend Secrets & API Keys
│   ├── requirements.txt      # Python Dependencies
│   └── main.py               # Uvicorn Server Entry Point
│
└── frontend/                 # Next.js + React Frontend
    ├── app/                  # Next.js App Router & Layout
    ├── components/
    │   ├── auth/             # Login, Signup, Google OAuth Button, Visualizer
    │   ├── chat/             # Chat Stream, Message Items, Input, Citations
    │   ├── navbar/           # Header Navbar & User Profile Menu
    │   └── upload/           # Upload Workspace, Progress Bar, Document Card
    ├── contexts/             # Auth Context Provider
    ├── services/             # Axios API Service Layer
    └── types/                # TypeScript Type Definitions
```

---

## ⚙️ Environment Configuration (`.env`)

1. Open the file **`backend/.env`**.
2. Populate your secrets and API keys:

```env
# ==============================================================================
# CONTEXT AI - ENVIRONMENT CONFIGURATION
# ==============================================================================

# PostgreSQL Database Connection String
DATABASE_URL="postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require"

# JWT Token Signing Secret
JWT_SECRET_KEY="context_ai_jwt_secret_key_production_2026_super_secure"

# Groq LLM API Key (Get free key from https://console.groq.com)
GROQ_API_KEY="gsk_your_groq_api_key_here"

# Google OAuth 2.0 Credentials (From https://console.cloud.google.com)
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your_google_client_secret"

# Qdrant Cloud Vector Database (From https://cloud.qdrant.io)
QDRANT_URL="https://your-qdrant-cluster-url.qdrant.io"
QDRANT_API_KEY="your_qdrant_api_key"

# Application Settings
FRONTEND_URL="http://localhost:3000"
TOP_K=5
COLLECTION_NAME="projectbrain_v1_docs"
EMBEDDING_MODEL_NAME="BAAI/bge-small-en-v1.5"
EMBEDDING_VECTOR_DIM=384
GROQ_MODEL_NAME="llama-3.3-70b-versatile"
MAX_FILE_SIZE_MB=25
LOG_LEVEL="INFO"
```

---

## 🐍 Backend Startup (FastAPI + Python)

### Step 1: Open Terminal in `/backend`
```bash
cd d:\RAG\backend
```

### Step 2: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Run the FastAPI Development Server
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Backend API**: `http://127.0.0.1:8000`
- **Swagger Interactive API Docs**: `http://127.0.0.1:8000/docs`
- **Health Check Endpoint**: `http://127.0.0.1:8000/health`

---

## ⚛️ Frontend Startup (Next.js + React)

### Step 1: Open Terminal in `/frontend`
```bash
cd d:\RAG\frontend
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Run the Next.js Dev Server
```bash
npm run dev
```

- **Live Application**: Open **`http://localhost:3000`** in your browser.

---

## 🔐 Google OAuth 2.0 Setup

To enable one-click **"Continue with Google"** login:

1. Go to **[Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)**.
2. Select or create an **OAuth 2.0 Web Application Client ID**.
3. Set **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
4. Set **Authorized redirect URIs**:
   - `http://127.0.0.1:8000/auth/google/callback`
   - `http://localhost:8000/auth/google/callback`
5. Copy your **Client ID** and **Client Secret** into `backend/.env`.

---

## 🗄️ Database Setup (PostgreSQL)

Set `DATABASE_URL` in `backend/.env` to your PostgreSQL (Neon / Supabase / Render / Local) database connection string.

---

## ❓ Troubleshooting & FAQs

### Error: `[WinError 10048] Only one usage of each socket address is permitted`
**Cause**: Port 8000 is already being used by another running process.
**Fix**: Stop the existing Python process or kill it via PowerShell:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
```

### Backend Health Status Check
Run this in terminal or browser to verify all services:
```bash
curl http://127.0.0.1:8000/health
```
Expected output:
```json
{"database":"connected","google_auth":"connected","groq":"connected","qdrant":"connected"}
```
