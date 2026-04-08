"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, FolderIcon, X, Check } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "@/store/useAppStore";
import { CollectionFolder, RequestConfig } from "@/types";

interface Props {
  request: RequestConfig;
  onClose: () => void;
}

export default function SaveModal({ request, onClose }: Props) {
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
            onClick={() => setSelectedFolderId(folder.id)}
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

        <div style={{ flex: 1, overflow: "auto", padding: "8px 4px" }}>
          {collections.map((col) => {
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
                    <Check size={12} style={{ color: "var(--accent-blue)" }} />
                  )}
                </div>
                {col.folders.length > 0 && (
                  <div>{renderFolders(col.folders, 1)}</div>
                )}
              </div>
            );
          })}
        </div>

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
