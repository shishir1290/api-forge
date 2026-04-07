"use client";

import { useState } from "react";
import { X, Plus, Trash2, Copy, Save, Shield, Settings2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Environment, EnvironmentVariable } from "@/types";

interface EnvironmentModalProps {
  environment: Environment | null;
  onClose: () => void;
}

export default function EnvironmentModal({
  environment,
  onClose,
}: EnvironmentModalProps) {
  const { updateEnvironment } = useAppStore();
  const [activeTab, setActiveTab] = useState<"variables" | "secrets">(
    "variables",
  );
  const [editedEnv, setEditedEnv] = useState<Environment>(
    environment || {
      id: "new",
      name: "",
      variables: [],
      secrets: [],
    },
  );

  if (!environment) return null;

  const handleSave = () => {
    updateEnvironment(environment.id, {
      name: editedEnv.name,
      variables: editedEnv.variables,
      secrets: editedEnv.secrets,
    });
    onClose();
  };

  const addVariable = () => {
    const newVar: EnvironmentVariable = {
      id: Math.random().toString(36).substring(2, 9),
      key: "",
      initialValue: "",
      currentValue: "",
      enabled: true,
    };
    if (activeTab === "variables") {
      setEditedEnv({
        ...editedEnv,
        variables: [...editedEnv.variables, newVar],
      });
    } else {
      setEditedEnv({ ...editedEnv, secrets: [...editedEnv.secrets, newVar] });
    }
  };

  const updateVar = (id: string, updates: Partial<EnvironmentVariable>) => {
    const target = activeTab === "variables" ? "variables" : "secrets";
    setEditedEnv({
      ...editedEnv,
      [target]: editedEnv[target].map((v) =>
        v.id === id ? { ...v, ...updates } : v,
      ),
    });
  };

  const deleteVar = (id: string) => {
    const target = activeTab === "variables" ? "variables" : "secrets";
    setEditedEnv({
      ...editedEnv,
      [target]: editedEnv[target].filter((v) => v.id !== id),
    });
  };

  const variables =
    activeTab === "variables" ? editedEnv.variables : editedEnv.secrets;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "85vh",
          animation: "modalFadeIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              margin: 0,
              color: "var(--text-primary)",
            }}
          >
            Edit Environment
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {/* Env Name */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Label
            </label>
            <input
              value={editedEnv.name}
              onChange={(e) =>
                setEditedEnv({ ...editedEnv, name: e.target.value })
              }
              style={{
                width: "100%",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "8px 12px",
                color: "var(--text-primary)",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 24,
              borderBottom: "1px solid var(--border)",
              marginBottom: 20,
            }}
          >
            <button
              onClick={() => setActiveTab("variables")}
              style={{
                padding: "8px 0",
                fontSize: 14,
                fontWeight: activeTab === "variables" ? 600 : 400,
                color:
                  activeTab === "variables"
                    ? "var(--accent-blue)"
                    : "var(--text-muted)",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "variables"
                    ? "2px solid var(--accent-blue)"
                    : "2px solid transparent",
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              Variables
            </button>
            <button
              onClick={() => setActiveTab("secrets")}
              style={{
                padding: "8px 0",
                fontSize: 14,
                fontWeight: activeTab === "secrets" ? 600 : 400,
                color:
                  activeTab === "secrets"
                    ? "var(--accent-blue)"
                    : "var(--text-muted)",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "secrets"
                    ? "2px solid var(--accent-blue)"
                    : "2px solid transparent",
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              Secrets
            </button>

            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <button
                onClick={addVariable}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Variables Table */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 40px",
                gap: 16,
                padding: "0 8px",
                color: "var(--text-muted)",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <span>Key</span>
              <span>Initial value</span>
              <span>Current value</span>
              <span></span>
            </div>

            {variables.length === 0 ? (
              <div
                style={{
                  padding: "40px 0",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 13,
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 8,
                  border: "1px dashed var(--border)",
                }}
              >
                No {activeTab} added yet. Click + to add one.
              </div>
            ) : (
              variables.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 40px",
                    gap: 16,
                    alignItems: "center",
                    padding: "4px 8px",
                  }}
                >
                  <input
                    value={v.key}
                    placeholder="New Variable"
                    onChange={(e) => updateVar(v.id, { key: e.target.value })}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontWeight: 500,
                      outline: "none",
                    }}
                  />
                  <div style={{ position: "relative" }}>
                    <input
                      type={activeTab === "secrets" ? "password" : "text"}
                      value={v.initialValue}
                      placeholder="Initial value"
                      onChange={(e) =>
                        updateVar(v.id, { initialValue: e.target.value })
                      }
                      style={{
                        width: "100%",
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 4,
                        padding: "6px 10px",
                        paddingRight: 30,
                        color: "var(--text-primary)",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                    <button
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={activeTab === "secrets" ? "password" : "text"}
                      value={v.currentValue}
                      placeholder="Current value"
                      onChange={(e) =>
                        updateVar(v.id, { currentValue: e.target.value })
                      }
                      style={{
                        width: "100%",
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 4,
                        padding: "6px 10px",
                        paddingRight: 30,
                        color: "var(--text-primary)",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                    <button
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => deleteVar(v.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 4,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            background: "var(--bg-tertiary)",
            borderRadius: "0 0 12px 12px",
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
            onClick={handleSave}
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
            <Save size={16} /> Save
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
