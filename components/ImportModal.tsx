"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { importCollection } from "@/lib/collection-importer";
import type { Collection } from "@/types";

interface ImportModalProps {
  onImport: (collections: Collection[]) => void;
  onClose: () => void;
}

export default function ImportModal({ onImport, onClose }: ImportModalProps) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (text: string) => {
    setError(null);
    setSuccess(null);
    try {
      const json = JSON.parse(text);
      const collections = importCollection(json);

      if (collections.length === 0) {
        setError(
          "Invalid Collection format. Could not detect Postman or Hoppscotch structure.",
        );
        return;
      }

      onImport(collections);
      setSuccess(`Successfully imported ${collections.length} collection(s)!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e) {
      setError(
        "Invalid JSON format. Please check your file or paste contents.",
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handleImport(text);
    };
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          overflow: "hidden",
          animation: "modalFadeIn 0.2s ease-out",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-tertiary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Upload size={20} style={{ color: "var(--accent-blue)" }} />
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              Import Collections
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              display: "flex",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Info Alert */}
          <div
            style={{
              background: "rgba(88,166,255,0.1)",
              border: "1px solid rgba(88,166,255,0.2)",
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              gap: 12,
              color: "var(--accent-blue)",
              fontSize: "13px",
            }}
          >
            <Info size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Supported Formats:</strong> Postman (v2.1) and Hoppscotch
              JSON collections.
            </div>
          </div>

          {/* File Upload Area */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: 140,
              border: `2px dashed ${isDragging ? "var(--accent-blue)" : "var(--border)"}`,
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              cursor: "pointer",
              background: isDragging
                ? "rgba(88,166,255,0.05)"
                : "var(--bg-tertiary)",
              transition: "all 0.2s ease",
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: "none" }}
            />
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(88,166,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-blue)",
              }}
            >
              <FileJson size={24} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                Click or drag collection.json here
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Postman v2.1 or Hoppscotch format
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              OR PASTE JSON
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Text Area */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              placeholder="Paste your collection JSON here..."
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              style={{
                width: "100%",
                height: 180,
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 12,
                color: "var(--text-primary)",
                fontSize: "12px",
                fontFamily: "JetBrains Mono, monospace",
                resize: "none",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent-blue)")
              }
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {error && (
            <div
              style={{
                background: "rgba(248,81,73,0.1)",
                border: "1px solid rgba(248,81,73,0.2)",
                borderRadius: 8,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "var(--accent-red)",
                fontSize: "13px",
                animation: "shake 0.4s ease-in-out",
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: "rgba(63,185,80,0.1)",
                border: "1px solid rgba(63,185,80,0.2)",
                borderRadius: 8,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "var(--accent-green)",
                fontSize: "13px",
              }}
            >
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-tertiary)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "none",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => handleImport(jsonText)}
            disabled={!jsonText.trim()}
            style={{
              padding: "8px 24px",
              borderRadius: 6,
              border: "none",
              background: jsonText.trim()
                ? "var(--accent-blue)"
                : "var(--bg-active)",
              color: "white",
              fontSize: "13px",
              fontWeight: 600,
              cursor: jsonText.trim() ? "pointer" : "default",
              opacity: jsonText.trim() ? 1 : 0.5,
              transition: "all 0.2s ease",
            }}
          >
            Import JSON
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </div>
  );
}
