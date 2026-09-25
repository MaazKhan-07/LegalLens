# Analysis router — simplification, clause highlighting, Q&A, actionable outputs
# All endpoints enforce: no legal advice, grounded in document text only.

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from app.services import gemini_service

router = APIRouter()
logger = logging.getLogger(__name__)

DISCLAIMER = (
    "This is general information, not legal advice. "
    "For decisions with real consequences, consult a licensed attorney in your jurisdiction."
)


# ── Simplification ─────────────────────────────────────────────────────────

class SimplifyRequest(BaseModel):
    document_text: str
    reading_level: str = "quick"  # "quick" or "detailed"


@router.post("/simplify")
async def simplify(req: SimplifyRequest):
    if req.reading_level not in ("quick", "detailed"):
        raise HTTPException(status_code=400, detail="reading_level must be 'quick' or 'detailed'.")
    if not req.document_text.strip():
        raise HTTPException(status_code=400, detail="document_text is required.")
    try:
        result = await gemini_service.simplify_document(req.document_text, req.reading_level)
        result["disclaimer"] = DISCLAIMER
        return result
    except Exception as e:
        logger.error(f"Simplify error: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")


# ── Clause Highlighting ────────────────────────────────────────────────────

class HighlightRequest(BaseModel):
    document_text: str


@router.post("/highlight-clauses")
async def highlight_clauses(req: HighlightRequest):
    if not req.document_text.strip():
        raise HTTPException(status_code=400, detail="document_text is required.")
    try:
        result = await gemini_service.highlight_clauses(req.document_text)
        result["disclaimer"] = DISCLAIMER
        return result
    except Exception as e:
        logger.error(f"Highlight clauses error: {e}")
        raise HTTPException(status_code=500, detail="Clause highlighting failed. Please try again.")


# ── Q&A ────────────────────────────────────────────────────────────────────

class QARequest(BaseModel):
    document_text: str
    question: str
    chat_history: Optional[List[dict]] = None


@router.post("/ask")
async def ask_question(req: QARequest):
    if not req.document_text.strip():
        raise HTTPException(status_code=400, detail="document_text is required.")
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required.")
    try:
        result = await gemini_service.answer_question(
            req.document_text, req.question, req.chat_history
        )
        if not result.get("escalation_triggered"):
            result["disclaimer"] = DISCLAIMER
        return result
    except Exception as e:
        logger.error(f"Q&A error: {e}")
        raise HTTPException(status_code=500, detail="Q&A failed. Please try again.")


# ── Actionable Outputs ─────────────────────────────────────────────────────

class ActionableRequest(BaseModel):
    document_text: str
    document_type: Optional[str] = "legal document"


@router.post("/actionable-outputs")
async def actionable_outputs(req: ActionableRequest):
    if not req.document_text.strip():
        raise HTTPException(status_code=400, detail="document_text is required.")
    try:
        result = await gemini_service.generate_actionable_outputs(req.document_text, req.document_type or "legal document")
        result["disclaimer"] = DISCLAIMER
        return result
    except Exception as e:
        logger.error(f"Actionable outputs error: {e}")
        raise HTTPException(status_code=500, detail="Generating outputs failed. Please try again.")


# ── Lawyer Brief ───────────────────────────────────────────────────────────

class LawyerBriefRequest(BaseModel):
    document_text: str
    flagged_clauses: Optional[List[dict]] = None


@router.post("/lawyer-brief")
async def lawyer_brief(req: LawyerBriefRequest):
    if not req.document_text.strip():
        raise HTTPException(status_code=400, detail="document_text is required.")
    try:
        result = await gemini_service.generate_lawyer_brief(req.document_text, req.flagged_clauses)
        result["disclaimer"] = DISCLAIMER
        return result
    except Exception as e:
        logger.error(f"Lawyer brief error: {e}")
        raise HTTPException(status_code=500, detail="Brief generation failed. Please try again.")
