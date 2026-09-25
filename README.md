# LegalLens — GenAI-Powered Legal Document Assistant

> **CRITICAL LEGAL DISCLAIMER**  
> LegalLens is an AI-powered informational tool designed to assist non-lawyer everyday users in understanding and navigating legal documents. **LegalLens does NOT provide legal advice and does NOT create an attorney-client relationship.** All generated analyses, risk flags, simplification summaries, and Q&A answers are for educational and informational purposes only. Consult a licensed attorney in your jurisdiction for binding legal counsel.
This web app was build for Google Prompt Wars Virtual Challenge by Hack2Skill and for learning purpose with mock data.

---
🔗 **Live Demo:** [legal-lens-two-rho.vercel.app](https://legal-lens-two-rho.vercel.app/)
## 📋 Problem Statement
 
**Challenge: AI for Legal Assistance & Access**
 
Legal information is often complex, difficult to understand, and hard to navigate without professional help. LegalLens makes legal documents more accessible by helping users simplify, compare, question, and act on legal text — while staying clearly within the bounds of *information and assistance*, not legal representation.
 
---
 
## ✨ Features
 
| Feature | Description |
|---|---|
| 📄 **Document Simplification** | Converts complex legal clauses into plain-language summaries at two reading levels, with original text always shown alongside |
| 🚩 **Clause & Risk Highlighting** | Detects and tags obligations, deadlines, penalties, auto-renewal clauses, liability/indemnity terms, and arbitration clauses — each with a plain-language explanation |
| 🔍 **Document Comparison** | Structured diff between two or more documents (e.g. two lease offers) to surface material differences |
| 💬 **Grounded Document Q&A** | Chat scoped strictly to the uploaded document, with citations to the exact clause — explicitly refuses to answer beyond the document's scope |
| ✅ **Actionable Outputs** | Checklists, obligation summaries, and a "questions to ask a lawyer" brief, exportable to PDF/Markdown |
 
---
 
## 🛠️ Tech Stack
 
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Python, FastAPI
- **GenAI:** Google Gemini API — used for simplification, risk tagging, grounded Q&A, comparison, and structured JSON outputs powering the UI
- **Deployment:** Vercel (multi-service deployment — frontend + backend as separate services)
- **Testing:** Pytest + httpx (backend), Vitest + React Testing Library (frontend)
---
## 🚦 Safety & Responsible AI Design
 
Because this tool sits close to legal decision-making, safety is enforced at multiple layers:
 
1. **Persistent disclaimer** visible on every AI-output screen
2. **No jurisdiction guessing** — the system asks or states the limitation rather than assuming governing law
3. **No outcome predictions** ("this is illegal," "you'll win") — reframed as informational context only
4. **Strict grounding** — answers are traceable to the uploaded document; general legal background, when given, is explicitly labeled and separated from document-specific analysis
5. **Escalation awareness** — high-stakes signals (eviction, criminal matters, immigration deadlines) surface a prompt toward professional/legal-aid resources instead of an inline answer
---
