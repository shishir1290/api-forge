"use client";
import {
  Users,
  MoreHorizontal,
  UserPlus,
  Shield,
  UserMinus,
  Mail,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";
import { SidebarContextMenu, CtxMenu } from "./SidebarUtils";
import { TeamMember, TeamRole } from "@/types";

interface Props {
  onInvite: () => void;
}

export default function TeamPanel({ onInvite }: Props) {
  const { workspace, user, removeMember, updateMemberRole } = useAppStore();
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  const currentUserRole =
    workspace.members.find((m) => m.id === user?.id)?.role || "viewer";
  const canManage = ["owner", "admin"].includes(currentUserRole);

  const handleCtx = (e: React.MouseEvent, member: TeamMember) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canManage || member.id === user?.id) return;

    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: "Promote to Admin",
          icon: <Shield size={13} />,
          onClick: () => updateMemberRole(member.id, "admin" as TeamRole),
        },
        {
          label: "Set as Editor",
          icon: <Users size={13} />,
          onClick: () => updateMemberRole(member.id, "editor" as TeamRole),
        },
        {
          label: "Set as Viewer",
          icon: <Users size={13} />,
          onClick: () => updateMemberRole(member.id, "viewer" as TeamRole),
        },
        {
          label: "Remove Member",
          icon: <UserMinus size={13} />,
          danger: true,
          onClick: () => {
            if (confirm(`Remove ${member.name} from workspace?`)) {
              removeMember(member.id);
            }
          },
        },
      ],
    });
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
      <div
        style={{
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text-muted)",
            letterSpacing: "0.05em",
          }}
        >
          MEMBERS ({workspace.members.length})
        </span>
        {canManage && (
          <button
            onClick={onInvite}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-blue)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            <UserPlus size={14} /> Invite
          </button>
        )}
      </div>

      <div style={{ padding: "0 8px" }}>
        {workspace.members.map((member) => (
          <div
            key={member.id}
            onContextMenu={(e) => handleCtx(e, member)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 8,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--accent-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {member.name[0]}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {member.name} {member.id === user?.id && "(You)"}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "1px 6px",
                    borderRadius: 10,
                    background: "var(--bg-active)",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  {member.role}
                </span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {member.email}
              </div>
            </div>

            {canManage && member.id !== user?.id && (
              <button
                onClick={(e) => handleCtx(e, member)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                  opacity: 0.6,
                }}
              >
                <MoreHorizontal size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {ctxMenu && (
        <SidebarContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} />
      )}
    </div>
  );
}
