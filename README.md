# Document Knowledge AI Assistant

A fully local, open-source RAG (Retrieval-Augmented Generation) system for querying your documents using natural language. Zero API costs — everything runs on your machine.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (React, TypeScript, Tailwind CSS) |
| Backend | FastAPI (Python 3.11+) |
| Framework | LangChain |
| Vector DB | ChromaDB (persistent, local) |
| Embeddings | SentenceTransformers `all-MiniLM-L6-v2` (local) |
| LLM | Ollama (`llama3.2` or any local model) |

## Running Options

### Option A — Docker (Recommended, truly standalone)

**Only prerequisite: [Docker Desktop](https://www.docker.com/products/docker-desktop/)**

```bash
# Windows — double-click or run:
start.bat

# macOS/Linux:
bash start.sh
```

That's it. On first run it will:
1. Build the backend and frontend containers
2. Pull the Llama 3.2 model (~2 GB, one-time download)
3. Start all services

Open **http://localhost:3000**

```bash
docker compose down        # stop everything
docker compose logs -f     # view logs
docker compose up -d       # restart
```

> **Data persists between restarts** — your uploaded documents and the LLM model are stored in Docker volumes.

---

### Option B — Manual (for development)

**Prerequisites:** Python 3.11+, Node.js 20+, Ollama

**Ollama:**
```bash
# Install from https://ollama.com, then:
ollama pull llama3.2
# Ollama runs as a background service automatically after install
```

**Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

## Usage

1. Navigate to **Documents** tab
2. Upload PDF, DOCX, or TXT files
3. Navigate to **Chat** tab
4. Ask questions about your documents

## Supported File Types

- PDF (`.pdf`)
- Word documents (`.docx`)
- Plain text (`.txt`, `.md`)

## Configuration

Edit `backend/.env` to tune:

| Setting | Default | Description |
|---|---|---|
| `OLLAMA_MODEL` | `llama3.2` | Local LLM model name |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | SentenceTransformer model |
| `CHUNK_SIZE` | `1000` | Characters per chunk |
| `CHUNK_OVERLAP` | `200` | Overlap between chunks |
| `RETRIEVAL_K` | `5` | Top-k chunks retrieved |
