import { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "@/store/useAppStore";
import MethodBadge from "./MethodBadge";
import type { RequestConfig } from "@/types";

export default function TabBar() {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    openTab,
    requests,
    saveRequestById,
  } = useAppStore();

  const [confirmCloseTabId, setConfirmCloseTabId] = useState<string | null>(
    null,
  );

  const handleNewTab = () => {
    const request: RequestConfig = {
      id: uuidv4(),
      name: "New Request",
      method: "GET",
      url: "",
      headers: [],
      params: [],
      body: { type: "none", content: "", formData: [] },
      auth: { type: "none" },
    };
    openTab(request);
  };

  const pendingTab = tabs.find((t) => t.id === confirmCloseTabId);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--bg-secondary)",
        overflowX: "auto",
        flexShrink: 0,
        minHeight: 36,
      }}
    >
      {tabs.map((tab) => {
        const request = requests[tab.id];
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 10px",
              height: 36,
              cursor: "pointer",
              background: isActive ? "var(--bg-primary)" : "none",
              borderRight: "1px solid var(--border)",
              borderTop: isActive
                ? "2px solid var(--accent-blue)"
                : "2px solid transparent",
              flexShrink: 0,
              maxWidth: 200,
              userSelect: "none",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = "none";
            }}
          >
            {request && <MethodBadge method={request.method} small />}
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "12px",
                color: isActive
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
                maxWidth: 110,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {tab.name}
              {tab.isDirty && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--accent-blue)",
                    flexShrink: 0,
                  }}
                />
              )}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (tab.isDirty) {
                  setConfirmCloseTabId(tab.id);
                  setActiveTab(tab.id); // Switch to the tab to show what's being closed
                } else {
                  closeTab(tab.id);
                }
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 2,
                display: "flex",
                borderRadius: 3,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-active)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      <button
        onClick={handleNewTab}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-muted)";
        }}
      >
        <Plus size={14} />
      </button>

      {/* Custom Discard Modal */}
      {confirmCloseTabId && pendingTab && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setConfirmCloseTabId(null)}
        >
          <div
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              width: 400,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(88,166,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-blue)",
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={20} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    color: "var(--text-primary)",
                  }}
                >
                  Save changes?
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  The request <strong>{pendingTab.name}</strong> has unsaved
                  changes. Do you want to save them before closing?
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 8,
              }}
            >
              <button
                onClick={() => setConfirmCloseTabId(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  background: "none",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  closeTab(confirmCloseTabId);
                  setConfirmCloseTabId(null);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  background: "none",
                  border: "1px solid var(--border)",
                  color: "var(--accent-red)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,123,114,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                Don't Save
              </button>
              <button
                onClick={async () => {
                  const saved = await saveRequestById(confirmCloseTabId);
                  if (saved) {
                    closeTab(confirmCloseTabId);
                    setConfirmCloseTabId(null);
                  } else {
                    // It's a new request, we don't know where to save it
                    // The App would normally show the SaveModal here
                    // For now, close this modal and let the user click the actual Save button in Editor
                    alert("Please save this new request manually first.");
                    setConfirmCloseTabId(null);
                  }
                }}
                style={{
                  padding: "8px 20px",
                  borderRadius: 6,
                  background: "var(--accent-blue)",
                  border: "none",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.filter = "brightness(1.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.filter = "brightness(1.0)")
                }
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
