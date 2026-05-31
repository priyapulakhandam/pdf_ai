from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI PDF Chat & Knowledge Assistant"
    debug: bool = False
    api_prefix: str = "/api/v1"

    database_url: str = "postgresql://postgres:postgres@localhost:5432/pdf_chat"
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "models/gemini-embedding-001"
    embedding_dimensions: int = 768

    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str | None = None
    qdrant_collection: str = "pdf_chunks"

    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 3600

    upload_dir: str = "./uploads"
    max_upload_mb: int = 50
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k_chunks: int = 8

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
