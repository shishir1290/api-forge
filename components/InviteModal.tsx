"use client";
import { useState, useRef, useEffect } from "react";
import { X, UserPlus, Info } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { TeamRole } from "@/types";

interface Props {
  onClose: () => void;
}

export default function InviteModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("viewer");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { inviteMember } = useAppStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current === e.target) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleInvite = async () => {
    setError(null);
    setIsSending(true);
    const res = await inviteMember(email, role);
    setIsSending(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Failed to send invitation");
    }
  };

  return (
    <div
      ref={modalRef}
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
          borderRadius: 12,
          width: 420,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(88,166,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-blue)",
              }}
            >
              <UserPlus size={20} />
            </div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 700,
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              Invite Member
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            Email Address
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            style={{
              width: "100%",
              height: 40,
              background: "var(--bg-active)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0 12px",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            style={{
              width: "100%",
              height: 40,
              background: "var(--bg-active)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0 10px",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
            }}
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(255,123,114,0.1)",
              border: "1px solid rgba(255,123,114,0.3)",
              color: "var(--accent-red)",
              fontSize: "12px",
              alignItems: "center",
            }}
          >
            <Info size={14} /> {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 42,
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={!email || isSending}
            style={{
              flex: 2,
              height: 42,
              background:
                email && !isSending ? "var(--accent-blue)" : "var(--bg-active)",
              border: "none",
              borderRadius: 8,
              cursor: email && !isSending ? "pointer" : "not-allowed",
              color: email && !isSending ? "white" : "var(--text-muted)",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            {isSending ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </div>
    </div>
  );
}
