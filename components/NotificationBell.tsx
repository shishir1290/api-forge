"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, Check, X, Mail } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function NotificationBell() {
  const { invitations, fetchInvitations, respondToInvitation } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvitations();
    // Poll every 30 seconds
    const interval = setInterval(fetchInvitations, 30000);
    return () => clearInterval(interval);
  }, [fetchInvitations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pendingCount = invitations.length;

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: pendingCount > 0 ? "var(--text-primary)" : "var(--text-muted)",
          padding: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          position: "relative",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-hover)";
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color =
            pendingCount > 0 ? "var(--text-primary)" : "var(--text-muted)";
        }}
      >
        <Bell size={18} />
        {pendingCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: "var(--accent-red, #ff4d4d)",
              color: "white",
              fontSize: "10px",
              fontWeight: "bold",
              minWidth: "14px",
              height: "14px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              border: "2px solid var(--bg-secondary)",
            }}
          >
            {pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 8,
            width: 320,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: "14px",
                color: "var(--text-primary)",
              }}
            >
              Notifications
            </span>
            {pendingCount > 0 && (
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--accent-blue)",
                  fontWeight: 500,
                }}
              >
                {pendingCount} pending
              </span>
            )}
          </div>

          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {invitations.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Mail size={24} style={{ opacity: 0.5 }} />
                <span style={{ fontSize: "13px" }}>No new invitations</span>
              </div>
            ) : (
              invitations.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", gap: 12 }}>
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
                        fontSize: "14px",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {inv.workspace.name[0].toUpperCase()}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          color: "var(--text-primary)",
                          lineHeight: 1.4,
                        }}
                      >
                        <strong>{inv.inviter.name || inv.inviter.email}</strong>{" "}
                        invited you to join{" "}
                        <strong>{inv.workspace.name}</strong>
                      </span>
                      <span
                        style={{ fontSize: "11px", color: "var(--text-muted)" }}
                      >
                        Role:{" "}
                        {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => respondToInvitation(inv.id, "ACCEPT")}
                      style={{
                        flex: 1,
                        background: "var(--accent-blue)",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        padding: "6px 0",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      onClick={() => respondToInvitation(inv.id, "REJECT")}
                      style={{
                        flex: 1,
                        background: "rgba(255, 77, 77, 0.1)",
                        color: "var(--accent-red, #ff4d4d)",
                        border: "1px solid rgba(255, 77, 77, 0.2)",
                        borderRadius: 4,
                        padding: "6px 0",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
