import { StateCreator } from "zustand";
import { AppState } from "../types";
import { TeamRole } from "@/types";

export interface WorkspaceMemberSlice {
  inviteMember: (
    email: string,
    role: TeamRole,
  ) => Promise<{ success: boolean; error?: string }>;
  updateMemberRole: (memberId: string, role: TeamRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
}

export const createWorkspaceMemberSlice: StateCreator<
  AppState,
  [],
  [],
  WorkspaceMemberSlice
> = (set, get) => ({
  inviteMember: async (email, role) => {
    const { token, workspace } = get();
    if (!token || !workspace) return { success: false, error: "No token" };
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(
        `${BACKEND_URL}/api/workspaces/${workspace.id}/invitations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, role: role.toUpperCase() }),
        },
      );
      if (res.ok) return { success: true };
      const err = await res.json();
      return { success: false, error: err.error || "Failed to invite" };
    } catch (e) {
      return { success: false, error: "Network error" };
    }
  },

  updateMemberRole: async (memberId, role) => {
    const { token, workspace } = get();
    if (!token || !workspace) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(
        `${BACKEND_URL}/api/workspaces/${workspace.id}/members/${memberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: role.toUpperCase() }),
        },
      );
      if (res.ok) {
        get().fetchWorkspaces();
      }
    } catch (e) {}
  },

  removeMember: async (memberId) => {
    const { token, workspace } = get();
    if (!token || !workspace) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(
        `${BACKEND_URL}/api/workspaces/${workspace.id}/members/${memberId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        get().fetchWorkspaces();
      }
    } catch (e) {}
  },
});
