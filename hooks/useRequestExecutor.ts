import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { resolveVariables } from "@/lib/resolve-vars";
import { executeScript } from "@/lib/script-executor";
import {
  getInheritedAuth,
  getInheritedVariables,
  getInheritedHeaders,
} from "@/lib/hierarchy-utils";
import { KeyValuePair, ResponseData, RequestConfig } from "@/types";

export function useRequestExecutor(tabId: string) {
  const {
    requests,
    setResponse,
    setLoading,
    addToHistory,
    environments,
    activeEnvironmentId,
    setEnvironmentVariable,
    collections,
  } = useAppStore();

  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const request = requests[tabId];

  const log = useCallback(
    (msg: string) =>
      setConsoleLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ${msg}`,
      ]),
    [],
  );

  const sendRequest = useCallback(async () => {
    if (!request?.url) return;
    setLoading(tabId, true);
    setConsoleLogs([]);

    try {
      // 1. Pre-request script
      if (request.preRequestScript) {
        log("Executing Pre-request script...");
        executeScript(request.preRequestScript, {
          environments,
          activeEnvironmentId,
          setEnvironmentVariable,
          log,
        });
      }

      const {
        environments: latestEnvs,
        activeEnvironmentId: latestActiveId,
        collections: latestCols,
      } = useAppStore.getState();

      const latestInheritedVars = getInheritedVariables(latestCols, request.id);
      const latestInheritedHeaders = getInheritedHeaders(
        latestCols,
        request.id,
      );
      const latestEffectiveAuth = getInheritedAuth(
        latestCols,
        request.id,
        request,
      );

      const resolve = (text: string) =>
        resolveVariables(text, latestEnvs, latestActiveId, latestInheritedVars);

      let url = resolve(request.url);
      const enabledParams = request.params.filter((p) => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const searchParams = new URLSearchParams();
        enabledParams.forEach((p) =>
          searchParams.append(resolve(p.key), resolve(p.value)),
        );
        url += (url.includes("?") ? "&" : "?") + searchParams.toString();
      }

      const headers: Record<string, string> = {};
      latestInheritedHeaders
        .filter((h: any) => h.enabled && h.key)
        .forEach((h: any) => {
          headers[resolve(h.key)] = resolve(h.value);
        });
      request.headers
        .filter((h: any) => h.enabled && h.key)
        .forEach((h: any) => {
          headers[resolve(h.key)] = resolve(h.value);
        });

      // Apply Auth logic
      if (
        latestEffectiveAuth.type === "bearer" &&
        latestEffectiveAuth.bearerToken
      ) {
        const resolvedToken = resolve(latestEffectiveAuth.bearerToken);
        headers["Authorization"] = `Bearer ${resolvedToken}`;
        log(`Applied Bearer Auth (Token: ${resolvedToken.slice(0, 8)}...)`);
      } else if (latestEffectiveAuth.type === "basic") {
        const username = resolve(latestEffectiveAuth.basicUsername || "");
        const password = resolve(latestEffectiveAuth.basicPassword || "");
        const encoded = btoa(`${username}:${password}`);
        headers["Authorization"] = `Basic ${encoded}`;
        log(`Applied Basic Auth (User: ${username})`);
      } else if (latestEffectiveAuth.type === "api-key") {
        const key = resolve(latestEffectiveAuth.apiKeyKey || "");
        const value = resolve(latestEffectiveAuth.apiKeyValue || "");
        const location = latestEffectiveAuth.apiKeyIn || "header";
        if (key) {
          if (location === "header") {
            headers[key] = value;
          } else {
            const separator = url.includes("?") ? "&" : "?";
            url += `${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
          }
          log(`Applied API Key Auth (${key} in ${location})`);
        }
      }

      let body: any;
      const hasBody = request.method !== "GET" && request.method !== "HEAD";

      if (request.body.type === "json") {
        if (hasBody) headers["Content-Type"] = "application/json";
        body = resolve(request.body.content);
      } else if (request.body.type === "form-data") {
        const fd = new FormData();
        request.body.formData.forEach(
          (p) => p.enabled && fd.append(p.key, p.value),
        );
        body = fd;
        // Browser sets Content-Type automatically for FormData
      }

      const isElectron =
        typeof window !== "undefined" &&
        navigator.userAgent.toLowerCase().includes("electron");
      const startTime = Date.now();

      log(
        `Sending ${request.method} ${url} (via ${isElectron ? "Direct" : "Proxy"})`,
      );

      const sanitizedHeaders: Record<string, string> = { ...headers };
      if (sanitizedHeaders["Authorization"]) {
        sanitizedHeaders["Authorization"] =
          sanitizedHeaders["Authorization"].substring(0, 15) + "...";
      }
      log(`Headers: ${JSON.stringify(sanitizedHeaders, null, 2)}`);

      let responseData: ResponseData | null = null;
      // 1. Attempt Direct Fetch (primary)
      try {
        log(`Attempting direct request to ${url}...`);
        const fetchOptions: RequestInit = {
          method: request.method,
          headers: headers,
          body:
            request.method !== "GET" && request.method !== "HEAD"
              ? body
              : undefined,
        };

        const res = await fetch(url, fetchOptions);
        const endTime = Date.now();

        const responseHeaders: Record<string, string> = {};
        res.headers.forEach((v, k) => {
          responseHeaders[k] = v;
        });

        const contentType = res.headers.get("content-type") || "";
        const isBinary = /image|pdf|video|audio|octet-stream/.test(contentType);

        let responseBody: string;
        let size = 0;
        if (isBinary) {
          const buffer = await res.arrayBuffer();
          size = buffer.byteLength;
          responseData = {
            status: res.status,
            statusText: res.statusText,
            headers: responseHeaders,
            body: btoa(
              Array.from(new Uint8Array(buffer))
                .map((b) => String.fromCharCode(b))
                .join(""),
            ),
            isBinary: true,
            time: endTime - startTime,
            size,
            requestId: request.id,
            requestHeaders: headers,
          };
        } else {
          responseBody = await res.text();
          size = new TextEncoder().encode(responseBody).length;
          responseData = {
            status: res.status,
            statusText: res.statusText,
            headers: responseHeaders,
            body: responseBody,
            isBinary: false,
            time: endTime - startTime,
            size,
            requestId: request.id,
            requestHeaders: headers,
          };
        }
        log(`Direct request successful (${res.status})`);
      } catch (directError: any) {
        // 2. Fallback to Proxy if Direct Fetch fails (usually due to CORS)
        if (isElectron) {
          // In Electron, direct fetch shouldn't fail due to CORS, so this is a real network error
          throw directError;
        }

        log(
          `Direct request failed (CORS or Network error). Falling back to Proxy...`,
        );
        const res = await fetch("/api/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: request.method,
            url,
            headers,
            body:
              request.method !== "GET" && request.method !== "HEAD"
                ? body
                : undefined,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Proxy Error (${res.status}): ${text.slice(0, 100)}`);
        }

        const resJson = await res.json();
        if (resJson.error) throw new Error(resJson.error);

        responseData = {
          status: resJson.status,
          statusText: resJson.statusText,
          headers: resJson.headers,
          body: resJson.body,
          isBinary: resJson.isBinary,
          time: resJson.time,
          size: resJson.size,
          requestId: request.id,
          requestHeaders: headers,
        };
        log(`Proxy request successful (${resJson.status})`);
      }

      if (responseData) {
        setResponse(tabId, responseData);
        addToHistory({
          id: uuidv4(),
          request: { ...request },
          response: responseData,
          timestamp: new Date().toISOString(),
        });

        // 3. Post-request script
        if (request.postRequestScript) {
          log("Executing Post-request script...");
          executeScript(request.postRequestScript, {
            environments: latestEnvs,
            activeEnvironmentId: latestActiveId,
            response: responseData,
            setEnvironmentVariable,
            log,
          });
        }
      }
    } catch (error: any) {
      log(`Error: ${error.message}`);
    } finally {
      setLoading(tabId, false);
    }
  }, [
    request,
    tabId,
    environments,
    activeEnvironmentId,
    collections,
    setResponse,
    setLoading,
    addToHistory,
    setEnvironmentVariable,
    log,
  ]);

  return { sendRequest, consoleLogs };
}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16),
  );
}
