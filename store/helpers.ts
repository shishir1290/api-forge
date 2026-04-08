import { CollectionFolder, RequestConfig } from "@/types";

export function addFolderToFolders(
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

export function addRequestToFolders(
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

export function updateFolderInFolders(
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

export function deleteFolderFromFolders(
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

export function deleteRequestFromFolders(
  folders: CollectionFolder[],
  requestId: string,
): CollectionFolder[] {
  return folders.map((f) => ({
    ...f,
    requests: f.requests.filter((r) => r.id !== requestId),
    folders: deleteRequestFromFolders(f.folders, requestId),
  }));
}

export function updateRequestInFolders(
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
