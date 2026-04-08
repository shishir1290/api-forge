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

export interface AppState {
  // Collections
  collections: Collection[];
  addCollection: (name: string, description?: string) => void;
  importFullCollections: (collections: Collection[]) => void;
  importCollectionsToBackend: (collections: Collection[]) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => Promise<void>;
  fetchCollections: (workspaceId: string) => Promise<void>;

  // Folders & Sidebar State
  expandedSidebarIds: string[];
  toggleSidebarExpansion: (id: string, expanded?: boolean) => void;
  setExpandedSidebarIds: (ids: string[]) => void;
  revealRequest: (requestId: string) => void;

  // Root-level requests in collection
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

  // Folders — parentFolderId=null means root of collection
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

  // Requests inside folders
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
  updateFolderInFolderTree: (
    collectionId: string,
    folderId: string,
    updates: Partial<CollectionFolder>,
  ) => Promise<void>;

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
  saveRequestById: (tabId: string) => Promise<boolean>;

  // Per-tab responses
  responses: Record<string, ResponseData>;
  setResponse: (tabId: string, response: ResponseData) => void;

  // Loading state
  loadingTabs: Record<string, boolean>;
  setLoading: (tabId: string, loading: boolean) => void;

  // Environments
  environments: Environment[];
  activeEnvironmentId: string | null;
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

  // History
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;

  // Team / Workspace
  workspaces: TeamWorkspace[];
  fetchWorkspaces: () => Promise<void>;
  workspace: TeamWorkspace;
  setActiveWorkspace: (id: string) => void;
  addWorkspace: (name: string) => Promise<void>;
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
