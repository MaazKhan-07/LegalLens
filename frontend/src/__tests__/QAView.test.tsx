import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { QAView } from "@/views/QAView";
import type { ParsedDocument, QAResponse } from "@/types";

// Mock the entire API client module so tests never hit real network/axios
vi.mock("@/api/client", () => ({
  askQuestion: vi.fn(),
}));

import { askQuestion } from "@/api/client";
const mockAskQuestion = vi.mocked(askQuestion);

const mockDoc: ParsedDocument = {
  filename: "sample_lease.txt",
  text: `RESIDENTIAL LEASE AGREEMENT
1. Term & Renewal
Unless Tenant provides written notice 60 days prior, the lease automatically renews.

2. Rent & Late Charges
Monthly rent is $2,400 due on the 1st. Late fee of $150 applies on the 2nd.`,
  char_count: 220,
  word_count: 35,
};

describe("QAView Component", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the question input, sample questions, and disclaimer", () => {
    render(<QAView document={mockDoc} />);
    expect(screen.getByText(/Ask Questions/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask a question about the document/i)).toBeInTheDocument();
    // Check one of the example questions
    expect(screen.getByText(/What happens if I terminate early\?/i)).toBeInTheDocument();
  });

  it("sends a question and displays the answer from the mock API", async () => {
    const fakeResponse: QAResponse = {
      escalation_triggered: false,
      answer: "**Based on Section 3 of the document:** Rent is due on the 1st of each month with a $150 late fee.",
      disclaimer: "This is informational only.",
    };
    mockAskQuestion.mockResolvedValueOnce(fakeResponse);

    const user = userEvent.setup();
    render(<QAView document={mockDoc} />);

    const textarea = screen.getByPlaceholderText(/Ask a question about the document/i);
    await user.type(textarea, "When is rent due and what is the late fee?");

    // The send button is the btn-primary button
    const sendBtn = screen.getByRole("button", { name: "" });
    await user.click(sendBtn);

    // The user question should appear in the chat
    await waitFor(() => {
      expect(screen.getByText(/When is rent due and what is the late fee\?/i)).toBeInTheDocument();
    });

    // The assistant answer should appear
    await waitFor(() => {
      expect(screen.getByText(/Based on Section 3/i)).toBeInTheDocument();
    });

    // Verify the API was called with the right document text and question
    expect(mockAskQuestion).toHaveBeenCalledWith(
      mockDoc.text,
      "When is rent due and what is the late fee?",
      expect.any(Array)
    );
  });

  it("triggers escalation resources for high-stakes emergency questions", async () => {
    const escalationResponse: QAResponse = {
      escalation_triggered: true,
      message:
        "It looks like your question involves high-stakes legal matters. Please contact a licensed attorney immediately.",
      resources: [
        { name: "Legal Services Corporation (LSC)", url: "https://www.lsc.gov/" },
        { name: "LawHelp.org", url: "https://www.lawhelp.org/" },
      ],
      disclaimer: "This is informational only.",
    };
    mockAskQuestion.mockResolvedValueOnce(escalationResponse);

    const user = userEvent.setup();
    render(<QAView document={mockDoc} />);

    const textarea = screen.getByPlaceholderText(/Ask a question about the document/i);
    await user.type(textarea, "My landlord filed an eviction notice against me today");

    const sendBtn = screen.getByRole("button", { name: "" });
    await user.click(sendBtn);

    // The EscalationBanner heading text
    await waitFor(() => {
      expect(screen.getByText(/This situation may need urgent professional help/i)).toBeInTheDocument();
    });

    // Resources rendered inside QAView's hardcoded list (not from mock response)
    await waitFor(() => {
      expect(screen.getByText(/Legal Services Corporation/i)).toBeInTheDocument();
    });
  });
});
