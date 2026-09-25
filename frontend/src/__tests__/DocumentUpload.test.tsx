import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DocumentUpload } from "@/components/DocumentUpload";

describe("DocumentUpload Component", () => {
  it("renders upload and paste options and sample buttons", () => {
    const handleParsed = vi.fn();
    render(<DocumentUpload onDocumentParsed={handleParsed} />);

    expect(screen.getByText(/Upload File/i)).toBeInTheDocument();
    expect(screen.getByText(/Paste Text/i)).toBeInTheDocument();
    expect(screen.getByText(/Try a sample:/i)).toBeInTheDocument();
    expect(screen.getByText(/Residential Lease/i)).toBeInTheDocument();
  });

  it("switches to paste mode and allows typing and analyzing text", async () => {
    const handleParsed = vi.fn();
    const user = userEvent.setup();
    render(<DocumentUpload onDocumentParsed={handleParsed} />);

    // Click Paste Text
    const pasteTab = screen.getByText(/Paste Text/i);
    await user.click(pasteTab);

    const textarea = screen.getByPlaceholderText(/Paste the full text/i);
    expect(textarea).toBeInTheDocument();

    await user.type(textarea, "Section 1. Agreement terms between parties.");
    const analyzeBtn = screen.getByRole("button", { name: /Analyze Text/i });
    expect(analyzeBtn).not.toBeDisabled();

    await user.click(analyzeBtn);

    await waitFor(() => {
      expect(handleParsed).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Section 1. Agreement terms between parties.",
          word_count: 6,
        })
      );
    });
  });

  it("loads a sample document directly upon clicking preset button", async () => {
    const handleParsed = vi.fn();
    const user = userEvent.setup();
    render(<DocumentUpload onDocumentParsed={handleParsed} />);

    const leasePreset = screen.getByText(/Residential Lease/i);
    await user.click(leasePreset);

    await waitFor(() => {
      expect(handleParsed).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: "residential_lease_agreement.txt",
        })
      );
    });
  });
});
