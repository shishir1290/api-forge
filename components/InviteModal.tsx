"use client";
import { useState } from "react";
import { X, UserPlus, Mail, Shield, ChevronDown } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { TeamRole } from "@/types";

interface Props {
  onClose: () => void;
}

export default function InviteModal({ onClose }: Props) {
  const { inviteMember } = useAppStore();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("viewer" as TeamRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInvite = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    const res = await inviteMember(email, role);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Failed to send invitation");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          animation: "modalFadeIn 0.2s ease-out",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <UserPlus size={18} style={{ color: "var(--accent-blue)" }} />{" "}
            Invite Member
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                style={{
                  width: "100%",
                  height: 36,
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  paddingLeft: 34,
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Workspace Role
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as TeamRole)}
                style={{
                  width: "100%",
                  height: 36,
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "0 10px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  appearance: "none",
                }}
              >
                <option value="viewer">Viewer (Read-only)</option>
                <option value="editor">Editor (Can edit)</option>
                <option value="admin">Admin (Full control)</option>
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                fontSize: "12px",
                color: "var(--accent-red)",
                background: "rgba(255,100,100,0.1)",
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "16px 20px",
            background: "var(--bg-tertiary)",
            borderRadius: "0 0 12px 12px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "none",
              color: "var(--text-primary)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={loading || !email}
            style={{
              padding: "8px 24px",
              borderRadius: 6,
              border: "none",
              background: loading ? "var(--border)" : "var(--accent-blue)",
              color: "white",
              fontSize: "13px",
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
