import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.config import get_settings
from app.database import Base, engine
from app.services.document_processor import ensure_upload_dir
from app.services.qdrant_service import ensure_collection

logging.basicConfig(level=logging.INFO)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import text

        with engine.connect() as conn:
            conn.execute(
                text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS confidence JSON")
            )
            conn.commit()
    except Exception as e:
        logging.warning("Could not migrate messages.confidence column: %s", e)
    ensure_upload_dir()
    try:
        ensure_collection()
    except Exception as e:
        logging.warning("Qdrant not available at startup: %s", e)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
print("LOADED CORS ORIGINS:", origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.app_name}
