"use client";
import { useState, useEffect } from "react";
import KeyValueEditor from "./KeyValueEditor";
import { RequestConfig, KeyValuePair } from "@/types";

interface Props {
  body: RequestConfig["body"];
  onChange: (updates: Partial<RequestConfig["body"]>) => void;
}

export default function BodyTab({ body, onChange }: Props) {
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (body.type === "json") {
      try {
        JSON.parse(body.content);
        setJsonError(null);
      } catch (e) {
        setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      }
    }
  }, [body.content, body.type]);

  const prettifyJson = () => {
    try {
      const parsed = JSON.parse(body.content);
      onChange({ content: JSON.stringify(parsed, null, 2) });
    } catch (e) {}
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          gap: 12,
        }}
      >
        {["none", "json", "form-data", "x-www-form-urlencoded", "raw"].map(
          (t) => (
            <label
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "12px",
                cursor: "pointer",
                color:
                  body.type === t ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              <input
                type="radio"
                checked={body.type === t}
                onChange={() => onChange({ type: t as any })}
                style={{ cursor: "pointer" }}
              />
              {t}
            </label>
          ),
        )}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {body.type === "json" || body.type === "raw" ? (
          <div style={{ position: "relative", height: "100%" }}>
            <textarea
              value={body.content}
              onChange={(e) => onChange({ content: e.target.value })}
              style={{
                width: "100%",
                height: "100%",
                background: "none",
                border: "none",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontFamily: "JetBrains Mono, monospace",
                outline: "none",
                resize: "none",
              }}
              placeholder={
                body.type === "json"
                  ? '{ "key": "value" }'
                  : "Request body content..."
              }
            />
            {body.type === "json" && (
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {jsonError && (
                  <span
                    style={{ color: "var(--accent-red)", fontSize: "11px" }}
                  >
                    {jsonError}
                  </span>
                )}
                <button
                  onClick={prettifyJson}
                  style={{
                    background: "var(--bg-active)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "4px 8px",
                    fontSize: "11px",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                  }}
                >
                  Prettify
                </button>
              </div>
            )}
          </div>
        ) : body.type === "form-data" ||
          body.type === "x-www-form-urlencoded" ? (
          <KeyValueEditor
            pairs={body.formData}
            onChange={(formData) => onChange({ formData })}
            keyPlaceholder="Key"
            valuePlaceholder="Value"
          />
        ) : (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              padding: 40,
              fontSize: "13px",
            }}
          >
            This request does not have a body.
          </div>
        )}
      </div>
    </div>
  );
}
