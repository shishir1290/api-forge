"use client";
import { FolderOpen, History, Globe, Users } from "lucide-react";

interface Props {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

export default function SidebarTabs({ activeTab, onTabChange }: Props) {
  const tabs = [
    { id: "collections", icon: <FolderOpen size={20} />, label: "Collections" },
    { id: "history", icon: <History size={20} />, label: "History" },
    { id: "environments", icon: <Globe size={20} />, label: "Environments" },
    { id: "team", icon: <Users size={20} />, label: "Team" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 0,
        gap: 12,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            width: 42,
            height: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            background: activeTab === tab.id ? "rgba(88,166,255,0.15)" : "none",
            border: "none",
            cursor: "pointer",
            color:
              activeTab === tab.id ? "var(--accent-blue)" : "var(--text-muted)",
            transition: "all 0.2s",
          }}
          title={tab.label}
        >
          {tab.icon}
        </button>
      ))}
    </div>
  );
}
