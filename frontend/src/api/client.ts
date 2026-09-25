// LegalLens — Resilient API Client with Intelligent Demo/Mock Mode Fallback
// Connects to FastAPI backend and seamlessly falls back to client-side mock engine
// if backend is not running or Gemini API is not configured.

import axios from "axios";
import type {
  ParsedDocument,
  SimplificationResult,
  ClauseHighlightResult,
  ComparisonResult,
  ActionableOutputsResult,
  LawyerBriefResult,
  QAResponse,
  ReadingLevel,
  HighlightedClause,
} from "@/types";
import {
  parseDocumentMock,
  simplifyDocumentMock,
  highlightClausesMock,
  askQuestionMock,
  getActionableOutputsMock,
  generateLawyerBriefMock,
  compareDocumentsMock,
} from "./mockData";

const api = axios.create({
  baseURL: "/api",
  timeout: 15_000, // 15s timeout before falling back
});

let isMockMode = false;
const mockListeners: Array<(isMock: boolean) => void> = [];

export function getIsMockMode(): boolean {
  return isMockMode;
}

export function subscribeMockMode(listener: (isMock: boolean) => void): () => void {
  mockListeners.push(listener);
  listener(isMockMode);
  return () => {
    const idx = mockListeners.indexOf(listener);
    if (idx !== -1) mockListeners.splice(idx, 1);
  };
}

function enableMockMode() {
  if (!isMockMode) {
    isMockMode = true;
    mockListeners.forEach((l) => l(true));
  }
}

// ─── Documents ──────────────────────────────────────────────────────────────

export async function uploadDocument(file: File): Promise<ParsedDocument> {
  try {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<ParsedDocument>("/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    console.warn("Backend upload failed or unavailable, falling back to client-side parser:", err);
    enableMockMode();

    // Try reading text directly in browser for txt / plain text
    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
      if (text && text.trim().length > 0) {
        return parseDocumentMock(text, file.name);
      }
    } catch {
      // ignore
    }

    // Default fallback
    return parseDocumentMock(
      `[Document: ${file.name}]\n\nThis legal document has been parsed and loaded in demo mode.\nIt contains standard provisions regarding obligations, renewal terms, liability limits, and dispute arbitration.`,
      file.name
    );
  }
}

export async function pasteDocument(text: string, filename?: string): Promise<ParsedDocument> {
  try {
    const { data } = await api.post<ParsedDocument>("/documents/paste", {
      text,
      filename: filename || "pasted-document.txt",
    });
    return data;
  } catch (err) {
    console.warn("Backend paste endpoint unavailable, using client-side parser:", err);
    enableMockMode();
    return parseDocumentMock(text, filename || "pasted-document.txt");
  }
}

// ─── Analysis ───────────────────────────────────────────────────────────────

export async function simplifyDocument(
  document_text: string,
  reading_level: ReadingLevel = "quick"
): Promise<SimplificationResult> {
  try {
    const { data } = await api.post<SimplificationResult>("/analysis/simplify", {
      document_text,
      reading_level,
    });
    return data;
  } catch (err) {
    console.warn("Backend simplify failed, using mock data engine:", err);
    enableMockMode();
    return simplifyDocumentMock(document_text, reading_level);
  }
}

export async function highlightClauses(document_text: string): Promise<ClauseHighlightResult> {
  try {
    const { data } = await api.post<ClauseHighlightResult>("/analysis/highlight-clauses", {
      document_text,
    });
    return data;
  } catch (err) {
    console.warn("Backend highlight-clauses failed, using mock data engine:", err);
    enableMockMode();
    return highlightClausesMock(document_text);
  }
}

export async function askQuestion(
  document_text: string,
  question: string,
  chat_history?: Array<{ user: string; assistant: string }>
): Promise<QAResponse> {
  try {
    const { data } = await api.post<QAResponse>("/analysis/ask", {
      document_text,
      question,
      chat_history,
    });
    return data;
  } catch (err) {
    console.warn("Backend ask failed, using mock data engine:", err);
    enableMockMode();
    return askQuestionMock(document_text, question);
  }
}

export async function getActionableOutputs(
  document_text: string,
  document_type?: string
): Promise<ActionableOutputsResult> {
  try {
    const { data } = await api.post<ActionableOutputsResult>("/analysis/actionable-outputs", {
      document_text,
      document_type,
    });
    return data;
  } catch (err) {
    console.warn("Backend actionable-outputs failed, using mock data engine:", err);
    enableMockMode();
    return getActionableOutputsMock(document_text);
  }
}

export async function generateLawyerBrief(
  document_text: string,
  flagged_clauses?: HighlightedClause[]
): Promise<LawyerBriefResult> {
  try {
    const { data } = await api.post<LawyerBriefResult>("/analysis/lawyer-brief", {
      document_text,
      flagged_clauses,
    });
    return data;
  } catch (err) {
    console.warn("Backend lawyer-brief failed, using mock data engine:", err);
    enableMockMode();
    return generateLawyerBriefMock(document_text, flagged_clauses);
  }
}

// ─── Compare ─────────────────────────────────────────────────────────────────

export async function compareDocuments(
  doc1_text: string,
  doc2_text: string,
  doc1_name?: string,
  doc2_name?: string
): Promise<ComparisonResult> {
  try {
    const { data } = await api.post<ComparisonResult>("/compare/", {
      doc1_text,
      doc2_text,
      doc1_name,
      doc2_name,
    });
    return data;
  } catch (err) {
    console.warn("Backend compare failed, using mock data engine:", err);
    enableMockMode();
    return compareDocumentsMock(doc1_text, doc2_text, doc1_name, doc2_name);
  }
}

// ─── Export ──────────────────────────────────────────────────────────────────

export async function exportMarkdown(
  title: string,
  content: unknown,
  documentName?: string
): Promise<Blob> {
  try {
    const { data } = await api.post(
      "/export/markdown",
      { title, content, document_name: documentName },
      { responseType: "blob" }
    );
    return data;
  } catch {
    const text = `# ${title}\n\nDocument: ${documentName || "LegalLens Document"}\n\n${typeof content === "string" ? content : JSON.stringify(content, null, 2)}\n\n---\n*Disclaimer: General information only, not legal advice.*`;
    return new Blob([text], { type: "text/markdown;charset=utf-8" });
  }
}

export async function getExportText(
  title: string,
  content: unknown,
  documentName?: string
): Promise<string> {
  try {
    const { data } = await api.post<{ text: string }>("/export/pdf-text", {
      title,
      content,
      document_name: documentName,
    });
    return data.text;
  } catch {
    return `${title}\n\nDocument: ${documentName || "LegalLens Document"}\n\n${typeof content === "string" ? content : JSON.stringify(content, null, 2)}\n\nDisclaimer: General information only, not legal advice.`;
  }
}

export default api;
