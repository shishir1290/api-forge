"use client";

import { useState } from "react";
import {
  X,
  Download,
  FileJson,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { exportToPostman, exportToHoppscotch } from "@/lib/collection-exporter";
import type { Collection } from "@/types";

interface ExportModalProps {
  collection: Collection;
  onClose: () => void;
}

type ExportFormat = "postman" | "hoppscotch";

export default function ExportModal({ collection, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("postman");
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const data =
        format === "postman"
          ? exportToPostman(collection)
          : exportToHoppscotch(collection);

      const fileName = `${collection.name.replace(/\s+/g, "_")}_${format}.json`;
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
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
          maxWidth: 450,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
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
            <Download size={18} style={{ color: "var(--accent-blue)" }} />
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              Export Collection
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
          >
            <X size={18} />
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              Collection
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              <FileJson size={16} style={{ color: "var(--accent-yellow)" }} />
              <span
                style={{
                  fontSize: 14,
                  color: "var(--text-primary)",
                  fontWeight: 500,
                }}
              >
                {collection.name}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              Choose Format
            </span>

            <div
              onClick={() => setFormat("postman")}
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid",
                borderColor:
                  format === "postman" ? "var(--accent-blue)" : "var(--border)",
                background:
                  format === "postman"
                    ? "rgba(88,166,255,0.05)"
                    : "var(--bg-tertiary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: "#FF6C37",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  P
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    Postman
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    v2.1 Collection format
                  </div>
                </div>
              </div>
              {format === "postman" && (
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "var(--accent-blue)",
                    border: "3px solid var(--bg-secondary)",
                  }}
                />
              )}
            </div>

            <div
              onClick={() => setFormat("hoppscotch")}
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid",
                borderColor:
                  format === "hoppscotch"
                    ? "var(--accent-blue)"
                    : "var(--border)",
                background:
                  format === "hoppscotch"
                    ? "rgba(88,166,255,0.05)"
                    : "var(--bg-tertiary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: "#3fb950",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  H
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    Hoppscotch
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Hoppscotch JSON format
                  </div>
                </div>
              </div>
              {format === "hoppscotch" && (
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "var(--accent-blue)",
                    border: "3px solid var(--bg-secondary)",
                  }}
                />
              )}
            </div>
          </div>

          {success && (
            <div
              style={{
                background: "rgba(63,185,80,0.1)",
                border: "1px solid rgba(63,185,80,0.2)",
                borderRadius: 8,
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "var(--accent-green)",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <CheckCircle2 size={18} />
              Export Successful!
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
            onClick={handleExport}
            disabled={isExporting || success}
            style={{
              padding: "8px 24px",
              borderRadius: 6,
              border: "none",
              background: "var(--accent-blue)",
              color: "white",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isExporting ? (
              "Exporting..."
            ) : (
              <>
                <Download size={16} /> Export
              </>
            )}
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
      `}</style>
    </div>
  );
}
