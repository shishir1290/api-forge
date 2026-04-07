import { RequestConfig, Environment, KeyValuePair, RequestAuth } from "@/types";
import { resolveVariables } from "./resolve-vars";

/**
 * Generates a cURL command from a RequestConfig object.
 */
export function generateCurl(
  request: RequestConfig,
  environments: Environment[] = [],
  activeId: string | null = null,
  extraVariables: KeyValuePair[] = [],
  inheritedHeaders: KeyValuePair[] = [],
  inheritedAuth?: RequestAuth,
): string {
  const resolve = (text: string) =>
    resolveVariables(text, environments, activeId, extraVariables);

  // Use inherited auth if the request is set to inherit
  const effectiveAuth =
    request.auth.type === "inherit" && inheritedAuth
      ? inheritedAuth
      : request.auth;

  // Create a deep copy to resolve variables without mutating original
  const resolvedUrl = resolve(request.url);
  const { method, headers, body } = request;

  let curl = `curl --location --request ${method} '${resolvedUrl}'`;

  // Headers
  const allHeaders: KeyValuePair[] = [];

  // 1. Add inherited headers
  inheritedHeaders.forEach((h) => {
    if (h.enabled !== false && h.key) {
      allHeaders.push({ ...h, value: resolve(h.value || "") });
    }
  });

  // 2. Add local headers (can override inherited)
  headers.forEach((h) => {
    if (h.enabled !== false && h.key) {
      // Find if this header already exists in allHeaders and update it
      const existingIdx = allHeaders.findIndex(
        (ah) => ah.key.toLowerCase() === h.key.toLowerCase(),
      );
      if (existingIdx !== -1) {
        allHeaders[existingIdx] = { ...h, value: resolve(h.value || "") };
      } else {
        allHeaders.push({ ...h, value: resolve(h.value || "") });
      }
    }
  });

  // Add Auth headers if applicable
  if (effectiveAuth.type === "bearer" && effectiveAuth.bearerToken) {
    const resolvedToken = resolve(effectiveAuth.bearerToken);
    allHeaders.push({
      id: "auth",
      key: "Authorization",
      value: `Bearer ${resolvedToken}`,
      enabled: true,
    });
  } else if (effectiveAuth.type === "basic") {
    const user = resolve(effectiveAuth.basicUsername || "");
    const pass = resolve(effectiveAuth.basicPassword || "");
    const encoded = btoa(`${user}:${pass}`);
    allHeaders.push({
      id: "auth",
      key: "Authorization",
      value: `Basic ${encoded}`,
      enabled: true,
    });
  } else if (
    effectiveAuth.type === "api-key" &&
    effectiveAuth.apiKeyIn === "header"
  ) {
    allHeaders.push({
      id: "auth",
      key: resolve(effectiveAuth.apiKeyKey || "X-API-Key"),
      value: resolve(effectiveAuth.apiKeyValue || ""),
      enabled: true,
    });
  }

  allHeaders
    .filter((h) => h.enabled !== false && h.key)
    .forEach((h) => {
      curl += ` \\\n--header '${h.key}: ${h.value}'`;
    });

  // Body
  if (method !== "GET" && method !== "HEAD") {
    if (body.type === "json" && body.content) {
      const resolvedBody = resolve(body.content);
      curl += ` \\\n--header 'Content-Type: application/json'`;
      curl += ` \\\n--data-raw '${resolvedBody.replace(/'/g, "'\\''")}'`;
    } else if (body.type === "x-www-form-urlencoded") {
      curl += ` \\\n--header 'Content-Type: application/x-www-form-urlencoded'`;
      const formParams = body.formData
        .filter((p) => p.enabled && p.key)
        .map((p) => {
          const resolvedKey = resolve(p.key);
          const resolvedVal = resolve(p.value || "");
          return `${encodeURIComponent(resolvedKey)}=${encodeURIComponent(resolvedVal)}`;
        })
        .join("&");
      if (formParams) {
        curl += ` \\\n--data '${formParams}'`;
      }
    } else if (body.type === "raw" && body.content) {
      const resolvedBody = resolve(body.content);
      curl += ` \\\n--data-raw '${resolvedBody.replace(/'/g, "'\\''")}'`;
    }
  }

  return curl;
}
