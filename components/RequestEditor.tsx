"use client";
import { useState, useMemo } from "react";
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
import { RequestConfig } from "@/types";

interface Props {
  tabId: string;
}

export default function RequestEditor({ tabId }: Props) {
  const [reqTab, setReqTab] = useState<
    "params" | "headers" | "body" | "auth" | "scripts"
  >("params");
  const [showSaveModal, setShowSaveModal] = useState(false);

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

  const update = (updates: Partial<RequestConfig>) =>
    updateRequest(tabId, updates);

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
          height: "350px",
          borderBottom: "1px solid var(--border)",
          overflow: "hidden",
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

      {/* RESPONSE SECTION */}
      <ResponseSection response={response} consoleLogs={consoleLogs} />

      {/* MODALS */}
      {showSaveModal && (
        <SaveModal request={request} onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
}
