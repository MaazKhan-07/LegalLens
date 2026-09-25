// HighlightView — clause detection and risk highlighting
import { useState } from "react";
import { Zap, Loader2, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { highlightClauses } from "@/api/client";
import type { ParsedDocument, ClauseHighlightResult, HighlightedClause, ClauseType, SeverityLevel } from "@/types";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { SeverityBadge, severityClass } from "@/components/SeverityBadge";

const CLAUSE_TYPE_LABELS: Record<ClauseType, string> = {
  obligation: "Obligation",
  right: "Right",
  deadline: "Deadline",
  penalty_or_fee: "Penalty / Fee",
  auto_renewal: "Auto-Renewal",
  termination: "Termination",
  liability_or_indemnity: "Liability / Indemnity",
  arbitration_or_waiver: "Arbitration / Waiver",
  governing_law: "Governing Law",
  other: "Other",
};

function ClauseCard({ clause, index }: { clause: HighlightedClause; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`clause-card ${severityClass(clause.severity)}`}
      style={{ animationDelay: `${index * 0.03}s`, marginBottom: 10 }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <SeverityBadge severity={clause.severity} size="sm" />
            <span style={{
              background: "var(--color-surface)", padding: "2px 8px",
              borderRadius: 999, fontSize: "0.72rem", color: "var(--color-text-muted)"
            }}>
              {CLAUSE_TYPE_LABELS[clause.clause_type] || clause.clause_type}
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--color-text-dim)" }}>
              {clause.section_reference}
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            {clause.why_it_matters}
          </p>
        </div>
        <button className="btn-ghost" style={{ padding: "4px 8px", flexShrink: 0 }} onClick={() => setExpanded((v) => !v)}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && clause.original_text && (
        <div style={{
          marginTop: 10,
          padding: "10px 12px",
          background: "var(--color-bg)",
          borderRadius: "var(--radius-sm)",
          borderLeft: "3px solid var(--color-blue)",
          fontSize: "0.82rem",
          color: "var(--color-text-dim)",
          fontStyle: "italic",
          lineHeight: 1.6,
        }}>
          <p style={{ color: "var(--color-blue-light)", fontWeight: 600, fontStyle: "normal", marginBottom: 4, fontSize: "0.72rem" }}>
            From the document:
          </p>
          {clause.original_text}
        </div>
      )}
    </div>
  );
}

interface HighlightViewProps {
  document: ParsedDocument;
}

export function HighlightView({ document: doc }: HighlightViewProps) {
  const [result, setResult] = useState<ClauseHighlightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | "All">("All");
  const [typeFilter, setTypeFilter] = useState<ClauseType | "All">("All");

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await highlightClauses(doc.text);
      setResult(r);
    } catch {
      setError("Clause analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredClauses = result?.clauses.filter((c) => {
    const matchSev = severityFilter === "All" || c.severity === severityFilter;
    const matchType = typeFilter === "All" || c.clause_type === typeFilter;
    return matchSev && matchType;
  }) || [];

  const counts = result
    ? {
        Informational: result.clauses.filter((c) => c.severity === "Informational").length,
        "Worth Reviewing": result.clauses.filter((c) => c.severity === "Worth Reviewing").length,
        Important: result.clauses.filter((c) => c.severity === "Important").length,
      }
    : null;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 6 }}>Clause Highlights</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Auto-detect obligations, deadlines, penalties, and other notable clauses in <strong>{doc.filename}</strong>.
          <br />
          <em style={{ fontSize: "0.8rem", color: "var(--color-text-dim)" }}>
            Attention levels are informational signals, not legal verdicts.
          </em>
        </p>
      </div>

      <DisclaimerBanner compact />

      <div style={{ margin: "24px 0" }}>
        <button className="btn-primary" onClick={analyze} disabled={loading}>
          {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={16} />}
          {loading ? "Analyzing clauses…" : "Analyze Clauses"}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <Loader2 size={32} color="var(--color-gold)" style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
          <p>Scanning for clauses…</p>
        </div>
      )}

      {error && <div className="escalation-banner" style={{ color: "var(--color-important)", padding: 16 }}>{error}</div>}

      {result && !loading && (
        <div className="animate-fadein">
          {/* Summary stats */}
          {counts && (
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {(["Important", "Worth Reviewing", "Informational"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(severityFilter === s ? "All" : s)}
                  style={{
                    padding: "8px 16px", borderRadius: 999,
                    border: "none", cursor: "pointer", fontFamily: "inherit",
                    fontSize: "0.825rem", fontWeight: 600,
                    background: severityFilter === s ? undefined : "var(--color-surface)",
                    color: severityFilter === s ? undefined : "var(--color-text-muted)",
                  }}
                  className={severityFilter === s ? `badge badge-${s === "Informational" ? "info" : s === "Worth Reviewing" ? "warn" : "important"}` : ""}
                >
                  {counts[s]} {s}
                </button>
              ))}
              {severityFilter !== "All" && (
                <button className="btn-ghost" onClick={() => setSeverityFilter("All")}>
                  <Filter size={12} /> Show all
                </button>
              )}
            </div>
          )}

          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Showing {filteredClauses.length} of {result.clauses.length} clauses
            </span>
          </div>

          {filteredClauses.map((clause, i) => (
            <ClauseCard key={i} clause={clause} index={i} />
          ))}

          {filteredClauses.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "var(--color-text-dim)" }}>
              No clauses match the current filter.
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
