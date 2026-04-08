import { StateCreator } from "zustand";
import { AppState } from "../types";
import { Invitation } from "@/types";

export interface WorkspaceInvitationSlice {
  invitations: Invitation[];
  fetchInvitations: () => Promise<void>;
  respondToInvitation: (
    id: string,
    action: "ACCEPT" | "REJECT",
  ) => Promise<void>;
}

export const createWorkspaceInvitationSlice: StateCreator<
  AppState,
  [],
  [],
  WorkspaceInvitationSlice
> = (set, get) => ({
  invitations: [],

  fetchInvitations: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { invitations } = await res.json();
        set({ invitations });
      }
    } catch (e) {}
  },

  respondToInvitation: async (id, action) => {
    const { token } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/invitations/${id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        get().fetchInvitations();
        get().fetchWorkspaces();
      }
    } catch (e) {}
  },
});
