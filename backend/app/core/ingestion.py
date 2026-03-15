import os
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from app.config import settings
from app.core.vectorstore import get_vectorstore

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx"}


def load_document(file_path: str) -> list[Document]:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
    elif ext == ".docx":
        loader = Docx2txtLoader(file_path)
    elif ext in {".txt", ".md"}:
        loader = TextLoader(file_path, encoding="utf-8")
    else:
        raise ValueError(f"Unsupported file type: {ext}")
    return loader.load()


def chunk_documents(documents: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )
    return splitter.split_documents(documents)


def ingest_file(file_path: str, doc_id: str, filename: str) -> dict:
    """Load → chunk → embed → store in ChromaDB."""
    raw_docs = load_document(file_path)

    for doc in raw_docs:
        doc.metadata.update({
            "doc_id": doc_id,
            "filename": filename,
        })

    chunks = chunk_documents(raw_docs)

    vs = get_vectorstore()
    chunk_ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    vs.add_documents(chunks, ids=chunk_ids)

    return {
        "doc_id": doc_id,
        "filename": filename,
        "total_pages": len(raw_docs),
        "total_chunks": len(chunks),
    }


def delete_document(doc_id: str) -> int:
    """Remove all chunks for a document from ChromaDB."""
    vs = get_vectorstore()
    collection = vs._collection
    results = collection.get(where={"doc_id": doc_id})
    ids_to_delete = results["ids"]
    if ids_to_delete:
        collection.delete(ids=ids_to_delete)
    return len(ids_to_delete)


def list_documents() -> list[dict]:
    """Return unique documents stored in ChromaDB."""
    vs = get_vectorstore()
    collection = vs._collection
    results = collection.get(include=["metadatas"])

    seen: dict[str, dict] = {}
    chunk_counts: dict[str, int] = {}

    for meta in results["metadatas"]:
        doc_id = meta.get("doc_id")
        if not doc_id:
            continue
        if doc_id not in seen:
            seen[doc_id] = {
                "doc_id": doc_id,
                "filename": meta.get("filename", "unknown"),
            }
            chunk_counts[doc_id] = 0
        chunk_counts[doc_id] += 1

    return [
        {**doc, "total_chunks": chunk_counts[doc["doc_id"]]}
        for doc in seen.values()
    ]
