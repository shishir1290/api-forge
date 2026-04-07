import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Shield,
  Layout,
  Variable,
  Info,
  CheckCircle,
  Database,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type {
  Collection,
  CollectionFolder,
  RequestAuth,
  KeyValuePair,
} from "@/types";
import VariableInput from "./VariableInput";
import KeyValueEditor from "./KeyValueEditor";

interface FolderPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  folderId?: string; // If undefined, it's the collection itself
}

type Tab = "auth" | "headers" | "variables" | "details";

export default function FolderPropertiesModal({
  isOpen,
  onClose,
  collectionId,
  folderId,
}: FolderPropertiesModalProps) {
  const { collections, updateCollection, updateFolderInFolderTree } =
    useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>("auth");

  // Find the target object (collection or folder)
  const collection = collections.find((c) => c.id === collectionId);

  const findFolder = (
    folders: CollectionFolder[],
    id: string,
  ): CollectionFolder | undefined => {
    for (const f of folders) {
      if (f.id === id) return f;
      const found = findFolder(f.folders, id);
      if (found) return found;
    }
    return undefined;
  };

  const target =
    folderId && collection
      ? findFolder(collection.folders, folderId)
      : collection;

  // Local state for editing
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [auth, setAuth] = useState<RequestAuth>({ type: "inherit" });
  const [headers, setHeaders] = useState<KeyValuePair[]>([]);
  const [variables, setVariables] = useState<KeyValuePair[]>([]);

  useEffect(() => {
    if (target && isOpen) {
      setName(target.name || "");
      setDescription(target.description || "");
      setAuth(target.auth || { type: "inherit" });
      setHeaders(target.headers || []);
      setVariables(target.variables || []);
    }
  }, [target, isOpen]);

  if (!isOpen || !target) return null;

  const handleSave = () => {
    const updates = {
      name,
      description,
      auth,
      headers,
      variables,
    };

    if (folderId) {
      updateFolderInFolderTree(collectionId, folderId, updates);
    } else {
      updateCollection(collectionId, updates);
    }
    onClose();
  };

  const tabBtn = (id: Tab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        background: activeTab === id ? "var(--bg-active)" : "none",
        border: "none",
        borderBottom: `2px solid ${activeTab === id ? "var(--accent-blue)" : "transparent"}`,
        color: activeTab === id ? "var(--text-primary)" : "var(--text-muted)",
        cursor: "pointer",
        fontSize: "13px",
        height: "100%",
        transition: "all 0.2s",
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 750,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          maxHeight: "85vh",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Database size={18} style={{ color: "var(--accent-blue)" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
              {folderId ? "Folder Properties" : "Collection Properties"}:{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                {target.name}
              </span>
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
              borderRadius: 4,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            padding: "0 10px",
            background: "var(--bg-tertiary)",
          }}
        >
          {tabBtn("auth", <Shield size={14} />, "Authorization")}
          {tabBtn("headers", <Layout size={14} />, "Headers")}
          {tabBtn("variables", <Variable size={14} />, "Variables")}
          {tabBtn("details", <Info size={14} />, "Details")}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {activeTab === "auth" && (
            <div className="fade-in">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    width: 140,
                  }}
                >
                  Authorization Type
                </label>
                <select
                  value={auth.type}
                  onChange={(e) =>
                    setAuth({ ...auth, type: e.target.value as any })
                  }
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "8px 12px",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    flex: 1,
                    outline: "none",
                  }}
                >
                  <option value="inherit">Inherit from parent</option>
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="api-key">API Key</option>
                </select>
              </div>

              {auth.type === "inherit" && (
                <div
                  style={{
                    padding: 16,
                    background: "rgba(88,166,255,0.05)",
                    border: "1px solid rgba(88,166,255,0.2)",
                    borderRadius: 8,
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <Info
                    size={16}
                    style={{
                      color: "var(--accent-blue)",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <div>
                    This {folderId ? "folder" : "collection"} will inherit
                    authorization from its parent. If it's at the top level, it
                    will inherit from the global settings if available.
                  </div>
                </div>
              )}

              {auth.type === "bearer" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                    <label
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        width: 140,
                        marginTop: 8,
                      }}
                    >
                      Token
                    </label>
                    <div style={{ flex: 1 }}>
                      <VariableInput
                        value={auth.bearerToken || ""}
                        onChange={(val) =>
                          setAuth({ ...auth, bearerToken: val })
                        }
                        placeholder="Enter bearer token"
                        style={{
                          background: "var(--bg-tertiary)",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          minHeight: 40,
                        }}
                      />
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          marginTop: 8,
                        }}
                      >
                        The authorization header will be automatically generated
                        when you send the request.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {auth.type !== "inherit" && (
                <div
                  style={{
                    marginTop: 32,
                    padding: 16,
                    background: "rgba(255,166,87,0.05)",
                    border: "1px solid rgba(255,166,87,0.2)",
                    borderRadius: 8,
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <CheckCircle
                    size={16}
                    style={{
                      color: "var(--accent-yellow)",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <div>
                    This authorization will be set for every request in this
                    collection.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "headers" && (
            <div className="fade-in">
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: 16,
                }}
              >
                Common headers applied to all requests in this{" "}
                {folderId ? "folder" : "collection"}.
              </p>
              <KeyValueEditor
                pairs={headers}
                onChange={setHeaders}
                keyPlaceholder="Header Name"
                valuePlaceholder="Value"
              />
            </div>
          )}

          {activeTab === "variables" && (
            <div className="fade-in">
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: 16,
                }}
              >
                Collection-level variables. Use them with{" "}
                <code>{"<<variable_name>>"}</code> syntax.
              </p>
              <KeyValueEditor
                pairs={variables}
                onChange={setVariables}
                keyPlaceholder="Variable Name"
                valuePlaceholder="Value"
              />
            </div>
          )}

          {activeTab === "details" && (
            <div
              className="fade-in"
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    marginBottom: 8,
                  }}
                >
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "10px 12px",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    marginBottom: 8,
                  }}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a description for this collection..."
                  style={{
                    width: "100%",
                    height: 120,
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "10px 12px",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            background: "var(--bg-tertiary)",
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontSize: "13px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 24px",
              background: "var(--accent-blue)",
              border: "none",
              borderRadius: 6,
              color: "white",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
