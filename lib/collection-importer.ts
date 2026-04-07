import { v4 as uuidv4 } from "uuid";
import type {
  Collection,
  CollectionFolder,
  RequestConfig,
  HttpMethod,
  KeyValuePair,
} from "@/types";

/**
 * Maps Postman Collection (v2.1.0) and Hoppscotch Collection to APIForge format.
 */

// ─── Postman Types ────────────────────────────────────────────────────────────
interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
  description?: string;
}

interface PostmanBody {
  mode: "raw" | "urlencoded" | "formdata" | "file";
  raw?: string;
  urlencoded?: {
    key: string;
    value: string;
    disabled?: boolean;
    description?: string;
  }[];
  formdata?: {
    key: string;
    value: string;
    disabled?: boolean;
    description?: string;
    type?: string;
  }[];
  options?: { raw?: { language: string } };
}

interface PostmanRequest {
  method: string;
  url: string | { raw: string; query?: any[] };
  header: PostmanHeader[];
  body?: PostmanBody;
  description?: string;
  auth?: any;
}

interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  item?: PostmanItem[];
  description?: string;
}

// ─── Hoppscotch Types (v1/v2) ────────────────────────────────────────────────
interface HoppHeader {
  key: string;
  value: string;
  active: boolean;
  description?: string;
}

interface HoppRequest {
  name: string;
  method: string;
  endpoint: string;
  params?: { key: string; value: string; active: boolean }[];
  headers?: HoppHeader[];
  body?: {
    contentType: string;
    body: string;
  };
  auth?: any;
}

interface HoppCollection {
  name: string;
  folders?: any[]; // Recursive
  requests?: HoppRequest[];
  v?: number;
}

// ─── Importer ─────────────────────────────────────────────────────────────────

export function importCollection(json: any): Collection[] {
  // Handle array of collections (Hoppscotch often exports as array)
  if (Array.isArray(json)) {
    return json
      .map((item) => importSingleCollection(item))
      .filter(Boolean) as Collection[];
  }

  const col = importSingleCollection(json);
  return col ? [col] : [];
}

function importSingleCollection(json: any): Collection | null {
  if (!json) return null;

  // Detect Postman
  if (json.info && json.item) {
    return mapPostmanCollection(json);
  }

  // Detect Hoppscotch (name + requests or name + folders or v)
  if (json.name && (json.requests || json.folders || json.v !== undefined)) {
    return mapHoppscotchCollection(json);
  }

  return null;
}

// ─── Postman Mapping ──────────────────────────────────────────────────────────

function mapPostmanCollection(postman: any): Collection {
  const collection: Collection = {
    id: uuidv4(),
    name: postman.info?.name || "Imported Postman Collection",
    description: postman.info?.description || "",
    requests: [],
    folders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const processItems = (
    items: PostmanItem[],
  ): { requests: RequestConfig[]; folders: CollectionFolder[] } => {
    const requests: RequestConfig[] = [];
    const folders: CollectionFolder[] = [];

    for (const item of items) {
      if (item.request) {
        requests.push(mapPostmanRequest(item));
      } else if (item.item) {
        const { requests: subReqs, folders: subFolders } = processItems(
          item.item,
        );
        folders.push({
          id: uuidv4(),
          name: item.name,
          description: item.description || "",
          requests: subReqs,
          folders: subFolders,
        });
      }
    }
    return { requests, folders };
  };

  const { requests, folders } = processItems(postman.item || []);
  collection.requests = requests;
  collection.folders = folders;
  return collection;
}

function mapPostmanRequest(item: PostmanItem): RequestConfig {
  const pmReq = item.request!;
  const url = typeof pmReq.url === "string" ? pmReq.url : pmReq.url?.raw || "";

  const headers = (pmReq.header || []).map((h) => ({
    id: uuidv4(),
    key: h.key,
    value: h.value,
    enabled: h.disabled !== true,
    description: h.description,
  }));

  const params: KeyValuePair[] = [];
  if (typeof pmReq.url !== "string" && pmReq.url?.query) {
    pmReq.url.query.forEach((q: any) => {
      params.push({
        id: uuidv4(),
        key: q.key,
        value: q.value,
        enabled: q.disabled !== true,
        description: q.description,
      });
    });
  }

  const bodyData: RequestConfig["body"] = {
    type: "none",
    content: "",
    formData: [],
  };
  if (pmReq.body) {
    if (pmReq.body.mode === "raw") {
      bodyData.type =
        pmReq.body.options?.raw?.language === "json" ? "json" : "raw";
      bodyData.content = pmReq.body.raw || "";
    } else if (pmReq.body.mode === "urlencoded") {
      bodyData.type = "x-www-form-urlencoded";
      bodyData.content = (pmReq.body.urlencoded || [])
        .map((i) => `${i.key}=${i.value}`)
        .join("&");
    } else if (pmReq.body.mode === "formdata") {
      bodyData.type = "form-data";
      bodyData.formData = (pmReq.body.formdata || []).map((f) => ({
        id: uuidv4(),
        key: f.key,
        value: f.value,
        enabled: f.disabled !== true,
        description: f.description,
      }));
    }
  }

  const auth: RequestConfig["auth"] = { type: "none" };
  if (pmReq.auth) {
    const pmAuth = pmReq.auth;
    if (pmAuth.type === "bearer") {
      auth.type = "bearer";
      auth.bearerToken =
        pmAuth.bearer?.find((b: any) => b.key === "token")?.value || "";
    } else if (pmAuth.type === "basic") {
      auth.type = "basic";
      auth.basicUsername =
        pmAuth.basic?.find((b: any) => b.key === "username")?.value || "";
      auth.basicPassword =
        pmAuth.basic?.find((b: any) => b.key === "password")?.value || "";
    }
  }

  return {
    id: uuidv4(),
    name: item.name,
    method: (pmReq.method || "GET") as HttpMethod,
    url,
    headers,
    params,
    body: bodyData,
    auth,
    description: item.description,
  };
}

// ─── Hoppscotch Mapping ───────────────────────────────────────────────────────

function mapHoppscotchCollection(hopp: any): Collection {
  const collection: Collection = {
    id: uuidv4(),
    name: hopp.name || "Imported Hoppscotch Collection",
    description: "",
    requests: [],
    folders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const processSubfolders = (hoppFolders: any[]): CollectionFolder[] => {
    return (hoppFolders || []).map((folder) => ({
      id: uuidv4(),
      name: folder.name,
      description: "",
      requests: (folder.requests || []).map((r: any) =>
        mapHoppscotchRequest(r),
      ),
      folders: processSubfolders(folder.folders || []),
    }));
  };

  collection.folders = processSubfolders(hopp.folders || []);
  collection.requests = (hopp.requests || []).map((r: any) =>
    mapHoppscotchRequest(r),
  );

  return collection;
}

function mapHoppscotchRequest(hoppReq: any): RequestConfig {
  const headers = (hoppReq.headers || []).map((h: any) => ({
    id: uuidv4(),
    key: h.key,
    value: h.value,
    enabled: h.active !== false,
  }));

  const params = (hoppReq.params || []).map((p: any) => ({
    id: uuidv4(),
    key: p.key,
    value: p.value,
    enabled: p.active !== false,
  }));

  const bodyData: RequestConfig["body"] = {
    type: "none",
    content: "",
    formData: [],
  };
  if (hoppReq.body) {
    const ct = hoppReq.body.contentType;
    if (ct === "application/json") bodyData.type = "json";
    else if (ct && ct.includes("form-data")) bodyData.type = "form-data";
    else if (ct && ct.includes("x-www-form-urlencoded"))
      bodyData.type = "x-www-form-urlencoded";
    else if (ct) bodyData.type = "raw";

    bodyData.content = hoppReq.body.body || "";
  }

  const auth: RequestConfig["auth"] = { type: "none" };
  if (hoppReq.auth) {
    if (hoppReq.auth.authType === "bearer") {
      auth.type = "bearer";
      auth.bearerToken = hoppReq.auth.token || "";
    } else if (hoppReq.auth.authType === "basic") {
      auth.type = "basic";
      auth.basicUsername = hoppReq.auth.username || "";
      auth.basicPassword = hoppReq.auth.password || "";
    }
  }

  return {
    id: uuidv4(),
    name: hoppReq.name || "Untitled Request",
    method: (hoppReq.method || "GET") as HttpMethod,
    url: hoppReq.endpoint || "",
    headers,
    params,
    body: bodyData,
    auth,
  };
}
