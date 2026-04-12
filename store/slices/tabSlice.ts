import { StateCreator } from "zustand";
import { AppState } from "../types";
import { Tab, RequestConfig, ResponseData } from "@/types";
import { v4 as uuidv4 } from "uuid";

export interface TabSlice {
  tabs: Tab[];
  activeTabId: string | null;
  requests: Record<string, RequestConfig>;
  responses: Record<string, ResponseData>;
  loadingTabs: Record<string, boolean>;
  openTab: (request: RequestConfig) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  setRequest: (tabId: string, request: RequestConfig) => void;
  updateRequest: (tabId: string, updates: Partial<RequestConfig>) => void;
  markTabSaved: (tabId: string) => void;
  saveRequestById: (tabId: string) => Promise<boolean>;
  setResponse: (tabId: string, response: ResponseData) => void;
  setLoading: (tabId: string, loading: boolean) => void;
}

export const createTabSlice: StateCreator<AppState, [], [], TabSlice> = (
  set,
  get,
) => ({
  tabs: [],
  activeTabId: null,
  requests: {},
  responses: {},
  loadingTabs: {},

  openTab: (request) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.requestId === request.id);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
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
    get().revealRequest(request.id);
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
      const { [tabId]: _r, ...restRequests } = s.requests;
      const { [tabId]: _res, ...restResponses } = s.responses;
      return {
        tabs: newTabs,
        activeTabId: newActiveId,
        requests: restRequests,
        responses: restResponses,
      };
    });
  },

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
    const { tabs, revealRequest } = get();
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      revealRequest(tab.requestId);
    }
  },

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
      tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, isDirty: false } : t)),
    })),

  saveRequestById: async (tabId) => {
    const {
      requests,
      token,
      collections,
      updateRequestInCollection,
      updateRequestInFolder,
      markTabSaved,
    } = get();
    const req = requests[tabId];
    if (!req || !token) return false;

    // Search for the request in collections to find its parent
    for (const col of collections) {
      if (col.requests.some((r) => r.id === req.id)) {
        await updateRequestInCollection(col.id, req.id, req);
        markTabSaved(tabId);
        return true;
      }

      // Recursive helper to search in nested folders
      const searchInFolders = async (folders: any[]): Promise<boolean> => {
        for (const folder of folders) {
          if (folder.requests.some((r: any) => r.id === req.id)) {
            await updateRequestInFolder(col.id, req.id, req);
            markTabSaved(tabId);
            return true;
          }
          if (folder.folders && folder.folders.length > 0) {
            if (await searchInFolders(folder.folders)) return true;
          }
        }
        return false;
      };

      if (await searchInFolders(col.folders)) return true;
    }

    return false;
  },

  setResponse: (tabId, response) =>
    set((s) => ({ responses: { ...s.responses, [tabId]: response } })),

  setLoading: (tabId, loading) =>
    set((s) => ({ loadingTabs: { ...s.loadingTabs, [tabId]: loading } })),
});
