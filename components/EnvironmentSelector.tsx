"use client";
import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function EnvironmentSelector() {
  const { environments, activeEnvironmentId, setActiveEnvironment } =
    useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);

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

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          background: "none",
          border: "1px solid var(--border)",
          borderRadius: 6,
          cursor: "pointer",
          color: activeEnv ? "var(--accent-blue)" : "var(--text-muted)",
          fontSize: "12px",
          fontWeight: 500,
          transition: "all 0.2s",
          minWidth: 140,
          justifyContent: "space-between",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--bg-hover)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            overflow: "hidden",
          }}
        >
          <Globe size={14} />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {activeEnv ? activeEnv.name : "No Environment"}
          </span>
        </div>
        <ChevronDown
          size={12}
          style={{
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 8,
            width: 220,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
            zIndex: 1100,
            padding: 4,
          }}
        >
          <div
            onClick={() => {
              setActiveEnvironment("");
              setIsOpen(false);
            }}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              borderRadius: 6,
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: !activeEnv ? "var(--text-primary)" : "var(--text-muted)",
              background: !activeEnv ? "rgba(255, 255, 255, 0.05)" : "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = !activeEnv
                ? "rgba(255, 255, 255, 0.05)"
                : "none")
            }
          >
            <span>No Environment</span>
            {!activeEnv && <Check size={14} color="var(--accent-blue)" />}
          </div>

          <div
            style={{ height: 1, background: "var(--border)", margin: "4px 0" }}
          />

          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {environments.map((env) => (
              <div
                key={env.id}
                onClick={() => {
                  setActiveEnvironment(env.id);
                  setIsOpen(false);
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderRadius: 6,
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color:
                    activeEnvironmentId === env.id
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  background:
                    activeEnvironmentId === env.id
                      ? "rgba(255, 255, 255, 0.05)"
                      : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    activeEnvironmentId === env.id
                      ? "rgba(255, 255, 255, 0.05)"
                      : "none")
                }
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {env.name}
                </span>
                {activeEnvironmentId === env.id && (
                  <Check size={14} color="var(--accent-blue)" />
                )}
              </div>
            ))}
          </div>

          {environments.length === 0 && (
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "11px",
              }}
            >
              No environments found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
