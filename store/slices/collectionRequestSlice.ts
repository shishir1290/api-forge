import { StateCreator } from "zustand";
import { AppState } from "../types";
import { RequestConfig, RequestExample } from "@/types";
import {
  addRequestToFolders,
  deleteRequestFromFolders,
  updateRequestInFolders,
} from "../helpers";

export interface CollectionRequestSlice {
  addRequestToCollection: (
    collectionId: string,
    request: RequestConfig,
  ) => Promise<void>;
  deleteRequestFromCollection: (
    collectionId: string,
    requestId: string,
  ) => Promise<void>;
  updateRequestInCollection: (
    collectionId: string,
    requestId: string,
    updates: Partial<RequestConfig>,
  ) => Promise<void>;
  addRequestToFolder: (
    collectionId: string,
    folderId: string,
    request: RequestConfig,
  ) => Promise<void>;
  deleteRequestFromFolder: (
    collectionId: string,
    requestId: string,
  ) => Promise<void>;
  updateRequestInFolder: (
    collectionId: string,
    requestId: string,
    updates: Partial<RequestConfig>,
  ) => Promise<void>;
  addExampleToRequest: (requestId: string, example: RequestExample) => void;
  deleteExampleFromRequest: (requestId: string, exampleId: string) => void;
}

export const createCollectionRequestSlice: StateCreator<
  AppState,
  [],
  [],
  CollectionRequestSlice
> = (set, get) => ({
  addRequestToCollection: async (collectionId, request) => {
    const { token, fetchCollections, workspace } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...request, collectionId }),
      });
      if (res.ok && workspace.id) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  deleteRequestFromCollection: async (collectionId, requestId) => {
    const { token, fetchCollections, workspace } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      await fetch(`${BACKEND_URL}/api/requests/${requestId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (workspace.id) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  updateRequestInCollection: async (collectionId, requestId, updates) => {
    const { token, fetchCollections, workspace } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      await fetch(`${BACKEND_URL}/api/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (workspace.id) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  addRequestToFolder: async (collectionId, folderId, request) => {
    const { token, fetchCollections, workspace } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...request, folderId }),
      });
      if (res.ok && workspace.id) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  deleteRequestFromFolder: async (collectionId, requestId) => {
    const { token, fetchCollections, workspace } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      await fetch(`${BACKEND_URL}/api/requests/${requestId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (workspace.id) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  updateRequestInFolder: async (collectionId, requestId, updates) => {
    const { token, fetchCollections, workspace } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      await fetch(`${BACKEND_URL}/api/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (workspace.id) {
        await fetchCollections(workspace.id);
      }
    } catch (e) {}
  },

  addExampleToRequest: (requestId, example) => {
    // Basic implementation (recursively finding the request would be better but keeping it simple for now)
    set((s) => ({
      collections: s.collections.map((c) => ({
        ...c,
        requests: c.requests.map((r) =>
          r.id === requestId
            ? { ...r, examples: [...(r.examples || []), example] }
            : r,
        ),
      })),
    }));
  },

  deleteExampleFromRequest: (requestId, exampleId) => {
    set((s) => ({
      collections: s.collections.map((c) => ({
        ...c,
        requests: c.requests.map((r) =>
          r.id === requestId
            ? {
                ...r,
                examples: (r.examples || []).filter(
                  (ex) => ex.id !== exampleId,
                ),
              }
            : r,
        ),
      })),
    }));
  },
});
