from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader

from app.config import get_settings

settings = get_settings()


@dataclass
class TextChunk:
    text: str
    page_number: int
    chunk_index: int


def extract_text_from_pdf(file_path: str) -> tuple[list[TextChunk], int]:
    reader = PdfReader(file_path)
    page_count = len(reader.pages)
    chunks: list[TextChunk] = []
    chunk_index = 0

    for page_num, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if not text:
            continue
        page_chunks = _split_text(text, page_num, chunk_index)
        chunks.extend(page_chunks)
        chunk_index += len(page_chunks)

    return chunks, page_count


def _split_text(text: str, page_number: int, start_index: int) -> list[TextChunk]:
    size = settings.chunk_size
    overlap = settings.chunk_overlap
    result: list[TextChunk] = []
    start = 0
    idx = start_index

    while start < len(text):
        end = start + size
        chunk_text = text[start:end].strip()
        if chunk_text:
            result.append(TextChunk(text=chunk_text, page_number=page_number, chunk_index=idx))
            idx += 1
        if end >= len(text):
            break
        start = end - overlap

    return result
