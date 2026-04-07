import {
  Collection,
  CollectionFolder,
  RequestAuth,
  RequestConfig,
  KeyValuePair,
} from "@/types";

/**
 * Finds the path from a root collection to a specific request.
 */
export function findRequestPath(
  collections: Collection[],
  requestId: string,
): (Collection | CollectionFolder)[] {
  let path: (Collection | CollectionFolder)[] = [];

  const search = (
    currentFolders: (Collection | CollectionFolder)[],
    currentPath: (Collection | CollectionFolder)[],
  ): boolean => {
    for (const folder of currentFolders) {
      // Check requests in this folder/collection
      if (folder.requests && folder.requests.some((r) => r.id === requestId)) {
        path = [...currentPath, folder];
        return true;
      }

      // Check sub-folders
      if (folder.folders && folder.folders.length > 0) {
        if (search(folder.folders, [...currentPath, folder])) {
          return true;
        }
      }
    }
    return false;
  };

  search(collections, []);
  return path;
}

/**
 * Resolves the effective authorization for a request by walking up the hierarchy.
 */
export function getInheritedAuth(
  collections: Collection[],
  requestId: string,
  request?: RequestConfig, // Allow passing current request directly
): RequestAuth {
  const path = findRequestPath(collections, requestId);

  // Find the request itself to get its own auth
  let targetRequest: RequestConfig | undefined = request;
  if (path.length > 0) {
    const lastParent = path[path.length - 1];
    const found = lastParent.requests.find((r) => r.id === requestId);
    if (found) targetRequest = found;
  }

  if (!targetRequest) return { type: "none" };

  let currentAuth = targetRequest.auth;

  if (currentAuth.type === "inherit") {
    // Traverse from the closest parent upwards
    for (let i = path.length - 1; i >= 0; i--) {
      const parent = path[i];
      if (parent.auth && parent.auth.type !== "inherit") {
        return parent.auth;
      }
    }
    return { type: "none" };
  }

  return currentAuth;
}

/**
 * Collects all variables from the hierarchy (request, folder, collection).
 * Higher level (collection) variables are added first, then overridden by folder variables.
 */
export function getInheritedVariables(
  collections: Collection[],
  requestId: string,
  _request?: RequestConfig,
): KeyValuePair[] {
  const path = findRequestPath(collections, requestId);
  const variables: KeyValuePair[] = [];

  // Traverse from top (collection) to bottom (closest folder)
  // This way, sub-folder variables override parent folder/collection variables
  path.forEach((item) => {
    if (item.variables) {
      variables.push(...item.variables);
    }
  });

  return variables;
}

/**
 * Collects all headers from the hierarchy (folder, collection).
 * Higher level (collection) headers are added first, then overridden by folder headers.
 */
export function getInheritedHeaders(
  collections: Collection[],
  requestId: string,
  _request?: RequestConfig,
): KeyValuePair[] {
  const path = findRequestPath(collections, requestId);
  const headers: KeyValuePair[] = [];

  // Traverse from top (collection) to bottom (closest folder)
  // This way, sub-folder headers override parent folder/collection headers
  path.forEach((item) => {
    if (item.headers) {
      headers.push(...item.headers);
    }
  });

  return headers;
}
