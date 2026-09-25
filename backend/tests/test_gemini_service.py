# Unit tests for Gemini AI service and safety guardrails
import pytest
from unittest.mock import patch, MagicMock
from app.services import gemini_service

SAMPLE_DOCUMENT = """
RESIDENTIAL LEASE AGREEMENT
Landlord: Greenwood Properties LLC
Tenant: Jane Doe
Premises: 742 Evergreen Terrace, Apt 4B

1. Term & Automatic Renewal
The lease is for 12 months. It automatically renews for 12 months with a 10% rent hike unless written notice is given 60 days before expiration.

2. Rent & Late Fees
Monthly rent is $2,400 due on the 1st. Late fee of $150 applies if not received by the 2nd.

3. Maintenance
Tenant pays for all repairs under $250. Landlord may enter at any time without advance notice.
"""


def test_escalation_triggers_detection():
    assert gemini_service.check_escalation_triggers("I received an eviction notice yesterday") is True
    assert gemini_service.check_escalation_triggers("The court hearing is scheduled for Monday") is True
    assert gemini_service.check_escalation_triggers("I am facing deportation") is True
    assert gemini_service.check_escalation_triggers("What is the rent due date?") is False


def test_escalation_response_format():
    msg = gemini_service.get_escalation_message()
    assert msg["escalation_triggered"] is True
    assert "resources" in msg
    assert len(msg["resources"]) >= 2
    assert any("lsc.gov" in r["url"] for r in msg["resources"])


@pytest.mark.asyncio
async def test_escalation_in_qa():
    res = await gemini_service.answer_question(
        SAMPLE_DOCUMENT, "Help, my landlord filed an eviction against me today!"
    )
    assert res["escalation_triggered"] is True
    assert "resources" in res


@pytest.mark.asyncio
async def test_grounding_and_hallucination_guardrail():
    """
    Explicit test verifying grounding/hallucination guardrail:
    Given a question that is NOT answerable from the document (e.g. pet deposit or gym hours),
    the system explicitly returns a 'not specified / not found' response rather than fabricating terms.
    """
    res = await gemini_service.answer_question(
        SAMPLE_DOCUMENT, "What is the policy regarding pet deposit and solar panels?"
    )
    assert res["escalation_triggered"] is False
    answer = res["answer"].lower()
    # Must explicitly state not mentioned / not specified
    assert "no mention" in answer or "not specified" in answer or "strictly" in answer


@pytest.mark.asyncio
async def test_simplify_document_fallback():
    quick_res = await gemini_service.simplify_document(SAMPLE_DOCUMENT, reading_level="quick")
    assert quick_res["reading_level"] == "quick"
    assert "summary" in quick_res
    assert "Residential Lease" in quick_res["summary"]

    detailed_res = await gemini_service.simplify_document(SAMPLE_DOCUMENT, reading_level="detailed")
    assert detailed_res["reading_level"] == "detailed"
    assert "sections" in detailed_res
    assert len(detailed_res["sections"]) >= 2
    assert any(s["severity"] in ("Informational", "Worth Reviewing", "Important") for s in detailed_res["sections"])


@pytest.mark.asyncio
async def test_highlight_clauses_fallback():
    res = await gemini_service.highlight_clauses(SAMPLE_DOCUMENT)
    assert "clauses" in res
    assert len(res["clauses"]) >= 1
    for clause in res["clauses"]:
        assert "clause_type" in clause
        assert "severity" in clause
        assert clause["severity"] in ("Informational", "Worth Reviewing", "Important")
        assert "why_it_matters" in clause


@pytest.mark.asyncio
async def test_compare_documents_fallback():
    doc_b = SAMPLE_DOCUMENT.replace("10% rent hike", "no rent increase").replace("without advance notice", "with 24h notice")
    res = await gemini_service.compare_documents(SAMPLE_DOCUMENT, doc_b, "Lease A", "Lease B")
    assert "overview" in res
    assert "comparison" in res
    assert len(res["comparison"]) >= 1


@pytest.mark.asyncio
async def test_gemini_mocked_llm_call():
    """
    Verify that when Gemini API is mocked, the service parses and returns the model response.
    """
    gemini_service._ANALYSIS_CACHE.clear()
    unique_doc = "MUTUAL CONSULTING CONTRACT\nParty A and Party B agree to consulting services."
    mock_model = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "This is a mocked Gemini plain language summary."
    mock_model.generate_content.return_value = mock_response

    with patch.object(gemini_service, "_is_api_configured", return_value=True):
        with patch.object(gemini_service, "_get_model", return_value=mock_model):
            res = await gemini_service.simplify_document(unique_doc, reading_level="quick")
            assert res["reading_level"] == "quick"
            assert "mocked Gemini" in res["summary"]
