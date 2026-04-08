"use client";
import { Globe, MoreHorizontal, Check, Edit2, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";
import { SidebarContextMenu, CtxMenu } from "./SidebarUtils";
import { Environment } from "@/types";

interface Props {
  onEdit: (env: Environment) => void;
}

export default function EnvironmentPanel({ onEdit }: Props) {
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
    deleteEnvironment,
  } = useAppStore();
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  const handleCtx = (e: React.MouseEvent, env: Environment) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: "Edit",
          icon: <Edit2 size={13} />,
          onClick: () => onEdit(env),
        },
        { label: "Duplicate", icon: <Globe size={13} />, onClick: () => {} }, // TODO
        {
          label: "Delete",
          icon: <Trash2 size={13} />,
          danger: true,
          onClick: () => deleteEnvironment(env.id),
        },
      ],
    });
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
      {/* Global Environment (Always exists or should exist) */}

      {environments.map((env) => (
        <div
          key={env.id}
          onClick={() => setActiveEnvironment(env.id)}
          onContextMenu={(e) => handleCtx(e, env)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            cursor: "pointer",
            background:
              activeEnvironmentId === env.id ? "rgba(88,166,255,0.1)" : "none",
            borderRadius: 6,
            margin: "1px 8px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (activeEnvironmentId !== env.id)
              e.currentTarget.style.background = "var(--bg-hover)";
          }}
          onMouseLeave={(e) => {
            if (activeEnvironmentId !== env.id)
              e.currentTarget.style.background = "none";
          }}
        >
          <div
            style={{
              color:
                activeEnvironmentId === env.id
                  ? "var(--accent-green)"
                  : "var(--text-muted)",
              display: "flex",
            }}
          >
            {activeEnvironmentId === env.id ? (
              <Check size={14} />
            ) : (
              <Globe size={14} />
            )}
          </div>

          <span
            style={{
              flex: 1,
              fontSize: "13px",
              fontWeight: 500,
              color:
                activeEnvironmentId === env.id
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {env.name}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCtx(e as any, env);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 2,
              display: "flex",
              opacity: 0.6,
            }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      ))}

      {environments.length === 0 && (
        <div
          style={{
            padding: 20,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "12px",
          }}
        >
          No environments created.
        </div>
      )}

      {ctxMenu && (
        <SidebarContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} />
      )}
    </div>
  );
}
