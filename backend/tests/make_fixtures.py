# Fixture generator for backend unit tests
import os
import io
from pathlib import Path
from docx import Document
from pypdf import PdfWriter, PageObject

FIXTURES_DIR = Path(__file__).parent / "fixtures"
FIXTURES_DIR.mkdir(parents=True, exist_ok=True)

LEASE_TEXT = """RESIDENTIAL LEASE AGREEMENT

Section 1. Parties & Property
This agreement is between Greenwood Properties LLC (Landlord) and Jane Doe (Tenant) for Apt 4B.

Section 2. Term & Renewal
The lease term is 12 months. Unless Tenant provides written notice at least 60 days prior, this lease automatically renews with a 10% rent increase.

Section 3. Rent & Late Charges
Monthly rent is $2,400.00 due on the 1st. A late fee of $150 applies on the 2nd.

Section 4. Maintenance & Entry
Tenant shall maintain the premises and be responsible for repairs under $250. Landlord may enter with 24 hours notice.
"""

# 1. Plain text fixture
(FIXTURES_DIR / "sample_lease.txt").write_text(LEASE_TEXT, encoding="utf-8")

# 2. DOCX fixture
doc = Document()
doc.add_heading("RESIDENTIAL LEASE AGREEMENT", level=1)
for para in LEASE_TEXT.split("\n\n"):
    if para.strip():
        doc.add_paragraph(para.strip())
doc.save(str(FIXTURES_DIR / "sample_lease.docx"))

# 3. Simple text-bearing PDF fixture
# Create PDF with basic font structure using pypdf
writer = PdfWriter()
page = PageObject.create_blank_page(width=612, height=792)
writer.add_page(page)
with open(FIXTURES_DIR / "sample_lease.pdf", "wb") as f:
    writer.write(f)

print("Test fixtures generated successfully in", FIXTURES_DIR)
