import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock scroll functions in jsdom
window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
