// Disclaimer Banner — visible on every screen that shows AI output.
// Non-negotiable safety guardrail per the product spec.

import { AlertTriangle } from "lucide-react";

interface DisclaimerBannerProps {
  compact?: boolean;
  className?: string;
}

export function DisclaimerBanner({ compact = false, className = "" }: DisclaimerBannerProps) {
  if (compact) {
    return (
      <div className={`disclaimer-banner ${className}`}>
        <AlertTriangle size={14} />
        <span>
          <strong>General information only — not legal advice.</strong> Consult a licensed
          attorney for decisions with real consequences.
        </span>
      </div>
    );
  }

  return (
    <div className={`disclaimer-banner ${className}`}>
      <AlertTriangle size={16} />
      <div>
        <strong>Important Notice:</strong> LegalLens provides general information and
        assistance only — it does <em>not</em> provide legal advice and does not replace a
        licensed attorney. The analysis above is based solely on the text of the uploaded
        document and should not be relied upon as a legal opinion. For any decision with real
        legal consequences, please consult a qualified attorney in your jurisdiction.
      </div>
    </div>
  );
}
