// ActionableView — checklists, obligations summary, questions for professionals
import { useState } from "react";
import { CheckSquare, Loader2, Download, Check } from "lucide-react";
import { getActionableOutputs, exportMarkdown } from "@/api/client";
import type { ParsedDocument, ActionableOutputsResult } from "@/types";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";

interface ActionableViewProps {
  document: ParsedDocument;
}

function ChecklistSection({ title, items }: { title: string; items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div>
      <h3 style={{ fontSize: "0.95rem", marginBottom: 12, color: "var(--color-gold-light)" }}>{title}</h3>
      {items.map((item, i) => (
        <div key={i} className="checklist-item">
          <button
            className={`check-circle ${checked.has(i) ? "checked" : ""}`}
            onClick={() => toggle(i)}
            title="Mark as done"
          >
            {checked.has(i) && <Check size={11} color="#0b0f1a" />}
          </button>
          <span style={{
            fontSize: "0.875rem",
            color: checked.has(i) ? "var(--color-text-dim)" : "var(--color-text-muted)",
            textDecoration: checked.has(i) ? "line-through" : "none",
            lineHeight: 1.6,
            transition: "all 0.15s",
          }}>
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ActionableView({ document: doc }: ActionableViewProps) {
  const [result, setResult] = useState<ActionableOutputsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"negotiate" | "clarify" | "obligations" | "questions">("negotiate");

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await getActionableOutputs(doc.text);
      setResult(r);
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!result) return;
    try {
      const blob = await exportMarkdown("Action Checklist", result, doc.filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "legallens-checklist.md";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 6 }}>Action Checklist</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Practical next steps based on <strong>{doc.filename}</strong> — what to negotiate, clarify, and ask.
        </p>
      </div>

      <DisclaimerBanner compact />

      <div style={{ margin: "24px 0", display: "flex", gap: 12 }}>
        <button className="btn-primary" onClick={analyze} disabled={loading}>
          {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <CheckSquare size={16} />}
          {loading ? "Generating…" : "Generate Checklist"}
        </button>
        {result && (
          <button className="btn-secondary" onClick={handleExport}>
            <Download size={16} /> Export Markdown
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <Loader2 size={32} color="var(--color-gold)" style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
          <p>Generating actionable outputs…</p>
        </div>
      )}

      {error && <div className="escalation-banner" style={{ color: "var(--color-important)", padding: 16 }}>{error}</div>}

      {result && !loading && (
        <div className="animate-fadein">
          <div className="tab-list" style={{ marginBottom: 20 }}>
            {([
              { key: "negotiate", label: "Negotiate" },
              { key: "clarify", label: "Clarify" },
              { key: "obligations", label: "Obligations" },
              { key: "questions", label: "Ask a Pro" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                className={`tab-trigger ${activeTab === key ? "active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            {activeTab === "negotiate" && (
              <ChecklistSection title="Things you may want to negotiate" items={result.negotiation_checklist} />
            )}
            {activeTab === "clarify" && (
              <ChecklistSection title="Things to clarify before signing" items={result.clarification_checklist} />
            )}
            {activeTab === "obligations" && (
              <div>
                <h3 style={{ fontSize: "0.95rem", marginBottom: 16, color: "var(--color-gold-light)" }}>
                  Obligations Summary
                </h3>
                {result.obligations_summary.map((ob, i) => (
                  <div key={i} style={{
                    padding: "14px 16px", marginBottom: 10,
                    background: "var(--color-bg-3)",
                    borderRadius: "var(--radius-sm)",
                    borderLeft: "3px solid var(--color-blue)",
                  }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{ob.party}</span>
                      {ob.deadline && (
                        <span style={{ background: "var(--color-warn-bg)", color: "var(--color-warn)", borderRadius: 999, padding: "1px 8px", fontSize: "0.75rem" }}>
                          Due: {ob.deadline}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: ob.consequence_if_missed ? 8 : 0, lineHeight: 1.6 }}>
                      {ob.obligation}
                    </p>
                    {ob.consequence_if_missed && (
                      <p style={{ fontSize: "0.8rem", color: "var(--color-important)", fontStyle: "italic" }}>
                        ⚠ If missed: {ob.consequence_if_missed}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {activeTab === "questions" && (
              <ChecklistSection title="Questions to ask a lawyer, landlord, or employer" items={result.questions_for_professional} />
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <DisclaimerBanner />
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
