import { describe, it, expect } from "vitest";
import {
  simplifyDocument,
  highlightClauses,
  askQuestion,
  getActionableOutputs,
  compareDocuments,
} from "@/api/client";

const sampleContract = `
RESIDENTIAL LEASE AGREEMENT
1. Term & Automatic Renewal
Unless Tenant provides written notice 60 days prior, lease automatically renews with 10% rent increase.

2. Rent & Penalties
Rent is $2,400 due on 1st. Late fee is $150.
`;

describe("API Client & Mock Data Engine", () => {
  it("simplifies document at quick reading level", async () => {
    const res = await simplifyDocument(sampleContract, "quick");
    expect(res.reading_level).toBe("quick");
    expect(res.summary).toBeDefined();
    expect(res.disclaimer).toContain("not legal advice");
  });

  it("simplifies document at detailed reading level with structured sections", async () => {
    const res = await simplifyDocument(sampleContract, "detailed");
    expect(res.reading_level).toBe("detailed");
    expect(res.sections).toBeDefined();
    expect(res.sections!.length).toBeGreaterThan(0);
    expect(res.sections![0].severity).toBeDefined();
  });

  it("highlights clauses with severity and attention rationale", async () => {
    const res = await highlightClauses(sampleContract);
    expect(res.clauses).toBeDefined();
    expect(res.clauses.length).toBeGreaterThan(0);
    expect(["Informational", "Worth Reviewing", "Important"]).toContain(res.clauses[0].severity);
  });

  it("returns grounded answer for document question", async () => {
    const res = await askQuestion(sampleContract, "What is the late fee?");
    expect(res.escalation_triggered).toBe(false);
    expect(res.answer).toBeDefined();
  });

  it("compares two documents producing structured diff rows", async () => {
    const docB = sampleContract.replace("60 days", "30 days");
    const res = await compareDocuments(sampleContract, docB, "Doc A", "Doc B");
    expect(res.overview).toBeDefined();
    expect(res.comparison.length).toBeGreaterThan(0);
    expect(res.comparison[0].topic).toBeDefined();
  });
});
