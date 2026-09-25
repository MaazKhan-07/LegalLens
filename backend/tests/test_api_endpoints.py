# Integration tests for FastAPI endpoints using TestClient
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_root_and_health_endpoints():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "operational"
    assert "not legal advice" in data["disclaimer"]

    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "ok"


def test_security_headers_present():
    """Verify security headers are attached to API responses."""
    res = client.get("/health")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert "strict-origin-when-cross-origin" in res.headers.get("Referrer-Policy", "")


def test_paste_document_success():
    payload = {"text": "Section 1. Confidentiality\nParty A and Party B agree to terms.", "filename": "test.txt"}
    res = client.post("/api/documents/paste", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["filename"] == "test.txt"
    assert data["word_count"] > 0
    assert data["char_count"] > 0


def test_paste_document_empty_rejected():
    res = client.post("/api/documents/paste", json={"text": "   "})
    assert res.status_code == 400


def test_upload_document_txt_success():
    txt_content = b"Residential Lease Agreement\nLandlord and Tenant agree."
    files = {"file": ("lease.txt", txt_content, "text/plain")}
    res = client.post("/api/documents/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["filename"] == "lease.txt"
    assert "Residential Lease" in data["text"]


def test_upload_document_docx_success():
    docx_path = FIXTURES_DIR / "sample_lease.docx"
    assert docx_path.exists(), "DOCX fixture missing"
    with open(docx_path, "rb") as f:
        files = {"file": ("lease.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        res = client.post("/api/documents/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["filename"] == "lease.docx"
    assert "RESIDENTIAL LEASE" in data["text"]


def test_upload_document_invalid_extension_rejected():
    files = {"file": ("malicious.exe", b"binary content", "application/octet-stream")}
    res = client.post("/api/documents/upload", files=files)
    assert res.status_code == 400
    assert "Unsupported file type" in res.json()["detail"]


def test_simplify_endpoint():
    payload = {
        "document_text": "Section 1. Agreement\nThis lease automatically renews with 10% rent hike.",
        "reading_level": "quick",
    }
    res = client.post("/api/analysis/simplify", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "disclaimer" in data

    # Test invalid reading level rejection
    invalid_payload = {"document_text": "Some text", "reading_level": "super_simple"}
    inv_res = client.post("/api/analysis/simplify", json=invalid_payload)
    assert inv_res.status_code == 400


def test_highlight_clauses_endpoint():
    payload = {
        "document_text": "Section 6. Indemnification\nTenant agrees to indemnify Landlord from all negligence claims."
    }
    res = client.post("/api/analysis/highlight-clauses", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "clauses" in data
    assert "disclaimer" in data


def test_ask_endpoint():
    payload = {
        "document_text": "Section 2. Renewal\nLease automatically renews unless 60 days notice is given.",
        "question": "What is the notice period for cancellation?",
    }
    res = client.post("/api/analysis/ask", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data or "message" in data


def test_compare_endpoint():
    payload = {
        "doc1_text": "Clause 1. 60 days notice required.",
        "doc2_text": "Clause 1. 30 days notice required.",
        "doc1_name": "Version 1",
        "doc2_name": "Version 2",
    }
    res = client.post("/api/compare/", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "comparison" in data
    assert "overview" in data
