import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type {
  RequestConfig,
  RequestExample,
  ResponseData,
  Collection,
  CollectionFolder,
  Environment,
  HistoryItem,
  Tab,
  TeamMember,
  TeamWorkspace,
  TeamRole,
  Invitation,
} from "@/types";
import { findRequestPath } from "@/lib/hierarchy-utils";

// ─── Recursive folder helpers ────────────────────────────────────────────────

function addFolderToFolders(
  folders: CollectionFolder[],
  parentFolderId: string,
  newFolder: CollectionFolder,
): CollectionFolder[] {
  return folders.map((f) => {
    if (f.id === parentFolderId) {
      return { ...f, folders: [...f.folders, newFolder] };
    }
    return {
      ...f,
      folders: addFolderToFolders(f.folders, parentFolderId, newFolder),
    };
  });
}

function addRequestToFolders(
  folders: CollectionFolder[],
  folderId: string,
  request: RequestConfig,
): CollectionFolder[] {
  return folders.map((f) => {
    if (f.id === folderId) {
      return { ...f, requests: [...f.requests, request] };
    }
    return { ...f, folders: addRequestToFolders(f.folders, folderId, request) };
  });
}

function updateFolderInFolders(
  folders: CollectionFolder[],
  folderId: string,
  updates: Partial<CollectionFolder>,
): CollectionFolder[] {
  return folders.map((f) => {
    if (f.id === folderId) return { ...f, ...updates };
    return {
      ...f,
      folders: updateFolderInFolders(f.folders, folderId, updates),
    };
  });
}

function deleteFolderFromFolders(
  folders: CollectionFolder[],
  folderId: string,
): CollectionFolder[] {
  return folders
    .filter((f) => f.id !== folderId)
    .map((f) => ({
      ...f,
      folders: deleteFolderFromFolders(f.folders, folderId),
    }));
}

function deleteRequestFromFolders(
  folders: CollectionFolder[],
  requestId: string,
): CollectionFolder[] {
  return folders.map((f) => ({
    ...f,
    requests: f.requests.filter((r) => r.id !== requestId),
    folders: deleteRequestFromFolders(f.folders, requestId),
  }));
}

function updateRequestInFolders(
  folders: CollectionFolder[],
  requestId: string,
  updates: Partial<RequestConfig>,
): CollectionFolder[] {
  return folders.map((f) => ({
    ...f,
    requests: f.requests.map((r) =>
      r.id === requestId ? { ...r, ...updates } : r,
    ),
    folders: updateRequestInFolders(f.folders, requestId, updates),
  }));
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface AppState {
  // Collections
  collections: Collection[];
  addCollection: (name: string, description?: string) => void;
  importFullCollections: (collections: Collection[]) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => Promise<void>;
  fetchCollections: (workspaceId: string) => Promise<void>;

  // Root-level requests in collection
  addRequestToCollection: (
    collectionId: string,
    request: RequestConfig,
  ) => void;
  deleteRequestFromCollection: (
    collectionId: string,
    requestId: string,
  ) => void;
  updateRequestInCollection: (
    collectionId: string,
    requestId: string,
    updates: Partial<RequestConfig>,
  ) => void;

  // Folders — parentFolderId=null means root of collection
  addFolderToCollection: (
    collectionId: string,
    name: string,
    parentFolderId?: string | null,
  ) => void;
  renameFolderInCollection: (
    collectionId: string,
    folderId: string,
    name: string,
  ) => void;
  deleteFolderFromCollection: (collectionId: string, folderId: string) => void;

  // Requests inside folders
  addRequestToFolder: (
    collectionId: string,
    folderId: string,
    request: RequestConfig,
  ) => void;
  deleteRequestFromFolder: (collectionId: string, requestId: string) => void;
  updateRequestInFolder: (
    collectionId: string,
    requestId: string,
    updates: Partial<RequestConfig>,
  ) => void;
  updateFolderInFolderTree: (
    collectionId: string,
    folderId: string,
    updates: Partial<CollectionFolder>,
  ) => void;

  // Examples
  addExampleToRequest: (requestId: string, example: RequestExample) => void;
  deleteExampleFromRequest: (requestId: string, exampleId: string) => void;

  // Tabs
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (request: RequestConfig) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;

  // Per-tab request state
  requests: Record<string, RequestConfig>;
  setRequest: (tabId: string, request: RequestConfig) => void;
  updateRequest: (tabId: string, updates: Partial<RequestConfig>) => void;
  markTabSaved: (tabId: string) => void;
  saveRequestById: (tabId: string) => Promise<boolean>; // returns true if saved, false if new (needs modal)

  // Per-tab responses
  responses: Record<string, ResponseData>;
  setResponse: (tabId: string, response: ResponseData) => void;

  // Loading state
  loadingTabs: Record<string, boolean>;
  setLoading: (tabId: string, loading: boolean) => void;

  // Environments
  environments: Environment[];
  activeEnvironmentId: string | null;
  addEnvironment: (name: string) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
  setActiveEnvironment: (id: string | null) => void;
  setEnvironmentVariable: (envId: string, key: string, value: string) => void;

  // History
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;

  // Team / Workspace
  workspaces: TeamWorkspace[];
  fetchWorkspaces: () => Promise<void>;
  workspace: TeamWorkspace;
  setActiveWorkspace: (id: string) => void;
  addWorkspace: (name: string) => Promise<void>; // Team
  inviteMember: (
    email: string,
    role: TeamRole,
  ) => Promise<{ success: boolean; error?: string }>;
  updateMemberRole: (memberId: string, role: TeamRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  // Invitations & Notifications
  invitations: Invitation[];
  fetchInvitations: () => Promise<void>;
  respondToInvitation: (
    id: string,
    action: "ACCEPT" | "REJECT",
  ) => Promise<void>;
  updateWorkspace: (
    updates: Partial<Pick<TeamWorkspace, "name" | "description">>,
  ) => void;
  // Sync
  processRemoteUpdate: (data: { type: string; payload: any }) => void;
  syncCollectionsToBackend: () => Promise<void>;

  // Auth
  user: { id: string; name: string; email: string } | null;
  token: string | null;
  setAuth: (user: any, token: string, workspaces?: any[]) => void;
  logout: () => void;
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      collections: [],
      tabs: [],
      activeTabId: null,
      requests: {},
      responses: {},
      loadingTabs: {},
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
      workspaces: [],
      workspace: {
        id: uuidv4(),
        name: "My Workspace",
        description: "",
        members: [],
        createdAt: new Date().toISOString(),
      },

      // Auth
      user: null,
      token: null,
      response: null,
      error: null,

      // Invitations
      invitations: [],
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
      setActiveWorkspace: (id) => {
        const { workspaces } = get();
        const ws = workspaces.find((w) => w.id === id);
        if (ws) {
          set({ workspace: ws });
          get().fetchCollections(id);
        }
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
            // Recursive map
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

            const mappedCollections: Collection[] = collections.map(
              (c: any) => ({
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
              }),
            );

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
              ? [
                  globalEnv,
                  ...mappedEnvironments.filter((e) => e.id !== "global"),
                ]
              : mappedEnvironments;

            set({
              collections: mappedCollections,
              environments: finalEnvs,
              activeEnvironmentId: finalEnvs[0]?.id || null,
            });
          }
        } catch (e) {
          console.error("Failed to fetch collections:", e);
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
        localStorage.removeItem("app-store"); // Clear persisted state
        window.location.href = "/login";
      },

      // ── Collections ──
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

      importFullCollections: (newCols: Collection[]) =>
        set((s) => ({ collections: [...s.collections, ...newCols] })),

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
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const collection = get().collections.find((c) => c.id === id);
            const requestIds = new Set<string>();
            if (collection) {
              collection.requests.forEach((r) => requestIds.add(r.id));
              const addReqIds = (folders: CollectionFolder[]) => {
                folders.forEach((f) => {
                  f.requests.forEach((r) => requestIds.add(r.id));
                  addReqIds(f.folders);
                });
              };
              addReqIds(collection.folders);
            }

            set((s) => ({
              collections: s.collections.filter((c) => c.id !== id),
              tabs: s.tabs.filter((t) => !requestIds.has(t.requestId)),
            }));
          }
        } catch (e) {
          console.error("Failed to delete collection:", e);
        }
      },

      // ── Root requests ──
      addRequestToCollection: (collectionId, request) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId
              ? {
                  ...c,
                  requests: [...c.requests, request],
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        })),

      deleteRequestFromCollection: (collectionId, requestId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId
              ? {
                  ...c,
                  requests: c.requests.filter((r) => r.id !== requestId),
                  // also search inside all nested folders
                  folders: deleteRequestFromFolders(c.folders, requestId),
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        })),

      updateRequestInCollection: (collectionId, requestId, updates) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId
              ? {
                  ...c,
                  requests: c.requests.map((r) =>
                    r.id === requestId ? { ...r, ...updates } : r,
                  ),
                  folders: updateRequestInFolders(
                    c.folders,
                    requestId,
                    updates,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        })),

      // ── Folders ──
      addFolderToCollection: (collectionId, name, parentFolderId) => {
        const newFolder: CollectionFolder = {
          id: uuidv4(),
          name,
          description: "",
          requests: [],
          folders: [],
          auth: { type: "inherit" },
          headers: [],
          variables: [],
        };
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            if (!parentFolderId) {
              // Add to root of collection
              return {
                ...c,
                folders: [...c.folders, newFolder],
                updatedAt: new Date().toISOString(),
              };
            }
            // Add as sub-folder
            return {
              ...c,
              folders: addFolderToFolders(c.folders, parentFolderId, newFolder),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      renameFolderInCollection: (collectionId, folderId, name) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== collectionId
              ? c
              : {
                  ...c,
                  folders: updateFolderInFolders(c.folders, folderId, { name }),
                  updatedAt: new Date().toISOString(),
                },
          ),
        })),

      deleteFolderFromCollection: (collectionId, folderId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== collectionId
              ? c
              : {
                  ...c,
                  folders: deleteFolderFromFolders(c.folders, folderId),
                  updatedAt: new Date().toISOString(),
                },
          ),
        })),

      // ── Folder requests ──
      addRequestToFolder: (collectionId, folderId, request) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== collectionId
              ? c
              : {
                  ...c,
                  folders: addRequestToFolders(c.folders, folderId, request),
                  updatedAt: new Date().toISOString(),
                },
          ),
        })),

      deleteRequestFromFolder: (collectionId, requestId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== collectionId
              ? c
              : {
                  ...c,
                  folders: deleteRequestFromFolders(c.folders, requestId),
                  updatedAt: new Date().toISOString(),
                },
          ),
        })),

      updateRequestInFolder: (collectionId, requestId, updates) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== collectionId
              ? c
              : {
                  ...c,
                  folders: updateRequestInFolders(
                    c.folders,
                    requestId,
                    updates,
                  ),
                  updatedAt: new Date().toISOString(),
                },
          ),
        })),

      updateFolderInFolderTree: (
        collectionId: string,
        folderId: string,
        updates: Partial<CollectionFolder>,
      ) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== collectionId
              ? c
              : {
                  ...c,
                  folders: updateFolderInFolders(c.folders, folderId, updates),
                  updatedAt: new Date().toISOString(),
                },
          ),
        })),

      // ── Tabs ──
      openTab: (request) => {
        const { tabs } = get();
        // If a tab for this exact requestId already exists, just switch to it
        const existing = tabs.find((t) => t.requestId === request.id);
        if (existing) {
          set({ activeTabId: existing.id });
          return;
        }
        // Otherwise open a brand-new tab
        const tab: Tab = {
          id: uuidv4(),
          requestId: request.id,
          name: request.name,
          isDirty: false,
        };
        set((s) => ({
          tabs: [...s.tabs, tab],
          activeTabId: tab.id,
          requests: { ...s.requests, [tab.id]: { ...request } },
        }));
      },

      closeTab: (tabId) => {
        const { tabs, activeTabId } = get();
        const idx = tabs.findIndex((t) => t.id === tabId);
        const newTabs = tabs.filter((t) => t.id !== tabId);
        let newActiveId: string | null = activeTabId;
        if (activeTabId === tabId) {
          newActiveId = newTabs[Math.min(idx, newTabs.length - 1)]?.id ?? null;
        }
        set((s) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [tabId]: _r, ...restRequests } = s.requests;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [tabId]: _res, ...restResponses } = s.responses;
          return {
            tabs: newTabs,
            activeTabId: newActiveId,
            requests: restRequests,
            responses: restResponses,
          };
        });
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      setRequest: (tabId, request) =>
        set((s) => ({ requests: { ...s.requests, [tabId]: request } })),

      updateRequest: (tabId, updates) =>
        set((s) => ({
          requests: {
            ...s.requests,
            [tabId]: { ...s.requests[tabId], ...updates },
          },
          tabs: s.tabs.map((t) =>
            t.id === tabId
              ? {
                  ...t,
                  isDirty: true,
                  name: updates.name !== undefined ? updates.name : t.name,
                }
              : t,
          ),
        })),

      markTabSaved: (tabId) =>
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === tabId ? { ...t, isDirty: false } : t,
          ),
        })),

      saveRequestById: async (tabId) => {
        const {
          requests,
          collections,
          updateRequestInCollection,
          markTabSaved,
          workspace,
        } = get();
        const request = requests[tabId];
        if (!request) return false;

        const path = findRequestPath(collections, request.id);
        if (path.length > 0) {
          const collectionId = path[0].id;

          // Local update
          updateRequestInCollection(collectionId, request.id, request);
          markTabSaved(tabId);

          // Backend sync (Async)
          try {
            const { token } = get();
            const BACKEND_URL =
              process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
            const res = await fetch(
              `${BACKEND_URL}/api/requests/${request.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(request),
              },
            );

            if (res.ok) {
              console.log("Synced with backend");
            }
          } catch (e) {
            console.error("Failed to sync with backend:", e);
          }

          return true;
        }
        return false;
      },

      setResponse: (tabId, response) =>
        set((s) => ({ responses: { ...s.responses, [tabId]: response } })),

      setLoading: (tabId, loading) =>
        set((s) => ({ loadingTabs: { ...s.loadingTabs, [tabId]: loading } })),

      // ── Environments ──
      addEnvironment: (name) => {
        const env: Environment = {
          id: uuidv4(),
          name,
          variables: [],
          secrets: [],
        };
        set((s) => ({ environments: [...s.environments, env] }));
      },

      updateEnvironment: (id, updates) =>
        set((s) => ({
          environments: s.environments.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
          ),
        })),

      deleteEnvironment: (id) =>
        set((s) => ({
          environments: s.environments.filter((e) => e.id !== id),
          activeEnvironmentId:
            s.activeEnvironmentId === id ? null : s.activeEnvironmentId,
        })),

      setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

      setEnvironmentVariable: (envId: string, key: string, value: string) =>
        set((s) => ({
          environments: s.environments.map((e) => {
            if (e.id !== envId) return e;
            // Check variables
            const varIdx = e.variables.findIndex((v) => v.key === key);
            if (varIdx !== -1) {
              const newVars = [...e.variables];
              newVars[varIdx] = { ...newVars[varIdx], currentValue: value };
              return { ...e, variables: newVars };
            }
            // Check secrets
            const secIdx = e.secrets.findIndex((v) => v.key === key);
            if (secIdx !== -1) {
              const newSecs = [...e.secrets];
              newSecs[secIdx] = { ...newSecs[secIdx], currentValue: value };
              return { ...e, secrets: newSecs };
            }
            // Not found, add new variable
            return {
              ...e,
              variables: [
                ...e.variables,
                {
                  id: uuidv4(),
                  key,
                  initialValue: value,
                  currentValue: value,
                  enabled: true,
                },
              ],
            };
          }),
        })),

      // ── History ──
      addToHistory: (item) =>
        set((s) => ({ history: [item, ...s.history].slice(0, 200) })),

      clearHistory: () => set({ history: [] }),

      // ── Team ──
      inviteMember: async (email, role) => {
        const { token, workspace } = get();
        if (!token || !workspace)
          return { success: false, error: "Not authenticated" };

        try {
          const BACKEND_URL =
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
          const res = await fetch(
            `${BACKEND_URL}/api/workspaces/${workspace.id}/invite`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ email, role }),
            },
          );

          if (res.ok) {
            return { success: true };
          } else {
            const data = await res.json();
            return { success: false, error: data.error || "Failed to invite" };
          }
        } catch (e) {
          console.error("Invite error:", e);
          return { success: false, error: "Network error" };
        }
      },

      fetchInvitations: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const BACKEND_URL =
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
          const res = await fetch(
            `${BACKEND_URL}/api/notifications/invitations`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (res.ok) {
            const { invitations } = await res.json();
            set({ invitations });
          }
        } catch (e) {
          console.error("Fetch invitations error:", e);
        }
      },

      respondToInvitation: async (id, action) => {
        const { token, fetchInvitations, fetchWorkspaces } = get();
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
            await fetchInvitations();
            if (action === "ACCEPT") {
              await fetchWorkspaces();
            }
          }
        } catch (e) {
          console.error("Respond invitation error:", e);
        }
      },

      updateMemberRole: async (memberId, role) => {
        const { token, workspace, fetchWorkspaces } = get();
        if (!token || !workspace) return;

        try {
          const BACKEND_URL =
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
          const res = await fetch(
            `${BACKEND_URL}/api/workspaces/${workspace.id}/members/${memberId}/role`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ role }),
            },
          );

          if (res.ok) {
            await fetchWorkspaces();
          }
        } catch (e) {
          console.error("Update role error:", e);
        }
      },

      removeMember: async (memberId) => {
        const { token, workspace, fetchWorkspaces } = get();
        if (!token || !workspace) return;

        try {
          const BACKEND_URL =
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
          const res = await fetch(
            `${BACKEND_URL}/api/workspaces/${workspace.id}/members/${memberId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (res.ok) {
            await fetchWorkspaces();
          }
        } catch (e) {
          console.error("Remove member error:", e);
        }
      },

      updateWorkspace: (updates) =>
        set((s) => ({ workspace: { ...s.workspace, ...updates } })),

      // ── Sync ──
      processRemoteUpdate: (data) => {
        const { type, payload } = data;
        const { collections } = get();

        if (type === "COLLECTION_CREATED") {
          const collection = payload;
          if (!collections.find((c) => c.id === collection.id)) {
            set((s) => ({ collections: [...s.collections, collection] }));
          }
        } else if (type === "COLLECTION_DELETED") {
          const { id } = payload;
          const collection = collections.find((c) => c.id === id);
          const requestIds = new Set<string>();
          if (collection) {
            collection.requests.forEach((r) => requestIds.add(r.id));
            const addReqIds = (folders: CollectionFolder[]) => {
              folders.forEach((f) => {
                f.requests.forEach((r) => requestIds.add(r.id));
                addReqIds(f.folders);
              });
            };
            addReqIds(collection.folders);
          }

          set((s) => ({
            collections: s.collections.filter((c) => c.id !== id),
            tabs: s.tabs.filter((t) => !requestIds.has(t.requestId)),
          }));
        } else if (type === "REQUEST_UPDATED" || type === "REQUEST_CREATED") {
          const request = payload;
          // Find if it exists and update
          const path = findRequestPath(collections, request.id);
          if (path.length > 0) {
            const collectionId = path[0].id;
            set((s) => ({
              collections: s.collections.map((c) =>
                c.id === collectionId
                  ? {
                      ...c,
                      requests: c.requests.map((r) =>
                        r.id === request.id ? { ...r, ...request } : r,
                      ),
                      folders: updateRequestInFolders(
                        c.folders,
                        request.id,
                        request,
                      ),
                      updatedAt: new Date().toISOString(),
                    }
                  : c,
              ),
              // Also update any open tabs for this request
              requests: Object.fromEntries(
                Object.entries(s.requests).map(([tabId, req]) => [
                  tabId,
                  req.id === request.id ? { ...req, ...request } : req,
                ]),
              ),
              tabs: s.tabs.map((t) =>
                t.requestId === request.id
                  ? { ...t, name: request.name, isDirty: false }
                  : t,
              ),
            }));
          } else if (type === "REQUEST_CREATED") {
            // New request from someone else
            const { collectionId, folderId } = request;
            set((s) => ({
              collections: s.collections.map((c) => {
                // If it belongs to this collection root
                if (collectionId && c.id === collectionId) {
                  if (c.requests.find((r) => r.id === request.id)) return c;
                  return {
                    ...c,
                    requests: [...c.requests, request],
                    updatedAt: new Date().toISOString(),
                  };
                }
                // If it's in a folder, we need to search this collection's folders
                if (folderId) {
                  // Check if already exists to avoid duplicates
                  const path = findRequestPath([c], request.id);
                  if (path.length > 0) return c;

                  return {
                    ...c,
                    folders: addRequestToFolders(c.folders, folderId, request),
                    updatedAt: new Date().toISOString(),
                  };
                }
                return c;
              }),
            }));
          }
        } else if (
          type === "MEMBER_JOINED" ||
          type === "MEMBER_REMOVED" ||
          type === "MEMBER_UPDATED"
        ) {
          // Refresh workspace and member list
          get().fetchWorkspaces();
        } else if (type === "FULL_SYNC_COMPLETE") {
          // Refresh collections and environments
          const { workspace } = get();
          if (workspace?.id) {
            get().fetchCollections(workspace.id);
          }
        }
      },

      syncCollectionsToBackend: async () => {
        const { collections, environments, workspace, token } = get();
        if (!token) return;

        try {
          const BACKEND_URL =
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
          const res = await fetch(
            `${BACKEND_URL}/api/workspaces/${workspace.id}/sync`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                collections,
                environments: environments.filter((e) => e.id !== "global"),
                workspaceName: workspace.name,
              }),
            },
          );
          if (res.ok) {
            console.log("Collections synced to backend");
          }
        } catch (e) {
          console.error("Failed to sync collections:", e);
        }
      },

      // ── Examples ──
      addExampleToRequest: (requestId, example) => {
        set((s) => ({
          collections: s.collections.map((c) => ({
            ...c,
            requests: c.requests.map((r) =>
              r.id === requestId
                ? { ...r, examples: [...(r.examples || []), example] }
                : r,
            ),
            folders: updateRequestInFolders(c.folders, requestId, {
              examples: [
                ...(s.collections
                  .flatMap((col) => {
                    const findInFolders = (
                      folders: CollectionFolder[],
                    ): RequestConfig | undefined => {
                      for (const f of folders) {
                        const r = f.requests.find(
                          (req) => req.id === requestId,
                        );
                        if (r) return r;
                        const rr = findInFolders(f.folders);
                        if (rr) return rr;
                      }
                      return undefined;
                    };
                    return [
                      ...col.requests,
                      ...(findInFolders(col.folders)
                        ? [findInFolders(col.folders)!]
                        : []),
                    ];
                  })
                  .find((req) => req.id === requestId)?.examples || []),
                example,
              ],
            }),
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
            folders: updateRequestInFolders(c.folders, requestId, {
              examples: (
                s.collections
                  .flatMap((col) => {
                    const findInFolders = (
                      folders: CollectionFolder[],
                    ): RequestConfig | undefined => {
                      for (const f of folders) {
                        const r = f.requests.find(
                          (req) => req.id === requestId,
                        );
                        if (r) return r;
                        const rr = findInFolders(f.folders);
                        if (rr) return rr;
                      }
                      return undefined;
                    };
                    const req =
                      col.requests.find((r) => r.id === requestId) ||
                      findInFolders(col.folders);
                    return req ? [req] : [];
                  })
                  .find((req) => req.id === requestId)?.examples || []
              ).filter((ex) => ex.id !== exampleId),
            }),
          })),
        }));
      },
    }),
    {
      name: "apiforge-store",
      partialize: (s) => ({
        collections: s.collections,
        environments: s.environments,
        history: s.history,
        activeEnvironmentId: s.activeEnvironmentId,
        workspace: s.workspace,
        user: s.user,
        token: s.token,
        workspaces: s.workspaces,
      }),
    },
  ),
);
