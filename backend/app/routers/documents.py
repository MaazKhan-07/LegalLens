# Documents router — upload and parse documents
# Privacy note: documents are NOT persisted to disk; processed in memory only.

import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from typing import Optional

from app.services.document_parser import parse_document
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_BYTES = settings.max_file_size_mb * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md"}


class ParsedDocumentResponse(BaseModel):
    filename: str
    text: str
    char_count: int
    word_count: int
    # Privacy: we return text only; original file is not stored server-side


@router.post("/upload", response_model=ParsedDocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF, DOCX, or text file.
    The document text is extracted and returned; the file itself is not persisted.
    """
    # Validate file extension
    filename = file.filename or "document"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file into memory
    file_bytes = await file.read()

    if len(file_bytes) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_file_size_mb} MB.",
        )

    logger.info(f"Processing document: {filename} ({len(file_bytes)} bytes)")

    try:
        text = parse_document(file_bytes, filename)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="No text could be extracted from this document. It may be an image-only scan with no OCR support configured.",
        )

    return ParsedDocumentResponse(
        filename=filename,
        text=text,
        char_count=len(text),
        word_count=len(text.split()),
    )


class PasteTextRequest(BaseModel):
    text: str
    filename: Optional[str] = "pasted-document.txt"


@router.post("/paste", response_model=ParsedDocumentResponse)
async def paste_text(req: PasteTextRequest):
    """Accept pasted plain text directly."""
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="No text provided.")
    if len(text) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Text too large.")

    return ParsedDocumentResponse(
        filename=req.filename or "pasted-document.txt",
        text=text,
        char_count=len(text),
        word_count=len(text.split()),
    )
