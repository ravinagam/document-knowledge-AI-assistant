import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import documents, chat

app = FastAPI(
    title="Document Knowledge Assistant API",
    description="Local RAG system powered by Ollama + ChromaDB + SentenceTransformers",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(chat.router)


@app.on_event("startup")
async def startup():
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.chroma_persist_directory, exist_ok=True)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "ollama_model": settings.ollama_model,
        "embedding_model": settings.embedding_model,
    }
