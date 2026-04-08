"use client";
import { Mail, Clock, Check, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Invitation } from "@/types";

interface Props {
  invitations: Invitation[];
}

export default function InvitationList({ invitations }: Props) {
  const { respondToInvitation } = useAppStore();

  if (invitations.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 32,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <h3
        style={{
          fontSize: "14px",
          fontWeight: 700,
          margin: 0,
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Clock size={18} style={{ color: "var(--accent-yellow)" }} /> Pending
        Invitations
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 12,
        }}
      >
        {invitations.map((inv) => (
          <div
            key={inv.id}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(210,153,34,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-yellow)",
                }}
              >
                <Mail size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {inv.workspace?.name}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Role: {inv.role.toLowerCase()}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => respondToInvitation(inv.id, "ACCEPT")}
                style={{
                  background: "rgba(63,185,80,0.15)",
                  border: "1px solid rgba(63,185,80,0.4)",
                  borderRadius: 6,
                  padding: "4px 8px",
                  cursor: "pointer",
                  color: "var(--accent-green)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                <Check size={12} /> Accept
              </button>
              <button
                onClick={() => respondToInvitation(inv.id, "REJECT")}
                style={{
                  background: "rgba(255,123,114,0.15)",
                  border: "1px solid rgba(255,123,114,0.4)",
                  borderRadius: 6,
                  padding: "4px 8px",
                  cursor: "pointer",
                  color: "var(--accent-red)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                <X size={12} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
