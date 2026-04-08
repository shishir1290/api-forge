import { Collection, RequestConfig, Environment } from "@/types";
import CollectionNode from "./CollectionNode";
import EnvironmentPanel from "./EnvironmentPanel";
import TeamPanel from "./TeamPanel";

interface Props {
  activeTab: string;
  filteredCollections: Collection[];
  openTab: (r: RequestConfig) => void;
  onExport: (c: Collection) => void;
  onOpenProperties: (cid: string, fid?: string) => void;
  onEditEnv: (env: Environment) => void;
  onInvite: () => void;
  canEdit: boolean;
}

export default function SidebarTreeView({
  activeTab,
  filteredCollections,
  openTab,
  onExport,
  onOpenProperties,
  onEditEnv,
  onInvite,
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
      {activeTab === "environments" && <EnvironmentPanel onEdit={onEditEnv} />}
      {activeTab === "team" && <TeamPanel onInvite={onInvite} />}
    </div>
  );
}
