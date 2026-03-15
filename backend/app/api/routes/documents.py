import os
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.config import settings
from app.core.ingestion import (
    ingest_file,
    delete_document,
    list_documents,
    SUPPORTED_EXTENSIONS,
)
from app.models.response_models import IngestionResult, DocumentRecord, DeleteResult

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=IngestionResult)
async def upload_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: {', '.join(SUPPORTED_EXTENSIONS)}",
        )

    if file.size and file.size > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {settings.max_file_size_mb} MB",
        )

    doc_id = str(uuid.uuid4())
    os.makedirs(settings.upload_dir, exist_ok=True)
    upload_path = os.path.join(settings.upload_dir, f"{doc_id}{ext}")

    content = await file.read()
    with open(upload_path, "wb") as f:
        f.write(content)

    try:
        result = ingest_file(
            file_path=upload_path,
            doc_id=doc_id,
            filename=file.filename,
        )
    except Exception as e:
        # Clean up on failure
        if os.path.exists(upload_path):
            os.remove(upload_path)
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")
    finally:
        # Always clean up temp file after ingestion
        background_tasks.add_task(_safe_remove, upload_path)

    return IngestionResult(**result)


@router.get("", response_model=list[DocumentRecord])
async def get_documents():
    docs = list_documents()
    return [DocumentRecord(**d) for d in docs]


@router.delete("/{doc_id}", response_model=DeleteResult)
async def remove_document(doc_id: str):
    deleted = delete_document(doc_id)
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return DeleteResult(deleted_chunks=deleted)


def _safe_remove(path: str) -> None:
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass
