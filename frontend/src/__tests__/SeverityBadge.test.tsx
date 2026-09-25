import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SeverityBadge } from "@/components/SeverityBadge";

describe("SeverityBadge Component", () => {
  it("renders Informational badge with icon and accessible label", () => {
    render(<SeverityBadge severity="Informational" />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveTextContent("Informational");
    expect(badge).toHaveAttribute("aria-label", "Attention level: Informational");
    expect(badge.querySelector("svg")).toBeInTheDocument();
  });

  it("renders Worth Reviewing badge with warning styling and icon", () => {
    render(<SeverityBadge severity="Worth Reviewing" />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveTextContent("Worth Reviewing");
    expect(badge).toHaveAttribute("aria-label", "Attention level: Worth Reviewing");
    expect(badge.querySelector("svg")).toBeInTheDocument();
  });

  it("renders Important badge with alert icon", () => {
    render(<SeverityBadge severity="Important" />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveTextContent("Important");
    expect(badge).toHaveAttribute("aria-label", "Attention level: Important");
    expect(badge.querySelector("svg")).toBeInTheDocument();
  });
});
