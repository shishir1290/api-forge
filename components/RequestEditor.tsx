'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Save, Plus, Copy, FolderPlus, Terminal, ChevronRight, ChevronDown, FolderIcon, X, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '@/store/useAppStore';
import KeyValueEditor from './KeyValueEditor';
import ResponseViewer from './ResponseViewer';
import MethodBadge from './MethodBadge';
import CurlImportModal from './CurlImportModal';
import type { HttpMethod, RequestConfig, ResponseData, CollectionFolder } from '@/types';

// ─── Folder-aware Save Modal ──────────────────────────────────────────────────
function SaveModal({ request, onClose }: { request: RequestConfig; onClose: () => void }) {
  const { collections, addRequestToCollection, addRequestToFolder } = useAppStore();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (overlayRef.current === e.target) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
      addRequestToFolder(selectedCollectionId, selectedFolderId, { ...request, id: uuidv4() });
    } else {
      addRequestToCollection(selectedCollectionId, { ...request, id: uuidv4() });
    }
    onClose();
  };

  const renderFolders = (folders: CollectionFolder[], depth: number): React.ReactNode =>
    folders.map((folder) => {
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedFolderId === folder.id;
      return (
        <div key={folder.id}>
          <div
            onClick={() => { setSelectedFolderId(folder.id); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              paddingLeft: 12 + depth * 16, paddingRight: 10,
              paddingTop: 5, paddingBottom: 5,
              cursor: 'pointer', borderRadius: 4, margin: '1px 4px',
              background: isSelected ? 'rgba(88,166,255,0.15)' : 'none',
              border: isSelected ? '1px solid rgba(88,166,255,0.4)' : '1px solid transparent',
            }}
            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'none'; }}
          >
            <span
              onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
              style={{ color: 'var(--text-muted)', display: 'flex', cursor: 'pointer' }}
            >
              {folder.folders.length > 0
                ? (isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />)
                : <span style={{ width: 12 }} />}
            </span>
            <FolderIcon size={12} style={{ color: 'var(--accent-yellow)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-primary)', flex: 1 }}>{folder.name}</span>
          </div>
          {isExpanded && renderFolders(folder.folders, depth + 1)}
        </div>
      );
    });

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        borderRadius: 10, width: 380, maxHeight: 520,
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
            Save Request
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '10px 12px 6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
          SELECT COLLECTION OR FOLDER
        </div>

        {/* Tree */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 4px 8px' }}>
          {collections.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              No collections yet. Create one first.
            </div>
          ) : collections.map((col) => {
            const isColSelected = selectedCollectionId === col.id && !selectedFolderId;
            return (
              <div key={col.id} style={{ marginBottom: 2 }}>
                <div
                  onClick={() => { setSelectedCollectionId(col.id); setSelectedFolderId(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px', cursor: 'pointer', borderRadius: 5, margin: '1px 4px',
                    background: isColSelected ? 'rgba(88,166,255,0.15)' : 'none',
                    border: isColSelected ? '1px solid rgba(88,166,255,0.4)' : '1px solid transparent',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => { if (!isColSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { if (!isColSelected) e.currentTarget.style.background = 'none'; }}
                >
                  <FolderIcon size={13} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>{col.name}</span>
                  {isColSelected && <Check size={12} style={{ color: 'var(--accent-blue)' }} />}
                </div>
                {col.folders.length > 0 && (
                  <div>{renderFolders(col.folders, 1)}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected destination info */}
        {selectedCollectionId && (
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
            Saving to: <span style={{ color: 'var(--accent-blue)' }}>
              {(() => {
                const col = collections.find(c => c.id === selectedCollectionId);
                if (!selectedFolderId) return col?.name;
                const findFolder = (folders: CollectionFolder[], id: string): string | undefined => {
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
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 5,
              padding: '6px 14px', cursor: 'pointer', color: 'var(--text-secondary)',
              fontSize: '12px', fontFamily: 'Inter, sans-serif',
            }}
          >Cancel</button>
          <button
            onClick={handleSave}
            disabled={!selectedCollectionId}
            style={{
              background: selectedCollectionId ? 'var(--accent-blue)' : 'var(--bg-active)',
              border: 'none', borderRadius: 5,
              padding: '6px 16px', cursor: selectedCollectionId ? 'pointer' : 'not-allowed',
              color: selectedCollectionId ? 'white' : 'var(--text-muted)',
              fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 600,
            }}
          >Save</button>
        </div>
      </div>
    </div>
  );
}

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'var(--method-get)',
  POST: 'var(--method-post)',
  PUT: 'var(--method-put)',
  PATCH: 'var(--method-patch)',
  DELETE: 'var(--method-delete)',
  HEAD: 'var(--method-head)',
  OPTIONS: 'var(--method-options)',
};

type ReqTab = 'params' | 'headers' | 'body' | 'auth';
type ResTab = 'body' | 'headers' | 'info';

interface Props {
  tabId: string;
}

export default function RequestEditor({ tabId }: Props) {
  const [reqTab, setReqTab] = useState<ReqTab>('params');
  const [resTab, setResTab] = useState<ResTab>('body');
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCurlModal, setShowCurlModal] = useState(false);

  const { requests, responses, loadingTabs, updateRequest, setResponse, setLoading, addToHistory, collections } = useAppStore();

  const request = requests[tabId];
  const response = responses[tabId];
  const loading = loadingTabs[tabId] || false;

  if (!request) return null;

  const update = (updates: Partial<RequestConfig>) => updateRequest(tabId, updates);

  const handleSend = async () => {
    if (!request.url) return;
    setLoading(tabId, true);

    try {
      let url = request.url;
      // Resolve env variables {{VAR}}
      const enabledParams = request.params.filter((p) => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const searchParams = new URLSearchParams();
        enabledParams.forEach((p) => searchParams.append(p.key, p.value));
        url += (url.includes('?') ? '&' : '?') + searchParams.toString();
      }

      const headers: Record<string, string> = {};
      request.headers.filter((h) => h.enabled && h.key).forEach((h) => { headers[h.key] = h.value; });

      // Auth
      if (request.auth.type === 'bearer' && request.auth.bearerToken) {
        headers['Authorization'] = `Bearer ${request.auth.bearerToken}`;
      } else if (request.auth.type === 'basic') {
        const encoded = btoa(`${request.auth.basicUsername}:${request.auth.basicPassword}`);
        headers['Authorization'] = `Basic ${encoded}`;
      } else if (request.auth.type === 'api-key' && request.auth.apiKeyIn === 'header') {
        headers[request.auth.apiKeyKey || 'X-API-Key'] = request.auth.apiKeyValue || '';
      }

      let body: string | undefined;
      if (request.body.type === 'json') {
        headers['Content-Type'] = 'application/json';
        body = request.body.content;
      } else if (request.body.type === 'x-www-form-urlencoded') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        const formParams = new URLSearchParams();
        request.body.formData.filter((p) => p.enabled && p.key).forEach((p) => formParams.append(p.key, p.value));
        body = formParams.toString();
      } else if (request.body.type === 'raw') {
        body = request.body.content;
      }

      const isElectron = typeof window !== 'undefined' && !!(window as Window & { electron?: unknown }).electron;

      let data: ResponseData & { error?: string };

      if (isElectron) {
        // In Electron: make the HTTP request directly from the renderer
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
          fetchRes.headers.forEach((v, k) => { resHeaders[k] = v; });
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
            status: 0, statusText: 'Error', headers: {},
            body: err instanceof Error ? err.message : 'Request failed',
            time: Date.now() - startTime, size: 0, requestId: request.id,
            error: err instanceof Error ? err.message : 'Request failed',
          };
        }
      } else {
        // In browser: use the Next.js proxy to avoid CORS
        const proxyRes = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: request.method, url, headers, body }),
        });
        data = await proxyRes.json();
      }

      if (data.error) {
        const errRes: ResponseData = {
          status: 0,
          statusText: 'Error',
          headers: {},
          body: data.error,
          time: 0,
          size: 0,
          requestId: request.id,
        };
        setResponse(tabId, errRes);
      } else {
        const res: ResponseData = { ...data, requestId: request.id };
        setResponse(tabId, res);
        addToHistory({ id: uuidv4(), request, response: res, timestamp: new Date().toISOString() });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setResponse(tabId, { status: 0, statusText: 'Error', headers: {}, body: msg, time: 0, size: 0, requestId: request.id });
    } finally {
      setLoading(tabId, false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 500) return 'var(--accent-red)';
    if (status >= 400) return 'var(--accent-yellow)';
    if (status >= 300) return 'var(--accent-blue)';
    return 'var(--accent-green)';
  };

  const tabBtn = (label: string, tab: ReqTab, count?: number) => (
    <button
      key={tab}
      onClick={() => setReqTab(tab)}
      style={{
        background: reqTab === tab ? 'var(--bg-tertiary)' : 'none',
        border: 'none',
        borderBottom: reqTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
        cursor: 'pointer',
        color: reqTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
        padding: '8px 12px',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span style={{
          background: 'var(--accent-blue)', color: 'white',
          borderRadius: 8, fontSize: '10px', padding: '1px 5px', fontWeight: 600,
        }}>{count}</span>
      )}
    </button>
  );

  const resTabBtn = (label: string, tab: ResTab) => (
    <button
      key={tab}
      onClick={() => setResTab(tab)}
      style={{
        background: resTab === tab ? 'var(--bg-tertiary)' : 'none',
        border: 'none',
        borderBottom: resTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
        cursor: 'pointer',
        color: resTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
        padding: '8px 12px',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
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
      {/* Request Name Bar */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: 'var(--bg-secondary)' }}>
        <input
          value={request.name}
          onChange={(e) => update({ name: e.target.value })}
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600,
            flex: 1, fontFamily: 'Inter, sans-serif',
          }}
          placeholder="Request name"
        />
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSaveModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--bg-active)', border: '1px solid var(--border)',
              borderRadius: 5, padding: '5px 10px', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'Inter, sans-serif',
            }}
          >
            <Save size={13} /> Save
          </button>
        </div>
      </div>
      {showSaveModal && <SaveModal request={request} onClose={() => setShowSaveModal(false)} />}

      {/* URL Bar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMethodMenu(!showMethodMenu)}
            style={{
              background: 'var(--bg-active)', border: '1px solid var(--border)',
              borderRadius: 5, padding: '7px 12px', cursor: 'pointer',
              color: METHOD_COLORS[request.method], fontSize: '12px',
              fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
              display: 'flex', alignItems: 'center', gap: 6, minWidth: 85,
            }}
          >
            {request.method}
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>▼</span>
          </button>
          {showMethodMenu && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: 6, padding: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => { update({ method: m }); setShowMethodMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    cursor: 'pointer', color: METHOD_COLORS[m], fontSize: '12px',
                    fontWeight: 700, padding: '6px 14px', borderRadius: 4,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          value={request.url}
          onChange={(e) => update({ url: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          placeholder="https://api.example.com/endpoint"
          style={{
            flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: 5, padding: '7px 12px', color: 'var(--text-primary)',
            fontSize: '13px', outline: 'none', fontFamily: 'JetBrains Mono, monospace',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />

        <button
          onClick={() => setShowCurlModal(true)}
          title="Import cURL command"
          style={{
            background: 'var(--bg-active)', border: '1px solid var(--border)',
            borderRadius: 5, padding: '7px 12px',
            cursor: 'pointer', color: 'var(--text-secondary)',
            fontSize: '12px', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: 5,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.color = 'var(--accent-blue)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Terminal size={13} />
          cURL
        </button>

        <button
          onClick={handleSend}
          disabled={loading || !request.url}
          style={{
            background: loading ? 'var(--bg-active)' : 'var(--accent-blue)',
            border: 'none', borderRadius: 5, padding: '7px 20px',
            cursor: loading || !request.url ? 'not-allowed' : 'pointer',
            color: 'white', fontSize: '13px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: !request.url ? 0.5 : 1, transition: 'all 0.15s',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {loading ? (
            <div className="loading-spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
          ) : (
            <Send size={14} />
          )}
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Split view: request config + response */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Request Tabs */}
        <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', background: 'var(--bg-secondary)', flexShrink: 0 }}>
          {tabBtn('Params', 'params', request.params.filter((p) => p.enabled && p.key).length)}
          {tabBtn('Headers', 'headers', request.headers.filter((h) => h.enabled && h.key).length)}
          {tabBtn('Body', 'body')}
          {tabBtn('Auth', 'auth')}
        </div>

        {/* Request Body */}
        <div style={{ maxHeight: '40%', overflow: 'auto', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', flexShrink: 0 }}>
          {reqTab === 'params' && (
            <KeyValueEditor
              pairs={request.params}
              onChange={(params) => update({ params })}
              keyPlaceholder="param_key"
              valuePlaceholder="param_value"
              showDescription
            />
          )}
          {reqTab === 'headers' && (
            <KeyValueEditor
              pairs={request.headers}
              onChange={(headers) => update({ headers })}
              keyPlaceholder="Header-Name"
              valuePlaceholder="Header Value"
              showDescription
            />
          )}
          {reqTab === 'body' && (
            <BodyEditor
              body={request.body}
              onChange={(body) => update({ body })}
              method={request.method}
            />
          )}
          {reqTab === 'auth' && (
            <AuthEditor
              auth={request.auth}
              onChange={(auth) => update({ auth })}
            />
          )}
        </div>

        {/* Response */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', flexShrink: 0 }}>
            {resTabBtn('Body', 'body')}
            {resTabBtn('Headers', 'headers')}
            {resTabBtn('Info', 'info')}
            {response && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, paddingRight: 16 }}>
                <span style={{ color: getStatusColor(response.status), fontWeight: 700, fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                  {response.status} {response.statusText}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{response.time}ms</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{formatSize(response.size)}</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {!response && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 8 }}>
                <Send size={32} style={{ opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '13px' }}>Send a request to see the response</p>
              </div>
            )}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 12 }}>
                <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} />
                <p style={{ margin: 0, fontSize: '13px' }}>Waiting for response...</p>
              </div>
            )}
            {response && !loading && (
              <div className="fade-in" style={{ height: '100%' }}>
                {resTab === 'body' && (
                  <ResponseViewer
                    content={response.body}
                    contentType={response.headers['content-type']}
                  />
                )}
                {resTab === 'headers' && (
                  <div style={{ padding: 12 }}>
                    {Object.entries(response.headers).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border-subtle)', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--accent-blue)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', minWidth: 200, flexShrink: 0 }}>{k}</span>
                        <span style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', wordBreak: 'break-all' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {resTab === 'info' && (
                  <div style={{ padding: 16 }}>
                    {[
                      ['Status', `${response.status} ${response.statusText}`],
                      ['Response Time', `${response.time}ms`],
                      ['Response Size', formatSize(response.size)],
                      ['Content-Type', response.headers['content-type'] || 'N/A'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-secondary)', width: 140, flexShrink: 0, fontSize: '12px' }}>{k}</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BodyEditor({ body, onChange, method }: { body: RequestConfig['body']; onChange: (b: RequestConfig['body']) => void; method: HttpMethod }) {
  const bodyTypes = ['none', 'json', 'form-data', 'x-www-form-urlencoded', 'raw'] as const;
  const noBodyMethods: HttpMethod[] = ['GET', 'HEAD', 'OPTIONS'];

  if (noBodyMethods.includes(method)) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
        {method} requests do not have a body
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        {bodyTypes.map((t) => (
          <button
            key={t}
            onClick={() => onChange({ ...body, type: t })}
            style={{
              background: body.type === t ? 'var(--bg-active)' : 'none',
              border: body.type === t ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
              color: body.type === t ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '11px', fontFamily: 'Inter, sans-serif',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {body.type === 'none' && (
        <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          No body
        </div>
      )}

      {(body.type === 'json' || body.type === 'raw') && (
        <textarea
          value={body.content}
          onChange={(e) => onChange({ ...body, content: e.target.value })}
          placeholder={body.type === 'json' ? '{\n  "key": "value"\n}' : 'Enter raw body...'}
          style={{
            width: '100%', minHeight: 120, background: 'var(--bg-primary)',
            border: 'none', outline: 'none', padding: '10px 12px',
            color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px', lineHeight: 1.6, resize: 'vertical',
          }}
        />
      )}

      {(body.type === 'form-data' || body.type === 'x-www-form-urlencoded') && (
        <KeyValueEditor
          pairs={body.formData}
          onChange={(formData) => onChange({ ...body, formData })}
        />
      )}
    </div>
  );
}

function AuthEditor({ auth, onChange }: { auth: RequestConfig['auth']; onChange: (a: RequestConfig['auth']) => void }) {
  const authTypes = ['none', 'bearer', 'basic', 'api-key'] as const;
  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
    borderRadius: 5, padding: '6px 10px', color: 'var(--text-primary)',
    fontSize: '12px', outline: 'none', fontFamily: 'JetBrains Mono, monospace',
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {authTypes.map((t) => (
          <button
            key={t}
            onClick={() => onChange({ ...auth, type: t })}
            style={{
              background: auth.type === t ? 'var(--bg-active)' : 'none',
              border: auth.type === t ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
              color: auth.type === t ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '11px', fontFamily: 'Inter, sans-serif',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {auth.type === 'bearer' && (
        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px', marginBottom: 6, fontWeight: 500 }}>TOKEN</label>
          <input
            type="text"
            value={auth.bearerToken || ''}
            onChange={(e) => onChange({ ...auth, bearerToken: e.target.value })}
            placeholder="Enter bearer token"
            style={{ ...inputStyle, width: '100%' }}
          />
        </div>
      )}

      {auth.type === 'basic' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px', marginBottom: 6, fontWeight: 500 }}>USERNAME</label>
            <input
              value={auth.basicUsername || ''}
              onChange={(e) => onChange({ ...auth, basicUsername: e.target.value })}
              placeholder="Username"
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px', marginBottom: 6, fontWeight: 500 }}>PASSWORD</label>
            <input
              type="password"
              value={auth.basicPassword || ''}
              onChange={(e) => onChange({ ...auth, basicPassword: e.target.value })}
              placeholder="Password"
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
        </div>
      )}

      {auth.type === 'api-key' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12 }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px', marginBottom: 6, fontWeight: 500 }}>KEY</label>
            <input
              value={auth.apiKeyKey || ''}
              onChange={(e) => onChange({ ...auth, apiKeyKey: e.target.value })}
              placeholder="X-API-Key"
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px', marginBottom: 6, fontWeight: 500 }}>VALUE</label>
            <input
              value={auth.apiKeyValue || ''}
              onChange={(e) => onChange({ ...auth, apiKeyValue: e.target.value })}
              placeholder="API key value"
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px', marginBottom: 6, fontWeight: 500 }}>ADD TO</label>
            <select
              value={auth.apiKeyIn || 'header'}
              onChange={(e) => onChange({ ...auth, apiKeyIn: e.target.value as 'header' | 'query' })}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="header">Header</option>
              <option value="query">Query</option>
            </select>
          </div>
        </div>
      )}

      {auth.type === 'none' && (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No authentication</div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
