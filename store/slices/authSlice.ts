import { StateCreator } from "zustand";
import { AppState } from "../types";
import { TeamRole } from "@/types";

export interface AuthSlice {
  user: { id: string; name: string; email: string } | null;
  token: string | null;
  setAuth: (user: any, token: string, workspaces?: any[]) => void;
  logout: () => void;
}

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (
  set,
  get,
) => ({
  user: null,
  token: null,

  setAuth: (user, token, workspaces) => {
    const mappedWorkspaces = Array.isArray(workspaces)
      ? workspaces.map((w: any) => ({
          id: w.id,
          name: w.name,
          description: w.description || "",
          createdAt: w.createdAt,
          members: (w.members || []).map((m: any) => ({
            id: m.userId,
            name: m.user.name || "Unknown",
            email: m.user.email || "",
            role: m.role.toLowerCase() as TeamRole,
            avatar: "#58a6ff",
            joinedAt: m.createdAt || new Date().toISOString(),
            status: "active",
          })),
        }))
      : [];

    set({
      user,
      token,
      workspaces: mappedWorkspaces,
      workspace: mappedWorkspaces[0] || get().workspace,
    });

    if (mappedWorkspaces[0]) {
      get().fetchCollections(mappedWorkspaces[0].id);
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      tabs: [],
      activeTabId: null,
      requests: {},
      responses: {},
    });
    localStorage.removeItem("app-store");
    window.location.href = "/login";
  },
});
