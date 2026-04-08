"use client";
import { useRef, useEffect, useState } from "react";

export interface CtxMenu {
  x: number;
  y: number;
  items: {
    label: string;
    icon?: React.ReactNode;
    danger?: boolean;
    onClick: () => void;
  }[];
}

export function SidebarContextMenu({
  menu,
  onClose,
}: {
  menu: CtxMenu;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        zIndex: 9999,
        left: Math.min(menu.x, window.innerWidth - 200),
        top: Math.min(menu.y, window.innerHeight - menu.items.length * 34 - 12),
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 4,
        minWidth: 180,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {menu.items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "7px 12px",
            borderRadius: 5,
            color: item.danger ? "var(--accent-red)" : "var(--text-primary)",
            fontSize: "12px",
            textAlign: "left",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-hover)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          {item.icon && <span style={{ opacity: 0.7 }}>{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function InlineRename({
  value,
  onConfirm,
  onCancel,
}: {
  value: string;
  onConfirm: (v: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);
  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onConfirm(text);
        if (e.key === "Escape") onCancel();
        e.stopPropagation();
      }}
      onBlur={() => onConfirm(text)}
      onClick={(e) => e.stopPropagation()}
      style={{
        flex: 1,
        background: "var(--bg-active)",
        border: "1px solid var(--accent-blue)",
        borderRadius: 3,
        padding: "2px 6px",
        color: "var(--text-primary)",
        fontSize: "12px",
        outline: "none",
        minWidth: 0,
      }}
    />
  );
}
