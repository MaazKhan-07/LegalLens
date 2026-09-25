# LegalLens — Document Parsing Service
# Supports: PDF (text + OCR fallback), DOCX, plain text
# Privacy: documents are processed in-memory; not persisted by default.

import io
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ── PDF parsing ──────────────────────────────
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text from PDF. Falls back to OCR (Tesseract) if text layer is sparse.
    """
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        full_text = "\n\n".join(text_parts).strip()

        # If very little text extracted, try OCR
        if len(full_text) < 200:
            logger.info("PDF text layer sparse — attempting OCR fallback.")
            full_text = _ocr_pdf(file_bytes)

        return full_text
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise ValueError(f"Could not extract text from PDF: {e}")


def _ocr_pdf(file_bytes: bytes) -> str:
    """OCR fallback using Tesseract (requires Tesseract installed on system)."""
    try:
        import pytesseract
        from PIL import Image
        import pdfplumber

        ocr_parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                # Render page to image
                img = page.to_image(resolution=200).original
                text = pytesseract.image_to_string(img)
                ocr_parts.append(text)
        return "\n\n".join(ocr_parts).strip()
    except Exception as e:
        logger.warning(f"OCR failed: {e}. Returning whatever text was extracted.")
        return ""


# ── DOCX parsing ─────────────────────────────
def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file preserving paragraph structure."""
    try:
        from docx import Document as DocxDocument
        doc = DocxDocument(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        raise ValueError(f"Could not extract text from DOCX: {e}")


# ── Plain text ────────────────────────────────
def extract_text_from_plain(file_bytes: bytes) -> str:
    """Decode plain text, trying utf-8 then latin-1."""
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1", errors="replace")


# ── Dispatcher ────────────────────────────────
def parse_document(file_bytes: bytes, filename: str) -> str:
    """
    Parse a document from bytes based on its file extension.
    Returns extracted plain text.
    """
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_bytes)
    elif ext in (".txt", ".md", ".text"):
        return extract_text_from_plain(file_bytes)
    else:
        # Try plain text as a fallback
        logger.warning(f"Unknown extension {ext!r} — attempting plain text decode.")
        return extract_text_from_plain(file_bytes)


# ── Chunking (for long documents / RAG) ──────
def chunk_text(text: str, chunk_size: int = 3000, overlap: int = 300) -> list[dict]:
    """
    Split text into overlapping chunks for processing long documents.
    Returns a list of dicts: {chunk_index, text, char_start, char_end}
    """
    chunks = []
    start = 0
    idx = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk_text_content = text[start:end]
        chunks.append({
            "chunk_index": idx,
            "text": chunk_text_content,
            "char_start": start,
            "char_end": end,
        })
        start += chunk_size - overlap
        idx += 1
    return chunks
