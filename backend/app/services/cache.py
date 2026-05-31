import json
from typing import Any

import redis

from app.config import get_settings

settings = get_settings()
_client: redis.Redis | None = None


def get_redis() -> redis.Redis | None:
    global _client
    if _client is not None:
        return _client
    try:
        _client = redis.from_url(settings.redis_url, decode_responses=True)
        _client.ping()
        return _client
    except redis.RedisError:
        return None


def cache_get(key: str) -> Any | None:
    client = get_redis()
    if not client:
        return None
    try:
        raw = client.get(key)
        return json.loads(raw) if raw else None
    except (redis.RedisError, json.JSONDecodeError):
        return None


def cache_set(key: str, value: Any, ttl: int | None = None) -> None:
    client = get_redis()
    if not client:
        return
    try:
        client.setex(key, ttl or settings.cache_ttl_seconds, json.dumps(value))
    except redis.RedisError:
        pass


def cache_delete(key: str) -> None:
    client = get_redis()
    if not client:
        return
    try:
        client.delete(key)
    except redis.RedisError:
        pass
