import uuid
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from app.config import get_settings
from app.services.pdf_processor import TextChunk

settings = get_settings()
_client: QdrantClient | None = None


def _vector_size() -> int:
    return settings.embedding_dimensions


def get_qdrant() -> QdrantClient:
    global _client
    if _client is None:
        kwargs: dict[str, Any] = {"url": settings.qdrant_url}
        if settings.qdrant_api_key:
            kwargs["api_key"] = settings.qdrant_api_key
        _client = QdrantClient(**kwargs)
    return _client


def ensure_collection() -> None:
    client = get_qdrant()
    collections = [c.name for c in client.get_collections().collections]

    if settings.qdrant_collection not in collections:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=qmodels.VectorParams(
                size=_vector_size(),
                distance=qmodels.Distance.COSINE,
            ),
        )

    # Create payload indexes
    try:
        client.create_payload_index(
            collection_name=settings.qdrant_collection,
            field_name="user_id",
            field_schema=qmodels.PayloadSchemaType.KEYWORD,
        )

        client.create_payload_index(
            collection_name=settings.qdrant_collection,
            field_name="document_id",
            field_schema=qmodels.PayloadSchemaType.KEYWORD,
        )
    except Exception:
        pass


def upsert_chunks(
    user_id: str,
    document_id: str,
    document_name: str,
    chunks: list[TextChunk],
    vectors: list[list[float]],
) -> None:
    ensure_collection()
    client = get_qdrant()
    points = []
    for chunk, vector in zip(chunks, vectors):
        point_id = str(uuid.uuid4())
        points.append(
            qmodels.PointStruct(
                id=point_id,
                vector=_pad_vector(vector),
                payload={
                    "user_id": user_id,
                    "document_id": document_id,
                    "document_name": document_name,
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "text": chunk.text,
                },
            )
        )
    if points:
        client.upsert(collection_name=settings.qdrant_collection, points=points)


def _pad_vector(vector: list[float], size: int | None = None) -> list[float]:
    size = size or _vector_size()
    if len(vector) >= size:
        return vector[:size]
    return vector + [0.0] * (size - len(vector))


def search_chunks(
    user_id: str,
    query_vector: list[float],
    document_ids: list[str] | None = None,
    limit: int | None = None,
) -> list[dict]:
    ensure_collection()
    client = get_qdrant()
    must = [qmodels.FieldCondition(key="user_id", match=qmodels.MatchValue(value=user_id))]
    if document_ids:
        must.append(
            qmodels.FieldCondition(key="document_id", match=qmodels.MatchAny(any=document_ids))
        )
    results = client.search(
        collection_name=settings.qdrant_collection,
        query_vector=_pad_vector(query_vector),
        query_filter=qmodels.Filter(must=must),
        limit=limit or settings.top_k_chunks,
    )
    return [
        {
            "document_id": hit.payload["document_id"],
            "document_name": hit.payload["document_name"],
            "page_number": hit.payload.get("page_number"),
            "chunk_index": hit.payload["chunk_index"],
            "text": hit.payload["text"],
            "score": hit.score,
        }
        for hit in results
        if hit.payload
    ]


def delete_document_chunks(user_id: str, document_id: str) -> None:
    client = get_qdrant()
    try:
        client.delete(
            collection_name=settings.qdrant_collection,
            points_selector=qmodels.FilterSelector(
                filter=qmodels.Filter(
                    must=[
                        qmodels.FieldCondition(key="user_id", match=qmodels.MatchValue(value=user_id)),
                        qmodels.FieldCondition(key="document_id", match=qmodels.MatchValue(value=document_id)),
                    ]
                )
            ),
        )
    except Exception:
        pass
