"use client";
import { Bell, X, Check, XCircle, Clock } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { formatDistanceToNow } from "date-fns";
import { AppNotification } from "@/types";

interface Props {
  onClose: () => void;
}

export default function NotificationCenter({ onClose }: Props) {
  const { notifications, respondToInvitation, markNotificationRead } =
    useAppStore();

  const handleAction = async (
    notif: AppNotification,
    action: "ACCEPT" | "REJECT",
  ) => {
    if (notif.data?.invitationId) {
      await respondToInvitation(notif.data.invitationId, action);
      await markNotificationRead(notif.id);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        bottom: 80,
        width: 320,
        maxHeight: 480,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        animation: "slideIn 0.2s ease-out",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          Notifications
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
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {notifications.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "13px",
            }}
          >
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              style={{
                padding: "12px",
                borderRadius: 8,
                background: n.read ? "none" : "rgba(59, 130, 246, 0.05)",
                borderBottom: "1px solid var(--border-subtle)",
                cursor: "default",
                position: "relative",
              }}
            >
              {!n.read && (
                <div
                  style={{
                    position: "absolute",
                    left: 4,
                    top: 16,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--accent-blue)",
                  }}
                />
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  marginLeft: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {n.title}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDistanceToNow(new Date(n.createdAt))} ago
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    lineHeight: "1.4",
                  }}
                >
                  {n.message}
                </p>

                {n.type === "INVITATION" && n.status === "PENDING" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(n, "ACCEPT");
                      }}
                      style={{
                        flex: 1,
                        padding: "6px 0",
                        borderRadius: 4,
                        background: "var(--accent-blue)",
                        color: "white",
                        border: "none",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <Check size={12} /> Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(n, "REJECT");
                      }}
                      style={{
                        flex: 1,
                        padding: "6px 0",
                        borderRadius: 4,
                        background: "var(--bg-tertiary)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}

                {n.status !== "PENDING" && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color:
                        n.status === "ACCEPTED"
                          ? "var(--accent-green)"
                          : "var(--accent-red)",
                    }}
                  >
                    {n.status}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
