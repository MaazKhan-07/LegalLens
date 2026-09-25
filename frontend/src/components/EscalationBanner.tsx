// Escalation Banner — shown when high-stakes signals detected (eviction, immigration, etc.)
// Points users to professional resources instead of answering inline.

import { Phone, ExternalLink, AlertOctagon } from "lucide-react";
import type { EscalationResource } from "@/types";

interface EscalationBannerProps {
  message: string;
  resources: EscalationResource[];
}

export function EscalationBanner({ message, resources }: EscalationBannerProps) {
  return (
    <div className="escalation-banner animate-fadein">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <AlertOctagon size={22} color="var(--color-important)" />
        <h3 style={{ color: "var(--color-important)", fontSize: "1rem", fontWeight: 700 }}>
          This situation may need urgent professional help
        </h3>
      </div>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: 16, lineHeight: 1.6 }}>
        {message}
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {resources.map((r) => (
          <a
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text)",
              textDecoration: "none",
              fontSize: "0.875rem",
              transition: "all 0.15s",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.15)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)";
            }}
          >
            <Phone size={14} color="var(--color-important)" />
            <span style={{ flex: 1 }}>{r.name}</span>
            <ExternalLink size={12} color="var(--color-text-dim)" />
          </a>
        ))}
      </div>
    </div>
  );
}
