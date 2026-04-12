"use client";
import { useRef, useEffect } from "react";
import { Plus, Check, LayoutGrid } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { TeamWorkspace } from "@/types";

interface Props {
  anchorRect: DOMRect;
  onClose: () => void;
  onCreateWorkspace: () => void;
}

export default function WorkspaceSwitcher({
  anchorRect,
  onClose,
  onCreateWorkspace,
}: Props) {
  const {
    workspaces,
    workspace: activeWs,
    setActiveWorkspace,
    addWorkspace,
  } = useAppStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleSelect = (id: string) => {
    setActiveWorkspace(id);
    onClose();
  };

  const handleAdd = () => {
    onCreateWorkspace();
  };

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        zIndex: 10000,
        left: anchorRect.left,
        top: anchorRect.bottom + 8,
        width: 260,
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--text-muted)",
          letterSpacing: "0.05em",
        }}
      >
        YOUR WORKSPACES
      </div>

      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {workspaces.map((ws) => (
          <button
            key={ws.id}
            onClick={() => handleSelect(ws.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background:
                ws.id === activeWs.id ? "rgba(88,166,255,0.1)" : "none",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              textAlign: "left",
              color:
                ws.id === activeWs.id
                  ? "var(--accent-blue)"
                  : "var(--text-primary)",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background =
                ws.id === activeWs.id ? "rgba(88,166,255,0.1)" : "none")
            }
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "var(--bg-active)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {ws.name[0].toUpperCase()}
            </div>
            <span
              style={{
                flex: 1,
                fontSize: "13px",
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {ws.name}
            </span>
            {ws.id === activeWs.id && <Check size={14} />}
          </button>
        ))}
      </div>

      <div
        style={{ height: 1, background: "var(--border)", margin: "4px 0" }}
      />

      <button
        onClick={handleAdd}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          background: "none",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          textAlign: "left",
          color: "var(--text-primary)",
          fontSize: "13px",
          fontWeight: 500,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--bg-hover)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        <Plus size={16} style={{ color: "var(--accent-blue)" }} />
        Create New Workspace
      </button>
    </div>
  );
}
