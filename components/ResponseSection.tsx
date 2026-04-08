"use client";
import { useState } from "react";
import ResponseViewer from "./ResponseViewer";
import { ResponseData } from "@/types";

interface Props {
  response: ResponseData | null;
  consoleLogs: string[];
}

export default function ResponseSection({ response, consoleLogs }: Props) {
  const [resTab, setResTab] = useState<"body" | "headers" | "console">("body");

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          padding: "0 16px",
        }}
      >
        {[
          { id: "body", label: "Response Body" },
          { id: "headers", label: "Headers" },
          { id: "console", label: `Console (${consoleLogs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setResTab(tab.id as any)}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${resTab === tab.id ? "var(--accent-blue)" : "transparent"}`,
              color:
                resTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {resTab === "body" && response && (
          <ResponseViewer
            content={response.body}
            contentType={response.headers["content-type"] || ""}
            isBinary={response.isBinary}
          />
        )}
        {resTab === "headers" && response && (
          <div style={{ padding: "16px" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <tbody>
                {Object.entries(response.headers).map(([k, v]) => (
                  <tr
                    key={k}
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    <td
                      style={{
                        padding: "8px 0",
                        color: "var(--text-muted)",
                        width: "30%",
                        fontWeight: 600,
                      }}
                    >
                      {k}
                    </td>
                    <td
                      style={{
                        padding: "8px 0",
                        color: "var(--text-primary)",
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {resTab === "console" && (
          <div
            style={{
              padding: "16px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "12px",
            }}
          >
            {consoleLogs.length === 0 ? (
              <div style={{ color: "var(--text-muted)" }}>
                No console output
              </div>
            ) : (
              consoleLogs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 4,
                    color: log.includes("Error")
                      ? "var(--accent-red)"
                      : "var(--text-secondary)",
                  }}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        )}
        {!response && resTab !== "console" && (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              fontSize: "13px",
            }}
          >
            Send a request to see the response
          </div>
        )}
      </div>
    </div>
  );
}
