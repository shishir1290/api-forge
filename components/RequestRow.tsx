"use client";
import { useState } from "react";
import { FileCode2, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import MethodBadge from "./MethodBadge";
import { SidebarContextMenu, InlineRename, CtxMenu } from "./SidebarUtils";
import { RequestConfig } from "@/types";

interface Props {
  request: RequestConfig;
  depth: number;
  collectionId: string;
  onOpen: () => void;
  onDelete: () => void;
}

export default function RequestRow({
  request,
  depth,
  collectionId,
  onOpen,
  onDelete,
}: Props) {
  const [hover, setHover] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const { updateRequestInCollection, activeTabId, tabs } = useAppStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isActive = activeTab?.requestId === request.id;

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
          background: isActive
            ? "var(--bg-active)"
            : hover
              ? "var(--bg-hover)"
              : "none",
          borderRadius: 4,
          margin: "1px 4px",
          borderLeft: isActive ? "2px solid var(--accent-blue)" : "none",
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
        )}
      </div>
      {ctxMenu && (
        <SidebarContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} />
      )}
    </>
  );
}
