"use client";
import KeyValueEditor from "./KeyValueEditor";
import { KeyValuePair } from "@/types";

interface Props {
  headers: KeyValuePair[];
  inheritedHeaders: KeyValuePair[];
  onChange: (headers: KeyValuePair[]) => void;
}

export default function HeadersTab({
  headers,
  inheritedHeaders,
  onChange,
}: Props) {
  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div style={{ padding: "12px 16px" }}>
        {inheritedHeaders.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "11px",
                fontWeight: 600,
                marginBottom: 10,
                letterSpacing: "0.05em",
              }}
            >
              INHERITED HEADERS
            </div>
            <KeyValueEditor
              pairs={inheritedHeaders}
              onChange={() => {}}
              readOnly
              keyPlaceholder="Header"
              valuePlaceholder="Value"
            />
          </div>
        )}
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "11px",
            fontWeight: 600,
            marginBottom: 10,
            letterSpacing: "0.05em",
          }}
        >
          HEADERS
        </div>
        <KeyValueEditor
          pairs={headers}
          onChange={onChange}
          keyPlaceholder="Header"
          valuePlaceholder="Value"
        />
      </div>
    </div>
  );
}
