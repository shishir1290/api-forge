export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface RequestAuth {
  type: 'none' | 'bearer' | 'basic' | 'api-key';
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  apiKeyKey?: string;
  apiKeyValue?: string;
  apiKeyIn?: 'header' | 'query';
}

export interface RequestConfig {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: {
    type: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw';
    content: string;
    formData: KeyValuePair[];
  };
  auth: RequestAuth;
  description?: string;
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
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: RequestConfig[];   // root-level requests
  folders: CollectionFolder[]; // root-level folders
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValuePair[];
  isActive: boolean;
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

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatar: string; // initials-based color string
  joinedAt: string;
  status: 'active' | 'pending';
}

export interface TeamWorkspace {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: string;
}
