"use client";
import Editor from "@monaco-editor/react";

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
        <div
          style={{
            flex: 1,
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            overflow: "hidden",
            height: "100%",
          }}
        >
          <Editor
            height="100%"
            language="javascript"
            theme="vs-dark"
            value={preRequestScript}
            onChange={(value) => onChange({ preRequestScript: value || "" })}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12,
              fontFamily: "JetBrains Mono, monospace",
              automaticLayout: true,
              autoClosingBrackets: "always",
              tabSize: 2,
              wordWrap: "on",
              lineNumbers: "on",
            }}
          />
        </div>
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
        <div
          style={{
            flex: 1,
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            overflow: "hidden",
            height: "100%",
          }}
        >
          <Editor
            height="100%"
            language="javascript"
            theme="vs-dark"
            value={postRequestScript}
            onChange={(value) => onChange({ postRequestScript: value || "" })}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12,
              fontFamily: "JetBrains Mono, monospace",
              automaticLayout: true,
              autoClosingBrackets: "always",
              tabSize: 2,
              wordWrap: "on",
              lineNumbers: "on",
            }}
          />
        </div>
      </div>
    </div>
  );
}
