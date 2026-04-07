"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useAppStore } from "@/store/useAppStore";

export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    workspace,
    collections,
    processRemoteUpdate,
    syncCollectionsToBackend,
  } = useAppStore();

  useEffect(() => {
    if (workspace?.id) {
      socket.connect();
      socket.emit("join-workspace", workspace.id);

      socket.on("workspace-change", (data) => {
        console.log("Realtime update received:", data);
        processRemoteUpdate(data);
      });

      // Initial sync of existing collections
      syncCollectionsToBackend();

      return () => {
        socket.off("workspace-change");
        socket.disconnect();
      };
    }
  }, [workspace?.id, processRemoteUpdate, syncCollectionsToBackend]);

  // Auto-sync whenever collections change (debounced)
  useEffect(() => {
    if (workspace?.id && collections.length > 0) {
      const timer = setTimeout(() => {
        syncCollectionsToBackend();
      }, 5000); // 5s debounce to avoid over-syncing
      return () => clearTimeout(timer);
    }
  }, [collections, workspace?.id, syncCollectionsToBackend]);

  return <>{children}</>;
};
