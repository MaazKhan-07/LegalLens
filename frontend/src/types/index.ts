// LegalLens — TypeScript types
// Shared across all features

export type ReadingLevel = "quick" | "detailed";

export type SeverityLevel = "Informational" | "Worth Reviewing" | "Important";

export type ClauseType =
  | "obligation"
  | "right"
  | "deadline"
  | "penalty_or_fee"
  | "auto_renewal"
  | "termination"
  | "liability_or_indemnity"
  | "arbitration_or_waiver"
  | "governing_law"
  | "other";

export type DifferenceType =
  | "same"
  | "minor_difference"
  | "material_difference"
  | "only_in_a"
  | "only_in_b";

// ─── Parsed Document ────────────────────────────────────────────────────────
export interface ParsedDocument {
  filename: string;
  text: string;
  char_count: number;
  word_count: number;
}

// ─── Simplification ─────────────────────────────────────────────────────────
export interface DocumentSection {
  section_title: string;
  plain_explanation: string;
  original_excerpt: string;
  severity: SeverityLevel;
}

export interface SimplificationResult {
  reading_level: ReadingLevel;
  summary?: string;           // for "quick"
  sections?: DocumentSection[]; // for "detailed"
  disclaimer: string;
}

// ─── Clause Highlighting ────────────────────────────────────────────────────
export interface HighlightedClause {
  clause_type: ClauseType;
  severity: SeverityLevel;
  why_it_matters: string;
  original_text: string;
  section_reference: string;
}

export interface ClauseHighlightResult {
  clauses: HighlightedClause[];
  disclaimer: string;
}

// ─── Comparison ─────────────────────────────────────────────────────────────
export interface ComparisonRow {
  topic: string;
  doc_a_summary: string;
  doc_b_summary: string;
  difference_type: DifferenceType;
  attention_note: string | null;
}

export interface ComparisonResult {
  overview: string;
  comparison: ComparisonRow[];
  disclaimer: string;
}

// ─── Actionable Outputs ─────────────────────────────────────────────────────
export interface Obligation {
  party: string;
  obligation: string;
  deadline: string | null;
  consequence_if_missed: string | null;
}

export interface ActionableOutputsResult {
  negotiation_checklist: string[];
  clarification_checklist: string[];
  obligations_summary: Obligation[];
  questions_for_professional: string[];
  disclaimer: string;
}

// ─── Lawyer Brief ───────────────────────────────────────────────────────────
export interface DocumentMetadata {
  document_type: string;
  parties: string[];
  effective_date: string;
  governing_law: string;
  term_or_duration: string;
}

export interface FlaggedForAttorney {
  clause_description: string;
  question: string;
}

export interface LawyerBriefResult {
  document_metadata: DocumentMetadata;
  key_facts: string[];
  flagged_for_attorney: FlaggedForAttorney[];
  specific_questions: string[];
  recommended_next_steps: string[];
  professional_consultation_note: string;
  disclaimer: string;
}

// ─── Q&A ────────────────────────────────────────────────────────────────────
export interface EscalationResource {
  name: string;
  url: string;
}

export interface QAResponse {
  escalation_triggered: boolean;
  answer?: string;
  message?: string;
  resources?: EscalationResource[];
  disclaimer?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  escalation?: boolean;
}

// ─── App State ──────────────────────────────────────────────────────────────
export type AppView =
  | "home"
  | "simplify"
  | "highlight"
  | "compare"
  | "actionable"
  | "brief"
  | "qa";
