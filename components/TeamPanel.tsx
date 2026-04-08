"use client";
import { useState, useEffect } from "react";
import { Users, UserPlus, RefreshCw } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import MemberList from "./MemberList";
import InviteModal from "./InviteModal";
import WorkspaceSettings from "./WorkspaceSettings";
import InvitationList from "./InvitationList";

export default function TeamPanel() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { workspace, user, invitations, fetchWorkspaces, fetchInvitations } =
    useAppStore();

  useEffect(() => {
    fetchWorkspaces();
    fetchInvitations();
  }, [fetchWorkspaces, fetchInvitations]);

  const currentUser = workspace.members.find((m) => m.id === user?.id);
  const userRole = currentUser?.role || "viewer";
  const canInvite = userRole === "owner" || userRole === "admin";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-primary)",
        overflow: "auto",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          width: "100%",
          padding: "40px 24px",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "rgba(88,166,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-blue)",
                }}
              >
                <Users size={24} />
              </div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                Team management
              </h1>
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              Manage your workspace members, roles, and settings.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                fetchWorkspaces();
                fetchInvitations();
              }}
              style={{
                height: 40,
                padding: "0 14px",
                background: "var(--bg-active)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                cursor: "pointer",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <RefreshCw size={16} /> Refresh
            </button>
            {canInvite && (
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  height: 40,
                  padding: "0 20px",
                  background: "var(--accent-blue)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <UserPlus size={18} /> Invite Member
              </button>
            )}
          </div>
        </div>

        {/* WORKSPACE SETTINGS */}
        <WorkspaceSettings workspace={workspace} userRole={userRole} />

        {/* MEMBER LIST */}
        <div style={{ marginTop: 40 }}>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 700,
              margin: "0 0 16px 0",
              color: "var(--text-primary)",
            }}
          >
            Workspace Members
          </h3>
          <MemberList
            members={workspace.members}
            currentUserRole={userRole}
            currentUserId={user?.id || ""}
          />
        </div>

        {/* PENDING INVITATIONS */}
        <InvitationList invitations={invitations} />
      </div>

      {/* MODALS */}
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
}
