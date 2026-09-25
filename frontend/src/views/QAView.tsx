// QAView — chat with the document, grounded answers only
// Includes escalation detection for high-stakes situations
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Bot, User, Loader2 } from "lucide-react";
import { askQuestion } from "@/api/client";
import type { ParsedDocument, ChatMessage, QAResponse } from "@/types";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { EscalationBanner } from "@/components/EscalationBanner";
import ReactMarkdown from "react-markdown";

interface QAViewProps {
  document: ParsedDocument;
}

const EXAMPLE_QUESTIONS = [
  "What are my main obligations under this agreement?",
  "Are there any auto-renewal clauses?",
  "What happens if I terminate early?",
  "What fees or penalties are mentioned?",
  "Who is responsible for repairs / maintenance?",
];

export function QAView({ document: doc }: QAViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (question?: string) => {
    const q = (question || input).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = { role: "user", content: q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Build history for context
    const history = messages.slice(-6).reduce<Array<{ user: string; assistant: string }>>((acc, msg, i, arr) => {
      if (msg.role === "user" && arr[i + 1]?.role === "assistant") {
        acc.push({ user: msg.content, assistant: arr[i + 1].content });
      }
      return acc;
    }, []);

    try {
      const response: QAResponse = await askQuestion(doc.text, q, history);
      const content = response.escalation_triggered
        ? response.message || "Please seek professional help."
        : response.answer || "I could not find an answer in the document.";

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content,
        timestamp: new Date(),
        escalation: response.escalation_triggered,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // If escalation, also inject resources as a special message
      if (response.escalation_triggered && response.resources) {
        // Handled inline via escalation flag
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="qa-container" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ marginBottom: 6 }}>Ask Questions</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Ask anything about <strong>{doc.filename}</strong> — answers are grounded strictly in the document.
        </p>
      </div>

      <DisclaimerBanner compact />

      {/* Example questions */}
      {messages.length === 0 && (
        <div className="animate-fadein">
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginBottom: 10 }}>Try asking:</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                className="btn-ghost"
                style={{ background: "var(--color-surface)", fontSize: "0.8rem" }}
                onClick={() => send(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            gap: 12,
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            animationDelay: `${i * 0.02}s`,
          }} className="animate-fadein">
            {msg.role === "assistant" && (
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "var(--color-gold-dim)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bot size={16} color="var(--color-gold)" />
              </div>
            )}
            <div style={{
              maxWidth: "75%",
              padding: "12px 16px",
              borderRadius: msg.role === "user"
                ? "var(--radius-md) var(--radius-md) 4px var(--radius-md)"
                : "var(--radius-md) var(--radius-md) var(--radius-md) 4px",
              background: msg.role === "user" ? "var(--color-surface-2)" : "var(--color-bg-3)",
              border: "1px solid var(--color-border)",
              fontSize: "0.875rem",
              lineHeight: 1.7,
              color: "var(--color-text-muted)",
            }}>
              {msg.escalation ? (
                <EscalationBanner
                  message={msg.content}
                  resources={[
                    { name: "Legal Services Corporation (USA)", url: "https://www.lsc.gov/" },
                    { name: "LawHelp.org", url: "https://www.lawhelp.org/" },
                    { name: "ABA Lawyer Referral", url: "https://www.americanbar.org/groups/legal_services/flh-home/" },
                  ]}
                />
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "var(--color-surface-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <User size={16} color="var(--color-text-muted)" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }} className="animate-fadein">
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--color-gold-dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot size={16} color="var(--color-gold)" />
            </div>
            <div style={{
              padding: "12px 16px",
              background: "var(--color-bg-3)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              display: "flex", gap: 4, alignItems: "center",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-dim)", animation: "bounce 1s ease infinite" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-dim)", animation: "bounce 1s ease 0.15s infinite" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-dim)", animation: "bounce 1s ease 0.3s infinite" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10, paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
        <textarea
          className="input-field"
          placeholder="Ask a question about the document… (Enter to send, Shift+Enter for new line)"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          style={{ flex: 1, resize: "none" }}
        />
        <button
          className="btn-primary"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{ alignSelf: "flex-end", padding: "12px 16px" }}
        >
          {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .qa-container {
          height: calc(100vh - 100px);
        }
        @media (max-width: 900px) {
          .qa-container {
            height: calc(100vh - 150px);
          }
        }
        .markdown-content p { margin-bottom: 8px; }
        .markdown-content p:last-child { margin-bottom: 0; }
        .markdown-content ul, .markdown-content ol { padding-left: 20px; margin-bottom: 8px; }
        .markdown-content li { margin-bottom: 4px; }
        .markdown-content strong { color: var(--color-text); }
      `}</style>
    </div>
  );
}
