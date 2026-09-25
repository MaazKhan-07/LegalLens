# LegalLens — GenAI-Powered Legal Document Assistant

> **CRITICAL LEGAL DISCLAIMER**  
> LegalLens is an AI-powered informational tool designed to assist non-lawyer everyday users in understanding and navigating legal documents. **LegalLens does NOT provide legal advice and does NOT create an attorney-client relationship.** All generated analyses, risk flags, simplification summaries, and Q&A answers are for educational and informational purposes only. Consult a licensed attorney in your jurisdiction for binding legal counsel.

---

## Overview

LegalLens transforms dense, intimidating legal documents (leases, employment contracts, NDAs, terms of service, contractor agreements) into structured, crystal-clear insights using Google Gemini AI models.

### Key Capabilities

1. **Upload & Multi-Format Ingestion**: Supports `.pdf`, `.docx`, `.txt`, and direct copy-pasted text.
2. **Plain-English Simplification**:
   - Executive Summary (TL;DR for regular people)
   - Clause-by-Clause Translation (Original Legalese vs. What This Means)
   - "Gotchas" & Hidden Traps Highlight
   - Rights & Obligations Matrix (What You Can Do vs. What You Must Do vs. What They Can Do)
3. **Risk & Red Flag Detector**:
   - Severity-coded flags (🔴 High, 🟡 Medium, 🔵 Low)
   - Industry benchmarks & why a clause is unusual or aggressive
   - Suggested negotiation pushback / alternative wording suggestions
4. **Interactive Document Q&A (RAG / Contextual)**:
   - Ask any question about the uploaded document
   - Clickable source clause citations
   - Pre-loaded suggested questions tailored to document type
   - Strict hallucination guardrails (refuses to guess facts outside the document)
5. **Document Version Comparison (Diff & Change Analyzer)**:
   - Compare two versions of a contract or compare a draft against a standard template
   - Analyzes who benefits from each change (Tenant vs. Landlord, Employee vs. Employer)
6. **Plain-Language Export & Action Checklist**:
   - PDF & Markdown export with mandatory legal disclaimer headers
   - Actionable "Before You Sign" checklist with critical dates and deadlines
7. **Proactive Attorney Escalation Prompts**:
   - Detects high-stakes terms (e.g. non-compete clauses, IP transfer, unlimited liability, personal indemnification) and prompts the user to seek specialized human counsel.

---

## Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion, Axios, jsPDF, React Markdown
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic, python-multipart, PyPDF, python-docx
- **AI / LLM**: Google Gemini (`gemini-2.5-flash` via `google-genai` / `google-generativeai`)

---

## Getting Started

### Prerequisites
- Node.js 18+ and `npm`
- Python 3.10+
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and set your GEMINI_API_KEY
copy .env.example .env
```

Start the FastAPI backend server:
```bash
uvicorn main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## Sample Documents Provided

Pre-built sample documents are available in the [`sample_documents/`](./sample_documents/) directory for immediate testing:
- [`sample_lease.txt`](./sample_documents/sample_lease.txt): Residential Lease Agreement with auto-renewal, arbitration waiver, and indemnification traps.
- [`sample_nda.txt`](./sample_documents/sample_nda.txt): Mutual Non-Disclosure Agreement with strict non-solicitation and perpetual trade secret terms.
- [`sample_employment_agreement.txt`](./sample_documents/sample_employment_agreement.txt): Executive Employment Agreement with non-competes, IP assignments, and arbitration clauses.

---

## Safety & Compliance Features

- **No Advice Guarantee**: System prompts explicitly prevent generating unqualified legal advice or predicting court outcomes.
- **Escalation Triggers**: Automated detection of high-risk legal clauses directs users to local bar associations and legal aid services.
- **Privacy First**: Uploaded documents are processed in-memory and analyzed directly through the configured Gemini API instance.
