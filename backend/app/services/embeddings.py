import google.generativeai as genai

from app.config import get_settings

settings = get_settings()


def configure_gemini() -> None:
    if settings.gemini_api_key:
        genai.configure(api_key=settings.gemini_api_key)


def _embed_kwargs() -> dict:
    return {
        "model": settings.gemini_embedding_model,
        "output_dimensionality": settings.embedding_dimensions,
    }


def embed_texts(texts: list[str]) -> list[list[float]]:
    configure_gemini()
    vectors: list[list[float]] = []
    for text in texts:
        result = genai.embed_content(
            content=text,
            task_type="retrieval_document",
            **_embed_kwargs(),
        )
        vectors.append(_extract_embedding(result))
    return vectors


def _extract_embedding(result: dict) -> list[float]:
    if isinstance(result, dict):
        emb = result.get("embedding")
        if isinstance(emb, list) and emb and isinstance(emb[0], (int, float)):
            return emb
        if isinstance(emb, list) and emb and isinstance(emb[0], list):
            return emb[0]
    raise ValueError("Unexpected embedding response format")


def embed_query(query: str) -> list[float]:
    configure_gemini()
    result = genai.embed_content(
        content=query,
        task_type="retrieval_query",
        **_embed_kwargs(),
    )
    return _extract_embedding(result)
