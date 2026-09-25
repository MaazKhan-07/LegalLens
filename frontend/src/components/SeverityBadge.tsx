// Severity Badge — visual indicator for clause attention levels.
// Framed as "things to pay attention to", never as legal verdicts.
// SeverityLevel: "Informational" | "Worth Reviewing" | "Important"

import { Info, Eye, AlertTriangle } from "lucide-react";
import type { SeverityLevel } from "@/types";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: "sm" | "md";
}

const config: Record<SeverityLevel, { label: string; className: string; Icon: React.FC<{ size: number }> }> = {
  Informational: {
    label: "Informational",
    className: "badge badge-info",
    Icon: ({ size }) => <Info size={size} />,
  },
  "Worth Reviewing": {
    label: "Worth Reviewing",
    className: "badge badge-warn",
    Icon: ({ size }) => <Eye size={size} />,
  },
  Important: {
    label: "Important",
    className: "badge badge-important",
    Icon: ({ size }) => <AlertTriangle size={size} />,
  },
};

export function SeverityBadge({ severity, size = "md" }: SeverityBadgeProps) {
  const c = config[severity] || config["Informational"];
  const iconSize = size === "sm" ? 10 : 12;
  return (
    <span className={c.className} title="Attention level — not a legal verdict">
      <c.Icon size={iconSize} />
      {c.label}
    </span>
  );
}

export function severityClass(severity: SeverityLevel): string {
  const map: Record<SeverityLevel, string> = {
    Informational: "severity-info",
    "Worth Reviewing": "severity-warn",
    Important: "severity-important",
  };
  return map[severity] || "severity-info";
}
