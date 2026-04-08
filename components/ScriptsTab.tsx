"use client";

interface Props {
  preRequestScript: string;
  postRequestScript: string;
  onChange: (updates: {
    preRequestScript?: string;
    postRequestScript?: string;
  }) => void;
}

export default function ScriptsTab({
  preRequestScript,
  postRequestScript,
  onChange,
}: Props) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          flex: 1,
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "11px",
            fontWeight: 600,
            marginBottom: 8,
            letterSpacing: "0.05em",
          }}
        >
          PRE-REQUEST SCRIPT
        </div>
        <textarea
          value={preRequestScript}
          onChange={(e) => onChange({ preRequestScript: e.target.value })}
          placeholder="// This script runs before the request is sent"
          style={{
            width: "100%",
            flex: 1,
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "10px",
            color: "var(--text-primary)",
            fontSize: "12px",
            outline: "none",
            resize: "none",
            fontFamily: "JetBrains Mono, monospace",
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "11px",
            fontWeight: 600,
            marginBottom: 8,
            letterSpacing: "0.05em",
          }}
        >
          POST-REQUEST SCRIPT
        </div>
        <textarea
          value={postRequestScript}
          onChange={(e) => onChange({ postRequestScript: e.target.value })}
          placeholder="// This script runs after the response is received"
          style={{
            width: "100%",
            flex: 1,
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "10px",
            color: "var(--text-primary)",
            fontSize: "12px",
            outline: "none",
            resize: "none",
            fontFamily: "JetBrains Mono, monospace",
          }}
        />
      </div>
    </div>
  );
}
