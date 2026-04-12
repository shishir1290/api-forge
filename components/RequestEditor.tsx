"use client";
import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useRequestExecutor } from "@/hooks/useRequestExecutor";
import { getInheritedAuth, getInheritedVariables } from "@/lib/hierarchy-utils";
import RequestUrlBar from "./RequestUrlBar";
import ParamsTab from "./ParamsTab";
import HeadersTab from "./HeadersTab";
import BodyTab from "./BodyTab";
import AuthTab from "./AuthTab";
import ScriptsTab from "./ScriptsTab";
import ResponseSection from "./ResponseSection";
import SaveModal from "./SaveModal";
import { parseQueryParams, buildUrlWithParams } from "@/lib/url-utils";
import { RequestConfig } from "@/types";

interface Props {
  tabId: string;
}

export default function RequestEditor({ tabId }: Props) {
  const [reqTab, setReqTab] = useState<
    "params" | "headers" | "body" | "auth" | "scripts"
  >("params");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [topHeight, setTopHeight] = useState(350);
  const [isVerticalDragging, setIsVerticalDragging] = useState(false);

  const {
    requests,
    responses,
    loadingTabs,
    updateRequest,
    collections,
    environments,
    activeEnvironmentId,
    saveRequestById,
  } = useAppStore();

  const request = requests[tabId];
  const response = responses[tabId];
  const loading = loadingTabs[tabId] || false;

  const { sendRequest, consoleLogs } = useRequestExecutor(tabId);

  const effectiveAuth = useMemo(
    () => getInheritedAuth(collections, request?.id || "", request),
    [collections, request],
  );

  const inheritedVars = useMemo(
    () => getInheritedVariables(collections, request?.id || ""),
    [collections, request?.id],
  );

  if (!request) return null;

  const update = (updates: Partial<RequestConfig>) => {
    let finalUpdates = { ...updates };

    if (updates.url !== undefined) {
      // Sync URL change to Params
      finalUpdates.params = parseQueryParams(updates.url, request.params);
    } else if (updates.params !== undefined) {
      // Sync Params change to URL
      finalUpdates.url = buildUrlWithParams(request.url, updates.params);
    }

    updateRequest(tabId, finalUpdates);
  };

  const startVerticalDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsVerticalDragging(true);
  };

  useEffect(() => {
    if (!isVerticalDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate height based on mouse position
      // The RequestEditor starts after the sidebar/header, approx 100px down
      const newHeight = Math.max(
        100,
        Math.min(window.innerHeight - 150, e.clientY - 90),
      );
      setTopHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsVerticalDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isVerticalDragging]);

  // Keyboard shortcut for saving (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        // Only trigger if this editor is for the active tab
        const activeId = useAppStore.getState().activeTabId;
        if (activeId !== tabId) return;

        e.preventDefault();
        saveRequestById(tabId).then(
          (saved) => !saved && setShowSaveModal(true),
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tabId, saveRequestById]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-primary)",
      }}
    >
      {/* URL BAR */}
      <RequestUrlBar
        request={request}
        loading={loading}
        onUpdate={update}
        onSend={sendRequest}
        onSave={() =>
          saveRequestById(tabId).then(
            (saved) => !saved && setShowSaveModal(true),
          )
        }
      />

      {/* TABS HEADER */}
      <div
        style={{
          display: "flex",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          padding: "0 16px",
        }}
      >
        {["params", "headers", "body", "auth", "scripts"].map((t) => (
          <button
            key={t}
            onClick={() => setReqTab(t as any)}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${reqTab === t ? "var(--accent-blue)" : "transparent"}`,
              color: reqTab === t ? "var(--text-primary)" : "var(--text-muted)",
              fontSize: "12px",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div
        style={{
          height: `${topHeight}px`,
          borderBottom: "1px solid var(--border)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {reqTab === "params" && (
          <ParamsTab
            params={request.params}
            onChange={(params) => update({ params })}
          />
        )}
        {reqTab === "headers" && (
          <HeadersTab
            headers={request.headers}
            inheritedHeaders={[]} // In reality, resolve inherited headers
            onChange={(headers) => update({ headers })}
          />
        )}
        {reqTab === "body" && (
          <BodyTab
            body={request.body}
            onChange={(bodyUpdates) =>
              update({ body: { ...request.body, ...bodyUpdates } })
            }
          />
        )}
        {reqTab === "auth" && (
          <AuthTab
            auth={request.auth}
            effectiveAuth={effectiveAuth}
            onChange={(auth) => update({ auth })}
          />
        )}
        {reqTab === "scripts" && (
          <ScriptsTab
            preRequestScript={request.preRequestScript || ""}
            postRequestScript={request.postRequestScript || ""}
            onChange={(scriptUpdates) => update(scriptUpdates)}
          />
        )}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={startVerticalDrag}
        style={{
          height: 4,
          cursor: "row-resize",
          background: isVerticalDragging ? "var(--accent-blue)" : "transparent",
          zIndex: 10,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--border)")
        }
        onMouseLeave={(e) => {
          if (!isVerticalDragging)
            e.currentTarget.style.background = "transparent";
        }}
      />

      {/* RESPONSE SECTION */}
      <ResponseSection response={response} consoleLogs={consoleLogs} />

      {/* MODALS */}
      {showSaveModal && (
        <SaveModal request={request} onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
}
