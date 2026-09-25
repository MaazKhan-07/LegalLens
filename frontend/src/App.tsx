// LegalLens — Main Application
// Full state management, collapsible desktop sidebar with arrow button, and responsive mobile drawer

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { HomeView } from "@/views/HomeView";
import { SimplifyView } from "@/views/SimplifyView";
import { HighlightView } from "@/views/HighlightView";
import { CompareView } from "@/views/CompareView";
import { ActionableView } from "@/views/ActionableView";
import { LawyerBriefView } from "@/views/LawyerBriefView";
import { QAView } from "@/views/QAView";
import type { AppView, ParsedDocument } from "@/types";
import { Menu, X, Scale, FileText, Zap, GitCompare, CheckSquare, Briefcase, MessageCircle, Home, Sparkles } from "lucide-react";
import { subscribeMockMode } from "@/api/client";

const viewTitles: Record<AppView, { title: string; icon: React.ComponentType<{ size: number }> }> = {
  home: { title: "Home", icon: Home },
  simplify: { title: "Simplify", icon: FileText },
  highlight: { title: "Clause Highlights", icon: Zap },
  compare: { title: "Compare Docs", icon: GitCompare },
  actionable: { title: "Action Checklist", icon: CheckSquare },
  brief: { title: "Lawyer Brief", icon: Briefcase },
  qa: { title: "Ask Questions", icon: MessageCircle },
};

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>("home");
  const [document, setDocument] = useState<ParsedDocument | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("legallens_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    return subscribeMockMode((active) => setIsDemoMode(active));
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("legallens_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleDocumentParsed = (doc: ParsedDocument) => {
    setDocument(doc);
    setCurrentView("simplify");
    setMobileMenuOpen(false);
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const CurrentIcon = viewTitles[currentView]?.icon || Home;

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative", backgroundColor: "var(--color-bg)" }}>
      {/* Desktop Sidebar */}
      <div className="desktop-sidebar-wrapper">
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          hasDocument={!!document}
          activeDocument={document}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? <X size={22} color="var(--color-gold-light)" /> : <Menu size={22} color="var(--color-gold-light)" />}
          </button>

          <div
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            onClick={() => handleNavigate("home")}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "linear-gradient(135deg, var(--color-gold) 0%, #d4a634 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Scale size={16} color="#0b0f1a" strokeWidth={2.4} />
            </div>
            <span className="gradient-text font-display" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
              LegalLens
            </span>
          </div>
        </div>

        {/* Current View Pill Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            background: "var(--color-surface)",
            borderRadius: 20,
            border: "1px solid var(--color-border)",
            fontSize: "0.78rem",
            color: "var(--color-gold-light)",
            fontWeight: 500,
          }}
        >
          <CurrentIcon size={14} />
          <span>{viewTitles[currentView]?.title}</span>
        </div>
      </header>

      {/* Mobile Off-Canvas Drawer Overlay */}
      <div
        className={`mobile-drawer-backdrop ${mobileMenuOpen ? "open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={`mobile-drawer-content ${mobileMenuOpen ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Scale size={18} color="var(--color-gold)" />
              <span className="gradient-text font-display" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                LegalLens Navigation
              </span>
            </div>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: 6, borderRadius: "50%" }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            <Sidebar
              currentView={currentView}
              onNavigate={handleNavigate}
              hasDocument={!!document}
              activeDocument={document}
              isCollapsed={false}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="main-viewport">
        {/* Demo Mode Notice Banner if active */}
        {isDemoMode && (
          <div
            style={{
              marginBottom: 20,
              padding: "8px 14px",
              background: "rgba(232, 184, 75, 0.1)",
              border: "1px solid rgba(232, 184, 75, 0.25)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.8rem",
              color: "var(--color-gold-light)",
            }}
          >
            <Sparkles size={14} />
            <span>
              <strong>Demo Mode Active:</strong> Running interactive mock engine with instant sample document analysis.
            </span>
          </div>
        )}

        {currentView === "home" && (
          <HomeView
            onDocumentParsed={handleDocumentParsed}
            onNavigate={handleNavigate}
            hasDocument={!!document}
          />
        )}
        {currentView === "simplify" && document && <SimplifyView document={document} />}
        {currentView === "highlight" && document && <HighlightView document={document} />}
        {currentView === "compare" && <CompareView />}
        {currentView === "actionable" && document && <ActionableView document={document} />}
        {currentView === "brief" && document && <LawyerBriefView document={document} />}
        {currentView === "qa" && document && <QAView document={document} />}

        {/* Fallback if view requires a document but none is loaded */}
        {currentView !== "home" && currentView !== "compare" && !document && (
          <div
            className="glass-card"
            style={{
              textAlign: "center",
              padding: "60px 24px",
              maxWidth: 540,
              margin: "40px auto",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--color-gold-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <FileText size={26} color="var(--color-gold)" />
            </div>
            <h3 style={{ marginBottom: 8, fontSize: "1.2rem" }}>No document uploaded</h3>
            <p style={{ marginBottom: 24, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Please upload or paste a legal document first, or try one of our instant sample agreements.
            </p>
            <button className="btn-primary" onClick={() => handleNavigate("home")}>
              Go to Home & Upload
            </button>
          </div>
        )}
      </main>

      <style>{`
        .desktop-sidebar-wrapper {
          display: block;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 40;
          overflow: visible;
        }

        .main-viewport {
          flex: 1;
          padding: 32px 40px;
          max-width: 1140px;
          margin: 0 auto;
          width: 100%;
          transition: padding 0.28s ease;
          min-width: 0;
        }

        .mobile-header {
          display: none;
        }

        .mobile-drawer-backdrop {
          display: none;
        }

        /* ─── Responsive Media Queries ─────────────────────────────────────────── */
        @media (max-width: 900px) {
          .desktop-sidebar-wrapper {
            display: none !important;
          }

          .mobile-header {
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            z-index: 60;
            background: rgba(17, 24, 39, 0.94);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid var(--color-border);
            padding: 0 16px;
            align-items: center;
            justify-content: space-between;
          }

          .mobile-menu-btn {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            padding: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .mobile-menu-btn:active {
            transform: scale(0.95);
            background: var(--color-surface-2);
          }

          .main-viewport {
            padding: 78px 16px 32px !important;
          }

          /* Mobile Drawer */
          .mobile-drawer-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 80;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s ease;
          }

          .mobile-drawer-backdrop.open {
            opacity: 1;
            pointer-events: auto;
          }

          .mobile-drawer-content {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 82%;
            max-width: 320px;
            background: var(--color-bg-2);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
            transform: translateX(-100%);
            transition: transform 0.28s cubic-bezier(0.33, 1, 0.68, 1);
          }

          .mobile-drawer-content.open {
            transform: translateX(0);
          }
        }

        @media (max-width: 600px) {
          .main-viewport {
            padding: 72px 12px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
