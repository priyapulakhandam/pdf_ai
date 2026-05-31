from datetime import datetime
from pydantic import BaseModel

from app.models.document import DocumentStatus


class DocumentResponse(BaseModel):
    id: str
    original_filename: str
    file_size: int
    page_count: int | None
    chunk_count: int
    status: DocumentStatus
    error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
