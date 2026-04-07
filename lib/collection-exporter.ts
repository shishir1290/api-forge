import type { Collection, CollectionFolder, RequestConfig } from "@/types";

/**
 * Maps APIForge Collection to Postman (v2.1.0) and Hoppscotch formats.
 */

// ─── Postman Export ───────────────────────────────────────────────────────────

export function exportToPostman(collection: Collection): any {
  const postman = {
    info: {
      _postman_id: collection.id,
      name: collection.name,
      description: collection.description,
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: [
      ...collection.folders.map(mapFolderToPostman),
      ...collection.requests.map(mapRequestToPostman),
    ],
  };

  return postman;
}

function mapFolderToPostman(folder: CollectionFolder): any {
  return {
    name: folder.name,
    description: folder.description,
    item: [
      ...folder.folders.map(mapFolderToPostman),
      ...folder.requests.map(mapRequestToPostman),
    ],
  };
}

function mapRequestToPostman(req: RequestConfig): any {
  const pmReq: any = {
    name: req.name,
    request: {
      method: req.method,
      header: req.headers.map((h) => ({
        key: h.key,
        value: h.value,
        description: h.description,
        disabled: !h.enabled,
      })),
      url: {
        raw: req.url,
        protocol: req.url.split("://")[0] || "http",
        host: (req.url.split("://")[1] || req.url).split("/")[0].split("."),
        path: (req.url.split("://")[1] || req.url).split("/").slice(1),
        query: req.params.map((p) => ({
          key: p.key,
          value: p.value,
          description: p.description,
          disabled: !p.enabled,
        })),
      },
    },
  };

  // Body mapping
  if (req.body.type !== "none") {
    const body: any = {};
    if (req.body.type === "json" || req.body.type === "raw") {
      body.mode = "raw";
      body.raw = req.body.content;
      body.options = {
        raw: {
          language: req.body.type === "json" ? "json" : "text",
        },
      };
    } else if (req.body.type === "form-data") {
      body.mode = "formdata";
      body.formdata = req.body.formData.map((f) => ({
        key: f.key,
        value: f.value,
        description: f.description,
        type: "text",
        disabled: !f.enabled,
      }));
    } else if (req.body.type === "x-www-form-urlencoded") {
      body.mode = "urlencoded";
      body.urlencoded = req.body.content.split("&").map((p) => {
        const [key, value] = p.split("=");
        return { key, value: decodeURIComponent(value || ""), disabled: false };
      });
    }
    pmReq.request.body = body;
  }

  // Auth mapping
  if (req.auth.type !== "none") {
    const auth: any = {
      type: req.auth.type === "api-key" ? "apikey" : req.auth.type,
    };
    if (req.auth.type === "bearer") {
      auth.bearer = [
        { key: "token", value: req.auth.bearerToken, type: "string" },
      ];
    } else if (req.auth.type === "basic") {
      auth.basic = [
        { key: "username", value: req.auth.basicUsername, type: "string" },
        { key: "password", value: req.auth.basicPassword, type: "string" },
      ];
    } else if (req.auth.type === "api-key") {
      auth.apikey = [
        { key: "key", value: req.auth.apiKeyKey, type: "string" },
        { key: "value", value: req.auth.apiKeyValue, type: "string" },
        { key: "in", value: req.auth.apiKeyIn, type: "string" },
      ];
    }
    pmReq.request.auth = auth;
  }

  return pmReq;
}

// ─── Hoppscotch Export ────────────────────────────────────────────────────────

export function exportToHoppscotch(collection: Collection): any {
  return {
    v: 1,
    name: collection.name,
    folders: collection.folders.map(mapFolderToHopp),
    requests: collection.requests.map(mapRequestToHopp),
    auth: { authType: "none", authActive: true },
    headers: [],
  };
}

function mapFolderToHopp(folder: CollectionFolder): any {
  return {
    name: folder.name,
    folders: folder.folders.map(mapFolderToHopp),
    requests: folder.requests.map(mapRequestToHopp),
  };
}

function mapRequestToHopp(req: RequestConfig): any {
  const hoppReq: any = {
    name: req.name,
    method: req.method,
    endpoint: req.url,
    params: req.params.map((p) => ({
      key: p.key,
      value: p.value,
      active: p.enabled,
    })),
    headers: req.headers.map((h) => ({
      key: h.key,
      value: h.value,
      active: h.enabled,
    })),
  };

  // Body mapping
  if (req.body.type !== "none") {
    let contentType = "text/plain";
    if (req.body.type === "json") contentType = "application/json";
    else if (req.body.type === "form-data") contentType = "multipart/form-data";
    else if (req.body.type === "x-www-form-urlencoded")
      contentType = "application/x-www-form-urlencoded";

    hoppReq.body = {
      contentType,
      body: req.body.content || (req.body.type === "form-data" ? "" : ""),
    };
  }

  // Auth mapping
  if (req.auth.type !== "none") {
    const auth: any = { authActive: true };
    if (req.auth.type === "bearer") {
      auth.authType = "bearer";
      auth.token = req.auth.bearerToken;
    } else if (req.auth.type === "basic") {
      auth.authType = "basic";
      auth.username = req.auth.basicUsername;
      auth.password = req.auth.basicPassword;
    } else {
      auth.authType = "none";
    }
    hoppReq.auth = auth;
  } else {
    hoppReq.auth = { authType: "none", authActive: true };
  }

  return hoppReq;
}
