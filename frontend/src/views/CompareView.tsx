// CompareView — two-document structured diff
import { useState } from "react";
import { GitCompare, Loader2, ArrowLeftRight } from "lucide-react";
import { compareDocuments } from "@/api/client";
import type { ComparisonResult, DifferenceType } from "@/types";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import type { ParsedDocument } from "@/types";

const DIFF_COLORS: Record<DifferenceType, { bg: string; color: string; label: string }> = {
  same: { bg: "rgba(100,116,139,0.1)", color: "var(--color-text-dim)", label: "Same" },
  minor_difference: { bg: "rgba(96,165,250,0.1)", color: "var(--color-info)", label: "Minor Diff" },
  material_difference: { bg: "rgba(251,191,36,0.12)", color: "var(--color-warn)", label: "Material Diff" },
  only_in_a: { bg: "rgba(56,189,248,0.1)", color: "var(--color-teal)", label: "Only in A" },
  only_in_b: { bg: "rgba(167,139,250,0.1)", color: "#a78bfa", label: "Only in B" },
};

export function CompareView() {
  const [doc1, setDoc1] = useState<ParsedDocument | null>(null);
  const [doc2, setDoc2] = useState<ParsedDocument | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = async () => {
    if (!doc1 || !doc2) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await compareDocuments(doc1.text, doc2.text, doc1.filename, doc2.filename);
      setResult(r);
    } catch {
      setError("Comparison failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 6 }}>Document Comparison</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Compare two versions of a document — leases, ToS updates, employment offers — and see exactly what changed.
        </p>
      </div>

      <DisclaimerBanner compact />

      <div className="compare-upload-grid" style={{ gap: 20, margin: "24px 0" }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 12, color: "var(--color-teal)" }}>Document A</p>
          <DocumentUpload onDocumentParsed={setDoc1} label="Upload first document" />
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 12, color: "#a78bfa" }}>Document B</p>
          <DocumentUpload onDocumentParsed={setDoc2} label="Upload second document" />
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={compare}
        disabled={!doc1 || !doc2 || loading}
        style={{ marginBottom: 24 }}
      >
        {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ArrowLeftRight size={16} />}
        {loading ? "Comparing…" : "Compare Documents"}
      </button>

      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <Loader2 size={32} color="var(--color-gold)" style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
          <p>Comparing documents…</p>
        </div>
      )}

      {error && <div className="escalation-banner" style={{ color: "var(--color-important)", padding: 16 }}>{error}</div>}

      {result && !loading && (
        <div className="animate-fadein">
          {result.overview && (
            <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <GitCompare size={18} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 6, fontSize: "0.9rem" }}>Overview</p>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", lineHeight: 1.7 }}>{result.overview}</p>
                </div>
              </div>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th style={{ width: "22%" }}>Topic</th>
                  <th style={{ width: "32%", color: "var(--color-teal)" }}>Document A ({doc1?.filename})</th>
                  <th style={{ width: "32%", color: "#a78bfa" }}>Document B ({doc2?.filename})</th>
                  <th style={{ width: "14%" }}>Change</th>
                </tr>
              </thead>
              <tbody>
                {result.comparison.map((row, i) => {
                  const diff = DIFF_COLORS[row.difference_type] || DIFF_COLORS.same;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{row.topic}</td>
                      <td style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                        {row.doc_a_summary}
                      </td>
                      <td style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                        {row.doc_b_summary}
                        {row.attention_note && (
                          <p style={{ color: diff.color, fontSize: "0.78rem", marginTop: 4, fontStyle: "italic" }}>
                            {row.attention_note}
                          </p>
                        )}
                      </td>
                      <td>
                        <span style={{
                          display: "inline-block", padding: "3px 8px", borderRadius: 999,
                          background: diff.bg, color: diff.color, fontSize: "0.72rem", fontWeight: 600
                        }}>
                          {diff.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 20 }}>
            <DisclaimerBanner />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .compare-upload-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 768px) {
          .compare-upload-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
