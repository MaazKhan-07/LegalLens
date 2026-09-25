# Unit tests for document parser service
import pytest
from pathlib import Path
from app.services.document_parser import (
    parse_document,
    extract_text_from_plain,
    extract_text_from_docx,
    extract_text_from_pdf,
    chunk_text,
)

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_extract_text_from_plain_utf8():
    text = "Section 1. Non-Disclosure Agreement\nAll information is confidential."
    raw_bytes = text.encode("utf-8")
    result = extract_text_from_plain(raw_bytes)
    assert "Non-Disclosure Agreement" in result
    assert "confidential" in result


def test_extract_text_from_plain_latin1():
    text = "Clause 2. Payment terms: £500 due on 1st. Signed at Café Central."
    raw_bytes = text.encode("latin-1")
    result = extract_text_from_plain(raw_bytes)
    assert "Payment terms" in result
    assert "Café" in result


def test_extract_text_from_docx():
    docx_path = FIXTURES_DIR / "sample_lease.docx"
    assert docx_path.exists(), "DOCX fixture missing"
    file_bytes = docx_path.read_bytes()
    result = extract_text_from_docx(file_bytes)
    assert "RESIDENTIAL LEASE AGREEMENT" in result
    assert "Greenwood Properties" in result
    assert "Rent & Late Charges" in result


def test_parse_document_dispatcher():
    # Plain text
    txt_bytes = b"Sample Contract Content\nParty A and Party B"
    assert "Sample Contract" in parse_document(txt_bytes, "agreement.txt")
    assert "Sample Contract" in parse_document(txt_bytes, "agreement.md")

    # DOCX
    docx_bytes = (FIXTURES_DIR / "sample_lease.docx").read_bytes()
    assert "RESIDENTIAL LEASE" in parse_document(docx_bytes, "contract.docx")


def test_chunk_text_structure_aware():
    document = """
SECTION 1. DEFINITIONS
"Confidential Information" means all non-public technical, commercial and proprietary data.

SECTION 2. OBLIGATIONS
Receiving party shall maintain strict secrecy and not disclose information to third parties.

SECTION 3. TERMINATION & REMEDIES
Either party may terminate upon 30 days notice. Remedies include immediate injunctive relief.
"""
    chunks = chunk_text(document, max_chunk_size=300)
    assert len(chunks) >= 1
    assert all("chunk_index" in c for c in chunks)
    assert all("text" in c for c in chunks)
    # Check that sections are preserved in chunks
    all_chunk_text = " ".join(c["text"] for c in chunks)
    assert "DEFINITIONS" in all_chunk_text
    assert "OBLIGATIONS" in all_chunk_text


def test_chunk_text_empty():
    assert chunk_text("") == []
    assert chunk_text("   ") == []


def test_corrupt_docx_handling():
    corrupt_bytes = b"PK\x03\x04notarealdocxfilecontent"
    with pytest.raises(ValueError):
        extract_text_from_docx(corrupt_bytes)
