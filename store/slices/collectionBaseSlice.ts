import { StateCreator } from "zustand";
import { AppState } from "../types";
import { Collection } from "@/types";
import { v4 as uuidv4 } from "uuid";

export interface CollectionBaseSlice {
  collections: Collection[];
  addCollection: (name: string, description?: string) => void;
  importFullCollections: (collections: Collection[]) => void;
  importCollectionsToBackend: (collections: Collection[]) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => Promise<void>;
}

export const createCollectionBaseSlice: StateCreator<
  AppState,
  [],
  [],
  CollectionBaseSlice
> = (set, get) => ({
  collections: [],

  addCollection: (name, description) => {
    const c: Collection = {
      id: uuidv4(),
      name,
      description,
      requests: [],
      folders: [],
      auth: { type: "inherit" },
      headers: [],
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ collections: [...s.collections, c] }));
  },

  importFullCollections: (newCols) =>
    set((s) => ({ collections: [...s.collections, ...newCols] })),

  importCollectionsToBackend: async (collections: Collection[]) => {
    const { token, workspace, fetchCollections } = get();
    if (!token || !workspace.id) return;

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/collections/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId: workspace.id,
          collections,
        }),
      });

      if (res.ok) {
        // Refresh collections to get the proper IDs from DB
        await fetchCollections(workspace.id);
      }
    } catch (e) {
      console.error("Import to backend failed:", e);
    }
  },

  updateCollection: (id, updates) =>
    set((s) => ({
      collections: s.collections.map((c) =>
        c.id === id
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c,
      ),
    })),

  deleteCollection: async (id) => {
    const { token } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/collections/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        set((s) => ({
          collections: s.collections.filter((c) => c.id !== id),
        }));
      }
    } catch (e) {}
  },
});
