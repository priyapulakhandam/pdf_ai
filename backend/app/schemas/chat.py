from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Citation(BaseModel):
    document_id: str
    document_name: str
    page_number: int | None
    chunk_index: int
    excerpt: str
    score: float | None = None


class ChatSessionCreate(BaseModel):
    title: str | None = "New Chat"
    document_ids: list[str] = Field(default_factory=list)


class ChatSessionUpdate(BaseModel):
    title: str | None = None
    document_ids: list[str] | None = None


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=8000)
    stream: bool = False


class ConfidenceInfo(BaseModel):
    confidence_score: float
    confidence_level: Literal["low", "medium", "high"]
    insufficient_context: bool
    max_similarity: float
    avg_similarity: float


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    citations: list[Citation] | None = None
    confidence: ConfidenceInfo | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionResponse(BaseModel):
    id: str
    title: str
    document_ids: list[str]
    document_names: list[str] = Field(default_factory=list)
    last_message_preview: str | None = None
    last_message_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class ChatSessionListResponse(BaseModel):
    sessions: list[ChatSessionResponse]
    total: int
