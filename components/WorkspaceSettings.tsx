"use client";
import { useState } from "react";
import { Settings, Save } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { TeamWorkspace, TeamRole } from "@/types";

interface Props {
  workspace: TeamWorkspace;
  userRole: TeamRole;
}

export default function WorkspaceSettings({ workspace, userRole }: Props) {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || "");
  const { updateWorkspace } = useAppStore();

  const canEdit = userRole === "owner" || userRole === "admin";
  const isDirty =
    name !== workspace.name || description !== (workspace.description || "");

  const handleSave = () => {
    updateWorkspace({ name, description });
  };

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <Settings size={18} style={{ color: "var(--text-muted)" }} />
        <h3
          style={{
            fontSize: "14px",
            fontWeight: 700,
            margin: 0,
            color: "var(--text-primary)",
          }}
        >
          Workspace Settings
        </h3>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            Workspace Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            style={{
              width: "100%",
              height: 38,
              background: "var(--bg-active)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "0 12px",
              color: "var(--text-primary)",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            Description (Optional)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            placeholder="What is this workspace for?"
            style={{
              width: "100%",
              height: 38,
              background: "var(--bg-active)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "0 12px",
              color: "var(--text-primary)",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
      </div>

      {canEdit && (
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}
        >
          <button
            onClick={handleSave}
            disabled={!isDirty || !name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 36,
              background:
                isDirty && name ? "var(--accent-blue)" : "var(--bg-active)",
              border: "none",
              borderRadius: 6,
              padding: "0 16px",
              cursor: isDirty && name ? "pointer" : "not-allowed",
              color: isDirty && name ? "white" : "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
