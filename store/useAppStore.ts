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
  deleteCollection: (id: string) => void;

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
  saveRequestById: (tabId: string) => boolean; // returns true if saved, false if new (needs modal)

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
  workspace: TeamWorkspace;
  inviteMember: (name: string, email: string, role: TeamRole) => void;
  updateMemberRole: (memberId: string, role: TeamRole) => void;
  removeMember: (memberId: string) => void;
  updateWorkspace: (
    updates: Partial<Pick<TeamWorkspace, "name" | "description">>,
  ) => void;
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
      workspace: {
        id: uuidv4(),
        name: "My Workspace",
        description: "",
        members: [
          {
            id: uuidv4(),
            name: "You",
            email: "me@example.com",
            role: "owner",
            avatar: "#58a6ff",
            joinedAt: new Date().toISOString(),
            status: "active",
          },
        ],
        createdAt: new Date().toISOString(),
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

      deleteCollection: (id) =>
        set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),

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

      saveRequestById: (tabId) => {
        const {
          requests,
          collections,
          updateRequestInCollection,
          markTabSaved,
        } = get();
        const request = requests[tabId];
        if (!request) return false;

        const path = findRequestPath(collections, request.id);
        if (path.length > 0) {
          const collectionId = path[0].id;
          updateRequestInCollection(collectionId, request.id, request);
          markTabSaved(tabId);
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
      inviteMember: (name, email, role) => {
        const AVATAR_COLORS = [
          "#58a6ff",
          "#bc8cff",
          "#3fb950",
          "#f0883e",
          "#ff7b72",
          "#ffa657",
          "#79c0ff",
        ];
        const member: TeamMember = {
          id: uuidv4(),
          name,
          email,
          role,
          avatar:
            AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          joinedAt: new Date().toISOString(),
          status: "pending",
        };
        set((s) => ({
          workspace: {
            ...s.workspace,
            members: [...s.workspace.members, member],
          },
        }));
      },

      updateMemberRole: (memberId, role) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            members: s.workspace.members.map((m) =>
              m.id === memberId ? { ...m, role } : m,
            ),
          },
        })),

      removeMember: (memberId) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            members: s.workspace.members.filter((m) => m.id !== memberId),
          },
        })),

      updateWorkspace: (updates) =>
        set((s) => ({ workspace: { ...s.workspace, ...updates } })),

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
      }),
    },
  ),
);
