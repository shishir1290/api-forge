"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Send,
  Save,
  Plus,
  Copy,
  FolderPlus,
  Terminal,
  ChevronRight,
  ChevronDown,
  FolderIcon,
  X,
  Check,
  Globe,
  Shield,
  AlertCircle,
  Copy as CopyIcon,
  Clock,
} from "lucide-react";
import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "@/store/useAppStore";
import KeyValueEditor from "./KeyValueEditor";
import ResponseViewer from "./ResponseViewer";
import MethodBadge from "./MethodBadge";
import CurlImportModal from "./CurlImportModal";
import { resolveVariables } from "@/lib/resolve-vars";
import { generateCurl } from "@/lib/curl-utils";
import { executeScript } from "@/lib/script-executor";
import {
  getInheritedAuth,
  getInheritedVariables,
  getInheritedHeaders,
  findRequestPath,
} from "@/lib/hierarchy-utils";
import VariableInput from "./VariableInput";
import type {
  HttpMethod,
  RequestConfig,
  ResponseData,
  CollectionFolder,
  Environment,
  KeyValuePair,
} from "@/types";

// ─── Folder-aware Save Modal ──────────────────────────────────────────────────
function SaveModal({
  request,
  onClose,
}: {
  request: RequestConfig;
  onClose: () => void;
}) {
  const { collections, addRequestToCollection, addRequestToFolder } =
    useAppStore();
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (overlayRef.current === e.target) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedCollectionId) return;
    if (selectedFolderId) {
      addRequestToFolder(selectedCollectionId, selectedFolderId, {
        ...request,
        id: uuidv4(),
      });
    } else {
      addRequestToCollection(selectedCollectionId, {
        ...request,
        id: uuidv4(),
      });
    }
    onClose();
  };

  const renderFolders = (
    folders: CollectionFolder[],
    depth: number,
  ): React.ReactNode =>
    folders.map((folder) => {
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedFolderId === folder.id;
      return (
        <div key={folder.id}>
          <div
            onClick={() => {
              setSelectedFolderId(folder.id);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              paddingLeft: 12 + depth * 16,
              paddingRight: 10,
              paddingTop: 5,
              paddingBottom: 5,
              cursor: "pointer",
              borderRadius: 4,
              margin: "1px 4px",
              background: isSelected ? "rgba(88,166,255,0.15)" : "none",
              border: isSelected
                ? "1px solid rgba(88,166,255,0.4)"
                : "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!isSelected)
                e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = "none";
            }}
          >
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              style={{
                color: "var(--text-muted)",
                display: "flex",
                cursor: "pointer",
              }}
            >
              {folder.folders.length > 0 ? (
                isExpanded ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )
              ) : (
                <span style={{ width: 12 }} />
              )}
            </span>
            <FolderIcon
              size={12}
              style={{ color: "var(--accent-yellow)", flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-primary)",
                flex: 1,
              }}
            >
              {folder.name}
            </span>
          </div>
          {isExpanded && renderFolders(folder.folders, depth + 1)}
        </div>
      );
    });

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          width: 380,
          maxHeight: 520,
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: "14px",
              color: "var(--text-primary)",
            }}
          >
            Save Request
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
            }}
          >
            <X size={15} />
          </button>
        </div>

        <div
          style={{
            padding: "10px 12px 6px",
            fontSize: "11px",
            color: "var(--text-muted)",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          SELECT COLLECTION OR FOLDER
        </div>

        {/* Tree */}
        <div style={{ flex: 1, overflow: "auto", padding: "0 4px 8px" }}>
          {collections.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "12px",
              }}
            >
              No collections yet. Create one first.
            </div>
          ) : (
            collections.map((col) => {
              const isColSelected =
                selectedCollectionId === col.id && !selectedFolderId;
              return (
                <div key={col.id} style={{ marginBottom: 2 }}>
                  <div
                    onClick={() => {
                      setSelectedCollectionId(col.id);
                      setSelectedFolderId(null);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      cursor: "pointer",
                      borderRadius: 5,
                      margin: "1px 4px",
                      background: isColSelected
                        ? "rgba(88,166,255,0.15)"
                        : "none",
                      border: isColSelected
                        ? "1px solid rgba(88,166,255,0.4)"
                        : "1px solid transparent",
                      fontWeight: 600,
                    }}
                    onMouseEnter={(e) => {
                      if (!isColSelected)
                        e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isColSelected)
                        e.currentTarget.style.background = "none";
                    }}
                  >
                    <FolderIcon
                      size={13}
                      style={{ color: "var(--accent-blue)", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        color: "var(--text-primary)",
                        flex: 1,
                      }}
                    >
                      {col.name}
                    </span>
                    {isColSelected && (
                      <Check
                        size={12}
                        style={{ color: "var(--accent-blue)" }}
                      />
                    )}
                  </div>
                  {col.folders.length > 0 && (
                    <div>{renderFolders(col.folders, 1)}</div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected destination info */}
        {selectedCollectionId && (
          <div
            style={{
              padding: "8px 16px",
              borderTop: "1px solid var(--border-subtle)",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            Saving to:{" "}
            <span style={{ color: "var(--accent-blue)" }}>
              {(() => {
                const col = collections.find(
                  (c) => c.id === selectedCollectionId,
                );
                if (!selectedFolderId) return col?.name;
                const findFolder = (
                  folders: CollectionFolder[],
                  id: string,
                ): string | undefined => {
                  for (const f of folders) {
                    if (f.id === id) return f.name;
                    const found = findFolder(f.folders, id);
                    if (found) return found;
                  }
                };
                return `${col?.name} / ${findFolder(col?.folders || [], selectedFolderId)}`;
              })()}
            </span>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 5,
              padding: "6px 14px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedCollectionId}
            style={{
              background: selectedCollectionId
                ? "var(--accent-blue)"
                : "var(--bg-active)",
              border: "none",
              borderRadius: 5,
              padding: "6px 16px",
              cursor: selectedCollectionId ? "pointer" : "not-allowed",
              color: selectedCollectionId ? "white" : "var(--text-muted)",
              fontSize: "12px",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "var(--method-get)",
  POST: "var(--method-post)",
  PUT: "var(--method-put)",
  PATCH: "var(--method-patch)",
  DELETE: "var(--method-delete)",
  HEAD: "var(--method-head)",
  OPTIONS: "var(--method-options)",
};

type ReqTab = "params" | "headers" | "body" | "auth" | "scripts";
type ResTab = "body" | "headers" | "info" | "console";

interface Props {
  tabId: string;
}

export default function RequestEditor({ tabId }: Props) {
  const [reqTab, setReqTab] = useState<ReqTab>("params");
  const [resTab, setResTab] = useState<ResTab>("body");
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [showEnvMenu, setShowEnvMenu] = useState(false);

  const {
    requests,
    responses,
    loadingTabs,
    updateRequest,
    setResponse,
    setLoading,
    addToHistory,
    collections,
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
    setEnvironmentVariable,
    markTabSaved,
    updateRequestInCollection,
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
  } = useAppStore();

  const [jsonError, setJsonError] = useState<string | null>(null);

  const request = requests[tabId];
  const response = responses[tabId];
  const loading = loadingTabs[tabId] || false;

  useEffect(() => {
    if (request?.body.type === "json") {
      try {
        JSON.parse(request.body.content);
        setJsonError(null);
      } catch (e) {
        setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      }
    }
  }, [request?.body.content, request?.body.type]);

  const prettifyJson = () => {
    if (request?.body.type === "json") {
      try {
        const parsed = JSON.parse(request.body.content);
        update({
          body: { ...request.body, content: JSON.stringify(parsed, null, 2) },
        });
      } catch (e) {
        // Already handled by error state
      }
    }
  };

  if (!request) return null;

  const update = (updates: Partial<RequestConfig>) =>
    updateRequest(tabId, updates);

  const [paneHeight, setPaneHeight] = useState(400); // Height of the top pane
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newHeight = e.clientY - 100; // Adjust for header offset
        if (newHeight > 100 && newHeight < window.innerHeight - 100) {
          setPaneHeight(newHeight);
        }
      }
    },
    [isResizing],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Variable validation
  const missingVars = useMemo(() => {
    const text = JSON.stringify(request);
    const matches = text.match(/<<(.+?)>>/g) || [];
    const keys = [...new Set(matches.map((m) => m.slice(2, -2)))];

    const availableKeys = new Set<string>();
    const global = environments.find((e) => e.id === "global");
    const active = environments.find((e) => e.id === activeEnvironmentId);

    global?.variables.forEach((v) => availableKeys.add(v.key));
    global?.secrets.forEach((v) => availableKeys.add(v.key));
    active?.variables.forEach((v) => availableKeys.add(v.key));
    active?.secrets.forEach((v) => availableKeys.add(v.key));

    return keys.filter((k) => !availableKeys.has(k));
  }, [request, environments, activeEnvironmentId]);

  const inheritedVars = useMemo(
    () => getInheritedVariables(collections, request.id),
    [collections, request.id],
  );

  const effectiveAuth = useMemo(
    () => getInheritedAuth(collections, request.id, request),
    [collections, request.id, request],
  );

  const handleSend = useCallback(async () => {
    if (!request.url) return;
    setLoading(tabId, true);
    setConsoleLogs([]);

    const log = (msg: string) =>
      setConsoleLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ${msg}`,
      ]);

    try {
      // 1. Pre-request script
      if (request.preRequestScript) {
        log("Executing Pre-request script...");
        executeScript(request.preRequestScript, {
          environments,
          activeEnvironmentId,
          setEnvironmentVariable,
          log,
        });
      }

      // Re-fetch state after script might have changed variables
      const {
        environments: latestEnvs,
        activeEnvironmentId: latestActiveId,
        collections: latestCols,
      } = useAppStore.getState();

      const latestInheritedVars = getInheritedVariables(latestCols, request.id);
      const latestInheritedHeaders = getInheritedHeaders(
        latestCols,
        request.id,
      );
      const latestEffectiveAuth = getInheritedAuth(
        latestCols,
        request.id,
        request,
      );

      const resolve = (text: string) =>
        resolveVariables(text, latestEnvs, latestActiveId, latestInheritedVars);

      let url = resolve(request.url);
      const enabledParams = request.params.filter((p) => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const searchParams = new URLSearchParams();
        enabledParams.forEach((p) =>
          searchParams.append(resolve(p.key), resolve(p.value)),
        );
        url += (url.includes("?") ? "&" : "?") + searchParams.toString();
      }

      const headers: Record<string, string> = {};

      // 2. Add inherited headers
      latestInheritedHeaders
        .filter((h: KeyValuePair) => h.enabled !== false && h.key)
        .forEach((h: KeyValuePair) => {
          headers[resolve(h.key)] = resolve(h.value);
        });

      // 3. Add local headers (can override inherited)
      request.headers
        .filter((h: KeyValuePair) => h.enabled !== false && h.key)
        .forEach((h: KeyValuePair) => {
          headers[resolve(h.key)] = resolve(h.value);
        });

      if (
        latestEffectiveAuth.type === "bearer" &&
        latestEffectiveAuth.bearerToken
      ) {
        headers["Authorization"] =
          `Bearer ${resolve(latestEffectiveAuth.bearerToken)}`;
      } else if (latestEffectiveAuth.type === "basic") {
        const user = resolve(latestEffectiveAuth.basicUsername || "");
        const pass = resolve(latestEffectiveAuth.basicPassword || "");
        const encoded = btoa(`${user}:${pass}`);
        headers["Authorization"] = `Basic ${encoded}`;
      } else if (
        latestEffectiveAuth.type === "api-key" &&
        latestEffectiveAuth.apiKeyIn === "header"
      ) {
        headers[resolve(latestEffectiveAuth.apiKeyKey || "X-API-Key")] =
          resolve(latestEffectiveAuth.apiKeyValue || "");
      }

      let body: any;
      if (request.body.type === "json") {
        headers["Content-Type"] = "application/json";
        body = resolve(request.body.content);
      } else if (request.body.type === "form-data") {
        const fd = new FormData();
        request.body.formData.forEach((p) => {
          if (p.enabled) {
            fd.append(p.key, p.value);
          }
        });
        body = fd;
        delete headers["Content-Type"];
      } else if (request.body.type === "x-www-form-urlencoded") {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        const formParams = new URLSearchParams();
        request.body.formData
          .filter((p) => p.enabled && p.key)
          .forEach((p) => {
            formParams.append(resolve(p.key), resolve(p.value));
          });
        body = formParams.toString();
      } else if (request.body.type === "raw") {
        body = resolve(request.body.content);
      }

      log(`Sending ${request.method} ${url}`);
      log(`Effective Auth Type: ${latestEffectiveAuth.type}`);
      log(`Effective Auth: ${JSON.stringify(latestEffectiveAuth)}`);

      // Apply Auth if not already in headers
      if (!headers["Authorization"]) {
        if (
          latestEffectiveAuth.type === "bearer" &&
          latestEffectiveAuth.bearerToken
        ) {
          const resolvedToken = resolve(latestEffectiveAuth.bearerToken);
          headers["Authorization"] = `Bearer ${resolvedToken}`;
          log(
            `Applied Inherited Bearer Token (Resolved): ${resolvedToken.substring(0, 15)}...`,
          );
        } else if (latestEffectiveAuth.type === "basic") {
          const u = resolve(latestEffectiveAuth.basicUsername || "");
          const p = resolve(latestEffectiveAuth.basicPassword || "");
          headers["Authorization"] = `Basic ${btoa(`${u}:${p}`)}`;
          log(`Applied Inherited Basic Auth for user: ${u}`);
        }
      }

      // Variable Debugging
      if (latestEffectiveAuth.type === "bearer") {
        const rawToken = latestEffectiveAuth.bearerToken || "";
        const resolvedToken = resolve(rawToken);
        log(`Bearer Token (Raw): "${rawToken}"`);
        if (resolvedToken === rawToken && rawToken.includes("<<")) {
          log(
            `ERROR: Variable in token NOT resolved! Check if environment is active.`,
          );
        }
      }

      if (headers["Authorization"]) {
        log(
          `Authorization Header: ${headers["Authorization"].substring(0, 15)}...`,
        );
      } else if (latestEffectiveAuth.type !== "none") {
        log(
          `Warning: Auth Type is ${latestEffectiveAuth.type} but no Authorization header was generated.`,
        );
      }

      const isElectron =
        typeof window !== "undefined" &&
        !!(window as Window & { electron?: unknown }).electron;

      let data: ResponseData & { error?: string };

      if (isElectron) {
        const startTime = Date.now();
        try {
          const fetchRes = await fetch(url, {
            method: request.method,
            headers,
            ...(body !== undefined ? { body } : {}),
          });
          const elapsed = Date.now() - startTime;
          const resBody = await fetchRes.text();
          const resHeaders: Record<string, string> = {};
          fetchRes.headers.forEach((v, k) => {
            resHeaders[k] = v;
          });
          data = {
            status: fetchRes.status,
            statusText: fetchRes.statusText,
            headers: resHeaders,
            body: resBody,
            time: elapsed,
            size: new TextEncoder().encode(resBody).length,
            requestId: request.id,
          };
        } catch (err: unknown) {
          data = {
            status: 0,
            statusText: "Error",
            headers: {},
            body: err instanceof Error ? err.message : "Request failed",
            time: Date.now() - startTime,
            size: 0,
            requestId: request.id,
            error: err instanceof Error ? err.message : "Request failed",
          };
        }
      } else {
        const proxyRes = await fetch("/api/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: request.method, url, headers, body }),
        });
        data = await proxyRes.json();
      }

      if (data.error) {
        log(`Request Error: ${data.error}`);
        setResponse(tabId, {
          status: 0,
          statusText: "Error",
          headers: {},
          body: data.error,
          time: 0,
          size: 0,
          requestId: request.id,
        });
      } else {
        const res: ResponseData = { ...data, requestId: request.id };
        setResponse(tabId, res);
        addToHistory({
          id: uuidv4(),
          request,
          response: res,
          timestamp: new Date().toISOString(),
        });

        // 2. Post-request script
        if (request.postRequestScript) {
          log("Executing Post-request script...");
          executeScript(request.postRequestScript, {
            environments: useAppStore.getState().environments,
            activeEnvironmentId,
            response: res,
            setEnvironmentVariable,
            log,
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      log(`Fatal Error: ${msg}`);
      setResponse(tabId, {
        status: 0,
        statusText: "Error",
        headers: {},
        body: msg,
        time: 0,
        size: 0,
        requestId: request.id,
      });
    } finally {
      setLoading(tabId, false);
    }
  }, [
    request,
    tabId,
    environments,
    activeEnvironmentId,
    inheritedVars,
    effectiveAuth,
    setLoading,
    setResponse,
    addToHistory,
    setConsoleLogs,
    setEnvironmentVariable,
  ]);

  const handleSave = useCallback(() => {
    const path = findRequestPath(collections, request.id);
    if (path.length > 0) {
      // Direct save: find the collection ID (first item in path)
      const collectionId = path[0].id;
      updateRequestInCollection(collectionId, request.id, request);
      markTabSaved(tabId);
    } else {
      // New request: show modal
      setShowSaveModal(true);
    }
  }, [collections, request, tabId, updateRequestInCollection, markTabSaved]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handleSend]);

  const handleCopyCurl = useCallback(() => {
    const {
      environments: latestEnvs,
      activeEnvironmentId: latestActiveId,
      collections: latestCols,
    } = useAppStore.getState();

    const latestInheritedVars = getInheritedVariables(latestCols, request.id);
    const latestInheritedHeaders = getInheritedHeaders(latestCols, request.id);
    const latestEffectiveAuth = getInheritedAuth(
      latestCols,
      request.id,
      request,
    );

    const curl = generateCurl(
      request,
      latestEnvs,
      latestActiveId,
      latestInheritedVars,
      latestInheritedHeaders,
      latestEffectiveAuth,
    );
    navigator.clipboard.writeText(curl);
  }, [request, environments, activeEnvironmentId]);

  const getStatusColor = (status: number) => {
    if (status >= 500) return "var(--accent-red)";
    if (status >= 400) return "var(--accent-yellow)";
    if (status >= 300) return "var(--accent-blue)";
    return "var(--accent-green)";
  };

  const tabBtn = (label: string, tab: ReqTab, count?: number) => (
    <button
      key={tab}
      onClick={() => setReqTab(tab)}
      style={{
        background: reqTab === tab ? "var(--bg-tertiary)" : "none",
        border: "none",
        borderBottom:
          reqTab === tab
            ? "2px solid var(--accent-blue)"
            : "2px solid transparent",
        cursor: "pointer",
        color: reqTab === tab ? "var(--text-primary)" : "var(--text-secondary)",
        padding: "8px 12px",
        fontSize: "12px",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          style={{
            background: "var(--accent-blue)",
            color: "white",
            borderRadius: 8,
            fontSize: "10px",
            padding: "1px 5px",
            fontWeight: 600,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );

  const resTabBtn = (label: string, tab: ResTab) => (
    <button
      key={tab}
      onClick={() => setResTab(tab)}
      style={{
        background: resTab === tab ? "var(--bg-tertiary)" : "none",
        border: "none",
        borderBottom:
          resTab === tab
            ? "2px solid var(--accent-blue)"
            : "2px solid transparent",
        cursor: "pointer",
        color: resTab === tab ? "var(--text-primary)" : "var(--text-secondary)",
        padding: "8px 12px",
        fontSize: "12px",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-primary)",
      }}
    >
      {/* cURL Import Modal */}
      {showCurlModal && (
        <CurlImportModal
          onImport={(imported) => {
            update({
              method: imported.method,
              url: imported.url,
              headers: imported.headers,
              params: imported.params,
              body: imported.body,
              auth: imported.auth,
              name: imported.name,
            });
          }}
          onClose={() => setShowCurlModal(false)}
        />
      )}

      {/* Request Name & Environment Bar */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
          background: "var(--bg-secondary)",
        }}
      >
        <input
          value={request.name}
          onChange={(e) => update({ name: e.target.value })}
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontSize: "14px",
            fontWeight: 600,
            flex: 1,
            fontFamily: "Inter, sans-serif",
          }}
          placeholder="Request name"
        />

        {/* Environment Selector */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowEnvMenu(!showEnvMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg-active)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              padding: "4px 10px",
              cursor: "pointer",
              color: activeEnvironmentId
                ? "var(--accent-green)"
                : "var(--text-muted)",
              fontSize: "12px",
              fontFamily: "Inter, sans-serif",
              minWidth: 140,
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {activeEnvironmentId === "global" ? (
                <Globe size={14} />
              ) : (
                <Shield size={14} />
              )}
              <span
                style={{
                  maxWidth: 100,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeEnvironmentId
                  ? environments.find((e) => e.id === activeEnvironmentId)?.name
                  : "No Environment"}
              </span>
            </div>
            <ChevronDown size={12} />
          </button>

          {showEnvMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 4,
                zIndex: 1000,
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 4,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                minWidth: 180,
              }}
            >
              <div
                onClick={() => {
                  setActiveEnvironment(null);
                  setShowEnvMenu(false);
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  color: !activeEnvironmentId
                    ? "var(--accent-blue)"
                    : "var(--text-primary)",
                  background: !activeEnvironmentId
                    ? "rgba(88,166,255,0.1)"
                    : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = !activeEnvironmentId
                    ? "rgba(88,166,255,0.1)"
                    : "none")
                }
              >
                No Environment
              </div>
              <div
                style={{
                  height: 1,
                  background: "var(--border)",
                  margin: "4px 0",
                }}
              />
              {environments.map((env) => (
                <div
                  key={env.id}
                  onClick={() => {
                    setActiveEnvironment(env.id);
                    setShowEnvMenu(false);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color:
                      activeEnvironmentId === env.id
                        ? "var(--accent-blue)"
                        : "var(--text-primary)",
                    background:
                      activeEnvironmentId === env.id
                        ? "rgba(88,166,255,0.1)"
                        : "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      activeEnvironmentId === env.id
                        ? "rgba(88,166,255,0.1)"
                        : "none")
                  }
                >
                  {env.id === "global" ? (
                    <Globe size={12} />
                  ) : (
                    <Shield size={12} />
                  )}
                  {env.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          title="Save (Ctrl+S)"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            borderRadius: 5,
            padding: "5px 10px",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: "12px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <Save size={13} /> Save
        </button>
      </div>

      {showSaveModal && (
        <SaveModal request={request} onClose={() => setShowSaveModal(false)} />
      )}

      {/* URL Bar */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexShrink: 0,
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMethodMenu(!showMethodMenu)}
            style={{
              background: "var(--bg-active)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              padding: "7px 12px",
              cursor: "pointer",
              color: METHOD_COLORS[request.method],
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "JetBrains Mono, monospace",
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 85,
            }}
          >
            {request.method}
            <span style={{ color: "var(--text-muted)", fontSize: 10 }}>▼</span>
          </button>
          {showMethodMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                zIndex: 100,
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 4,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              {METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    update({ method: m });
                    setShowMethodMenu(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: METHOD_COLORS[m],
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "6px 14px",
                    borderRadius: 4,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <VariableInput
            value={request.url}
            onChange={(url) => update({ url })}
            placeholder="https://api.example.com/endpoint"
            extraVariables={inheritedVars}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            style={{
              flex: 1,
              background: "var(--bg-tertiary)",
              border: `1px solid ${missingVars.length > 0 ? "var(--accent-red)" : "var(--border)"}`,
              borderRadius: 5,
              fontSize: "13px",
              fontFamily: "JetBrains Mono, monospace",
            }}
          />
          {missingVars.length > 0 && (
            <div
              title={`Missing variables: ${missingVars.join(", ")}`}
              style={{
                position: "absolute",
                right: 8,
                color: "var(--accent-red)",
                display: "flex",
              }}
            >
              <AlertCircle size={14} />
            </div>
          )}
        </div>

        <button
          onClick={handleCopyCurl}
          title="Copy as cURL"
          style={{
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            borderRadius: 5,
            padding: "7px 12px",
            cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-blue)";
            e.currentTarget.style.color = "var(--accent-blue)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <CopyIcon size={13} />
        </button>

        <button
          onClick={() => setShowCurlModal(true)}
          title="Import cURL command"
          style={{
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            borderRadius: 5,
            padding: "7px 12px",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: "12px",
            fontFamily: "Inter, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-blue)";
            e.currentTarget.style.color = "var(--accent-blue)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <Terminal size={13} />
          Import
        </button>

        <button
          onClick={handleSend}
          disabled={loading || !request.url || missingVars.length > 0}
          style={{
            background:
              loading || missingVars.length > 0
                ? "var(--bg-active)"
                : "var(--accent-blue)",
            border: "none",
            borderRadius: 5,
            padding: "7px 20px",
            cursor:
              loading || !request.url || missingVars.length > 0
                ? "not-allowed"
                : "pointer",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: !request.url || missingVars.length > 0 ? 0.5 : 1,
            transition: "all 0.15s",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>

      {/* Split view: request config + response */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Request Tabs */}
        <div
          style={{
            borderBottom: "1px solid var(--border)",
            display: "flex",
            background: "var(--bg-secondary)",
            flexShrink: 0,
          }}
        >
          {tabBtn(
            "Params",
            "params",
            request.params.filter((p) => p.enabled && p.key).length,
          )}
          {tabBtn(
            "Headers",
            "headers",
            request.headers.filter((h) => h.enabled && h.key).length,
          )}
          {tabBtn("Body", "body")}
          {tabBtn("Auth", "auth")}
          {tabBtn("Scripts", "scripts")}
        </div>

        <div
          style={{
            height: paneHeight,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", // Parent no longer scrolls everything
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-primary)",
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, overflow: "auto" }}>
            {reqTab === "params" && (
              <KeyValueEditor
                pairs={request.params}
                onChange={(params) => update({ params })}
                keyPlaceholder="param_key"
                valuePlaceholder="param_value"
                showDescription
                extraVariables={inheritedVars}
              />
            )}
            {reqTab === "headers" && (
              <KeyValueEditor
                pairs={request.headers}
                onChange={(headers) => update({ headers })}
                keyPlaceholder="Header-Name"
                valuePlaceholder="Header Value"
                showDescription
                extraVariables={inheritedVars}
              />
            )}
            {reqTab === "body" && (
              <BodyEditor
                body={request.body}
                onChange={(body) => update({ body })}
                method={request.method}
                inheritedVars={inheritedVars}
                prettifyJson={prettifyJson}
                jsonError={jsonError}
              />
            )}
            {reqTab === "auth" && (
              <AuthEditor
                auth={request.auth}
                effectiveAuth={effectiveAuth}
                onChange={(auth) => update({ auth })}
                extraVariables={inheritedVars}
                environments={environments}
                activeEnvironmentId={activeEnvironmentId}
              />
            )}
            {reqTab === "scripts" && (
              <div style={{ padding: 16 }}>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      marginBottom: 8,
                    }}
                  >
                    PRE-REQUEST SCRIPT
                  </label>
                  <VariableInput
                    type="textarea"
                    value={request.preRequestScript || ""}
                    onChange={(val) => update({ preRequestScript: val })}
                    placeholder="// pm.environment.set('token', 'abc');"
                    extraVariables={inheritedVars}
                    style={{
                      height: 120,
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      background: "var(--bg-secondary)",
                      fontSize: 13,
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      marginBottom: 8,
                    }}
                  >
                    POST-REQUEST SCRIPT
                  </label>
                  <VariableInput
                    type="textarea"
                    value={request.postRequestScript || ""}
                    onChange={(val) => update({ postRequestScript: val })}
                    placeholder="// const data = pm.response.json();"
                    extraVariables={inheritedVars}
                    style={{
                      height: 120,
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      background: "var(--bg-secondary)",
                      fontSize: 13,
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Resizer */}
        <div
          onMouseDown={startResizing}
          style={{
            height: 4,
            width: "100%",
            cursor: "ns-resize",
            background: isResizing ? "var(--accent-blue)" : "transparent",
            transition: "background 0.2s",
            zIndex: 10,
            flexShrink: 0,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--accent-blue)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = isResizing
              ? "var(--accent-blue)"
              : "transparent")
          }
        />

        {/* Response */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              background: "var(--bg-secondary)",
              flexShrink: 0,
            }}
          >
            {resTabBtn("Body", "body")}
            {resTabBtn("Headers", "headers")}
            {resTabBtn("Info", "info")}
            {resTabBtn("Console", "console")}
            {resTab === "console" && consoleLogs.length > 0 && (
              <button
                onClick={() => setConsoleLogs([])}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-blue)",
                  fontSize: "11px",
                  cursor: "pointer",
                  padding: "0 8px",
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Clear
              </button>
            )}
            {response && (
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  paddingRight: 16,
                }}
              >
                <span
                  style={{
                    color: getStatusColor(response.status),
                    fontWeight: 700,
                    fontSize: "12px",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {response.status} {response.statusText}
                </span>
                <span
                  style={{ color: "var(--text-secondary)", fontSize: "12px" }}
                >
                  {response.time}ms
                </span>
                <span
                  style={{ color: "var(--text-secondary)", fontSize: "12px" }}
                >
                  {formatSize(response.size)}
                </span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {resTab === "console" ? (
              <div
                style={{
                  height: "100%",
                  overflowY: "auto",
                  padding: 16,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 13,
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              >
                {consoleLogs.length === 0 ? (
                  <div
                    style={{ color: "var(--text-muted)", fontStyle: "italic" }}
                  >
                    No logs yet. Run a request to see output.
                  </div>
                ) : (
                  consoleLogs.map((log, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 4,
                        borderBottom: "1px solid var(--border-subtle)",
                        paddingBottom: 4,
                      }}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            ) : resTab === "headers" && response ? (
              <div style={{ padding: 16 }}>
                <KeyValueEditor
                  pairs={Object.entries(response.headers).map(
                    ([key, value]) => ({
                      id: key,
                      key,
                      value,
                      enabled: true,
                    }),
                  )}
                  onChange={() => {}}
                  readOnly
                />
              </div>
            ) : resTab === "info" && response ? (
              <div
                style={{
                  padding: 16,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <span
                    style={{ fontWeight: 600, color: "var(--text-primary)" }}
                  >
                    Status:
                  </span>{" "}
                  {response.status} {response.statusText}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span
                    style={{ fontWeight: 600, color: "var(--text-primary)" }}
                  >
                    Time:
                  </span>{" "}
                  {response.time}ms
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span
                    style={{ fontWeight: 600, color: "var(--text-primary)" }}
                  >
                    Size:
                  </span>{" "}
                  {formatSize(response.size)}
                </div>
                {response.headers["content-type"] && (
                  <div style={{ marginBottom: 8 }}>
                    <span
                      style={{ fontWeight: 600, color: "var(--text-primary)" }}
                    >
                      Content Type:
                    </span>{" "}
                    {response.headers["content-type"]}
                  </div>
                )}
                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={() => {
                      const name = prompt("Enter example name:", "Example 1");
                      if (!name) return;
                      const { addExampleToRequest } = useAppStore.getState();
                      addExampleToRequest(request.id, {
                        id: uuidv4(),
                        name,
                        request: { ...request },
                        response: { ...response },
                      });
                      alert("Response saved as example!");
                    }}
                    style={{
                      background: "var(--accent-blue)",
                      border: "none",
                      borderRadius: 4,
                      color: "white",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Plus size={14} />
                    Save as Example
                  </button>
                </div>
              </div>
            ) : resTab === "body" && response && !loading ? (
              <div className="fade-in" style={{ height: "100%" }}>
                <ResponseViewer
                  content={response.body}
                  contentType={response.headers["content-type"]}
                />
              </div>
            ) : loading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "var(--text-muted)",
                  gap: 12,
                }}
              >
                <div
                  className="loading-spinner"
                  style={{
                    width: 32,
                    height: 32,
                    border: "3px solid var(--border)",
                    borderTopColor: "var(--accent-blue)",
                    borderRadius: "50%",
                  }}
                />
                <p style={{ margin: 0, fontSize: "13px" }}>
                  Waiting for response...
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "var(--text-muted)",
                  gap: 8,
                }}
              >
                <Send size={32} style={{ opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: "13px" }}>
                  Send a request to see the response
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BodyEditor({
  body,
  onChange,
  method,
  inheritedVars = [],
  prettifyJson,
  jsonError,
}: {
  body: RequestConfig["body"];
  onChange: (b: RequestConfig["body"]) => void;
  method: HttpMethod;
  inheritedVars?: KeyValuePair[];
  prettifyJson?: () => void;
  jsonError?: string | null;
}) {
  const bodyTypes = [
    "none",
    "json",
    "form-data",
    "x-www-form-urlencoded",
    "raw",
  ] as const;
  const noBodyMethods: HttpMethod[] = ["GET", "HEAD", "OPTIONS"];

  if (noBodyMethods.includes(method)) {
    return (
      <div
        style={{
          padding: "24px 16px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "12px",
        }}
      >
        {method} requests do not have a body
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "8px 12px",
          borderBottom: "1px solid var(--border-subtle)",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {bodyTypes.map((t) => (
          <button
            key={t}
            onClick={() => onChange({ ...body, type: t })}
            style={{
              background: body.type === t ? "var(--bg-active)" : "none",
              border:
                body.type === t
                  ? "1px solid var(--border)"
                  : "1px solid transparent",
              borderRadius: 4,
              padding: "4px 10px",
              cursor: "pointer",
              color:
                body.type === t
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              fontSize: "11px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {body.type === "none" && (
          <div
            style={{
              padding: "20px 16px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "12px",
            }}
          >
            No body
          </div>
        )}

        {body.type === "json" ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "var(--bg-active)",
              margin: 12,
              borderRadius: 6,
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "4px 8px",
                borderBottom: "1px solid var(--border-subtle)",
                background: "var(--bg-tertiary)",
              }}
            >
              <button
                onClick={prettifyJson}
                style={{
                  fontSize: "11px",
                  color: "var(--accent-blue)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Prettify
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <VariableInput
                type="textarea"
                value={body.content}
                onChange={(content) => onChange({ ...body, content })}
                placeholder='{"key": "value"}'
                extraVariables={inheritedVars}
                style={{
                  fontSize: "13px",
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  color: "var(--text-primary)",
                  padding: 12,
                  height: "100%",
                  width: "100%",
                  border: "none",
                  background: "transparent",
                }}
              />
            </div>
            {jsonError && (
              <div
                style={{
                  padding: "4px 12px",
                  fontSize: "11px",
                  color: "var(--accent-red)",
                  background: "rgba(255,123,114,0.1)",
                  borderTop: "1px solid var(--accent-red)",
                }}
              >
                Invalid JSON: {jsonError}
              </div>
            )}
          </div>
        ) : body.type === "form-data" ||
          body.type === "x-www-form-urlencoded" ? (
          <div style={{ flex: 1, overflow: "auto" }}>
            <KeyValueEditor
              pairs={body.formData}
              onChange={(formData) => onChange({ ...body, formData })}
              extraVariables={inheritedVars}
            />
          </div>
        ) : body.type === "raw" ? (
          <div style={{ flex: 1, margin: 12 }}>
            <VariableInput
              type="textarea"
              value={body.content}
              onChange={(content) => onChange({ ...body, content })}
              placeholder="Enter raw content..."
              extraVariables={inheritedVars}
              style={{
                fontSize: "13px",
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                height: "100%",
                width: "100%",
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AuthEditor({
  auth,
  effectiveAuth,
  onChange,
  extraVariables = [],
  environments,
  activeEnvironmentId,
}: {
  auth: RequestConfig["auth"];
  effectiveAuth: RequestConfig["auth"];
  onChange: (a: RequestConfig["auth"]) => void;
  extraVariables?: KeyValuePair[];
  environments: Environment[];
  activeEnvironmentId: string | null;
}) {
  const resolve = (text: string) =>
    resolveVariables(text, environments, activeEnvironmentId, extraVariables);
  const authTypes = ["none", "bearer", "basic", "api-key", "inherit"] as const;
  const inputStyle: React.CSSProperties = {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border)",
    borderRadius: 5,
    padding: "6px 10px",
    color: "var(--text-primary)",
    fontSize: "12px",
    outline: "none",
    fontFamily: "JetBrains Mono, monospace",
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {authTypes.map((t) => (
          <button
            key={t}
            onClick={() => onChange({ ...auth, type: t })}
            style={{
              background: auth.type === t ? "var(--bg-active)" : "none",
              border:
                auth.type === t
                  ? "1px solid var(--border)"
                  : "1px solid transparent",
              borderRadius: 4,
              padding: "4px 10px",
              cursor: "pointer",
              color:
                auth.type === t
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              fontSize: "11px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {auth.type === "bearer" && (
        <div>
          <label
            style={{
              display: "block",
              color: "var(--text-secondary)",
              fontSize: "11px",
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            TOKEN
          </label>
          <VariableInput
            value={auth.bearerToken || ""}
            onChange={(val) => onChange({ ...auth, bearerToken: val })}
            placeholder="Enter bearer token"
            extraVariables={extraVariables}
            style={{ ...inputStyle, width: "100%" }}
          />
        </div>
      )}

      {auth.type === "basic" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary)",
                fontSize: "11px",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              USERNAME
            </label>
            <VariableInput
              value={auth.basicUsername || ""}
              onChange={(val) => onChange({ ...auth, basicUsername: val })}
              placeholder="Username"
              extraVariables={extraVariables}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary)",
                fontSize: "11px",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              PASSWORD
            </label>
            <VariableInput
              value={auth.basicPassword || ""}
              onChange={(val) => onChange({ ...auth, basicPassword: val })}
              placeholder="Password"
              extraVariables={extraVariables}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
        </div>
      )}

      {auth.type === "api-key" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: 12,
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary)",
                fontSize: "11px",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              KEY
            </label>
            <VariableInput
              value={auth.apiKeyKey || ""}
              onChange={(val) => onChange({ ...auth, apiKeyKey: val })}
              placeholder="X-API-Key"
              extraVariables={extraVariables}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary)",
                fontSize: "11px",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              VALUE
            </label>
            <VariableInput
              value={auth.apiKeyValue || ""}
              onChange={(val) => onChange({ ...auth, apiKeyValue: val })}
              placeholder="API key value"
              extraVariables={extraVariables}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary)",
                fontSize: "11px",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              ADD TO
            </label>
            <select
              value={auth.apiKeyIn || "header"}
              onChange={(e) =>
                onChange({
                  ...auth,
                  apiKeyIn: e.target.value as "header" | "query",
                })
              }
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="header">Header</option>
              <option value="query">Query</option>
            </select>
          </div>
        </div>
      )}

      {auth.type === "none" && (
        <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
          No authentication
        </div>
      )}

      {auth.type === "inherit" && (
        <div
          style={{
            padding: "16px",
            background: "rgba(88,166,255,0.05)",
            border: "1px solid rgba(88,166,255,0.1)",
            borderRadius: 8,
            color: "var(--text-secondary)",
            fontSize: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              color: "var(--accent-blue)",
              fontWeight: 600,
            }}
          >
            <Shield size={14} />
            Inheriting from parent
          </div>

          <div style={{ marginBottom: 12 }}>
            The following settings from the parent folder or collection are
            currently active:
          </div>

          <div
            style={{
              background: "var(--bg-tertiary)",
              padding: 12,
              borderRadius: 6,
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Effective Auth: {effectiveAuth.type}
            </div>

            {effectiveAuth.type === "bearer" && (
              <div>
                <span style={{ color: "var(--text-muted)" }}>Token: </span>
                <span className="mono" style={{ color: "var(--accent-green)" }}>
                  {resolve(effectiveAuth.bearerToken || "") || "(empty)"}
                </span>
              </div>
            )}

            {effectiveAuth.type === "basic" && (
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>User: </span>
                  <span
                    className="mono"
                    style={{ color: "var(--accent-green)" }}
                  >
                    {resolve(effectiveAuth.basicUsername || "") || "(empty)"}
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Pass: </span>
                  <span
                    className="mono"
                    style={{ color: "var(--accent-green)" }}
                  >
                    {effectiveAuth.basicPassword ? "********" : "(empty)"}
                  </span>
                </div>
              </div>
            )}

            {effectiveAuth.type === "api-key" && (
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Key: </span>
                  <span
                    className="mono"
                    style={{ color: "var(--accent-green)" }}
                  >
                    {resolve(effectiveAuth.apiKeyKey || "") || "(empty)"}
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Value: </span>
                  <span
                    className="mono"
                    style={{ color: "var(--accent-green)" }}
                  >
                    {resolve(effectiveAuth.apiKeyValue || "") || "(empty)"}
                  </span>
                </div>
              </div>
            )}

            {effectiveAuth.type === "none" && (
              <div style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                No parent authentication defined.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
