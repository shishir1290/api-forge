"use client";
import KeyValueEditor from "./KeyValueEditor";
import { KeyValuePair } from "@/types";

interface Props {
  params: KeyValuePair[];
  onChange: (params: KeyValuePair[]) => void;
}

export default function ParamsTab({ params, onChange }: Props) {
  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div style={{ padding: "12px 16px" }}>
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "11px",
            fontWeight: 600,
            marginBottom: 10,
            letterSpacing: "0.05em",
          }}
        >
          QUERY PARAMETERS
        </div>
        <KeyValueEditor
          pairs={params}
          onChange={onChange}
          keyPlaceholder="Parameter"
          valuePlaceholder="Value"
        />
      </div>
    </div>
  );
}
