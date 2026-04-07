"use client";
import { useState, useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import Sidebar from "@/components/Sidebar";
import TabBar from "@/components/TabBar";
import NotificationBell from "@/components/NotificationBell";
import RequestEditor from "@/components/RequestEditor";
import WelcomeScreen from "@/components/WelcomeScreen";
import { v4 as uuidv4 } from "uuid";
import type { RequestConfig } from "@/types";

export default function Home() {
  const { tabs, activeTabId, openTab, closeTab } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [dragging, setDragging] = useState(false);

  // Electron menu keyboard shortcut support
  useEffect(() => {
    const w = window as Window & {
      electron?: {
        onNewTab: (cb: () => void) => void;
        onCloseTab: (cb: () => void) => void;
        removeAllListeners: (ch: string) => void;
      };
    };
    if (!w.electron) return;
    const newTabHandler = () => {
      const req: RequestConfig = {
        id: uuidv4(),
        name: "New Request",
        method: "GET",
        url: "",
        headers: [],
        params: [],
        body: { type: "none", content: "", formData: [] },
        auth: { type: "none" },
      };
      openTab(req);
    };
    const closeTabHandler = () => {
      const { activeTabId: atid } = useAppStore.getState();
      if (atid) closeTab(atid);
    };
    w.electron.onNewTab(newTabHandler);
    w.electron.onCloseTab(closeTabHandler);
    return () => {
      w.electron?.removeAllListeners("new-tab");
      w.electron?.removeAllListeners("close-tab");
    };
  }, [openTab, closeTab]);

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(400, Math.max(180, e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-primary)",
      }}
    >
      {sidebarOpen && (
        <div
          style={{
            width: sidebarWidth,
            flexShrink: 0,
            position: "relative",
            display: "flex",
          }}
        >
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Sidebar />
          </div>
          <div
            onMouseDown={() => setDragging(true)}
            style={{
              width: 4,
              cursor: "col-resize",
              background: dragging ? "var(--accent-blue)" : "transparent",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--border)")
            }
            onMouseLeave={(e) => {
              if (!dragging) e.currentTarget.style.background = "transparent";
            }}
          />
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border)",
            paddingLeft: 8,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "6px",
              display: "flex",
              borderRadius: 4,
            }}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={15} />
            ) : (
              <PanelLeftOpen size={15} />
            )}
          </button>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <TabBar />
          </div>
          <div
            style={{ paddingRight: 12, display: "flex", alignItems: "center" }}
          >
            <NotificationBell />
          </div>
        </div>

        <div style={{ flex: 1, overflow: "hidden" }}>
          {!activeTabId || tabs.length === 0 ? (
            <WelcomeScreen />
          ) : (
            tabs.map((tab) => (
              <div
                key={tab.id}
                style={{
                  display: tab.id === activeTabId ? "flex" : "none",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <RequestEditor tabId={tab.id} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
