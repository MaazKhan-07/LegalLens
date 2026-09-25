// SimplifyView — plain-language document simplification with side-by-side original text
import { useState } from "react";
import { FileText, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { simplifyDocument } from "@/api/client";
import type { ParsedDocument, SimplificationResult, DocumentSection } from "@/types";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { SeverityBadge } from "@/components/SeverityBadge";

interface SimplifyViewProps {
  document: ParsedDocument;
}

function SectionCard({ section, index }: { section: DocumentSection; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`clause-card animate-fadein`}
      style={{ animationDelay: `${index * 0.04}s`, marginBottom: 12 }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 600 }}>{section.section_title || `Section ${index + 1}`}</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <SeverityBadge severity={section.severity} size="sm" />
          <button className="btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setExpanded((v) => !v)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span style={{ fontSize: "0.75rem" }}>Original</span>
          </button>
        </div>
      </div>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", lineHeight: 1.7 }}>
        {section.plain_explanation}
      </p>
      {expanded && section.original_excerpt && (
        <div style={{
          marginTop: 12,
          padding: "12px 14px",
          background: "var(--color-bg)",
          borderRadius: "var(--radius-sm)",
          borderLeft: "3px solid var(--color-blue)",
          fontSize: "0.825rem",
          color: "var(--color-text-dim)",
          lineHeight: 1.6,
          fontStyle: "italic",
        }}>
          <p style={{ color: "var(--color-blue-light)", fontWeight: 600, fontStyle: "normal", marginBottom: 6, fontSize: "0.75rem" }}>
            Original text:
          </p>
          {section.original_excerpt}
        </div>
      )}
    </div>
  );
}

export function SimplifyView({ document: doc }: SimplifyViewProps) {
  const [level, setLevel] = useState<"quick" | "detailed">("quick");
  const [result, setResult] = useState<SimplificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (selectedLevel: "quick" | "detailed") => {
    setLevel(selectedLevel);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await simplifyDocument(doc.text, selectedLevel);
      setResult(r);
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 6 }}>Document Simplification</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Get a plain-language explanation of <strong>{doc.filename}</strong> ({doc.word_count.toLocaleString()} words).
        </p>
      </div>

      <DisclaimerBanner compact className="animate-fadein" />

      <div style={{ margin: "24px 0", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          className="btn-primary"
          onClick={() => analyze("quick")}
          disabled={loading}
          style={{ opacity: level === "quick" && result ? 1 : undefined }}
        >
          {loading && level === "quick" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <FileText size={16} />}
          Quick Summary
        </button>
        <button
          className="btn-secondary"
          onClick={() => analyze("detailed")}
          disabled={loading}
        >
          {loading && level === "detailed" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <FileText size={16} />}
          Detailed Walkthrough
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <Loader2 size={32} color="var(--color-gold)" style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
          <p>Analyzing document… this may take a moment.</p>
        </div>
      )}

      {error && (
        <div className="escalation-banner" style={{ color: "var(--color-important)", padding: 16 }}>{error}</div>
      )}

      {result && !loading && (
        <div className="animate-fadein">
          {result.reading_level === "quick" && result.summary && (
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: 16, fontSize: "1rem", color: "var(--color-gold-light)" }}>Plain-language Summary</h3>
                  <div style={{ lineHeight: 1.8, color: "var(--color-text-muted)", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                    {result.summary}
                  </div>
                </div>
              </div>
            </div>
          )}

          {result.reading_level === "detailed" && result.sections && (
            <div>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {result.sections.length} sections · Click "Original" to see source text
                </span>
              </div>
              {result.sections.map((section, i) => (
                <SectionCard key={i} section={section} index={i} />
              ))}
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <DisclaimerBanner />
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
