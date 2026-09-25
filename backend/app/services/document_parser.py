# LegalLens — Document Parsing Service
# Supports: PDF (text + OCR fallback), DOCX, plain text
# Privacy: documents are processed in-memory; not persisted to disk.

import io
import logging
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


# ── PDF parsing ──────────────────────────────
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text from PDF using pdfplumber or pypdf fallback.
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
        if full_text:
            return full_text
    except Exception as e:
        logger.warning(f"pdfplumber extraction failed: {e}. Trying pypdf fallback.")

    # Fallback to pypdf
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
        full_text = "\n\n".join(text_parts).strip()
        if full_text:
            return full_text
    except Exception as e:
        logger.warning(f"pypdf extraction failed: {e}")

    # Fallback: check if empty or image-only
    return ""


# ── DOCX parsing ─────────────────────────────
def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file preserving paragraph and table structure."""
    try:
        from docx import Document as DocxDocument
        doc = DocxDocument(io.BytesIO(file_bytes))
        paragraphs = []
        for p in doc.paragraphs:
            if p.text.strip():
                paragraphs.append(p.text.strip())
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    paragraphs.append(row_text)
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
        # Default attempt plain text
        return extract_text_from_plain(file_bytes)


# ── Structure-Aware Chunking (Efficiency & Context Optimization) ──────
# Efficiency fix: Splitting text along natural clause/section boundaries
# rather than arbitrary character offsets reduces wasted tokens and prevents
# splitting critical legal clauses across chunks.
def chunk_text(
    text: str,
    max_chunk_size: int = 2500,
    min_chunk_size: int = 200,
    overlap_sentences: int = 1,
) -> List[Dict[str, Any]]:
    """
    Split legal document text into structure-aware chunks by section headings,
    numbered clauses, or paragraph breaks.
    """
    if not text.strip():
        return []

    # Regex detecting legal section headers (e.g. "Section 1", "ARTICLE IV", "1. Title", "## Title")
    section_split_pattern = re.compile(
        r"(?=(?:^|\n\n)(?:(?:SECTION|ARTICLE|CLAUSE)\s+[0-9IVXLCDM]+|[0-9]+\.\s+[A-Z]|##+\s+))",
        re.IGNORECASE,
    )

    raw_sections = [s.strip() for s in section_split_pattern.split(text) if s.strip()]
    if not raw_sections:
        raw_sections = [p.strip() for p in text.split("\n\n") if p.strip()]

    chunks = []
    current_chunk = []
    current_length = 0
    chunk_idx = 0

    for section in raw_sections:
        section_len = len(section)
        if current_length + section_len > max_chunk_size and current_chunk:
            combined_text = "\n\n".join(current_chunk)
            chunks.append({
                "chunk_index": chunk_idx,
                "text": combined_text,
                "char_length": len(combined_text),
                "section_count": len(current_chunk),
            })
            chunk_idx += 1
            # Keep the last paragraph for semantic overlap if needed
            current_chunk = [current_chunk[-1]] if overlap_sentences > 0 else []
            current_length = len(current_chunk[0]) if current_chunk else 0

        # If a single section is larger than max_chunk_size, split by sentences
        if section_len > max_chunk_size:
            sentences = re.split(r"(?<=[.!?])\s+", section)
            for sent in sentences:
                if current_length + len(sent) > max_chunk_size and current_chunk:
                    combined_text = " ".join(current_chunk)
                    chunks.append({
                        "chunk_index": chunk_idx,
                        "text": combined_text,
                        "char_length": len(combined_text),
                        "section_count": 1,
                    })
                    chunk_idx += 1
                    current_chunk = []
                    current_length = 0
                current_chunk.append(sent)
                current_length += len(sent) + 1
        else:
            current_chunk.append(section)
            current_length += section_len + 2

    if current_chunk:
        combined_text = "\n\n".join(current_chunk)
        chunks.append({
            "chunk_index": chunk_idx,
            "text": combined_text,
            "char_length": len(combined_text),
            "section_count": len(current_chunk),
        })

    return chunks
