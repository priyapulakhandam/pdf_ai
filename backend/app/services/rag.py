import json
from dataclasses import dataclass
from typing import AsyncGenerator, Literal

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

from app.config import get_settings
from app.schemas.chat import Citation
from app.services.cache import cache_get, cache_set
from app.services.embeddings import configure_gemini, embed_query
from app.services.qdrant_service import search_chunks

settings = get_settings()

FALLBACK_MODELS = (
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
)

SYSTEM_PROMPT = """You are a helpful AI assistant that answers questions based ONLY on the provided document context.
Rules:
- Answer using only the context below. If the answer is not in the context, say you don't have enough information.
- Be concise and accurate.
- Reference page numbers when relevant.
"""

CAUTION_NOTE = (
    "Note: retrieved context has low relevance scores. "
    "Answer cautiously and say if you're uncertain."
)

INSUFFICIENT_CONTEXT_ANSWER = ""

ConfidenceLevel = Literal["low", "medium", "high"]


@dataclass
class ConfidenceResult:
    confidence_score: float
    confidence_level: ConfidenceLevel
    insufficient_context: bool
    max_similarity: float
    avg_similarity: float

    def to_dict(self) -> dict:
        return {
            "confidence_score": round(self.confidence_score, 4),
            "confidence_level": self.confidence_level,
            "insufficient_context": self.insufficient_context,
            "max_similarity": round(self.max_similarity, 4),
            "avg_similarity": round(self.avg_similarity, 4),
        }


@dataclass
class RAGResult:
    answer: str
    citations: list[Citation]
    confidence: ConfidenceResult


def _friendly_gemini_error(exc: Exception) -> str:
    if isinstance(exc, google_exceptions.ResourceExhausted):
        return (
            "Gemini API quota exceeded for this model. Wait ~30 seconds and retry, "
            "or set GEMINI_MODEL=gemini-2.0-flash-lite in backend/.env. "
            "Check usage: https://ai.google.dev/gemini-api/docs/rate-limits"
        )
    if isinstance(exc, google_exceptions.PermissionDenied):
        return (
            "Gemini API key is invalid or lacks permission. "
            "Use a key from https://aistudio.google.com/apikey (starts with AIza)."
        )
    return f"Gemini API error: {exc}"


def _model_candidates() -> list[str]:
    seen: set[str] = set()
    ordered = [settings.gemini_model, *FALLBACK_MODELS]
    result: list[str] = []
    for name in ordered:
        if name and name not in seen:
            seen.add(name)
            result.append(name)
    return result


def evaluate_retrieval_confidence(chunks: list[dict]) -> ConfidenceResult:
    """Score retrieval quality from Qdrant similarity scores (cosine, 0–1)."""
    if not chunks:
        return ConfidenceResult(
            confidence_score=0.0,
            confidence_level="low",
            insufficient_context=True,
            max_similarity=0.0,
            avg_similarity=0.0,
        )

    scores = sorted((c.get("score") or 0.0 for c in chunks), reverse=True)
    top3 = scores[:3]
    max_similarity = top3[0]
    avg_similarity = sum(top3) / len(top3)
    confidence_score = avg_similarity

    if max_similarity < 0.50:
        return ConfidenceResult(
            confidence_score=confidence_score,
            confidence_level="low",
            insufficient_context=True,
            max_similarity=max_similarity,
            avg_similarity=avg_similarity,
        )

    if max_similarity > 0.65:
        level: ConfidenceLevel = "high"
    elif max_similarity >= 0.58:
        level = "medium"
    else:
        level = "low"

    return ConfidenceResult(
        confidence_score=confidence_score,
        confidence_level=level,
        insufficient_context=False,
        max_similarity=max_similarity,
        avg_similarity=avg_similarity,
    )


def _build_prompt(
    query: str,
    chunks: list[dict],
    history: list[dict] | None,
    *,
    caution: bool = False,
) -> str:
    context = _build_context(chunks)
    history_text = ""
    if history:
        for msg in history[-6:]:
            history_text += f"{msg['role'].upper()}: {msg['content']}\n"

    caution_block = f"{CAUTION_NOTE}\n\n" if caution else ""

    return f"""{SYSTEM_PROMPT}

{caution_block}Context:
{context}

Conversation history:
{history_text}

User question: {query}

Answer:"""


def _build_context(chunks: list[dict]) -> str:
    parts = []
    for i, c in enumerate(chunks, 1):
        page = c.get("page_number", "?")
        parts.append(f"[Source {i} | {c['document_name']} | Page {page}]\n{c['text']}")
    return "\n\n".join(parts)


def _chunks_to_citations(chunks: list[dict]) -> list[Citation]:
    return [
        Citation(
            document_id=c["document_id"],
            document_name=c["document_name"],
            page_number=c.get("page_number"),
            chunk_index=c["chunk_index"],
            excerpt=c["text"][:300] + ("..." if len(c["text"]) > 300 else ""),
            score=c.get("score"),
        )
        for c in chunks
    ]


def retrieve_context(user_id: str, query: str, document_ids: list[str] | None) -> list[dict]:
    cache_key = f"rag:{user_id}:{hash(query)}:{','.join(sorted(document_ids or []))}"
    cached = cache_get(cache_key)
    if cached:
        return cached
    query_vector = embed_query(query)
    chunks = search_chunks(user_id, query_vector, document_ids)
    cache_set(cache_key, chunks, ttl=300)
    return chunks


def _generate_content(prompt: str):
    configure_gemini()
    last_error: Exception | None = None
    for model_name in _model_candidates():
        try:
            model = genai.GenerativeModel(model_name)
            return model.generate_content(prompt)
        except google_exceptions.GoogleAPIError as exc:
            last_error = exc
            if isinstance(exc, google_exceptions.ResourceExhausted):
                continue
            if isinstance(exc, google_exceptions.NotFound):
                continue
            raise
    if last_error:
        raise last_error
    raise RuntimeError("No Gemini model available")


def generate_answer(
    query: str,
    chunks: list[dict],
    history: list[dict] | None = None,
) -> RAGResult:
    confidence = evaluate_retrieval_confidence(chunks)
    citations = _chunks_to_citations(chunks)

    if confidence.insufficient_context:
        return RAGResult(
            answer=INSUFFICIENT_CONTEXT_ANSWER,
            citations=citations,
            confidence=confidence,
        )

    use_caution = 0.50 <= confidence.max_similarity <= 0.65
    prompt = _build_prompt(query, chunks, history, caution=use_caution)

    try:
        response = _generate_content(prompt)
        answer = response.text or "I could not generate a response."
    except google_exceptions.GoogleAPIError as exc:
        answer = _friendly_gemini_error(exc)

    return RAGResult(answer=answer, citations=citations, confidence=confidence)


async def stream_answer(
    query: str,
    chunks: list[dict],
    history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    confidence = evaluate_retrieval_confidence(chunks)
    citations = _chunks_to_citations(chunks)

    yield f"data: {json.dumps({'type': 'confidence', **confidence.to_dict()})}\n\n"

    if confidence.insufficient_context:
        yield f"data: {json.dumps({'type': 'citations', 'citations': [c.model_dump() for c in citations]})}\n\n"
        yield "data: [DONE]\n\n"
        return

    use_caution = 0.50 <= confidence.max_similarity <= 0.65
    prompt = _build_prompt(query, chunks, history, caution=use_caution)

    configure_gemini()
    last_error: Exception | None = None

    for model_name in _model_candidates():
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'type': 'token', 'content': chunk.text})}\n\n"
            yield f"data: {json.dumps({'type': 'citations', 'citations': [c.model_dump() for c in citations]})}\n\n"
            yield "data: [DONE]\n\n"
            return
        except google_exceptions.ResourceExhausted as exc:
            last_error = exc
            continue
        except google_exceptions.NotFound as exc:
            last_error = exc
            continue
        except google_exceptions.GoogleAPIError as exc:
            msg = _friendly_gemini_error(exc)
            yield f"data: {json.dumps({'type': 'error', 'content': msg})}\n\n"
            yield "data: [DONE]\n\n"
            return

    msg = _friendly_gemini_error(last_error) if last_error else "Gemini API unavailable."
    yield f"data: {json.dumps({'type': 'error', 'content': msg})}\n\n"
    yield "data: [DONE]\n\n"
