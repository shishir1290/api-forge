import { StateCreator } from "zustand";
import { AppState } from "../types";
import { Invitation, AppNotification } from "@/types";

export interface WorkspaceInvitationSlice {
  invitations: Invitation[];
  notifications: AppNotification[];
  fetchInvitations: () => Promise<void>;
  respondToInvitation: (
    id: string,
    action: "ACCEPT" | "REJECT",
  ) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}

export const createWorkspaceInvitationSlice: StateCreator<
  AppState,
  [],
  [],
  WorkspaceInvitationSlice
> = (set, get) => ({
  invitations: [],
  notifications: [],

  fetchInvitations: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/notifications/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { invitations, notifications } = await res.json();
        set({ invitations, notifications });
      }
    } catch (e) {}
  },

  respondToInvitation: async (id, action) => {
    const { token } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(
        `${BACKEND_URL}/api/notifications/invitations/${id}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        },
      );
      if (res.ok) {
        get().fetchInvitations();
        get().fetchWorkspaces();
      }
    } catch (e) {}
  },

  markNotificationRead: async (id) => {
    const { token } = get();
    if (!token) return;
    // For now, local update. In future, add backend endpoint.
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  },
});
