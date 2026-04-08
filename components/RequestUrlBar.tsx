"use client";
import { useState } from "react";
import { Send, ChevronDown, Save, Copy, Terminal } from "lucide-react";
import MethodBadge from "./MethodBadge";
import VariableInput from "./VariableInput";
import { HttpMethod, RequestConfig } from "@/types";
import { generateCurl } from "@/lib/curl-utils";

interface Props {
  request: RequestConfig;
  loading: boolean;
  onUpdate: (updates: Partial<RequestConfig>) => void;
  onSend: () => void;
  onSave: () => void;
}

const METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

export default function RequestUrlBar({
  request,
  loading,
  onUpdate,
  onSend,
  onSave,
}: Props) {
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCurl = () => {
    const curl = generateCurl(request);
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowOptions(false);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "12px 16px",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowMethodMenu(!showMethodMenu)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px",
            height: 38,
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            cursor: "pointer",
            minWidth: 100,
          }}
        >
          <MethodBadge method={request.method} />
          <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
        </button>

        {showMethodMenu && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 4,
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              boxShadow: "0 8px 16px rgba(0,0,0,0.4)",
              zIndex: 100,
              minWidth: 120,
              padding: 4,
            }}
          >
            {METHODS.map((m) => (
              <div
                key={m}
                onClick={() => {
                  onUpdate({ method: m });
                  setShowMethodMenu(false);
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderRadius: 4,
                  fontSize: "12px",
                  fontWeight: 600,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                <MethodBadge method={m} />
              </div>
            ))}
          </div>
        )}
      </div>

      <VariableInput
        value={request.url}
        onChange={(val) => onUpdate({ url: val })}
        placeholder="https://api.example.com/v1/resource"
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        style={{
          flex: 1,
          background: "var(--bg-active)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          color: "var(--text-primary)",
          fontSize: "13px",
          outline: "none",
          fontFamily: "JetBrains Mono, monospace",
          height: 38,
        }}
      />

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={onSend}
          disabled={loading || !request.url}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 16px",
            height: 38,
            background: "var(--accent-blue)",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: loading || !request.url ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "13px",
            opacity: loading || !request.url ? 0.6 : 1,
          }}
        >
          <Send size={14} />
          {loading ? "Sending..." : "Send"}
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowOptions(!showOptions)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              height: 38,
              background: "var(--bg-active)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
            title="More options"
          >
            <ChevronDown size={14} />
          </button>

          {showOptions && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 4,
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 8px 16px rgba(0,0,0,0.4)",
                zIndex: 100,
                minWidth: 160,
                padding: 4,
              }}
            >
              <div
                onClick={handleCopyCurl}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderRadius: 4,
                  fontSize: "12px",
                  color: copied
                    ? "var(--accent-green)"
                    : "var(--text-secondary)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                {copied ? <Copy size={14} /> : <Terminal size={14} />}
                {copied ? "Copied!" : "Copy as cURL"}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onSave}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            height: 38,
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            cursor: "pointer",
            color: "var(--text-secondary)",
          }}
          title="Save (Ctrl+S)"
        >
          <Save size={16} />
        </button>
      </div>
    </div>
  );
}
