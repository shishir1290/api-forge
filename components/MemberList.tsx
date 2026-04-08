"use client";
import { Shield, Mail, Trash2, ChevronDown } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { TeamMember, TeamRole } from "@/types";

interface Props {
  members: TeamMember[];
  currentUserRole: TeamRole;
  currentUserId: string;
}

export default function MemberList({
  members,
  currentUserRole,
  currentUserId,
}: Props) {
  const { updateMemberRole, removeMember } = useAppStore();

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}
      >
        <thead>
          <tr
            style={{
              background: "var(--bg-tertiary)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <th
              style={{
                textAlign: "left",
                padding: "12px 16px",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Member
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "12px 16px",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Role
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "12px 16px",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr
              key={member.id}
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: member.avatar || "var(--bg-active)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {member.name[0]}
                  </div>
                  <div>
                    <div
                      style={{ color: "var(--text-primary)", fontWeight: 500 }}
                    >
                      {member.name} {member.id === currentUserId && "(You)"}
                    </div>
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Mail size={10} /> {member.email}
                    </div>
                  </div>
                </div>
              </td>
              <td style={{ padding: "12px 16px" }}>
                {canManage &&
                member.id !== currentUserId &&
                member.role !== "owner" ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      updateMemberRole(member.id, e.target.value as TeamRole)
                    }
                    style={{
                      background: "var(--bg-active)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "4px 8px",
                      color: "var(--text-primary)",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "var(--text-secondary)",
                      textTransform: "capitalize",
                    }}
                  >
                    <Shield size={12} /> {member.role}
                  </span>
                )}
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                {canManage &&
                  member.id !== currentUserId &&
                  member.role !== "owner" && (
                    <button
                      onClick={() => removeMember(member.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--accent-red)",
                        padding: 6,
                        borderRadius: 6,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,123,114,0.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "none")
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
