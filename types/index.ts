export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
  type?: "text" | "file";
}

export interface RequestAuth {
  type: "none" | "bearer" | "basic" | "api-key" | "inherit";
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  apiKeyKey?: string;
  apiKeyValue?: string;
  apiKeyIn?: "header" | "query";
}

export interface RequestExample {
  id: string;
  name: string;
  request: RequestConfig;
  response: ResponseData;
}

export interface RequestConfig {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: {
    type: "none" | "json" | "form-data" | "x-www-form-urlencoded" | "raw";
    content: string;
    formData: KeyValuePair[];
  };
  auth: RequestAuth;
  description?: string;
  preRequestScript?: string;
  postRequestScript?: string;
  examples?: RequestExample[];
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
  requestId: string;
}

// Recursive folder — folders can contain requests AND sub-folders
export interface CollectionFolder {
  id: string;
  name: string;
  description?: string;
  requests: RequestConfig[];
  folders: CollectionFolder[]; // nested folders
  auth?: RequestAuth;
  headers?: KeyValuePair[];
  variables?: KeyValuePair[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: RequestConfig[]; // root-level requests
  folders: CollectionFolder[]; // root-level folders
  auth?: RequestAuth;
  headers?: KeyValuePair[];
  variables?: KeyValuePair[];
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  initialValue: string;
  currentValue: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  secrets: EnvironmentVariable[];
}

export interface HistoryItem {
  id: string;
  request: RequestConfig;
  response: ResponseData;
  timestamp: string;
}

export interface Tab {
  id: string;
  requestId: string;
  name: string;
  isDirty: boolean;
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export type TeamRole = "owner" | "admin" | "editor" | "viewer";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatar: string; // initials-based color string
  joinedAt: string;
  status: "active" | "pending";
}

export interface TeamWorkspace {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: TeamRole;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  workspaceId: string;
  workspace: { id: string; name: string };
  inviter: { id: string; name: string; email: string };
  createdAt: string;
}
