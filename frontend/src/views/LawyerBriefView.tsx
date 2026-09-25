// LawyerBriefView — "Prepare for a Professional" mode
// One-click concise brief for an attorney. Always nudges toward professional consultation.
import { useState } from "react";
import { Briefcase, Loader2, Download, ExternalLink, ArrowRight } from "lucide-react";
import { generateLawyerBrief, exportMarkdown } from "@/api/client";
import type { ParsedDocument, LawyerBriefResult } from "@/types";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";

interface LawyerBriefViewProps {
  document: ParsedDocument;
}

export function LawyerBriefView({ document: doc }: LawyerBriefViewProps) {
  const [result, setResult] = useState<LawyerBriefResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await generateLawyerBrief(doc.text);
      setResult(r);
    } catch {
      setError("Brief generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!result) return;
    try {
      const blob = await exportMarkdown("Lawyer Brief", result, doc.filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "legallens-lawyer-brief.md";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 6 }}>Prepare for a Professional</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          Generate a concise brief you can hand to an attorney — key facts, flagged clauses,
          and the specific questions you need answered. This feature is designed to help you make the most
          of professional consultation, not replace it.
        </p>
      </div>

      <div className="disclaimer-banner" style={{ marginBottom: 20 }}>
        <Briefcase size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>This feature is about next steps, not conclusions.</strong> The brief helps you have
          a more productive conversation with a real lawyer — it does not constitute legal advice itself.
        </span>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button className="btn-primary" onClick={generate} disabled={loading}>
          {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Briefcase size={16} />}
          {loading ? "Generating brief…" : "Generate Lawyer Brief"}
        </button>
        {result && (
          <button className="btn-secondary" onClick={handleExport}>
            <Download size={16} /> Export as Markdown
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <Loader2 size={32} color="var(--color-gold)" style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
          <p>Generating attorney brief…</p>
        </div>
      )}

      {error && <div className="escalation-banner" style={{ color: "var(--color-important)", padding: 16 }}>{error}</div>}

      {result && !loading && (
        <div className="animate-fadein" style={{ display: "grid", gap: 16 }}>
          {/* Document Metadata */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: 14, color: "var(--color-gold-light)" }}>Document Overview</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {[
                { label: "Type", value: result.document_metadata.document_type },
                { label: "Parties", value: result.document_metadata.parties.join(", ") },
                { label: "Effective Date", value: result.document_metadata.effective_date },
                { label: "Governing Law", value: result.document_metadata.governing_law },
                { label: "Duration / Term", value: result.document_metadata.term_or_duration },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "var(--color-bg-3)", padding: "10px 14px", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {label}
                  </p>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Facts */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: 12, color: "var(--color-gold-light)" }}>Key Facts</h3>
            {result.key_facts.map((fact, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                <ArrowRight size={14} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: 3 }} />
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{fact}</span>
              </div>
            ))}
          </div>

          {/* Flagged for Attorney */}
          {result.flagged_for_attorney.length > 0 && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: "0.95rem", marginBottom: 12, color: "var(--color-gold-light)" }}>Flagged for Your Attorney</h3>
              {result.flagged_for_attorney.map((item, i) => (
                <div key={i} style={{
                  padding: "12px 14px", marginBottom: 8,
                  background: "var(--color-bg-3)",
                  borderRadius: "var(--radius-sm)",
                  borderLeft: "3px solid var(--color-warn)",
                }}>
                  <p style={{ fontSize: "0.875rem", marginBottom: 6, lineHeight: 1.6 }}>{item.clause_description}</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-warn)", fontStyle: "italic" }}>
                    Question: {item.question}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Questions for Attorney */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: 12, color: "var(--color-gold-light)" }}>Questions to Ask Your Attorney</h3>
            {result.specific_questions.map((q, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ color: "var(--color-blue)", fontWeight: 700, flexShrink: 0 }}>Q{i + 1}.</span>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{q}</span>
              </div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: 12, color: "var(--color-gold-light)" }}>Recommended Next Steps</h3>
            {result.recommended_next_steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ color: "var(--color-gold)", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{step}</span>
              </div>
            ))}
          </div>

          {/* Professional consultation note */}
          {result.professional_consultation_note && (
            <div className="disclaimer-banner">
              <ExternalLink size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Why professional review matters for this document: </strong>
                {result.professional_consultation_note}
              </div>
            </div>
          )}

          <DisclaimerBanner />
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
