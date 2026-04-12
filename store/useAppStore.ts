import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState } from "./types";
import { createAuthSlice } from "./slices/authSlice";
import { createWorkspaceBaseSlice } from "./slices/workspaceBaseSlice";
import { createWorkspaceMemberSlice } from "./slices/workspaceMemberSlice";
import { createWorkspaceInvitationSlice } from "./slices/workspaceInvitationSlice";
import { createCollectionBaseSlice } from "./slices/collectionBaseSlice";
import { createCollectionFolderSlice } from "./slices/collectionFolderSlice";
import { createCollectionRequestSlice } from "./slices/collectionRequestSlice";
import { createCollectionSyncSlice } from "./slices/collectionSyncSlice";
import { createTabSlice } from "./slices/tabSlice";
import { createEnvironmentSlice } from "./slices/environmentSlice";

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createWorkspaceBaseSlice(...a),
      ...createWorkspaceMemberSlice(...a),
      ...createWorkspaceInvitationSlice(...a),
      ...createCollectionBaseSlice(...a),
      ...createCollectionFolderSlice(...a),
      ...createCollectionRequestSlice(...a),
      ...createCollectionSyncSlice(...a),
      ...createTabSlice(...a),
      ...createEnvironmentSlice(...a),

      processRemoteUpdate: (data: { type: string; payload: any }) => {
        const { type, payload } = data;
        const get = a[1] as () => AppState;
        const current = get();

        switch (type) {
          case "REQUEST_CREATED":
          case "REQUEST_UPDATED":
          case "REQUEST_DELETED":
          case "FOLDER_CREATED":
          case "FOLDER_UPDATED":
          case "FOLDER_DELETED":
          case "COLLECTION_CREATED":
          case "COLLECTION_UPDATED":
          case "COLLECTION_DELETED":
          case "ENVIRONMENT_CREATED":
          case "ENVIRONMENT_UPDATED":
          case "ENVIRONMENT_DELETED":
          case "FULL_SYNC_COMPLETE":
            if (current.workspace.id) {
              current.fetchCollections(current.workspace.id);
            }
            break;

          case "MEMBER_JOINED":
          case "MEMBER_UPDATED":
          case "MEMBER_REMOVED":
            current.fetchWorkspaces();
            break;
        }
      },

      syncCollectionsToBackend: async () => {},
    }),
    {
      name: "app-store",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        workspaces: state.workspaces,
        workspace: state.workspace,
        collections: state.collections,
        environments: state.environments,
        activeEnvironmentId: state.activeEnvironmentId,
        history: state.history,
        tabs: state.tabs,
      }),
    },
  ),
);
