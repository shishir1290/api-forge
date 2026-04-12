import { StateCreator } from "zustand";
import { AppState } from "../types";
import { Collection, CollectionFolder, Environment } from "@/types";
import { v4 as uuidv4 } from "uuid";

export interface CollectionSyncSlice {
  fetchCollections: (workspaceId: string) => Promise<void>;
  processRemoteUpdate: (data: { type: string; payload: any }) => void;
  syncCollectionsToBackend: () => Promise<void>;
}

export const createCollectionSyncSlice: StateCreator<
  AppState,
  [],
  [],
  CollectionSyncSlice
> = (set, get) => ({
  fetchCollections: async (workspaceId) => {
    const { token } = get();
    if (!token) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(
        `${BACKEND_URL}/api/workspaces/${workspaceId}/collections`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const { collections, environments } = await res.json();
        const mapFolder = (f: any): CollectionFolder => ({
          id: f.id,
          name: f.name,
          description: f.description || "",
          auth: f.auth || { type: "inherit" },
          headers: f.headers || [],
          variables: f.variables || [],
          requests: (f.requests || []).map((r: any) => ({
            ...r,
            headers: r.headers || [],
            params: r.params || [],
            body: r.body || { type: "none", content: "", formData: [] },
            auth: r.auth || { type: "inherit" },
            preRequestScript: r.preRequestScript || "",
            postRequestScript: r.postRequestScript || "",
          })),
          folders: (f.subFolders || []).map(mapFolder),
        });

        const mappedCollections: Collection[] = collections.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description || "",
          auth: c.auth || { type: "inherit" },
          headers: c.headers || [],
          variables: c.variables || [],
          requests: (c.requests || []).map((r: any) => ({
            ...r,
            headers: r.headers || [],
            params: r.params || [],
            body: r.body || { type: "none", content: "", formData: [] },
            auth: r.auth || { type: "inherit" },
            preRequestScript: r.preRequestScript || "",
            postRequestScript: r.postRequestScript || "",
          })),
          folders: (c.folders || []).map(mapFolder),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));

        const mappedEnvironments: Environment[] = (environments || []).map(
          (e: any) => ({
            id: e.id,
            name: e.name,
            variables: (e.variables || []).map((v: any) => ({
              ...v,
              id: v.id || uuidv4(),
            })),
            secrets: (e.secrets || []).map((s: any) => ({
              ...s,
              id: s.id || uuidv4(),
            })),
          }),
        );

        const globalEnv = get().environments.find((e) => e.id === "global");
        const finalEnvs = globalEnv
          ? [globalEnv, ...mappedEnvironments.filter((e) => e.id !== "global")]
          : mappedEnvironments;

        const currentActiveId = get().activeEnvironmentId;
        const envExists = finalEnvs.some((e) => e.id === currentActiveId);

        set({
          collections: mappedCollections,
          environments: finalEnvs,
          activeEnvironmentId: envExists
            ? currentActiveId
            : finalEnvs[0]?.id || null,
        });
      }
    } catch (e) {}
  },

  processRemoteUpdate: (data) => {
    // Sync logic handled in main store or here
  },

  syncCollectionsToBackend: async () => {
    // Optional sync logic
  },
});
