"use client";
import { useState, useMemo } from "react";
import { Search, Plus, FolderPlus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import SidebarTabs from "./SidebarTabs";
import SidebarProfile from "./SidebarProfile";
import SidebarTreeView from "./SidebarTreeView";
import FolderPropertiesModal from "./FolderPropertiesModal";
import EnvironmentModal from "./EnvironmentModal";
import ImportModal from "./ImportModal";
import ExportModal from "./ExportModal";

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<
    "collections" | "history" | "environments" | "team"
  >("collections");
  const [search, setSearch] = useState("");
  const { collections, workspace, openTab, addCollection } = useAppStore();
  const [showProperties, setShowProperties] = useState<{
    cid: string;
    fid?: string;
  } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState<any>(null);

  const filteredCollections = useMemo(() => {
    if (!search) return collections;
    return collections.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [collections, search]);

  const canEdit = workspace.members.some((m) =>
    ["owner", "admin", "editor"].includes(m.role),
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: 320,
        borderRight: "1px solid var(--border)",
        background: "var(--bg-secondary)",
      }}
    >
      <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div
          style={{
            padding: "16px 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collections..."
              style={{
                width: "100%",
                height: 32,
                background: "var(--bg-active)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                paddingLeft: 32,
                paddingRight: 10,
                fontSize: "12px",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.02em",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>
                {workspace.name}
              </span>
              <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                &gt;
              </span>
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => addCollection("New Collection")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                }}
                title="New collection"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => setShowImport(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                }}
                title="Import"
              >
                <FolderPlus size={14} />
              </button>
            </div>
          </div>
        </div>

        <SidebarTreeView
          activeTab={activeTab}
          filteredCollections={filteredCollections}
          openTab={openTab}
          onExport={setShowExport}
          onOpenProperties={(cid, fid) => setShowProperties({ cid, fid })}
          canEdit={canEdit}
        />

        <SidebarProfile />
      </div>

      {showProperties && (
        <FolderPropertiesModal
          isOpen={true}
          collectionId={showProperties.cid}
          folderId={showProperties.fid}
          onClose={() => setShowProperties(null)}
        />
      )}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={(newCols) => {
            const { importCollectionsToBackend } = useAppStore.getState();
            importCollectionsToBackend(newCols);
            setShowImport(false);
          }}
        />
      )}
      {showExport && (
        <ExportModal
          collection={showExport}
          onClose={() => setShowExport(null)}
        />
      )}
    </div>
  );
}
