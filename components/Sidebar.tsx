"use client";
import { useState, useRef, useEffect } from "react";
import {
  FolderOpen,
  FolderPlus,
  Plus,
  ChevronRight,
  ChevronDown,
  Trash2,
  Search,
  X,
  Clock,
  Settings,
  History,
  FolderIcon,
  FileCode2,
  MoreHorizontal,
  Edit2,
  Check,
  Users,
  FileDown,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "@/store/useAppStore";
import MethodBadge from "./MethodBadge";
import TeamPanel from "./TeamPanel";
import ImportModal from "./ImportModal";
import ExportModal from "./ExportModal";
import EnvironmentModal from "./EnvironmentModal";
import {
  Globe,
  Layers,
  CheckCircle2 as CheckCircle,
  HelpCircle,
  SlidersHorizontal,
} from "lucide-react";
import FolderPropertiesModal from "./FolderPropertiesModal";
import type {
  Collection,
  CollectionFolder,
  RequestConfig,
  Environment,
} from "@/types";

type SidebarTab = "collections" | "history" | "environments" | "team";

// ─── Context menu ─────────────────────────────────────────────────────────────
interface CtxMenu {
  x: number;
  y: number;
  items: {
    label: string;
    icon?: React.ReactNode;
    danger?: boolean;
    onClick: () => void;
  }[];
}

function ContextMenu({
  menu,
  onClose,
}: {
  menu: CtxMenu;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        zIndex: 9999,
        left: Math.min(menu.x, window.innerWidth - 200),
        top: Math.min(menu.y, window.innerHeight - menu.items.length * 34 - 12),
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 4,
        minWidth: 180,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {menu.items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "7px 12px",
            borderRadius: 5,
            color: item.danger ? "var(--accent-red)" : "var(--text-primary)",
            fontSize: "12px",
            fontFamily: "Inter, sans-serif",
            textAlign: "left",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-hover)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          {item.icon && <span style={{ opacity: 0.7 }}>{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Inline rename input ──────────────────────────────────────────────────────
function InlineRename({
  value,
  onConfirm,
  onCancel,
}: {
  value: string;
  onConfirm: (v: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);
  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onConfirm(text);
        if (e.key === "Escape") onCancel();
        e.stopPropagation();
      }}
      onBlur={() => onConfirm(text)}
      onClick={(e) => e.stopPropagation()}
      style={{
        flex: 1,
        background: "var(--bg-active)",
        border: "1px solid var(--accent-blue)",
        borderRadius: 3,
        padding: "2px 6px",
        color: "var(--text-primary)",
        fontSize: "12px",
        outline: "none",
        fontFamily: "Inter, sans-serif",
        minWidth: 0,
      }}
    />
  );
}

// ─── Request row ──────────────────────────────────────────────────────────────
function RequestRow({
  request,
  depth,
  collectionId,
  folderId,
  onOpen,
  onDelete,
}: {
  request: RequestConfig;
  depth: number;
  collectionId: string;
  folderId?: string;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const { updateRequestInCollection } = useAppStore();

  const handleCtx = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: "Open", icon: <FileCode2 size={13} />, onClick: onOpen },
        {
          label: "Rename",
          icon: <Edit2 size={13} />,
          onClick: () => setRenaming(true),
        },
        {
          label: "Delete",
          icon: <Trash2 size={13} />,
          danger: true,
          onClick: onDelete,
        },
      ],
    });
  };

  return (
    <>
      <div
        onClick={onOpen}
        onContextMenu={handleCtx}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          paddingLeft: 8 + depth * 16,
          paddingRight: 6,
          paddingTop: 4,
          paddingBottom: 4,
          cursor: "pointer",
          background: hover ? "var(--bg-hover)" : "none",
          borderRadius: 4,
          margin: "1px 4px",
        }}
      >
        <FileCode2
          size={12}
          style={{ color: "var(--text-muted)", flexShrink: 0 }}
        />
        {renaming ? (
          <InlineRename
            value={request.name}
            onConfirm={(name) => {
              updateRequestInCollection(collectionId, request.id, { name });
              setRenaming(false);
            }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <MethodBadge method={request.method} small />
            <span
              style={{
                flex: 1,
                fontSize: "12px",
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {request.name}
            </span>
          </>
        )}
        {hover && !renaming && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCtx(e as unknown as React.MouseEvent);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 2,
              display: "flex",
              borderRadius: 3,
            }}
          >
            <MoreHorizontal size={12} />
          </button>
        )}
      </div>
      {ctxMenu && (
        <ContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} />
      )}
    </>
  );
}

// ─── Folder node (recursive) ──────────────────────────────────────────────────
function FolderNode({
  folder,
  depth,
  collectionId,
  onOpenRequest,
  onAddRequest,
  onAddFolder,
  onDeleteFolder,
  onRenameFolder,
  onDeleteRequest,
  onOpenProperties,
}: {
  folder: CollectionFolder;
  depth: number;
  collectionId: string;
  onOpenRequest: (r: RequestConfig) => void;
  onAddRequest: (folderId: string) => void;
  onAddFolder: (parentFolderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteRequest: (requestId: string) => void;
  onOpenProperties: (collectionId: string, folderId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  const totalItems = folder.requests.length + folder.folders.length;

  const handleCtx = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: "Add Request",
          icon: <FileCode2 size={13} />,
          onClick: () => {
            onAddRequest(folder.id);
            setExpanded(true);
          },
        },
        {
          label: "Add Sub-folder",
          icon: <FolderPlus size={13} />,
          onClick: () => {
            onAddFolder(folder.id);
            setExpanded(true);
          },
        },
        {
          label: "Rename",
          icon: <Edit2 size={13} />,
          onClick: () => setRenaming(true),
        },
        {
          label: "Properties",
          icon: <SlidersHorizontal size={13} />,
          onClick: () => onOpenProperties(collectionId, folder.id),
        },
        {
          label: "Delete Folder",
          icon: <Trash2 size={13} />,
          danger: true,
          onClick: () => onDeleteFolder(folder.id),
        },
      ],
    });
  };

  return (
    <>
      <div>
        {/* Folder header */}
        <div
          onClick={() => setExpanded(!expanded)}
          onContextMenu={handleCtx}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            paddingLeft: 4 + depth * 16,
            paddingRight: 6,
            paddingTop: 5,
            paddingBottom: 5,
            cursor: "pointer",
            background: hover ? "var(--bg-hover)" : "none",
            borderRadius: 4,
            margin: "1px 4px",
          }}
        >
          <span
            style={{
              color: "var(--text-muted)",
              display: "flex",
              flexShrink: 0,
            }}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
          <FolderIcon
            size={13}
            style={{
              color: expanded ? "var(--accent-yellow)" : "var(--text-muted)",
              flexShrink: 0,
            }}
          />
          {renaming ? (
            <InlineRename
              value={folder.name}
              onConfirm={(name) => {
                onRenameFolder(folder.id, name);
                setRenaming(false);
              }}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            <>
              <span
                style={{
                  flex: 1,
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {folder.name}
              </span>
              {totalItems > 0 && (
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    background: "var(--bg-active)",
                    borderRadius: 8,
                    padding: "1px 5px",
                    flexShrink: 0,
                  }}
                >
                  {totalItems}
                </span>
              )}
            </>
          )}
          {hover && !renaming && (
            <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddRequest(folder.id);
                  setExpanded(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--accent-blue)",
                  padding: 2,
                  display: "flex",
                  borderRadius: 3,
                }}
                title="Add request"
              >
                <Plus size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFolder(folder.id);
                  setExpanded(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 2,
                  display: "flex",
                  borderRadius: 3,
                }}
                title="Add sub-folder"
              >
                <FolderPlus size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCtx(e as unknown as React.MouseEvent);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 2,
                  display: "flex",
                  borderRadius: 3,
                }}
              >
                <MoreHorizontal size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {expanded && (
          <div>
            {/* Sub-folders first */}
            {folder.folders.map((sub) => (
              <FolderNode
                key={sub.id}
                folder={sub}
                depth={depth + 1}
                collectionId={collectionId}
                onOpenRequest={onOpenRequest}
                onAddRequest={onAddRequest}
                onAddFolder={onAddFolder}
                onDeleteFolder={onDeleteFolder}
                onRenameFolder={onRenameFolder}
                onDeleteRequest={onDeleteRequest}
                onOpenProperties={onOpenProperties}
              />
            ))}
            {/* Requests */}
            {folder.requests.map((req) => (
              <div key={req.id}>
                <RequestRow
                  request={req}
                  depth={depth + 1}
                  collectionId={collectionId}
                  folderId={folder.id}
                  onOpen={() => onOpenRequest(req)}
                  onDelete={() => onDeleteRequest(req.id)}
                />
                {req.examples && req.examples.length > 0 && (
                  <div style={{ paddingLeft: (depth + 2) * 16 }}>
                    {req.examples.map((ex) => (
                      <div
                        key={ex.id}
                        onClick={() => onOpenRequest(ex.request)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "3px 8px",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--text-primary)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--text-muted)")
                        }
                      >
                        <ChevronRight size={10} />
                        <span>{ex.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {folder.folders.length === 0 && folder.requests.length === 0 && (
              <div
                style={{
                  paddingLeft: 8 + (depth + 1) * 16,
                  paddingTop: 4,
                  paddingBottom: 4,
                  color: "var(--text-muted)",
                  fontSize: "11px",
                }}
              >
                Empty folder
              </div>
            )}
          </div>
        )}
      </div>
      {ctxMenu && (
        <ContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} />
      )}
    </>
  );
}

// ─── Collection node ──────────────────────────────────────────────────────────
function CollectionNode({
  collection,
  onOpen,
  onExport,
  onOpenProperties,
}: {
  collection: Collection;
  onOpen: (r: RequestConfig) => void;
  onExport: (c: Collection) => void;
  onOpenProperties: (collectionId: string, folderId?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  const {
    deleteCollection,
    updateCollection,
    addFolderToCollection,
    renameFolderInCollection,
    deleteFolderFromCollection,
    addRequestToCollection,
    addRequestToFolder,
    deleteRequestFromCollection,
    deleteRequestFromFolder,
  } = useAppStore();

  const totalItems = collection.requests.length + collection.folders.length;

  const createRequest = (): RequestConfig => ({
    id: uuidv4(),
    name: "New Request",
    method: "GET",
    url: "",
    headers: [],
    params: [],
    body: { type: "none", content: "", formData: [] },
    auth: { type: "inherit" },
  });

  const handleAddRootRequest = () => {
    const req = createRequest();
    addRequestToCollection(collection.id, req);
    onOpen(req);
    setExpanded(true);
  };

  const handleAddFolderRequest = (folderId: string) => {
    const req = createRequest();
    addRequestToFolder(collection.id, folderId, req);
    onOpen(req);
  };

  const handleAddFolder = (parentFolderId?: string | null) => {
    addFolderToCollection(collection.id, "New Folder", parentFolderId);
    setExpanded(true);
  };

  const handleCtx = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: "Add Request",
          icon: <FileCode2 size={13} />,
          onClick: handleAddRootRequest,
        },
        {
          label: "Add Folder",
          icon: <FolderPlus size={13} />,
          onClick: () => handleAddFolder(null),
        },
        {
          label: "Rename",
          icon: <Edit2 size={13} />,
          onClick: () => setRenaming(true),
        },
        {
          label: "Export",
          icon: <FileDown size={13} />,
          onClick: () => onExport(collection),
        },
        {
          label: "Properties",
          icon: <SlidersHorizontal size={13} />,
          onClick: () => onOpenProperties(collection.id),
        },
        {
          label: "Delete Collection",
          icon: <Trash2 size={13} />,
          danger: true,
          onClick: () => deleteCollection(collection.id),
        },
      ],
    });
  };

  return (
    <>
      <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {/* Collection header */}
        <div
          onClick={() => setExpanded(!expanded)}
          onContextMenu={handleCtx}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "7px 8px",
            cursor: "pointer",
            background: hover ? "var(--bg-hover)" : "none",
          }}
        >
          <span
            style={{
              color: "var(--text-muted)",
              display: "flex",
              flexShrink: 0,
            }}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
          <FolderOpen
            size={13}
            style={{ color: "var(--accent-yellow)", flexShrink: 0 }}
          />
          {renaming ? (
            <InlineRename
              value={collection.name}
              onConfirm={(name) => {
                updateCollection(collection.id, { name });
                setRenaming(false);
              }}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            <>
              <span
                style={{
                  flex: 1,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {collection.name}
              </span>
              {totalItems > 0 && (
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    background: "var(--bg-active)",
                    borderRadius: 8,
                    padding: "1px 5px",
                    flexShrink: 0,
                  }}
                >
                  {totalItems}
                </span>
              )}
            </>
          )}
          {hover && !renaming && (
            <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddRootRequest();
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--accent-blue)",
                  padding: "2px 3px",
                  display: "flex",
                  borderRadius: 3,
                }}
                title="Add request"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddFolder(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "2px 3px",
                  display: "flex",
                  borderRadius: 3,
                }}
                title="Add folder"
              >
                <FolderPlus size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCtx(e as unknown as React.MouseEvent);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "2px 3px",
                  display: "flex",
                  borderRadius: 3,
                }}
              >
                <MoreHorizontal size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Collection children */}
        {expanded && (
          <div style={{ paddingBottom: 4 }}>
            {/* Root-level folders */}
            {collection.folders.map((folder) => (
              <FolderNode
                key={folder.id}
                folder={folder}
                depth={1}
                collectionId={collection.id}
                onOpenRequest={onOpen}
                onAddRequest={(fid) => handleAddFolderRequest(fid)}
                onAddFolder={(pid) => handleAddFolder(pid)}
                onDeleteFolder={(fid) =>
                  deleteFolderFromCollection(collection.id, fid)
                }
                onRenameFolder={(fid, name) =>
                  renameFolderInCollection(collection.id, fid, name)
                }
                onDeleteRequest={(rid) =>
                  deleteRequestFromCollection(collection.id, rid)
                }
                onOpenProperties={onOpenProperties}
              />
            ))}
            {/* Root-level requests */}
            {collection.requests.map((req) => (
              <div key={req.id}>
                <RequestRow
                  request={req}
                  depth={1}
                  collectionId={collection.id}
                  onOpen={() => onOpen(req)}
                  onDelete={() =>
                    deleteRequestFromCollection(collection.id, req.id)
                  }
                />
                {req.examples && req.examples.length > 0 && (
                  <div style={{ paddingLeft: 32 }}>
                    {req.examples.map((ex) => (
                      <div
                        key={ex.id}
                        onClick={() => onOpen(ex.request)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "3px 8px",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--text-primary)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--text-muted)")
                        }
                      >
                        <ChevronRight size={10} />
                        <span>{ex.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {collection.folders.length === 0 &&
              collection.requests.length === 0 && (
                <div
                  style={{
                    paddingLeft: 24,
                    paddingTop: 4,
                    paddingBottom: 4,
                    color: "var(--text-muted)",
                    fontSize: "11px",
                  }}
                >
                  Right-click to add items
                </div>
              )}
          </div>
        )}
      </div>
      {ctxMenu && (
        <ContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} />
      )}
    </>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>("collections");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewEnv, setShowNewEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [collectionToExport, setCollectionToExport] =
    useState<Collection | null>(null);
  const [envToEdit, setEnvToEdit] = useState<Environment | null>(null);
  const [envSearch, setEnvSearch] = useState("");
  const [propModalOpen, setPropModalOpen] = useState(false);
  const [propColId, setPropColId] = useState<string | null>(null);
  const [propFolderId, setPropFolderId] = useState<string | undefined>(
    undefined,
  );

  const {
    collections,
    addCollection,
    history,
    clearHistory,
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
    addEnvironment,
    deleteEnvironment,
    openTab,
    importFullCollections,
  } = useAppStore();

  const handleAddCollection = () => {
    if (!newCollectionName.trim()) return;
    addCollection(newCollectionName.trim());
    setNewCollectionName("");
    setShowNewCollection(false);
  };

  const filteredCollections = searchQuery
    ? collections.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.requests.some(
            (r) =>
              r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              r.url.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
    : collections;

  const tabBtn = (id: SidebarTab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1,
        background: activeTab === id ? "var(--bg-active)" : "none",
        border: "none",
        borderBottom:
          activeTab === id
            ? "2px solid var(--accent-blue)"
            : "2px solid transparent",
        cursor: "pointer",
        color:
          activeTab === id ? "var(--text-primary)" : "var(--text-secondary)",
        padding: "8px 4px",
        fontSize: "10px",
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        letterSpacing: "0.05em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "11px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "linear-gradient(135deg, #58a6ff 0%, #bc8cff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 14,
            color: "white",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(88,166,255,0.3)",
          }}
        >
          A
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}
        >
          APIForge
        </span>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        {tabBtn("collections", <FolderOpen size={11} />, "COLS")}
        {tabBtn("history", <History size={11} />, "HIST")}
        {tabBtn("environments", <Settings size={11} />, "ENV")}
        {tabBtn("team", <Users size={11} />, "TEAM")}
      </div>

      {/* Search */}
      <div
        style={{
          padding: "7px 8px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            size={11}
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              padding: "5px 8px 5px 26px",
              color: "var(--text-primary)",
              fontSize: "12px",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent-blue)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* ── Collections tab ── */}
        {activeTab === "collections" && (
          <div>
            <div
              style={{
                padding: "6px 8px",
                display: "flex",
                justifyContent: "flex-end",
                gap: 6,
              }}
            >
              <button
                onClick={() => setShowImportModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: 5,
                  padding: "4px 10px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: "11px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <FileDown size={12} /> Import
              </button>
              <button
                onClick={() => setShowNewCollection(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "var(--bg-active)",
                  border: "1px solid var(--border)",
                  borderRadius: 5,
                  padding: "4px 10px",
                  cursor: "pointer",
                  color: "var(--accent-blue)",
                  fontSize: "11px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <FolderPlus size={12} /> New Collection
              </button>
            </div>

            {showNewCollection && (
              <div
                style={{
                  padding: "6px 8px",
                  display: "flex",
                  gap: 4,
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <input
                  autoFocus
                  placeholder="Collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCollection();
                    if (e.key === "Escape") {
                      setShowNewCollection(false);
                      setNewCollectionName("");
                    }
                  }}
                  style={{
                    flex: 1,
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--accent-blue)",
                    borderRadius: 4,
                    padding: "4px 8px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleAddCollection}
                  style={{
                    background: "var(--accent-blue)",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 8px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "12px",
                    display: "flex",
                  }}
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setShowNewCollection(false);
                    setNewCollectionName("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {filteredCollections.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              >
                {searchQuery ? (
                  "No results"
                ) : (
                  <>
                    No collections yet.
                    <br />
                    Click "New Collection" to start.
                  </>
                )}
              </div>
            ) : (
              filteredCollections.map((col) => (
                <CollectionNode
                  key={col.id}
                  collection={col}
                  onOpen={openTab}
                  onExport={(c) => setCollectionToExport(c)}
                  onOpenProperties={(colId, folderId) => {
                    setPropColId(colId);
                    setPropFolderId(folderId);
                    setPropModalOpen(true);
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* ── History tab ── */}
        {activeTab === "history" && (
          <div>
            {history.length > 0 && (
              <div
                style={{
                  padding: "6px 8px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={clearHistory}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "4px 8px",
                    cursor: "pointer",
                    color: "var(--accent-red)",
                    fontSize: "11px",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
            {history.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                }}
              >
                No history yet
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openTab(item.request)}
                  style={{
                    padding: "7px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <MethodBadge method={item.request.method} small />
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.request.name}
                    </span>
                    <span
                      className={`mono`}
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color:
                          item.response.status >= 500
                            ? "var(--accent-red)"
                            : item.response.status >= 400
                              ? "var(--accent-yellow)"
                              : item.response.status >= 300
                                ? "var(--accent-blue)"
                                : "var(--accent-green)",
                      }}
                    >
                      {item.response.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Clock size={10} />
                    {new Date(item.timestamp).toLocaleTimeString()}
                    <span style={{ marginLeft: "auto" }}>
                      {item.response.time}ms
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {item.request.url}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Environments tab ── */}
        {activeTab === "environments" && (
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            {/* Header Path */}
            <div
              style={{
                padding: "12px 16px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>
                PSL - WorkSpace
              </span>
              <ChevronRight size={14} />
              <span style={{ color: "var(--text-primary)" }}>Environments</span>
            </div>

            {/* Global Entry */}
            <div
              onClick={() => setActiveEnvironment("global")}
              style={{
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                background:
                  activeEnvironmentId === "global"
                    ? "rgba(88,166,255,0.05)"
                    : "transparent",
                color:
                  activeEnvironmentId === "global"
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                transition: "all 0.2s",
              }}
            >
              <Globe size={16} />
              <span style={{ fontSize: "14px", fontWeight: 500 }}>Global</span>
              <div style={{ marginLeft: "auto" }}>
                <MoreHorizontal
                  size={14}
                  onClick={(e) => {
                    e.stopPropagation();
                    const globalEnv = environments.find(
                      (ev) => ev.id === "global",
                    );
                    if (globalEnv) setEnvToEdit(globalEnv);
                  }}
                />
              </div>
            </div>

            <div style={{ padding: "8px 16px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Search
              </div>
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
                  value={envSearch}
                  onChange={(e) => setEnvSearch(e.target.value)}
                  placeholder="Search..."
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    borderRadius: 4,
                    padding: "6px 10px 6px 32px",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setShowNewEnv(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  <Plus size={18} /> New
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: "var(--text-muted)",
                }}
              >
                <HelpCircle size={16} cursor="pointer" />
                <FolderIcon size={16} cursor="pointer" />
              </div>
            </div>

            {showNewEnv && (
              <div
                style={{
                  padding: "8px 16px",
                  display: "flex",
                  gap: 6,
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <input
                  autoFocus
                  placeholder="Environment name"
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (newEnvName.trim()) addEnvironment(newEnvName.trim());
                      setNewEnvName("");
                      setShowNewEnv(false);
                    }
                    if (e.key === "Escape") {
                      setShowNewEnv(false);
                      setNewEnvName("");
                    }
                  }}
                  style={{
                    flex: 1,
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--accent-blue)",
                    borderRadius: 4,
                    padding: "4px 8px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => {
                    if (newEnvName.trim()) addEnvironment(newEnvName.trim());
                    setNewEnvName("");
                    setShowNewEnv(false);
                  }}
                  style={{
                    background: "var(--accent-blue)",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 8px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "12px",
                  }}
                >
                  <Check size={14} />
                </button>
              </div>
            )}

            <div style={{ flex: 1, overflowY: "auto" }}>
              {environments.filter(
                (e) =>
                  e.id !== "global" &&
                  e.name.toLowerCase().includes(envSearch.toLowerCase()),
              ).length === 0 ? (
                <div
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                  }}
                >
                  No environments found
                </div>
              ) : (
                environments
                  .filter(
                    (e) =>
                      e.id !== "global" &&
                      e.name.toLowerCase().includes(envSearch.toLowerCase()),
                  )
                  .map((env) => (
                    <div
                      key={env.id}
                      onClick={() => setActiveEnvironment(env.id)}
                      style={{
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        background:
                          activeEnvironmentId === env.id
                            ? "rgba(63,185,80,0.05)"
                            : "transparent",
                        transition: "all 0.2s",
                      }}
                    >
                      {activeEnvironmentId === env.id ? (
                        <CheckCircle size={16} color="var(--accent-green)" />
                      ) : (
                        <Layers size={16} color="var(--text-muted)" />
                      )}
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight:
                            activeEnvironmentId === env.id ? 600 : 400,
                          color:
                            activeEnvironmentId === env.id
                              ? "var(--accent-blue)"
                              : "var(--text-primary)",
                        }}
                      >
                        {env.name}
                      </span>
                      <div
                        style={{
                          marginLeft: "auto",
                          color: "var(--text-muted)",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEnvToEdit(env);
                        }}
                      >
                        <MoreHorizontal size={14} />
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* ── Team tab ── */}
        {activeTab === "team" && <TeamPanel />}
      </div>

      {showImportModal && (
        <ImportModal
          onImport={(cols) => importFullCollections(cols)}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {collectionToExport && (
        <ExportModal
          collection={collectionToExport}
          onClose={() => setCollectionToExport(null)}
        />
      )}

      {envToEdit && (
        <EnvironmentModal
          environment={envToEdit}
          onClose={() => setEnvToEdit(null)}
        />
      )}

      {propModalOpen && propColId && (
        <FolderPropertiesModal
          isOpen={propModalOpen}
          onClose={() => setPropModalOpen(false)}
          collectionId={propColId}
          folderId={propFolderId}
        />
      )}
    </div>
  );
}
