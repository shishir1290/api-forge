"use client";
import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { KeyValuePair } from "@/types";

import VariableInput from "./VariableInput";

interface Props {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  showDescription?: boolean;
  extraVariables?: KeyValuePair[];
  readOnly?: boolean;
}

export default function KeyValueEditor({
  pairs,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  showDescription = false,
  extraVariables = [],
  readOnly = false,
}: Props) {
  const addRow = () => {
    onChange([
      ...pairs,
      { id: uuidv4(), key: "", value: "", enabled: true, description: "" },
    ]);
  };

  const removeRow = (id: string) => {
    onChange(pairs.filter((p) => p.id !== id));
  };

  const updateRow = (
    id: string,
    field: keyof KeyValuePair,
    value: string | boolean,
  ) => {
    onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const inputStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--text-primary)",
    width: "100%",
    padding: "6px 8px",
    fontSize: "12px",
    fontFamily: "JetBrains Mono, monospace",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {pairs.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: showDescription
              ? "32px 24px 1fr 1fr 1fr 32px"
              : "32px 24px 1fr 1fr 32px",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "4px 8px",
          }}
        >
          <span />
          <span />
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "11px",
              padding: "0 8px",
            }}
          >
            KEY
          </span>
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "11px",
              padding: "0 8px",
            }}
          >
            VALUE
          </span>
          {showDescription && (
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: "11px",
                padding: "0 8px",
              }}
            >
              DESCRIPTION
            </span>
          )}
          <span />
        </div>
      )}

      {pairs.map((pair) => (
        <div
          key={pair.id}
          style={{
            display: "grid",
            gridTemplateColumns: showDescription
              ? "32px 24px 60px 1fr 1fr 1fr 32px"
              : "32px 24px 60px 1fr 1fr 32px",
            borderBottom: "1px solid var(--border-subtle)",
            alignItems: "center",
            opacity: pair.enabled ? 1 : 0.4,
            pointerEvents: readOnly ? "none" : "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab",
              color: "var(--text-muted)",
            }}
          >
            <GripVertical size={12} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <input
              type="checkbox"
              checked={pair.enabled}
              onChange={(e) => updateRow(pair.id, "enabled", e.target.checked)}
              style={{ accentColor: "var(--accent-blue)", cursor: "pointer" }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderLeft: "1px solid var(--border-subtle)",
              padding: "0 8px",
            }}
          >
            <select
              value={pair.type || "text"}
              onChange={(e) =>
                updateRow(pair.id, "type", e.target.value as "text" | "file")
              }
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "10px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="text">Text</option>
              <option value="file">File</option>
            </select>
          </div>
          <VariableInput
            style={inputStyle}
            placeholder={keyPlaceholder}
            value={pair.key}
            onChange={(val) => updateRow(pair.id, "key", val)}
            extraVariables={extraVariables}
          />
          {pair.type === "file" ? (
            <div
              style={{
                ...inputStyle,
                borderLeft: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // In a real app, we might store the File object separately,
                    // but for now we'll store the filename in 'value'.
                    updateRow(pair.id, "value", file.name);
                    // TODO: Store the actual File object for the fetch call
                  }
                }}
                style={{ fontSize: "11px", color: "var(--text-muted)" }}
              />
            </div>
          ) : (
            <VariableInput
              style={{
                ...inputStyle,
                borderLeft: "1px solid var(--border-subtle)",
              }}
              placeholder={valuePlaceholder}
              value={pair.value}
              onChange={(val) => updateRow(pair.id, "value", val)}
              extraVariables={extraVariables}
            />
          )}
          {showDescription && (
            <input
              style={{
                ...inputStyle,
                borderLeft: "1px solid var(--border-subtle)",
              }}
              placeholder="Description"
              value={pair.description || ""}
              onChange={(e) =>
                updateRow(pair.id, "description", e.target.value)
              }
            />
          )}
          {!readOnly && (
            <button
              onClick={() => removeRow(pair.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent-red)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        <button
          onClick={addRow}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--accent-blue)",
            fontSize: "12px",
            fontFamily: "Inter, sans-serif",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Plus size={13} />
          Add Row
        </button>
      )}
    </div>
  );
}
