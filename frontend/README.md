# ProjectBrain AI Frontend

Next.js 15 App Router frontend for ProjectBrain AI with Tailwind CSS, Framer Motion, and Server-Sent Events (SSE) streaming chat.

## Features
- **Modern SaaS UI**: Glassmorphism aesthetic, dark mode, crisp typography.
- **Upload Dropzone**: Drag-and-drop PDF upload with 25MB validation & timing metrics.
- **Streaming Chat**: Real-time response tokens with markdown rendering & code copy.
- **Interactive Citations**: Clickable page number badges revealing exact context excerpts.
- **Real-Time Health Pill**: Live backend, Groq API, and Qdrant Cloud health monitoring.

## Local Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variable (optional):
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run development server:
```bash
npm run dev
```
Open http://localhost:3000 in your browser.
