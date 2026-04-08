"use client";
import { Collection, RequestConfig } from "@/types";
import CollectionNode from "./CollectionNode";

interface Props {
  activeTab: string;
  filteredCollections: Collection[];
  openTab: (r: RequestConfig) => void;
  onExport: (c: Collection) => void;
  onOpenProperties: (cid: string, fid?: string) => void;
  canEdit: boolean;
}

export default function SidebarTreeView({
  activeTab,
  filteredCollections,
  openTab,
  onExport,
  onOpenProperties,
  canEdit,
}: Props) {
  return (
    <div style={{ flex: 1, overflow: "auto", paddingBottom: 20 }}>
      {activeTab === "collections" && (
        <div>
          {filteredCollections.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "12px",
              }}
            >
              No collections found
            </div>
          ) : (
            filteredCollections.map((c) => (
              <CollectionNode
                key={c.id}
                collection={c}
                onOpen={openTab}
                onExport={onExport}
                onOpenProperties={(cid, fid) => onOpenProperties(cid, fid)}
                canEdit={canEdit}
              />
            ))
          )}
        </div>
      )}
      {activeTab === "history" && (
        <div
          style={{
            padding: 20,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "12px",
          }}
        >
          History logic goes here...
        </div>
      )}
      {activeTab === "environments" && (
        <div
          style={{
            padding: 20,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "12px",
          }}
        >
          Environments logic goes here...
        </div>
      )}
      {activeTab === "team" && (
        <div
          style={{
            padding: 20,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "12px",
          }}
        >
          Team logic goes here...
        </div>
      )}
    </div>
  );
}
