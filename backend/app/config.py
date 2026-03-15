from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # Ollama (local LLM - free, no API key)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    # SentenceTransformer embedding (local - free, no API key)
    embedding_model: str = "all-MiniLM-L6-v2"

    # ChromaDB
    chroma_persist_directory: str = "./chroma_db"
    chroma_collection_name: str = "documents"

    # LLM generation
    llm_temperature: float = 0.1
    llm_max_tokens: int = 2048

    # Chunking
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Retrieval
    retrieval_k: int = 5
    retrieval_score_threshold: float = 0.3

    # Upload
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 50

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
