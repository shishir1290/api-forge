import { StateCreator } from "zustand";
import { AppState } from "../types";
import { TeamWorkspace, TeamRole } from "@/types";

export interface WorkspaceBaseSlice {
  workspaces: TeamWorkspace[];
  workspace: TeamWorkspace;
  fetchWorkspaces: () => Promise<void>;
  setActiveWorkspace: (id: string) => void;
  addWorkspace: (name: string) => Promise<void>;
  updateWorkspace: (
    updates: Partial<Pick<TeamWorkspace, "name" | "description">>,
  ) => void;
}

export const createWorkspaceBaseSlice: StateCreator<
  AppState,
  [],
  [],
  WorkspaceBaseSlice
> = (set, get) => ({
  workspaces: [],
  workspace: {
    id: "",
    name: "My Workspace",
    description: "",
    members: [],
    createdAt: new Date().toISOString(),
  },

  fetchWorkspaces: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/workspaces`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { workspaces } = await res.json();
        const mappedWorkspaces = workspaces.map((w: any) => ({
          ...w,
          members: w.members.map((m: any) => ({
            id: m.user.id,
            name: m.user.name || "Unknown",
            email: m.user.email,
            role: m.role.toLowerCase() as TeamRole,
            avatar: m.user.image || "",
            joinedAt: m.createdAt,
            status: "active",
          })),
        }));
        set({ workspaces: mappedWorkspaces });
      }
    } catch (e) {
      console.error("Fetch workspaces error:", e);
    }
  },

  setActiveWorkspace: (id) => {
    const { workspaces } = get();
    const ws = workspaces.find((w) => w.id === id);
    if (ws) {
      set({ workspace: ws });
      get().fetchCollections(id);
    }
  },

  addWorkspace: async (name) => {
    const { token } = get();
    if (!token) return;

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const data = await res.json();
        const w = data.workspace;
        const mappedWs = {
          id: w.id,
          name: w.name,
          description: w.description || "",
          createdAt: w.createdAt,
          members: (w.members || []).map((m: any) => ({
            id: m.userId,
            name: m.user?.name || "Unknown",
            email: m.user?.email || "",
            role: m.role.toLowerCase() as TeamRole,
            avatar: "#58a6ff",
            joinedAt: m.createdAt || new Date().toISOString(),
            status: "active",
          })),
        };
        set((s) => ({
          workspaces: [...s.workspaces, mappedWs],
          workspace: mappedWs,
        }));
        get().fetchCollections(w.id);
      }
    } catch (e) {
      console.error("Failed to create workspace:", e);
    }
  },

  updateWorkspace: (updates) =>
    set((s) => ({ workspace: { ...s.workspace, ...updates } })),
});
