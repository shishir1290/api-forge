"use client";
import { RequestAuth } from "@/types";

interface Props {
  auth: RequestAuth;
  effectiveAuth: RequestAuth;
  onChange: (auth: RequestAuth) => void;
}

export default function AuthTab({ auth, effectiveAuth, onChange }: Props) {
  const isInherited = auth.type === "inherit";
  const displayAuth = isInherited ? effectiveAuth : auth;

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "12px 16px" }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "11px",
            fontWeight: 600,
            marginBottom: 10,
            letterSpacing: "0.05em",
          }}
        >
          AUTHENTICATION TYPE
        </div>
        <select
          value={auth.type}
          onChange={(e) => onChange({ ...auth, type: e.target.value as any })}
          style={{
            width: "100%",
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            borderRadius: 5,
            padding: "8px 10px",
            color: "var(--text-primary)",
            fontSize: "12px",
            outline: "none",
          }}
        >
          <option value="inherit">Inherit from parent</option>
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="api-key">API Key</option>
        </select>
      </div>

      <div style={{ opacity: isInherited ? 0.7 : 1 }}>
        {displayAuth.type === "bearer" && (
          <div>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "11px",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              TOKEN
            </div>
            <input
              type="text"
              value={displayAuth.bearerToken || ""}
              onChange={(e) =>
                !isInherited &&
                onChange({ ...auth, bearerToken: e.target.value })
              }
              readOnly={isInherited}
              placeholder="Enter bearer token..."
              style={{
                width: "100%",
                background: "var(--bg-active)",
                border: "1px solid var(--border)",
                borderRadius: 5,
                padding: "8px 10px",
                color: "var(--text-primary)",
                fontSize: "12px",
                outline: "none",
                fontFamily: "JetBrains Mono, monospace",
              }}
            />
          </div>
        )}
        {displayAuth.type === "basic" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                USERNAME
              </div>
              <input
                type="text"
                value={displayAuth.basicUsername || ""}
                onChange={(e) =>
                  !isInherited &&
                  onChange({ ...auth, basicUsername: e.target.value })
                }
                readOnly={isInherited}
                style={{
                  width: "100%",
                  background: "var(--bg-active)",
                  border: "1px solid var(--border)",
                  borderRadius: 5,
                  padding: "8px 10px",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                PASSWORD
              </div>
              <input
                type="password"
                value={displayAuth.basicPassword || ""}
                onChange={(e) =>
                  !isInherited &&
                  onChange({ ...auth, basicPassword: e.target.value })
                }
                readOnly={isInherited}
                style={{
                  width: "100%",
                  background: "var(--bg-active)",
                  border: "1px solid var(--border)",
                  borderRadius: 5,
                  padding: "8px 10px",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </div>
          </div>
        )}
        {displayAuth.type === "none" && !isInherited && (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              padding: 20,
              fontSize: "12px",
            }}
          >
            No authentication will be sent with this request.
          </div>
        )}
      </div>
      {isInherited && (
        <div
          style={{
            marginTop: 20,
            padding: 10,
            borderRadius: 5,
            background: "rgba(88,166,255,0.05)",
            border: "1px solid rgba(88,166,255,0.2)",
            fontSize: "11px",
            color: "var(--accent-blue)",
          }}
        >
          Inheriting authentication settings from the collection or folder.
        </div>
      )}
    </div>
  );
}
