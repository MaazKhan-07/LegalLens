# Compare router — two-document structured diff
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services import gemini_service

router = APIRouter()
logger = logging.getLogger(__name__)

DISCLAIMER = (
    "This is general information, not legal advice. "
    "For decisions with real consequences, consult a licensed attorney in your jurisdiction."
)


class CompareRequest(BaseModel):
    doc1_text: str
    doc2_text: str
    doc1_name: Optional[str] = "Document A"
    doc2_name: Optional[str] = "Document B"


@router.post("/")
async def compare_documents(req: CompareRequest):
    if not req.doc1_text.strip() or not req.doc2_text.strip():
        raise HTTPException(status_code=400, detail="Both documents must have text.")
    try:
        result = await gemini_service.compare_documents(
            req.doc1_text, req.doc2_text, req.doc1_name or "Document A", req.doc2_name or "Document B"
        )
        result["disclaimer"] = DISCLAIMER
        return result
    except Exception as e:
        logger.error(f"Comparison error: {e}")
        raise HTTPException(status_code=500, detail="Comparison failed. Please try again.")
