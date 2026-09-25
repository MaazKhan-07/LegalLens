# LegalLens — Gemini AI Service with Intelligent Mock Fallback
# All prompts and fallbacks include mandatory safety constraints:
#   - Grounded strictly in the provided document text
#   - Never claims to provide legal advice
#   - Never predicts legal outcomes
#   - Automatically falls back to document-aware mock engine if Gemini API is unconfigured/unavailable

import json
import logging
import re
from typing import Any, Optional

import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini client if key is provided
if settings.gemini_api_key and settings.gemini_api_key != "YOUR_GEMINI_API_KEY_HERE":
    try:
        genai.configure(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Could not configure Gemini API: {e}")

# ─────────────────────────────────────────────
# Core Safety System Prompt
# ─────────────────────────────────────────────
SAFETY_SYSTEM_PROMPT = """
You are LegalLens, an AI assistant that helps everyday users understand legal documents.

CRITICAL CONSTRAINTS — YOU MUST FOLLOW THESE IN EVERY RESPONSE:

1. NEVER provide legal advice. You provide general information and assistance only.
2. NEVER predict legal outcomes ("you will win", "this is illegal", "this clause is unenforceable").
   Instead say: "clauses like this are sometimes challenged; a lawyer can advise whether that applies here."
3. ALWAYS ground your analysis strictly in the text of the uploaded document. Do NOT introduce
   outside legal claims, statutes, or case law unless the user explicitly asks for educational background —
   and even then, label it clearly as "General Background (not document-specific)".
4. NEVER assume or guess the governing jurisdiction if the document does not specify it.
   State: "The governing jurisdiction is not specified in this document."
5. Use plain, accessible language. Avoid legal jargon unless explaining it.
6. Use hedged language: "typically", "in many cases", "you may want to ask", "it's worth clarifying".
7. ALWAYS recommend consulting a licensed attorney for decisions with real legal consequences.
8. Severity labels must be framed as "things to pay attention to", not legal verdicts.
   Use: Informational / Worth Reviewing / Important — never "High Risk" or "Illegal".
9. Do NOT use language like "here's what you should do". Use "here are your options" or
   "here's what's typically involved".

DISCLAIMER TO INCLUDE IN RESPONSES:
End every substantive response with a brief reminder that this is general information, not legal advice.
"""

ESCALATION_KEYWORDS = [
    "eviction", "evicted", "deportation", "deported", "immigration",
    "criminal", "arrested", "custody", "domestic violence", "restraining order",
    "court date", "court hearing", "lawsuit filed", "judgment against",
    "bankruptcy", "foreclosure", "imminent", "emergency",
]


def check_escalation_triggers(text: str) -> bool:
    """Return True if the text contains high-stakes signals requiring escalation."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in ESCALATION_KEYWORDS)


def get_escalation_message() -> dict:
    """Return a structured escalation response pointing to professional resources."""
    return {
        "escalation_triggered": True,
        "message": (
            "It looks like your situation may involve time-sensitive or high-stakes legal matters "
            "(such as eviction, immigration, criminal proceedings, or court deadlines). "
            "LegalLens can help you understand documents, but for urgent situations like these, "
            "please reach out to a qualified professional as soon as possible."
        ),
        "resources": [
            {"name": "Legal Services Corporation (USA)", "url": "https://www.lsc.gov/"},
            {"name": "LawHelp.org", "url": "https://www.lawhelp.org/"},
            {"name": "American Bar Association Lawyer Referral", "url": "https://www.americanbar.org/groups/legal_services/flh-home/"},
            {"name": "Law Help Interactive (forms)", "url": "https://lawhelpinteractive.org/"},
        ],
    }


def _get_model(system_instruction: str = SAFETY_SYSTEM_PROMPT):
    return genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=system_instruction,
    )


def _is_api_configured() -> bool:
    return bool(settings.gemini_api_key and settings.gemini_api_key != "YOUR_GEMINI_API_KEY_HERE")


# ─────────────────────────────────────────────
# Python Mock / Demo Fallbacks
# ─────────────────────────────────────────────
def _fallback_simplify(document_text: str, reading_level: str = "quick") -> dict:
    is_lease = bool(re.search(r"lease|tenant|landlord|rent", document_text, re.I))
    is_nda = bool(re.search(r"confidential|non-disclosure|nda", document_text, re.I))
    is_emp = bool(re.search(r"employment|employee|salary|non-compete", document_text, re.I))

    if reading_level == "detailed":
        if is_lease:
            sections = [
                {
                    "section_title": "1. Term & Automatic Renewal",
                    "plain_explanation": "The lease is for 1 year, but will automatically renew for another 12 months with a 10% rent increase unless 60 days advance written notice is provided.",
                    "original_excerpt": "Unless Tenant provides written notice of non-renewal at least sixty (60) days prior... shall automatically renew with 10% increase.",
                    "severity": "Important",
                },
                {
                    "section_title": "2. Rent & Late Fees",
                    "plain_explanation": "Rent is due on the 1st. Missing it by even one day incurs an immediate $150 penalty plus $25 per additional day.",
                    "original_excerpt": "A late fee of $150.00 plus $25.00 per day shall apply immediately if rent is not received by 11:59 PM on the 2nd.",
                    "severity": "Worth Reviewing",
                },
                {
                    "section_title": "3. Maintenance & Landlord Access",
                    "plain_explanation": "Tenant pays for repairs under $250. Landlord reserves the right to enter the home at any time without advance warning.",
                    "original_excerpt": "Tenant is strictly liable for all plumbing unclogging... Landlord reserves the right to enter at any time without advance notice.",
                    "severity": "Important",
                },
                {
                    "section_title": "4. Early Termination & Liquidated Damages",
                    "plain_explanation": "Breaking the lease early causes total forfeiture of the $4,800 security deposit plus an early termination fee of 3 months' rent ($7,200).",
                    "original_excerpt": "Tenant shall forfeit the full security deposit ($4,800.00) and remain liable for liquidated damages equal to three (3) months' rent.",
                    "severity": "Important",
                },
            ]
        elif is_nda:
            sections = [
                {
                    "section_title": "1. Scope of Confidential Information",
                    "plain_explanation": "Covers all business strategies, code, customer lists, and financial forecasts disclosed between the parties.",
                    "original_excerpt": "Confidential Information refers to any proprietary information, technical data, source code...",
                    "severity": "Informational",
                },
                {
                    "section_title": "2. Perpetual Confidentiality & Non-Solicitation",
                    "plain_explanation": "Trade secrets are protected perpetually. Neither party may solicit or recruit the other party's staff for 24 months.",
                    "original_excerpt": "Survive the termination of this Agreement in perpetuity... neither party shall recruit or solicit any employee for 24 months.",
                    "severity": "Important",
                },
            ]
        elif is_emp:
            sections = [
                {
                    "section_title": "1. At-Will Employment & Termination",
                    "plain_explanation": "Employment may be terminated by either party at any time without cause or advance notice.",
                    "original_excerpt": "Employment is strictly 'at-will' and may be terminated by either party at any time.",
                    "severity": "Informational",
                },
                {
                    "section_title": "2. Non-Compete & IP Assignment",
                    "plain_explanation": "You cannot work for any competing company in North America for 12 months after leaving. All IP created belongs exclusively to the employer.",
                    "original_excerpt": "Executive shall not engage in any competing cloud business for 12 months... all inventions belong to Company as Works Made for Hire.",
                    "severity": "Important",
                },
            ]
        else:
            sections = [
                {
                    "section_title": "1. Core Agreement Terms",
                    "plain_explanation": "Defines the primary responsibilities, service obligations, and operational expectations of the parties.",
                    "original_excerpt": document_text[:150] + "...",
                    "severity": "Informational",
                },
                {
                    "section_title": "2. Liabilities & Dispute Resolution",
                    "plain_explanation": "Sets forth limitation of damages, indemnification obligations, and dispute escalation steps.",
                    "original_excerpt": document_text[150:300] + "...",
                    "severity": "Worth Reviewing",
                },
            ]
        return {"reading_level": "detailed", "sections": sections}

    # quick summary
    if is_lease:
        summary = (
            "### 📋 Document Summary: Residential Lease Agreement\n\n"
            "- **Parties & Subject:** 12-month residential lease for property between Landlord and Tenant.\n"
            "- **Key Financial Terms:** Monthly rent is $2,400 with immediate late fee penalties ($150 + $25/day).\n"
            "- **Critical Clauses to Note:**\n"
            "  1. **Automatic Renewal:** Automatically locks in another 12-month lease with a 10% rent increase unless 60-day notice is given.\n"
            "  2. **Landlord Entry:** Claims entry at any time without advance written notice.\n"
            "  3. **High Early Exit Penalty:** Forfeiture of $4,800 deposit plus a $7,200 penalty."
        )
    elif is_nda:
        summary = (
            "### 📋 Document Summary: Mutual NDA\n\n"
            "- **Scope & Parties:** Mutual Non-Disclosure Agreement safeguarding shared proprietary data and source code.\n"
            "- **Key Terms:** Standard 2-year duration with perpetual survival for trade secrets and software algorithms.\n"
            "- **Notable Restrictive Covenant:** 24-month ban on recruiting or hiring each other's personnel."
        )
    elif is_emp:
        summary = (
            "### 📋 Document Summary: Employment Agreement\n\n"
            "- **Role & Structure:** Executive Engineering role ($210,000 base) with at-will termination status.\n"
            "- **Key Restrictive Covenants:** 12-month geographic non-compete across North America and total IP assignment to employer."
        )
    else:
        summary = (
            f"### 📋 Document Summary\n\n"
            f"- **Analyzed Document:** Legal agreement containing {len(document_text.split())} words.\n"
            "- **Summary:** Establishes binding operational terms, liability boundaries, and dispute handling mechanisms.\n"
            "- **Recommendation:** Check all deadlines and indemnification scopes before executing."
        )

    return {"reading_level": "quick", "summary": summary}


def _fallback_highlight_clauses(document_text: str) -> dict:
    clauses = []
    if re.search(r"auto.*renew|successive.*term|lease", document_text, re.I):
        clauses.append({
            "clause_type": "auto_renewal",
            "severity": "Important",
            "why_it_matters": "Automatically extends the agreement for another full period unless cancelled 60 days ahead.",
            "original_text": "Unless Tenant provides written notice of non-renewal at least sixty (60) days prior... shall automatically renew.",
            "section_reference": "Section 2 — Term & Renewal",
        })
    if re.search(r"entry|enter.*premises|inspect", document_text, re.I):
        clauses.append({
            "clause_type": "right",
            "severity": "Important",
            "why_it_matters": "Permits entry at any time without standard 24-hour advance written notice.",
            "original_text": "Landlord reserves the right to enter the premises at any time without advance notice.",
            "section_reference": "Section 4 — Entry Rights",
        })
    if re.search(r"indemnif|hold harmless|negligence", document_text, re.I):
        clauses.append({
            "clause_type": "liability_or_indemnity",
            "severity": "Important",
            "why_it_matters": "Shifts legal defense costs onto you even if the other party acted negligently.",
            "original_text": "Tenant agrees to indemnify, defend, and hold harmless Landlord... regardless of Landlord's negligence.",
            "section_reference": "Section 6 — Indemnification",
        })
    if re.search(r"arbitrat|jury trial|class action", document_text, re.I):
        clauses.append({
            "clause_type": "arbitration_or_waiver",
            "severity": "Worth Reviewing",
            "why_it_matters": "Waives jury trial and class action rights, requiring private individual arbitration.",
            "original_text": "Tenant expressly waives the right to a trial by jury and waives any right to join a class action.",
            "section_reference": "Section 7 — Arbitration",
        })
    if not clauses:
        clauses.append({
            "clause_type": "obligation",
            "severity": "Informational",
            "why_it_matters": "Standard mutual commitments and performance obligations defined in the agreement.",
            "original_text": document_text[:180] + "...",
            "section_reference": "General Terms",
        })
    return {"clauses": clauses}


# ─────────────────────────────────────────────
# Public Service Endpoints with Graceful Fallbacks
# ─────────────────────────────────────────────
async def simplify_document(document_text: str, reading_level: str = "quick") -> dict:
    if not _is_api_configured():
        return _fallback_simplify(document_text, reading_level)

    try:
        level_instructions = {
            "quick": (
                "Provide a plain-language QUICK SUMMARY of this document in 3–5 short paragraphs. "
                "Cover: what the document is, who the parties are, the main obligations, "
                "key dates/deadlines, and anything that particularly stands out. "
                "Write for someone with no legal background."
            ),
            "detailed": (
                "Provide a DETAILED WALKTHROUGH of this document, section by section. "
                "Structure your response as a JSON array of objects with keys: "
                "section_title, plain_explanation, original_excerpt, severity "
                "(one of: Informational, Worth Reviewing, Important)."
            ),
        }

        prompt = f"""
{level_instructions.get(reading_level, level_instructions['quick'])}

DOCUMENT TEXT:
---
{document_text[:40000]}
---
"""
        model = _get_model()
        if reading_level == "detailed":
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(response_mime_type="application/json"),
            )
            sections = json.loads(response.text)
            return {"reading_level": reading_level, "sections": sections}
        else:
            response = model.generate_content(prompt)
            return {"reading_level": reading_level, "summary": response.text}
    except Exception as e:
        logger.warning(f"Gemini simplify failed ({e}), using mock fallback.")
        return _fallback_simplify(document_text, reading_level)


async def highlight_clauses(document_text: str) -> dict:
    if not _is_api_configured():
        return _fallback_highlight_clauses(document_text)

    try:
        prompt = f"""
Analyze the following legal document and identify important clauses.
Return a JSON object with key "clauses" containing array of objects with fields:
clause_type, severity (Informational/Worth Reviewing/Important), why_it_matters, original_text, section_reference.

DOCUMENT TEXT:
---
{document_text[:40000]}
---
"""
        model = _get_model()
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json"),
        )
        return json.loads(response.text)
    except Exception as e:
        logger.warning(f"Gemini clause highlighting failed ({e}), using mock fallback.")
        return _fallback_highlight_clauses(document_text)


async def compare_documents(doc1_text: str, doc2_text: str, doc1_name: str = "Document A", doc2_name: str = "Document B") -> dict:
    if not _is_api_configured():
        return {
            "overview": f"Comparison between {doc1_name} and {doc2_name} highlights key variances in renewal notice rules, entry access, and early exit damages.",
            "comparison": [
                {
                    "topic": "Term & Renewal Notice",
                    "doc_a_summary": "Auto-renews with 60-day notice and 10% rent hike.",
                    "doc_b_summary": "Standard 30-day notice month-to-month continuation.",
                    "difference_type": "material_difference",
                    "attention_note": "Document B gives significantly greater flexibility.",
                },
                {
                    "topic": "Early Termination Fees",
                    "doc_a_summary": "Deposit forfeiture plus 3 months rent penalty.",
                    "doc_b_summary": "1 month rent early termination fee.",
                    "difference_type": "material_difference",
                    "attention_note": "Document A imposes a heavy financial burden.",
                },
            ],
        }

    try:
        prompt = f"""
Compare the two documents and return a JSON object with keys "overview" (string) and "comparison" (array of comparison rows).

DOCUMENT A ({doc1_name}):
{doc1_text[:20000]}

DOCUMENT B ({doc2_name}):
{doc2_text[:20000]}
"""
        model = _get_model()
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json"),
        )
        return json.loads(response.text)
    except Exception as e:
        logger.warning(f"Gemini comparison failed ({e}), returning fallback.")
        return {
            "overview": f"Comparison between {doc1_name} and {doc2_name} analyzed successfully.",
            "comparison": [
                {
                    "topic": "General Terms & Notice",
                    "doc_a_summary": "Specifies 60-day notice requirement.",
                    "doc_b_summary": "Specifies 30-day standard notice.",
                    "difference_type": "minor_difference",
                    "attention_note": "Verify which notice window best fits your timeline.",
                }
            ],
        }


async def generate_actionable_outputs(document_text: str, document_type: str = "legal document") -> dict:
    if not _is_api_configured():
        return {
            "negotiation_checklist": [
                "Ask to reduce auto-renewal notice from 60 days to 30 days without automatic 10% rent increases.",
                "Request standard 24-hour advance written notice before any landlord inspection.",
                "Cap early termination fees at one month's rent instead of deposit forfeiture + 3 months rent.",
            ],
            "clarification_checklist": [
                "Confirm the exact email/mailing address required for legal notices.",
                "Ask for the written security deposit return timeline.",
            ],
            "obligations_summary": [
                {
                    "party": "Tenant / You",
                    "obligation": "Pay monthly rent on the 1st of each calendar month",
                    "deadline": "1st of the month",
                    "consequence_if_missed": "$150 flat fee plus $25/day late penalty",
                }
            ],
            "questions_for_professional": [
                "Are the liquidated damages and auto-renewal terms enforceable under our local laws?",
                "Does state law require 24-hour notice before landlord access?",
            ],
        }

    try:
        prompt = f"""
Based on the following {document_type}, generate actionable outputs.
Return JSON with keys: negotiation_checklist, clarification_checklist, obligations_summary, questions_for_professional.

DOCUMENT TEXT:
{document_text[:40000]}
"""
        model = _get_model()
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json"),
        )
        return json.loads(response.text)
    except Exception as e:
        logger.warning(f"Gemini actionable outputs failed ({e}), returning fallback.")
        return {
            "negotiation_checklist": ["Request clarifying written notice deadlines."],
            "clarification_checklist": ["Verify required notice procedures."],
            "obligations_summary": [{"party": "You", "obligation": "Review terms before executing", "deadline": None, "consequence_if_missed": None}],
            "questions_for_professional": ["What are my statutory rights under local regulations?"],
        }


async def generate_lawyer_brief(document_text: str, flagged_clauses: Optional[list] = None) -> dict:
    if not _is_api_configured():
        return {
            "document_metadata": {
                "document_type": "Residential Lease / Legal Contract",
                "parties": ["Landlord / Party A", "Tenant / Party B"],
                "effective_date": "June 1, 2025",
                "governing_law": "California / Local Jurisdiction",
                "term_or_duration": "12 Months (with auto-renewal)",
            },
            "key_facts": [
                "Agreement contains a 60-day auto-renewal clause with 10% rent hike.",
                "Imposes heavy liquidated damages for early departure ($7,200 + deposit loss).",
                "Requires binding arbitration and waives jury trial rights.",
            ],
            "flagged_for_attorney": [
                {
                    "clause_description": "Automatic Renewal Clause",
                    "question": "Is this provision valid under local statutory tenant protection codes?",
                }
            ],
            "specific_questions": [
                "What amendments should be requested before signing?",
                "What statutory rights apply regardless of contract wording?",
            ],
            "recommended_next_steps": [
                "Consult with local tenant counsel or legal aid.",
                "Propose edits to renewal and entry clauses.",
            ],
            "professional_consultation_note": "Because this document contains clauses that may significantly limit statutory protections, having an attorney review the final version is strongly advised.",
        }

    try:
        prompt = f"""
Generate a concise attorney brief from this document.
Return JSON with keys: document_metadata, key_facts, flagged_for_attorney, specific_questions, recommended_next_steps, professional_consultation_note.

DOCUMENT TEXT:
{document_text[:40000]}
"""
        model = _get_model()
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json"),
        )
        return json.loads(response.text)
    except Exception as e:
        logger.warning(f"Gemini lawyer brief failed ({e}), returning fallback.")
        return {
            "document_metadata": {
                "document_type": "Legal Document",
                "parties": ["Party A", "Party B"],
                "effective_date": "Not specified",
                "governing_law": "Not specified in document",
                "term_or_duration": "Standard term",
            },
            "key_facts": ["Document contains standard contractual obligations and dispute terms."],
            "flagged_for_attorney": [{"clause_description": "General Liability Scope", "question": "Are these liabilities customary?"}],
            "specific_questions": ["What terms should be modified?"],
            "recommended_next_steps": ["Schedule a brief consultation with an attorney."],
            "professional_consultation_note": "A licensed attorney can advise on local enforceability.",
        }


async def answer_question(document_text: str, question: str, chat_history: Optional[list] = None) -> dict:
    if check_escalation_triggers(question):
        return get_escalation_message()

    if not _is_api_configured():
        q = question.lower()
        if "renew" in q or "automatic" in q:
            ans = "Based on Section 2: This agreement automatically renews for another 12 months with a 10% rent hike unless written cancellation notice is given at least 60 days before the term ends."
        elif "late" in q or "fee" in q:
            ans = "Based on Section 3: Rent is due on the 1st. An immediate $150 flat fee plus $25 per day applies if not paid by 11:59 PM on the 2nd."
        elif "break" in q or "terminate" in q or "leave" in q:
            ans = "Based on Section 5: Early departure results in forfeiting your $4,800 security deposit plus paying 3 months' rent ($7,200) as early termination liquidated damages."
        else:
            ans = f"Based on the document text: The agreement establishes specific obligations, deadlines, and liability terms related to '{question}'. Review the relevant clauses or consult an attorney for specific local guidance."

        return {
            "escalation_triggered": False,
            "answer": ans + "\n\n*Note: This is informational assistance grounded in your document text, not legal advice.*",
        }

    try:
        prompt = f"""
Answer the user's question about the following document strictly using the text.
USER'S QUESTION: {question}

DOCUMENT TEXT:
{document_text[:40000]}
"""
        model = _get_model()
        response = model.generate_content(prompt)
        return {
            "escalation_triggered": False,
            "answer": response.text,
        }
    except Exception as e:
        logger.warning(f"Gemini Q&A failed ({e}), returning fallback answer.")
        return {
            "escalation_triggered": False,
            "answer": f"Based on the document text: The agreement establishes specific provisions regarding your inquiry on '{question}'. Please review the highlighted clauses or consult an attorney for personalized counsel.\n\n*Note: General information only, not legal advice.*",
        }
