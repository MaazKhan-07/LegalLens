// LegalLens — Comprehensive Mock Data Engine & Intelligent Client-Side Fallback
// Enables full functionality for demo/testing even without an active backend or Gemini API key.

import type {
  ParsedDocument,
  SimplificationResult,
  ClauseHighlightResult,
  ComparisonResult,
  ActionableOutputsResult,
  LawyerBriefResult,
  QAResponse,
  ReadingLevel,
  HighlightedClause,
  DocumentSection,
  Obligation,
} from "@/types";

const DISCLAIMER =
  "This is general information, not legal advice. For decisions with real consequences, consult a licensed attorney in your jurisdiction.";

export const SAMPLE_DOCUMENTS = {
  lease: {
    name: "Sample Residential Lease Agreement",
    filename: "residential_lease_agreement.txt",
    text: `RESIDENTIAL LEASE AGREEMENT

1. PARTIES & PREMISES
This Agreement is entered into between Greenwood Properties LLC ("Landlord") and Jane Doe ("Tenant") for the property located at 742 Evergreen Terrace, Apt 4B.

2. TERM & AUTOMATIC RENEWAL
The lease commences on June 1, 2025 and ends on May 31, 2026. Unless Tenant provides written notice of non-renewal at least sixty (60) days prior to the expiration date, this Lease shall automatically renew for a successive twelve (12) month term at a rental rate determined solely by Landlord, with a mandatory 10% minimum annual increase.

3. RENT & LATE PENALTIES
Monthly rent is $2,400.00, due on or before the 1st of each calendar month. A late fee of $150.00 plus $25.00 per day shall apply immediately if rent is not received by 11:59 PM on the 2nd day of the month.

4. MAINTENANCE, REPAIRS & LANDLORD ACCESS
Tenant shall promptly notify Landlord of needed repairs. Tenant is strictly liable for all plumbing unclogging and minor repairs under $250. Landlord reserves the right to enter the premises at any time without advance notice for inspection, showing, or maintenance purposes.

5. EARLY TERMINATION & LIQUIDATED DAMAGES
Should Tenant terminate this lease prior to expiration for any reason, Tenant shall forfeit the full security deposit ($4,800.00) and remain liable for an early termination liquidated damages fee equal to three (3) months' rent ($7,200.00), plus rent until a replacement tenant occupies the unit.

6. INDEMNIFICATION & LIMITATION OF LIABILITY
Tenant agrees to indemnify, defend, and hold harmless Landlord from any and all claims, liabilities, or injuries occurring on the premises, regardless of Landlord's negligence. Landlord shall have zero liability for water damage, mold, theft, or heating failure.

7. MANDATORY ARBITRATION & JURY TRIAL WAIVER
Any dispute arising out of this agreement shall be resolved through individual binding arbitration. Tenant expressly waives the right to a trial by jury and waives any right to join or initiate a class action lawsuit against Landlord.`,
  },
  nda: {
    name: "Sample Mutual NDA",
    filename: "mutual_nda_agreement.txt",
    text: `MUTUAL NON-DISCLOSURE AGREEMENT

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" refers to any proprietary information, technical data, source code, customer lists, and financial forecasts disclosed between Apex Innovations Inc. and Quantum Software LLC.

2. OBLIGATIONS & PERPETUAL SURVIVAL
Receiving Party shall protect Confidential Information with reasonable care and shall not disclose it without prior written approval. Confidentiality obligations regarding trade secrets and software algorithms shall survive the termination of this Agreement in perpetuity.

3. NON-SOLICITATION COVENANT
For a period of twenty-four (24) months following termination of this Agreement, neither party shall recruit, solicit, or attempt to hire any employee, consultant, or key contractor of the other party.

4. REMEDIES & INJUNCTIVE RELIEF
Any breach of this Agreement shall entitle the non-breaching party to seek immediate injunctive relief and specific performance without the requirement of posting a bond.

5. GOVERNING LAW & VENUE
This Agreement is governed by the laws of the State of Delaware. All legal proceedings shall take place exclusively in the state or federal courts located in Wilmington, Delaware.`,
  },
  employment: {
    name: "Sample Employment Agreement",
    filename: "executive_employment_agreement.txt",
    text: `EXECUTIVE EMPLOYMENT AGREEMENT

1. POSITION & AT-WILL EMPLOYMENT
Executive shall serve as Senior Director of Engineering for Apex Technology Cloud Inc. Employment is strictly "at-will" and may be terminated by either party at any time with or without cause or advance notice.

2. COMPENSATION & SEVERANCE
Base salary is $210,000 annually with an optional performance bonus. In the event of termination without cause, Executive is entitled to two (2) months base salary conditioned on signing a broad general release of all legal claims.

3. NON-COMPETE & NON-SOLICITATION RESTRICTIONS
During employment and for twelve (12) months following termination, Executive shall not engage in, advise, or invest in any competing cloud optimization business anywhere in North America. Executive shall not solicit clients or hire company employees for eighteen (18) months post-termination.

4. INTELLECTUAL PROPERTY ASSIGNMENT
All inventions, software, code, designs, and patentable ideas conceived or reduced to practice during employment, whether during business hours or using personal equipment, belong exclusively to the Company as Works Made for Hire.

5. MANDATORY BINDING ARBITRATION
All disputes, wage claims, or employment conflicts shall be submitted exclusively to binding arbitration under JAMS in San Francisco, California. Executive waives all rights to a jury trial or class action proceedings.`,
  },
};

export function parseDocumentMock(text: string, filename = "document.txt"): ParsedDocument {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return {
    filename,
    text,
    char_count: text.length,
    word_count: words.length,
  };
}

export function simplifyDocumentMock(text: string, readingLevel: ReadingLevel = "quick"): SimplificationResult {
  const isLease = /lease|tenant|landlord|rent/i.test(text);
  const isNDA = /confidential|non-disclosure|nda/i.test(text);
  const isEmployment = /employment|employee|salary|non-compete/i.test(text);

  if (readingLevel === "detailed") {
    let sections: DocumentSection[] = [];

    if (isLease) {
      sections = [
        {
          section_title: "1. Term & Automatic Renewal",
          plain_explanation: "The lease runs for one year, but it will automatically lock you into another 12 months with an automatic 10% rent hike unless you give written cancellation notice at least 60 days in advance.",
          original_excerpt: "Unless Tenant provides written notice of non-renewal at least sixty (60) days prior... automatically renew for a successive twelve (12) month term with mandatory 10% increase.",
          severity: "Important",
        },
        {
          section_title: "2. Rent & Late Fees",
          plain_explanation: "Rent is due on the 1st. Missing the 1st by even one day triggers a very heavy $150 flat fee plus $25 per day thereafter.",
          original_excerpt: "A late fee of $150.00 plus $25.00 per day shall apply immediately if rent is not received by 11:59 PM on the 2nd.",
          severity: "Worth Reviewing",
        },
        {
          section_title: "3. Repairs & Landlord Entry Rights",
          plain_explanation: "You are required to pay out of pocket for any plumbing issues and repairs under $250. The landlord also claims the right to enter your home at any time without giving you advance notice.",
          original_excerpt: "Tenant is strictly liable for all plumbing unclogging and minor repairs under $250. Landlord reserves the right to enter... without advance notice.",
          severity: "Important",
        },
        {
          section_title: "4. Early Termination & Liquidated Damages",
          plain_explanation: "If you need to move out early, you lose your entire 2-month deposit ($4,800) and must pay an extra 3 months of rent ($7,200) plus ongoing rent until a replacement is found.",
          original_excerpt: "Tenant shall forfeit the full security deposit ($4,800.00) and remain liable for liquidated damages equal to three (3) months' rent ($7,200.00).",
          severity: "Important",
        },
        {
          section_title: "5. Dispute Resolution & Arbitration",
          plain_explanation: "You cannot take the landlord to small claims court or join a class action. Any legal dispute must go to private arbitration.",
          original_excerpt: "Tenant expressly waives the right to a trial by jury and waives any right to join or initiate a class action lawsuit.",
          severity: "Worth Reviewing",
        },
      ];
    } else if (isNDA) {
      sections = [
        {
          section_title: "1. Definition of Confidential Information",
          plain_explanation: "Covers all business information, source code, data, customer lists, and financial strategies shared between the two parties.",
          original_excerpt: "Confidential Information refers to any proprietary information, technical data, source code, customer lists...",
          severity: "Informational",
        },
        {
          section_title: "2. Confidentiality Duration & Perpetual Survival",
          plain_explanation: "Standard terms last 2 years, but confidentiality for software algorithms and trade secrets never expires (perpetual).",
          original_excerpt: "Confidentiality obligations regarding trade secrets and software algorithms shall survive... in perpetuity.",
          severity: "Worth Reviewing",
        },
        {
          section_title: "3. Non-Solicitation of Employees",
          plain_explanation: "For 2 years after working together, neither company is allowed to hire or recruit any staff members or contractors from the other side.",
          original_excerpt: "For a period of twenty-four (24) months... neither party shall recruit, solicit, or attempt to hire any employee...",
          severity: "Important",
        },
      ];
    } else if (isEmployment) {
      sections = [
        {
          section_title: "1. Employment Status & Termination",
          plain_explanation: "The job is strictly 'at-will', meaning either you or the company can end employment at any time with no advance notice required.",
          original_excerpt: "Employment is strictly 'at-will' and may be terminated by either party at any time with or without cause.",
          severity: "Informational",
        },
        {
          section_title: "2. Post-Employment Non-Compete",
          plain_explanation: "You are prohibited from working for or advising any competing cloud software business across North America for 12 months after leaving.",
          original_excerpt: "Executive shall not engage in, advise, or invest in any competing cloud optimization business anywhere in North America.",
          severity: "Important",
        },
        {
          section_title: "3. Intellectual Property Assignment",
          plain_explanation: "Everything you create during your employment belongs to the employer, even if developed outside working hours or on personal devices if related to their business.",
          original_excerpt: "All inventions, software, code, designs... whether during business hours or using personal equipment, belong exclusively to the Company.",
          severity: "Important",
        },
      ];
    } else {
      sections = [
        {
          section_title: "Overview of Core Terms",
          plain_explanation: "This agreement outlines the operational terms, rights, and responsibilities established between the participating parties.",
          original_excerpt: text.slice(0, 150) + "...",
          severity: "Informational",
        },
        {
          section_title: "Rights and Liabilities",
          plain_explanation: "Defines limitation of damages, indemnification clauses, and remedies in case of disagreement or breach.",
          original_excerpt: text.slice(150, 300) + "...",
          severity: "Worth Reviewing",
        },
      ];
    }

    return {
      reading_level: "detailed",
      sections,
      disclaimer: DISCLAIMER,
    };
  }

  // Quick summary
  let summary = "";
  if (isLease) {
    summary = ` 📋 Document Summary: Residential Lease Agreement\n\n- Document Type & Parties: A 12-month residential lease agreement between Greenwood Properties LLC (Landlord) and Jane Doe (Tenant) for Apt 4B.\n- Key Financial Terms: Monthly rent is $2,400.00 due on the 1st, with aggressive late fees ($150 + $25/day) starting on day 2.\n- Major Attention Items:\n  1. Automatic Renewal: Automatically renews for 12 months with an automatic 10% rent hike unless written notice is submitted 60 days ahead.\n  2. Landlord Entry Rights: Permits landlord entry at any time without advance notice.\n  3. High Early Exit Penalty: Breaking the lease incurs full loss of $4,800 deposit plus a $7,200 fee.\n  4. Broad Liability Waiver: Tenant waives landlord liability for damages and waives jury trial/class action rights.`;
  } else if (isNDA) {
    summary = ` 📋 Document Summary: Mutual Non-Disclosure Agreement\n\n- Document Type & Parties: Mutual NDA between Apex Innovations Inc. and Quantum Software LLC to safeguard exchanged technical and commercial information.\n- Key Terms: Standard 2-year term with perpetual protection for software algorithms and trade secrets.\n- Notable Clauses: Includes a 24-month strict non-solicitation restriction preventing either party from hiring each other's employees or contractors.`;
  } else if (isEmployment) {
    summary = ` 📋 Document Summary: Executive Employment Agreement\n\n- Role & Compensation: Senior Director of Engineering role at Apex Technology Cloud Inc., $210,000 annual base salary with at-will employment status.\n- Key Restrictive Covenants:\n  1. 12-Month Non-Compete: Restricts working for competing cloud optimization companies in North America.\n  2. IP Assignment: Assigns all intellectual property created during employment to the company.\n  3. Mandatory Arbitration: Requires private JAMS arbitration in San Francisco and waives jury trial rights.`;
  } else {
    summary = ` 📋 Document Summary\n\n- Analyzed Content: Legal agreement containing ${text.split(/\s+/).length} words.\n- Core Highlights: Establishes binding mutual terms, service delivery obligations, liability allocations, and termination stipulations.\n- Review Advice: Verify all deadlines, auto-renewal mechanisms, and indemnification caps before signing.`;
  }

  return {
    reading_level: "quick",
    summary,
    disclaimer: DISCLAIMER,
  };
}

export function highlightClausesMock(text: string): ClauseHighlightResult {
  const clauses: HighlightedClause[] = [];

  if (/auto.*renew/i.test(text) || /successive.*term/i.test(text) || /lease/i.test(text)) {
    clauses.push({
      clause_type: "auto_renewal",
      severity: "Important",
      why_it_matters: "Automatically locks you into another full term with higher rent unless you remember to cancel 60 days before the lease ends.",
      original_text: "Unless Tenant provides written notice of non-renewal at least sixty (60) days prior... shall automatically renew for a successive twelve (12) month term with mandatory 10% increase.",
      section_reference: "Section 2 — Term & Automatic Renewal",
    });
  }

  if (/entry|enter.*premises|inspect/i.test(text) || /lease/i.test(text)) {
    clauses.push({
      clause_type: "right",
      severity: "Important",
      why_it_matters: "Allows the landlord to enter your private home at any time without standard 24-hour advance written notice.",
      original_text: "Landlord reserves the right to enter the premises at any time without advance notice for inspection, showing, or maintenance.",
      section_reference: "Section 4 — Maintenance & Entry Rights",
    });
  }

  if (/liquidated damages|early termination|forfeit/i.test(text) || /lease/i.test(text)) {
    clauses.push({
      clause_type: "penalty_or_fee",
      severity: "Important",
      why_it_matters: "Imposes severe financial penalties (loss of entire deposit plus 3 months rent) if you need to relocate or break the lease early.",
      original_text: "Tenant shall forfeit the full security deposit ($4,800.00) and remain liable for liquidated damages equal to three (3) months' rent ($7,200.00).",
      section_reference: "Section 5 — Early Termination",
    });
  }

  if (/indemnif|hold harmless|negligence/i.test(text)) {
    clauses.push({
      clause_type: "liability_or_indemnity",
      severity: "Important",
      why_it_matters: "Shifts legal liability and defense costs onto you even if damage or injury is caused by the other party's own negligence.",
      original_text: "Tenant agrees to indemnify, defend, and hold harmless Landlord... regardless of Landlord's negligence.",
      section_reference: "Section 6 — Indemnification",
    });
  }

  if (/arbitrat|jury trial|class action/i.test(text)) {
    clauses.push({
      clause_type: "arbitration_or_waiver",
      severity: "Worth Reviewing",
      why_it_matters: "Waives your constitutional right to a jury trial or to join a class action, requiring private binding arbitration instead.",
      original_text: "Tenant expressly waives the right to a trial by jury and waives any right to join or initiate a class action lawsuit.",
      section_reference: "Section 7 — Mandatory Arbitration",
    });
  }

  if (/non-compete|competing|solicit/i.test(text)) {
    clauses.push({
      clause_type: "obligation",
      severity: "Important",
      why_it_matters: "Restricts where you can work or who you can hire for up to 12-24 months after the contract ends.",
      original_text: "Shall not engage in, advise, or invest in any competing business for a period of twelve (12) months following termination.",
      section_reference: "Section 3 / 5 — Restrictive Covenants",
    });
  }

  if (clauses.length === 0) {
    clauses.push({
      clause_type: "obligation",
      severity: "Worth Reviewing",
      why_it_matters: "Outlines core contractual performance commitments and expectations between parties.",
      original_text: text.slice(0, 180) + "...",
      section_reference: "General Terms",
    });
  }

  return {
    clauses,
    disclaimer: DISCLAIMER,
  };
}

export function askQuestionMock(documentText: string, question: string): QAResponse {
  const q = question.toLowerCase();

  // Check for high-stakes escalation signals
  if (/evict|deport|arrest|jail|custody|restraining|court date|lawsuit|sheriff/i.test(q)) {
    return {
      escalation_triggered: true,
      message:
        "It looks like your question involves time-sensitive or high-stakes legal matters (such as eviction proceedings, court hearings, or emergency legal orders). LegalLens provides informational assistance only. Please contact a licensed attorney or legal aid organization immediately.",
      resources: [
        { name: "Legal Services Corporation (LSC)", url: "https://www.lsc.gov/" },
        { name: "LawHelp.org Free Legal Aid Directory", url: "https://www.lawhelp.org/" },
        { name: "American Bar Association Lawyer Referral", url: "https://www.americanbar.org/groups/legal_services/flh-home/" },
      ],
      disclaimer: DISCLAIMER,
    };
  }

  let answer = "";
  if (/renew|automatic|cancel/i.test(q)) {
    answer =
      "**Based on Section 2 of the document:**\n\nThis agreement contains an **automatic renewal clause**. If you do not provide written notice of non-renewal at least **60 days before the term ends**, it automatically renews for another 12 months with a mandatory 10% price increase.\n\n*Source citation:* Section 2 ('Unless Tenant provides written notice of non-renewal at least sixty (60) days prior...')";
  } else if (/late|fee|penalty|due/i.test(q)) {
    answer =
      "**Based on Section 3 of the document:**\n\nPayment is due on the **1st of each month**. If not received by 11:59 PM on the 2nd day, an immediate flat late fee of **$150.00** plus **$25.00 for each additional day** is charged.\n\n*Source citation:* Section 3 ('A late fee of $150.00 plus $25.00 per day shall apply immediately...')";
  } else if (/break|terminate|leave early|move out/i.test(q)) {
    answer =
      "**Based on Section 5 of the document:**\n\nIf you terminate early, the contract specifies that you **forfeit your entire security deposit ($4,800)** and must pay an **early termination liquidated fee of three months' rent ($7,200)**, plus rent until a replacement is found.\n\n*Source citation:* Section 5 ('Early Termination & Liquidated Damages')";
  } else if (/repair|maintenance|access|entry/i.test(q)) {
    answer =
      "**Based on Section 4 of the document:**\n\n1. **Repairs:** You are responsible for all minor repairs under $250 as well as plumbing unclogging.\n2. **Access:** The landlord claims the right to enter at any time without advance notice.\n\n*Source citation:* Section 4 ('Tenant is strictly liable for all plumbing unclogging... Landlord reserves the right to enter at any time without advance notice.')";
  } else {
    answer = `**Based on the provided document text:**\n\nI reviewed your question regarding "${question}". The document establishes specific terms regarding party obligations, payment schedules, restrictive covenants, and dispute procedures. \n\nTo ensure complete accuracy regarding your specific situation, check the corresponding sections or consult a legal professional for guidance tailored to your jurisdiction.`;
  }

  return {
    escalation_triggered: false,
    answer: answer + `\n\n---\n*Note: This is informational assistance grounded in your document text, not formal legal advice.*`,
    disclaimer: DISCLAIMER,
  };
}

export function getActionableOutputsMock(text: string): ActionableOutputsResult {
  const isLease = /lease|tenant|rent/i.test(text);

  const obligations: Obligation[] = isLease
    ? [
      {
        party: "Tenant",
        obligation: "Pay monthly rent of $2,400.00",
        deadline: "1st of each month",
        consequence_if_missed: "$150 flat fee + $25/day late fee starting on the 2nd",
      },
      {
        party: "Tenant",
        obligation: "Submit written notice if you do not want the lease to auto-renew",
        deadline: "60 days before May 31, 2026",
        consequence_if_missed: "Automatic 12-month renewal with mandatory 10% rent hike",
      },
      {
        party: "Tenant",
        obligation: "Pay for all repairs under $250 and plumbing unclogging",
        deadline: "Upon occurrence",
        consequence_if_missed: "Deductions from security deposit or breach claim",
      },
      {
        party: "Landlord",
        obligation: "Provide habitable premises and structural maintenance",
        deadline: "Ongoing",
        consequence_if_missed: "Subject to local tenant housing codes",
      },
    ]
    : [
      {
        party: "You",
        obligation: "Maintain confidentiality of proprietary technical data and trade secrets",
        deadline: "Ongoing / Perpetual",
        consequence_if_missed: "Injunctive relief and breach of contract claim",
      },
      {
        party: "You",
        obligation: "Comply with non-solicitation and restrictive covenants",
        deadline: "12-24 months post-termination",
        consequence_if_missed: "Legal injunction and damages",
      },
    ];

  const negotiation_checklist = isLease
    ? [
      "Ask to remove the 60-day auto-renewal clause or reduce it to 30 days without mandatory 10% rent increases.",
      "Request standard 24-hour advance written notice before landlord entry (except in genuine emergencies).",
      "Negotiate a reasonable cap on early termination fees (e.g. 1 month rent rather than deposit forfeiture + 3 months rent).",
      "Clarify that plumbing repairs resulting from normal wear-and-tear or building piping are landlord responsibility.",
    ]
    : [
      "Request narrowing the non-compete scope to only direct competitors rather than the entire industry.",
      "Add a mutual fee-shifting clause so the prevailing party recovers legal costs in any arbitration.",
      "Ensure trade secret confidentiality is limited to identifiable confidential markings.",
    ];

  const clarification_checklist = [
    "Verify the exact procedure and email/mailing address required for giving formal written notice.",
    "Confirm the exact refund schedule and inspection timeline for the security deposit.",
    "Ask for written clarification on what constitutes emergency maintenance versus routine inspection.",
  ];

  const questions_for_professional = [
    "Are the auto-renewal and liquidated damages clauses enforceable under our local state/municipal tenancy laws?",
    "Does local law require mandatory 24-hour notice before landlord entry regardless of what this contract says?",
    "Can the indemnification clause be modified to exclude situations involving landlord negligence?",
  ];

  return {
    negotiation_checklist,
    clarification_checklist,
    obligations_summary: obligations,
    questions_for_professional,
    disclaimer: DISCLAIMER,
  };
}

export function generateLawyerBriefMock(text: string, flaggedClauses?: HighlightedClause[]): LawyerBriefResult {
  const isLease = /lease|tenant|rent/i.test(text);

  return {
    document_metadata: {
      document_type: isLease ? "Residential Lease Agreement" : "Commercial Legal Agreement",
      parties: isLease ? ["Greenwood Properties LLC (Landlord)", "Jane Doe (Tenant)"] : ["Party A", "Party B"],
      effective_date: "June 1, 2025",
      governing_law: "State of California / Local Municipal Jurisdiction",
      term_or_duration: "12 Months (with automatic renewal provision)",
    },
    key_facts: [
      "Contract involves a recurring monthly obligation with immediate late penalty triggers.",
      "Contains an aggressive automatic renewal mechanism requiring 60-day advance notice to prevent a 10% rate increase.",
      "Includes an expansive early termination liquidated damages penalty ($7,200 + deposit forfeiture).",
      "Disputes are routed to mandatory binding individual arbitration with jury trial waiver.",
    ],
    flagged_for_attorney: [
      {
        clause_description: "Automatic Renewal & Rent Increase (Section 2)",
        question: "Is this automatic renewal enforceable without separate explicit tenant sign-off under local tenant protection acts?",
      },
      {
        clause_description: "Landlord Entry Without Notice (Section 4)",
        question: "Does statutory quiet enjoyment law override this provision requiring 24-48 hours notice?",
      },
      {
        clause_description: "Liquidated Damages on Early Termination (Section 5)",
        question: "Does this constitute an unenforceable penalty under local contract law since landlord has a duty to mitigate damages?",
      },
    ],
    specific_questions: [
      "What specific clause modifications would you recommend requesting before signing?",
      "If the landlord refuses changes, what statutory rights protect me regardless of what is written here?",
      "What is the standard procedure for serving formal non-renewal notice?",
    ],
    recommended_next_steps: [
      "Schedule a 30-minute consultation with a tenant attorney or local legal aid clinic.",
      "Send written pushback on Section 2 (Auto-renewal) and Section 4 (Entry notice) using the suggested negotiation phrasing.",
      "Retain all email correspondence and signed addenda in your records.",
    ],
    professional_consultation_note:
      "Because this document contains clauses that may significantly limit your statutory rights and impose heavy financial liquidated damages, having a licensed attorney review the final draft is strongly advised.",
    disclaimer: DISCLAIMER,
  };
}

export function compareDocumentsMock(
  doc1Text: string,
  doc2Text: string,
  doc1Name = "Document A",
  doc2Name = "Document B"
): ComparisonResult {
  return {
    overview:
      `Comparison between ${doc1Name} and ${doc2Name} shows key differences in notice periods, liability caps, and dispute resolution terms. ${doc2Name} generally provides more balanced protections.`,
    comparison: [
      {
        topic: "Term & Renewal Notice",
        doc_a_summary: "Automatic 12-month renewal with 60-day advance notice requirement and 10% price increase.",
        doc_b_summary: "Month-to-month continuation with standard 30-day notice without automatic price hike.",
        difference_type: "material_difference",
        attention_note: "Document B gives significantly greater flexibility and avoids unexpected renewals.",
      },
      {
        topic: "Landlord Entry Rights",
        doc_a_summary: "Entry permitted at any time without advance notice.",
        doc_b_summary: "Requires 24-hour written notice for non-emergency inspections.",
        difference_type: "material_difference",
        attention_note: "Document B aligns with standard privacy and statutory quiet enjoyment guidelines.",
      },
      {
        topic: "Early Termination Penalty",
        doc_a_summary: "Loss of full security deposit + 3 months rent liquidated damages fee.",
        doc_b_summary: "1 month rent early termination fee with security deposit returned subject to standard inspection.",
        difference_type: "material_difference",
        attention_note: "Document A imposes a substantially higher financial burden.",
      },
      {
        topic: "Dispute Resolution",
        doc_a_summary: "Mandatory binding arbitration with complete jury and class action waiver.",
        doc_b_summary: "Standard court jurisdiction with mediation step prior to formal litigation.",
        difference_type: "minor_difference",
        attention_note: "Document B preserves court and small-claims dispute options.",
      },
    ],
    disclaimer: DISCLAIMER,
  };
}
