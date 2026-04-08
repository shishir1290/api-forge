"use client";
import { useState } from "react";
import { X, Terminal, ArrowRight } from "lucide-react";
import { parseCurl } from "@/lib/curl-utils";
import { RequestConfig } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface Props {
  onClose: () => void;
  onImport: (request: RequestConfig) => void;
}

export default function ImportCurlModal({ onClose, onImport }: Props) {
  const [curl, setCurl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    if (!curl.trim()) return;
    try {
      const partial = parseCurl(curl);
      if (!partial.url) {
        throw new Error("Could not find URL in cURL command");
      }

      const request: RequestConfig = {
        id: uuidv4(),
        name: "Imported cURL",
        method: partial.method || "GET",
        url: partial.url,
        headers: partial.headers || [],
        params: partial.params || [],
        body: partial.body || { type: "none", content: "", formData: [] },
        auth: partial.auth || { type: "none" },
      };

      onImport(request);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to parse cURL command");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: 500,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-tertiary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Terminal size={18} color="var(--accent-blue)" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
              Import from cURL
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 4,
              display: "flex",
              borderRadius: 4,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            Paste a cURL command below. It should start with <code>curl</code>.
          </p>

          <textarea
            value={curl}
            onChange={(e) => {
              setCurl(e.target.value);
              setError(null);
            }}
            placeholder={
              'curl -X POST https://api.example.com -H "Content-Type: application/json" -d \'{"key": "value"}\''
            }
            style={{
              width: "100%",
              height: 180,
              background: "var(--bg-active)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 12,
              color: "var(--text-primary)",
              fontSize: "12px",
              fontFamily: "JetBrains Mono, monospace",
              outline: "none",
              resize: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) =>
              (e.currentTarget.style.borderColor = "var(--accent-blue)")
            }
            onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          />

          {error && (
            <div
              style={{
                marginTop: 12,
                fontSize: "12px",
                color: "var(--accent-red)",
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "16px 20px",
            background: "var(--bg-tertiary)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-secondary)",
              fontSize: "13px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!curl.trim()}
            style={{
              padding: "8px 20px",
              background: "var(--accent-blue)",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: "13px",
              fontWeight: 600,
              cursor: curl.trim() ? "pointer" : "not-allowed",
              opacity: curl.trim() ? 1 : 0.6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Import <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
