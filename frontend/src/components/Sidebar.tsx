// LegalLens — Collapsible Desktop Sidebar & Mobile-Ready Navigation
import { useState, useEffect } from "react";
import {
  Scale,
  FileText,
  GitCompare,
  CheckSquare,
  Briefcase,
  MessageCircle,
  Zap,
  Home,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileCheck2,
} from "lucide-react";
import type { AppView, ParsedDocument } from "@/types";

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  hasDocument: boolean;
  activeDocument?: ParsedDocument | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

const navItems: Array<{
  view: AppView;
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  requiresDoc: boolean;
  badge?: string;
}> = [
  { view: "home", label: "Home", icon: Home, requiresDoc: false },
  { view: "simplify", label: "Simplify", icon: FileText, requiresDoc: true },
  { view: "highlight", label: "Clause Highlights", icon: Zap, requiresDoc: true },
  { view: "compare", label: "Compare Docs", icon: GitCompare, requiresDoc: false },
  { view: "actionable", label: "Action Checklist", icon: CheckSquare, requiresDoc: true },
  { view: "brief", label: "Lawyer Brief", icon: Briefcase, requiresDoc: true },
  { view: "qa", label: "Ask Questions", icon: MessageCircle, requiresDoc: true },
];

export function Sidebar({
  currentView,
  onNavigate,
  hasDocument,
  activeDocument,
  isCollapsed = false,
  onToggleCollapse,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sidebarWidth = isMobileDrawer ? "100%" : isCollapsed ? 72 : 256;

  return (
    <aside
      className={`sidebar-root ${isCollapsed && !isMobileDrawer ? "collapsed" : "expanded"} ${
        isMobileDrawer ? "mobile-drawer" : ""
      }`}
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
        background: "var(--color-bg-2)",
        borderRight: isMobileDrawer ? "none" : "1px solid var(--color-border)",
        padding: isCollapsed && !isMobileDrawer ? "20px 10px" : "22px 14px",
        display: "flex",
        flexDirection: "column",
        height: isMobileDrawer ? "100%" : "100vh",
        position: isMobileDrawer ? "relative" : "sticky",
        top: 0,
        zIndex: isMobileDrawer ? 100 : 30,
        transition: "width 0.28s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.28s cubic-bezier(0.4, 0, 0.2, 1), padding 0.28s ease",
        boxSizing: "border-box",
        overflow: "visible",
      }}
    >
      {/* Desktop Collapse Arrow Button — on right edge */}
      {!isMobileDrawer && onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar towards right" : "Collapse sidebar towards left"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            position: "absolute",
            right: -14,
            top: 24,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--color-bg-3)",
            border: "2px solid var(--color-gold)",
            color: "var(--color-gold-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 50,
            boxShadow: "0 2px 12px rgba(0,0,0,0.6), 0 0 10px rgba(232, 184, 75, 0.35)",
            transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s, box-shadow 0.2s",
          }}
          className="sidebar-collapse-btn"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.15)";
            e.currentTarget.style.background = "var(--color-surface-2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.background = "var(--color-bg-3)";
          }}
        >
          {isCollapsed ? <ChevronRight size={15} strokeWidth={2.8} /> : <ChevronLeft size={15} strokeWidth={2.8} />}
        </button>
      )}

      {/* Brand Header */}
      <div
        style={{
          marginBottom: 24,
          padding: isCollapsed && !isMobileDrawer ? "0 4px" : "0 8px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          justifyContent: isCollapsed && !isMobileDrawer ? "center" : "flex-start",
          cursor: "pointer",
        }}
        onClick={() => {
          onNavigate("home");
          if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            minWidth: 38,
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--color-gold) 0%, #d4a634 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(232, 184, 75, 0.25)",
            flexShrink: 0,
          }}
        >
          <Scale size={20} color="#0b0f1a" strokeWidth={2.2} />
        </div>

        {(!isCollapsed || isMobileDrawer) && (
          <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
            <span className="gradient-text font-display" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
              LegalLens
            </span>
            <p style={{ color: "var(--color-text-dim)", fontSize: "0.68rem", fontWeight: 500, marginTop: -2 }}>
              Plain English Legal Assistant
            </p>
          </div>
        )}
      </div>

      {/* Active Document Status Card (when expanded) */}
      {(!isCollapsed || isMobileDrawer) && hasDocument && activeDocument && (
        <div
          style={{
            marginBottom: 18,
            padding: "10px 12px",
            background: "rgba(79, 156, 249, 0.08)",
            border: "1px solid rgba(79, 156, 249, 0.2)",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FileCheck2 size={16} color="var(--color-blue)" style={{ flexShrink: 0 }} />
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text)" }}>
              {activeDocument.filename}
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)" }}>
              {activeDocument.word_count.toLocaleString()} words loaded
            </div>
          </div>
        </div>
      )}

      {/* Navigation list */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        {navItems.map(({ view, label, icon: Icon, requiresDoc }) => {
          const disabled = requiresDoc && !hasDocument;
          const isActive = currentView === view;

          return (
            <button
              key={view}
              type="button"
              onClick={() => {
                if (!disabled) {
                  onNavigate(view);
                  if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
                }
              }}
              disabled={disabled}
              aria-current={isActive ? "page" : undefined}
              title={disabled ? `${label} (Upload document first)` : label}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed && !isMobileDrawer ? "center" : "flex-start",
                gap: 12,
                padding: isCollapsed && !isMobileDrawer ? "12px 0" : "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: isActive ? "var(--color-surface-2)" : "transparent",
                color: disabled
                  ? "var(--color-text-dim)"
                  : isActive
                  ? "var(--color-gold-light)"
                  : "var(--color-text-muted)",
                cursor: disabled ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 400,
                fontFamily: "inherit",
                textAlign: "left",
                transition: "all 0.16s ease",
                borderLeft:
                  !isCollapsed || isMobileDrawer
                    ? isActive
                      ? "3px solid var(--color-gold)"
                      : "3px solid transparent"
                    : "none",
                opacity: disabled ? 0.45 : 1,
                position: "relative",
              }}
              className={`nav-button ${isActive ? "active" : ""}`}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  color: isActive ? "var(--color-gold)" : "inherit",
                }}
              >
                <Icon size={18} />
              </div>

              {(!isCollapsed || isMobileDrawer) && (
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {label}
                </span>
              )}

              {/* Collapsed active dot indicator */}
              {isCollapsed && !isMobileDrawer && isActive && (
                <div
                  style={{
                    position: "absolute",
                    right: 4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 4,
                    height: 16,
                    borderRadius: 2,
                    background: "var(--color-gold)",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Disclaimer */}
      {(!isCollapsed || isMobileDrawer) ? (
        <div
          style={{
            marginTop: "auto",
            padding: "10px 12px",
            background: "rgba(232, 184, 75, 0.06)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(232, 184, 75, 0.14)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Shield size={13} color="var(--color-gold)" />
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--color-gold)" }}>
              Safety First
            </span>
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.68rem", lineHeight: 1.45 }}>
            Informational assistance only. Not legal advice.
          </p>
        </div>
      ) : (
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "center",
            padding: "8px 0",
          }}
          title="LegalLens provides informational assistance only, not formal legal advice."
        >
          <Shield size={16} color="var(--color-gold)" opacity={0.7} />
        </div>
      )}
    </aside>
  );
}
