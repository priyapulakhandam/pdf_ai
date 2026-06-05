# AI PDF Chat & Knowledge Assistant

Production-ready SaaS RAG application: upload PDFs, index them in Qdrant with Gemini embeddings, and chat with grounded answers and source citations.

## Architecture

```
PDF Upload → Text Extraction → Chunking → Embeddings (Gemini) → Qdrant
User Query → Semantic Search → Top Chunks → Gemini LLM → Answer + Citations
```

| Layer | Stack |
|-------|--------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| Vector DB | Qdrant |
| AI | Google Gemini (LLM + embeddings) |
| Cache | Redis |

## Features

- JWT authentication (signup / login)
- PDF upload, extraction, chunking, embedding, Qdrant indexing
- RAG chat with source citations
- Multi-PDF chat sessions
- Streaming responses (SSE)
- Redis caching for retrieval
- Background PDF processing (FastAPI BackgroundTasks)
- Docker Compose for local development

## Quick Start (Docker)

1. Copy environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

2. Set `GEMINI_API_KEY` in `backend/.env`.

3. Start services:

```bash
docker compose up --build
```

4. Open the app:

- Frontend: http://localhost:3000 (run separately — see below)
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Frontend (local dev)

```bash
cd frontend
npm install
npm run dev
```

### Backend (local dev without Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Start Postgres, Redis, Qdrant (or use docker compose for infra only)
uvicorn app.main:app --reload
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/signup` | Register |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Current user |
| POST | `/api/v1/documents/upload` | Upload PDF |
| GET | `/api/v1/documents` | List documents |
| DELETE | `/api/v1/documents/{id}` | Delete document |
| POST | `/api/v1/chat/sessions` | Create chat session |
| GET | `/api/v1/chat/sessions` | List sessions |
| GET | `/api/v1/chat/sessions/{id}` | Get session + messages |
| POST | `/api/v1/chat/sessions/{id}/messages` | Send message |
| POST | `/api/v1/chat/sessions/{id}/messages/stream` | Stream response (SSE) |

## Database Schema

- **users** — accounts
- **documents** — uploaded PDFs and processing status
- **chat_sessions** — conversations with `document_ids` (multi-PDF)
- **messages** — user/assistant messages with `citations` JSON

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | [Vercel](https://vercel.com) — set `NEXT_PUBLIC_API_URL` |
| Backend | [Render](https://render.com) or [Railway](https://railway.app) |
| PostgreSQL | [Neon](https://neon.tech) |
| Qdrant | [Qdrant Cloud](https://cloud.qdrant.io) |
| Redis | Upstash or managed Redis |

### Vercel

```bash
cd frontend
vercel
```

Set `NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1`.

### Backend (Render/Railway)

- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env: `DATABASE_URL`, `SECRET_KEY`, `GEMINI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `REDIS_URL`, `CORS_ORIGINS`

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/          # auth, documents, chat routes
│   │   ├── core/         # security, dependencies
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # PDF, embeddings, Qdrant, RAG, cache
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   └── src/              # Next.js app
├── docker-compose.yml
└── README.md
```

## License

MIT
