from pydantic import BaseModel
from typing import List, Optional


class SourceCitation(BaseModel):
    filename: str
    page: Optional[int] = None
    excerpt: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceCitation] = []


class DocumentRecord(BaseModel):
    doc_id: str
    filename: str
    total_chunks: int


class IngestionResult(BaseModel):
    doc_id: str
    filename: str
    total_pages: int
    total_chunks: int


class DeleteResult(BaseModel):
    deleted_chunks: int
