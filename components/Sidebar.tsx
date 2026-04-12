"use client";
import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  FolderPlus,
  ChevronDown,
  Bell,
  Terminal,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Environment } from "@/types";
import SidebarTabs from "./SidebarTabs";
import SidebarProfile from "./SidebarProfile";
import SidebarTreeView from "./SidebarTreeView";
import FolderPropertiesModal from "./FolderPropertiesModal";
import EnvironmentModal from "./EnvironmentModal";
import ImportModal from "./ImportModal";
import ExportModal from "./ExportModal";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import InviteModal from "./InviteModal";
import NotificationCenter from "./NotificationCenter";
import ImportCurlModal from "./ImportCurlModal";
import CreateWorkspaceModal from "./CreateWorkspaceModal";

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<
    "collections" | "history" | "environments" | "team"
  >("collections");
  const [search, setSearch] = useState("");
  const {
    collections,
    workspace,
    user,
    openTab,
    addCollection,
    fetchWorkspaces,
    fetchCollections,
    fetchInvitations,
    addEnvironment,
    notifications,
  } = useAppStore();
  const [showProperties, setShowProperties] = useState<{
    cid: string;
    fid?: string;
  } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState<any>(null);
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showImportCurl, setShowImportCurl] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const swRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWorkspaces();
    if (workspace?.id) fetchCollections(workspace.id);
    fetchInvitations();
  }, [fetchWorkspaces, workspace?.id, fetchCollections, fetchInvitations]);

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
      <div
        style={{
          width: 60,
          background: "var(--bg-tertiary)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 0",
          gap: 20,
        }}
      >
        <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div style={{ flex: 1 }} />

        {/* <button
          onClick={() => setShowNotifications(!showNotifications)}
          style={{
            width: 42,
            height: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            background: showNotifications ? "rgba(88,166,255,0.15)" : "none",
            border: "none",
            cursor: "pointer",
            color: showNotifications
              ? "var(--accent-blue)"
              : "var(--text-muted)",
            transition: "all 0.2s",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            if (!showNotifications)
              e.currentTarget.style.background = "var(--bg-hover)";
          }}
          onMouseLeave={(e) => {
            if (!showNotifications) e.currentTarget.style.background = "none";
          }}
          title="Notifications"
        >
          <Bell size={20} />
          {notifications.filter((n) => !n.read).length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--accent-red)",
                border: "1.5px solid var(--bg-tertiary)",
              }}
            />
          )}
        </button> */}

        <div style={{ height: 20 }} />
      </div>

      {showNotifications && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}

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
              ref={swRef}
              onClick={() => setShowWorkspaceSwitcher(!showWorkspaceSwitcher)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.02em",
                overflow: "hidden",
                whiteSpace: "nowrap",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 6,
                background: showWorkspaceSwitcher ? "var(--bg-active)" : "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!showWorkspaceSwitcher)
                  e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!showWorkspaceSwitcher)
                  e.currentTarget.style.background = "none";
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>
                {workspace.name}
              </span>
              <ChevronDown
                size={12}
                style={{
                  color: "var(--text-muted)",
                  transform: showWorkspaceSwitcher ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
              <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                &gt;
              </span>
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => {
                  if (activeTab === "collections")
                    addCollection("New Collection");
                  if (activeTab === "environments")
                    addEnvironment("New Environment");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                }}
                title={
                  activeTab === "environments"
                    ? "New environment"
                    : "New collection"
                }
              >
                <Plus size={14} />
              </button>
              {activeTab === "collections" && (
                <>
                  <button
                    onClick={() => setShowImport(true)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: 4,
                    }}
                    title="Import Collection"
                  >
                    <FolderPlus size={14} />
                  </button>
                  <button
                    onClick={() => setShowImportCurl(true)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: 4,
                    }}
                    title="Import from cURL"
                  >
                    <Terminal size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <SidebarTreeView
          activeTab={activeTab}
          filteredCollections={filteredCollections}
          openTab={openTab}
          onExport={setShowExport}
          onOpenProperties={(cid, fid) => setShowProperties({ cid, fid })}
          onEditEnv={setEditingEnv}
          onInvite={() => setShowInviteModal(true)}
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
      {showWorkspaceSwitcher && swRef.current && (
        <WorkspaceSwitcher
          anchorRect={swRef.current.getBoundingClientRect()}
          onClose={() => setShowWorkspaceSwitcher(false)}
          onCreateWorkspace={() => {
            setShowWorkspaceSwitcher(false);
            setShowCreateWorkspace(true);
          }}
        />
      )}
      {showCreateWorkspace && (
        <CreateWorkspaceModal onClose={() => setShowCreateWorkspace(false)} />
      )}
      {editingEnv && (
        <EnvironmentModal
          environment={editingEnv}
          onClose={() => setEditingEnv(null)}
        />
      )}
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} />
      )}
      {showImportCurl && (
        <ImportCurlModal
          onClose={() => setShowImportCurl(false)}
          onImport={(request) => {
            openTab(request);
            setShowImportCurl(false);
          }}
        />
      )}
    </div>
  );
}
