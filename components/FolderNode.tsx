"use client";
import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FolderIcon,
  FileCode2,
  FolderPlus,
  Edit2,
  SlidersHorizontal,
  Trash2,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { CollectionFolder, RequestConfig } from "@/types";
import RequestRow from "./RequestRow";
import { SidebarContextMenu, InlineRename, CtxMenu } from "./SidebarUtils";
import { useAppStore } from "@/store/useAppStore";

interface Props {
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
  canEdit: boolean;
}

export default function FolderNode({
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
  canEdit,
}: Props) {
  const { expandedSidebarIds, toggleSidebarExpansion } = useAppStore();
  const expanded = expandedSidebarIds.includes(folder.id);
  const [hover, setHover] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  const setExpanded = (val: boolean) => toggleSidebarExpansion(folder.id, val);

  const totalItems = folder.requests.length + folder.folders.length;

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
          {hover && !renaming && canEdit && (
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
                }}
                title="Add sub-folder"
              >
                <FolderPlus size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCtx(e as any);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 2,
                  display: "flex",
                }}
              >
                <MoreHorizontal size={12} />
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <div>
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
                canEdit={canEdit}
              />
            ))}
            {folder.requests.map((req) => (
              <RequestRow
                key={req.id}
                request={req}
                depth={depth + 1}
                collectionId={collectionId}
                onOpen={() => onOpenRequest(req)}
                onDelete={() => onDeleteRequest(req.id)}
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
