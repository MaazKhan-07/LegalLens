// Home / Landing page
import { Scale, FileText, Zap, GitCompare, CheckSquare, Briefcase, MessageCircle, Shield, ArrowRight } from "lucide-react";
import type { AppView } from "@/types";
import { DocumentUpload } from "@/components/DocumentUpload";
import type { ParsedDocument } from "@/types";

interface HomeViewProps {
  onDocumentParsed: (doc: ParsedDocument) => void;
  onNavigate: (view: AppView) => void;
  hasDocument: boolean;
}

const features = [
  { icon: FileText, title: "Simplify", desc: "Plain-language summaries at two reading levels", view: "simplify" as AppView },
  { icon: Zap, title: "Clause Highlights", desc: "Auto-tag obligations, deadlines, penalties & more", view: "highlight" as AppView },
  { icon: GitCompare, title: "Compare Docs", desc: "Structured diff table for two documents", view: "compare" as AppView },
  { icon: CheckSquare, title: "Action Checklist", desc: "What to negotiate, clarify, and ask", view: "actionable" as AppView },
  { icon: Briefcase, title: "Lawyer Brief", desc: "A concise brief to hand your attorney", view: "brief" as AppView },
  { icon: MessageCircle, title: "Ask Questions", desc: "Chat with the document — grounded answers", view: "qa" as AppView },
];

const safeguards = [
  "Strictly grounded in your document — no outside legal claims",
  "No jurisdiction guessing — states limitations clearly",
  "No legal outcome predictions — always hedged language",
  "Escalation triggers for high-stakes situations",
  "Persistent disclaimer on every AI output",
  "Session-only processing — documents never stored",
];

export function HomeView({ onDocumentParsed, onNavigate, hasDocument }: HomeViewProps) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 56, paddingTop: 24 }} className="animate-fadein">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, var(--color-gold) 0%, #d4a634 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(232, 184, 75, 0.3)",
          }}>
            <Scale size={28} color="#0b0f1a" />
          </div>
        </div>
        <h1 className="font-display gradient-text" style={{ marginBottom: 16 }}>
          LegalLens
        </h1>
        <p style={{ fontSize: "1.2rem", color: "var(--color-text-muted)", maxWidth: 520, margin: "0 auto 24px" }}>
          Understand any legal document in plain English — contracts, leases, NDAs, terms of service, employment offers.
        </p>
        <div className="disclaimer-banner" style={{ maxWidth: 600, margin: "0 auto 32px", textAlign: "left" }}>
          <Shield size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>This is general information, not legal advice.</strong> LegalLens helps you
            understand documents — for decisions with real consequences, always consult a licensed attorney.
          </span>
        </div>
      </div>

      {/* Upload */}
      <div className="glass-card animate-fadein-delay" style={{ padding: 32, marginBottom: 40 }}>
        <h2 style={{ marginBottom: 8, fontSize: "1.2rem" }}>Get started</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: 24, fontSize: "0.9rem" }}>
          Upload a PDF, DOCX, or paste text. Your document is processed only for this session and never stored.
        </p>
        <DocumentUpload onDocumentParsed={onDocumentParsed} />
        {hasDocument && (
          <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {features.slice(0, 3).map((f) => (
              <button key={f.view} className="btn-primary" onClick={() => onNavigate(f.view)}>
                <f.icon size={16} /> {f.title} <ArrowRight size={14} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Features grid */}
      <div style={{ marginBottom: 48 }} className="animate-fadein-delay-2">
        <h2 style={{ marginBottom: 4, fontSize: "1.1rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
          What you can do
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginTop: 16 }}>
          {features.map((f) => (
            <button
              key={f.view}
              onClick={() => hasDocument ? onNavigate(f.view) : undefined}
              disabled={!hasDocument && f.view !== "compare"}
              className="glass-card"
              style={{
                padding: 20,
                textAlign: "left",
                cursor: hasDocument || f.view === "compare" ? "pointer" : "default",
                border: "none",
                opacity: !hasDocument && f.view !== "compare" ? 0.5 : 1,
                width: "100%",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "var(--color-blue-dim)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12,
              }}>
                <f.icon size={20} color="var(--color-blue-light)" />
              </div>
              <h3 style={{ fontSize: "1rem", marginBottom: 4 }}>{f.title}</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Safety architecture */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Shield size={20} color="var(--color-gold)" />
          <h2 style={{ fontSize: "1rem" }}>Built-in safety guardrails</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
          {safeguards.map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              <span style={{ color: "var(--color-gold)", marginTop: 2, flexShrink: 0 }}>✓</span>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
