import logging
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal
from app.models.document import Document, DocumentStatus
from app.services.embeddings import embed_texts
from app.services.pdf_processor import extract_text_from_pdf
from app.services.qdrant_service import delete_document_chunks, upsert_chunks

logger = logging.getLogger(__name__)
settings = get_settings()


def process_document(document_id: str) -> None:
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return

        doc.status = DocumentStatus.PROCESSING
        db.commit()

        chunks, page_count = extract_text_from_pdf(doc.file_path)
        if not chunks:
            doc.status = DocumentStatus.FAILED
            doc.error_message = "No text could be extracted from this PDF."
            db.commit()
            return

        texts = [c.text for c in chunks]
        vectors = embed_texts(texts)

        delete_document_chunks(doc.user_id, doc.id)
        upsert_chunks(doc.user_id, doc.id, doc.original_filename, chunks, vectors)

        doc.status = DocumentStatus.READY
        doc.page_count = page_count
        doc.chunk_count = len(chunks)
        doc.error_message = None
        db.commit()
        logger.info("Processed document %s: %d chunks", document_id, len(chunks))
    except Exception as e:
        logger.exception("Failed to process document %s", document_id)
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(e)[:500]
            db.commit()
    finally:
        db.close()


def ensure_upload_dir() -> Path:
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path
