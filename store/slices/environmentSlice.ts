import { StateCreator } from "zustand";
import { AppState } from "../types";
import { Environment, HistoryItem } from "@/types";
import { v4 as uuidv4 } from "uuid";

export interface EnvironmentSlice {
  environments: Environment[];
  activeEnvironmentId: string | null;
  history: HistoryItem[];
  addEnvironment: (name: string) => Promise<void>;
  updateEnvironment: (
    id: string,
    updates: Partial<Environment>,
  ) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActiveEnvironment: (id: string | null) => void;
  setEnvironmentVariable: (
    envId: string,
    key: string,
    value: string,
  ) => Promise<void>;
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
}

export const createEnvironmentSlice: StateCreator<
  AppState,
  [],
  [],
  EnvironmentSlice
> = (set, get) => ({
  environments: [
    {
      id: "global",
      name: "Global",
      variables: [],
      secrets: [],
    },
  ],
  activeEnvironmentId: null,
  history: [],

  addEnvironment: async (name) => {
    const { token, fetchCollections, workspace } = get();
    if (!token || !workspace.id) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/environments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, workspaceId: workspace.id }),
      });
      if (res.ok) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  updateEnvironment: async (id, updates) => {
    if (id === "global") {
      set((s) => ({
        environments: s.environments.map((e) =>
          e.id === id ? { ...e, ...updates } : e,
        ),
      }));
      return;
    }
    const { token, fetchCollections, workspace } = get();
    if (!token || !workspace.id) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/environments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  deleteEnvironment: async (id) => {
    if (id === "global") return;
    const { token, fetchCollections, workspace } = get();
    if (!token || !workspace.id) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/environments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

  setEnvironmentVariable: async (envId, key, value) => {
    const { environments } = get();
    const env = environments.find((e) => e.id === envId);
    if (!env) return;

    let newVariables = [...env.variables];
    const exists = newVariables.find((v) => v.key === key);
    if (exists) {
      newVariables = newVariables.map((v) =>
        v.key === key ? { ...v, currentValue: value } : v,
      );
    } else {
      newVariables.push({
        id: uuidv4(),
        key,
        initialValue: value,
        currentValue: value,
        enabled: true,
      });
    }

    if (envId === "global") {
      set({
        environments: environments.map((e) =>
          e.id === "global" ? { ...e, variables: newVariables } : e,
        ),
      });
      return;
    }

    const { token, fetchCollections, workspace } = get();
    if (!token || !workspace.id) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/environments/${envId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ variables: newVariables }),
      });
      if (res.ok) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  addToHistory: (item) =>
    set((s) => ({ history: [item, ...s.history].slice(0, 50) })),

  clearHistory: () => set({ history: [] }),
});
