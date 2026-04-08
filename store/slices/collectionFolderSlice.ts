import { StateCreator } from "zustand";
import { AppState } from "../types";
import { CollectionFolder } from "@/types";
import { v4 as uuidv4 } from "uuid";
import {
  addFolderToFolders,
  updateFolderInFolders,
  deleteFolderFromFolders,
} from "../helpers";

export interface CollectionFolderSlice {
  expandedSidebarIds: string[];
  toggleSidebarExpansion: (id: string, expanded?: boolean) => void;
  setExpandedSidebarIds: (ids: string[]) => void;
  revealRequest: (requestId: string) => void;
  addFolderToCollection: (
    collectionId: string,
    name: string,
    parentFolderId?: string | null,
  ) => Promise<void>;
  renameFolderInCollection: (
    collectionId: string,
    folderId: string,
    name: string,
  ) => Promise<void>;
  deleteFolderFromCollection: (
    collectionId: string,
    folderId: string,
  ) => Promise<void>;
  updateFolderInFolderTree: (
    collectionId: string,
    folderId: string,
    updates: Partial<CollectionFolder>,
  ) => Promise<void>;
}

export const createCollectionFolderSlice: StateCreator<
  AppState,
  [],
  [],
  CollectionFolderSlice
> = (set, get) => ({
  expandedSidebarIds: [],

  toggleSidebarExpansion: (id, expanded) => {
    set((s) => {
      const currentIds = s.expandedSidebarIds || [];
      const isExpanded =
        expanded !== undefined ? expanded : !currentIds.includes(id);

      if (isExpanded) {
        if (currentIds.includes(id)) return s;
        return { expandedSidebarIds: [...currentIds, id] };
      }
      return { expandedSidebarIds: currentIds.filter((fid) => fid !== id) };
    });
  },

  setExpandedSidebarIds: (ids) => set({ expandedSidebarIds: ids }),

  revealRequest: (requestId) => {
    const { collections } = get();
    const parentIds: string[] = [];

    const findInFolders = (
      folders: CollectionFolder[],
      targetId: string,
    ): boolean => {
      for (const f of folders) {
        if (f.requests.some((r) => r.id === targetId)) {
          parentIds.push(f.id);
          return true;
        }
        if (findInFolders(f.folders, targetId)) {
          parentIds.push(f.id);
          return true;
        }
      }
      return false;
    };

    for (const c of collections) {
      if (c.requests.some((r) => r.id === requestId)) {
        parentIds.push(c.id);
        break;
      }
      if (findInFolders(c.folders, requestId)) {
        parentIds.push(c.id);
        break;
      }
    }

    if (parentIds.length > 0) {
      set((s) => ({
        expandedSidebarIds: Array.from(
          new Set([...s.expandedSidebarIds, ...parentIds]),
        ),
      }));
    }
  },

  addFolderToCollection: async (collectionId, name, parentFolderId) => {
    const { token, fetchCollections, workspace } = get();
    if (!token) return;

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, collectionId, parentFolderId }),
      });

      if (res.ok && workspace.id) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  renameFolderInCollection: async (collectionId, folderId, name) => {
    const { token, fetchCollections, workspace } = get();
    if (!token) return;

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/folders/${folderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (res.ok && workspace.id) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  deleteFolderFromCollection: async (collectionId, folderId) => {
    const { token, fetchCollections, workspace } = get();
    if (!token) return;

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/folders/${folderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok && workspace.id) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  updateFolderInFolderTree: async (collectionId, folderId, updates) => {
    const { token, fetchCollections, workspace } = get();
    if (!token) return;

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/folders/${folderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok && workspace.id) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },
});
