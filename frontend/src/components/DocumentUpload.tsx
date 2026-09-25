// DocumentUpload — drag-and-drop + paste input for document ingestion
// Supports PDF, DOCX, TXT. Max file size enforced client-side before upload.
// Also includes 1-click sample document loaders for instant testing.

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, ClipboardPaste, X, Loader2, CheckCircle, Sparkles } from "lucide-react";
import { uploadDocument, pasteDocument } from "@/api/client";
import { SAMPLE_DOCUMENTS } from "@/api/mockData";
import type { ParsedDocument } from "@/types";

interface DocumentUploadProps {
  onDocumentParsed: (doc: ParsedDocument) => void;
  label?: string;
}

export function DocumentUpload({ onDocumentParsed, label = "Upload your document" }: DocumentUploadProps) {
  const [mode, setMode] = useState<"drop" | "paste">("drop");
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ParsedDocument | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const doc = await uploadDocument(file);
      setSuccess(doc);
      onDocumentParsed(doc);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Upload failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [onDocumentParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
    onDropAccepted: ([f]) => handleFile(f),
    onDropRejected: ([r]) => {
      setError(r.errors[0]?.message || "File not accepted.");
    },
  });

  const handlePaste = async () => {
    if (!pasteText.trim()) {
      setError("Please paste some text first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const doc = await pasteDocument(pasteText);
      setSuccess(doc);
      onDocumentParsed(doc);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Processing failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = async (key: keyof typeof SAMPLE_DOCUMENTS) => {
    const sample = SAMPLE_DOCUMENTS[key];
    setPasteText(sample.text);
    setMode("paste");
    setError(null);
    setLoading(true);
    try {
      const doc = await pasteDocument(sample.text, sample.filename);
      setSuccess(doc);
      onDocumentParsed(doc);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Processing failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(74, 222, 128, 0.15)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <CheckCircle size={20} color="#4ade80" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{success.filename}</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
              {success.word_count.toLocaleString()} words · {(success.char_count / 1000).toFixed(1)}k characters
            </div>
          </div>
          <button
            className="btn-ghost"
            style={{ marginLeft: "auto" }}
            onClick={() => { setSuccess(null); setError(null); setPasteText(""); }}
          >
            <X size={14} /> Replace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Sample presets bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 16,
        padding: "10px 14px",
        background: "rgba(232, 184, 75, 0.08)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid rgba(232, 184, 75, 0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--color-gold)", fontWeight: 600 }}>
          <Sparkles size={14} /> Try a sample:
        </div>
        <button
          type="button"
          onClick={() => loadSample("lease")}
          className="btn-ghost"
          style={{ padding: "4px 10px", fontSize: "0.8rem", height: "auto" }}
        >
          🏠 Residential Lease
        </button>
        <button
          type="button"
          onClick={() => loadSample("nda")}
          className="btn-ghost"
          style={{ padding: "4px 10px", fontSize: "0.8rem", height: "auto" }}
        >
          🤝 Mutual NDA
        </button>
        <button
          type="button"
          onClick={() => loadSample("employment")}
          className="btn-ghost"
          style={{ padding: "4px 10px", fontSize: "0.8rem", height: "auto" }}
        >
          💼 Employment Agreement
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <p style={{ color: "var(--color-text-muted)", fontWeight: 600, marginBottom: 12, fontSize: "0.875rem" }}>
          {label}
        </p>
        <div className="tab-list" style={{ maxWidth: 320 }}>
          <button
            className={`tab-trigger ${mode === "drop" ? "active" : ""}`}
            onClick={() => setMode("drop")}
          >
            <Upload size={14} style={{ display: "inline", marginRight: 6 }} />
            Upload File
          </button>
          <button
            className={`tab-trigger ${mode === "paste" ? "active" : ""}`}
            onClick={() => setMode("paste")}
          >
            <ClipboardPaste size={14} style={{ display: "inline", marginRight: 6 }} />
            Paste Text
          </button>
        </div>
      </div>

      {mode === "drop" ? (
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? "active" : ""}`}
        >
          <input {...getInputProps()} />
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Loader2 size={36} color="var(--color-gold)" className="spin" style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ color: "var(--color-text-muted)" }}>Parsing document…</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "var(--color-gold-dim)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FileText size={28} color="var(--color-gold)" />
              </div>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>
                  {isDragActive ? "Drop it here!" : "Drop your document here"}
                </p>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                  PDF, DOCX, or TXT · up to 20 MB
                </p>
              </div>
              <button type="button" className="btn-secondary" style={{ pointerEvents: "none" }}>Browse files</button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <textarea
            className="input-field"
            placeholder="Paste the full text of your legal document here…"
            rows={10}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            disabled={loading}
          />
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="button" className="btn-primary" onClick={handlePaste} disabled={loading || !pasteText.trim()}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ClipboardPaste size={16} />}
              {loading ? "Processing…" : "Analyze Text"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setPasteText("")} disabled={!pasteText}>
              <X size={14} /> Clear
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 12, padding: "10px 14px",
          background: "var(--color-important-bg)",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: "var(--radius-sm)",
          color: "var(--color-important)",
          fontSize: "0.875rem",
        }}>
          {error}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
