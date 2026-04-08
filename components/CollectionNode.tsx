"use client";
import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileCode2,
  FolderPlus,
  Edit2,
  FileDown,
  SlidersHorizontal,
  Trash2,
  Plus,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "@/store/useAppStore";
import FolderNode from "./FolderNode";
import RequestRow from "./RequestRow";
import { SidebarContextMenu, InlineRename, CtxMenu } from "./SidebarUtils";
import { Collection, RequestConfig } from "@/types";

interface Props {
  collection: Collection;
  onOpen: (r: RequestConfig) => void;
  onExport: (c: Collection) => void;
  onOpenProperties: (collectionId: string, folderId?: string) => void;
  canEdit: boolean;
}

export default function CollectionNode({
  collection,
  onOpen,
  onExport,
  onOpenProperties,
  canEdit,
}: Props) {
  const {
    deleteCollection,
    updateCollection,
    addFolderToCollection,
    addRequestToCollection,
    addRequestToFolder,
    deleteFolderFromCollection,
    renameFolderInCollection,
    deleteRequestFromCollection,
    deleteRequestFromFolder,
    expandedSidebarIds,
    toggleSidebarExpansion,
  } = useAppStore();

  const expanded = expandedSidebarIds.includes(collection.id);
  const [hover, setHover] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  const setExpanded = (val: boolean) =>
    toggleSidebarExpansion(collection.id, val);

  const handleCtx = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canEdit) return;
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: "Add Request",
          icon: <FileCode2 size={13} />,
          onClick: () => {
            const r = {
              id: uuidv4(),
              name: "New Request",
              method: "GET",
              url: "",
              headers: [],
              params: [],
              body: { type: "none", content: "", formData: [] },
              auth: { type: "inherit" },
            } as any;
            addRequestToCollection(collection.id, r);
            onOpen(r);
            setExpanded(true);
          },
        },
        {
          label: "Add Folder",
          icon: <FolderPlus size={13} />,
          onClick: () => {
            addFolderToCollection(collection.id, "New Folder", null);
            setExpanded(true);
          },
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
          )}
        </div>
        {expanded && (
          <div>
            {collection.folders.map((f) => (
              <FolderNode
                key={f.id}
                folder={f}
                depth={1}
                collectionId={collection.id}
                onOpenRequest={onOpen}
                onAddRequest={(fid) => {
                  const r = {
                    id: uuidv4(),
                    name: "New Request",
                    method: "GET",
                    url: "",
                    headers: [],
                    params: [],
                    body: { type: "none", content: "", formData: [] },
                    auth: { type: "inherit" },
                  } as any;
                  addRequestToFolder(collection.id, fid, r);
                  onOpen(r);
                }}
                onAddFolder={(fid) =>
                  addFolderToCollection(collection.id, "New Folder", fid)
                }
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
                canEdit={canEdit}
              />
            ))}
            {collection.requests.map((r) => (
              <RequestRow
                key={r.id}
                request={r}
                depth={1}
                collectionId={collection.id}
                onOpen={() => onOpen(r)}
                onDelete={() =>
                  deleteRequestFromCollection(collection.id, r.id)
                }
              />
            ))}
          </div>
        )}
      </div>
      {ctxMenu && (
        <SidebarContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} />
      )}
    </>
  );
}
