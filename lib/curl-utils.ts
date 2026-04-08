import { RequestConfig } from "@/types";

export function generateCurl(request: RequestConfig): string {
  const parts = ["curl"];

  parts.push(`-X ${request.method}`);
  parts.push(`"${request.url}"`);

  request.headers.forEach((h) => {
    if (h.enabled && h.key) {
      parts.push(`-H "${h.key}: ${h.value}"`);
    }
  });

  if (request.body.type !== "none" && request.body.content) {
    // Escape double quotes for shell
    const escapedBody = request.body.content.replace(/"/g, '\\"');
    parts.push(`-d "${escapedBody}"`);
  }

  // Handle Auth
  if (request.auth.type === "bearer" && request.auth.bearerToken) {
    parts.push(`-H "Authorization: Bearer ${request.auth.bearerToken}"`);
  } else if (request.auth.type === "basic") {
    const auth = btoa(
      `${request.auth.basicUsername || ""}:${request.auth.basicPassword || ""}`,
    );
    parts.push(`-H "Authorization: Basic ${auth}"`);
  }

  return parts.join(" ");
}

export function parseCurl(curl: string): Partial<RequestConfig> {
  const config: Partial<RequestConfig> = {
    method: "GET",
    url: "",
    headers: [],
    params: [],
    body: { type: "none", content: "", formData: [] },
    auth: { type: "none" },
  };

  // Very basic regex-based parser
  // In a real app, use a library like 'curl-to-json' or 'shell-quote'
  const methodMatch = curl.match(/-X\s+([A-Z]+)/);
  if (methodMatch) config.method = methodMatch[1] as any;

  const urlMatch =
    curl.match(/"(https?:\/\/[^"]+)"/) || curl.match(/'(https?:\/\/[^']+)'/);
  if (urlMatch) config.url = urlMatch[1];

  const headerMatches = curl.matchAll(/-H\s+["']([^"']+)["']/g);
  for (const match of headerMatches) {
    const [key, ...values] = match[1].split(":");
    if (key && values.length > 0) {
      config.headers?.push({
        id: Math.random().toString(36).substr(2, 9),
        key: key.trim(),
        value: values.join(":").trim(),
        enabled: true,
      });
    }
  }

  const bodyMatch =
    curl.match(/-d\s+["']([^"']+)["']/) ||
    curl.match(/--data\s+["']([^"']+)["']/);
  if (bodyMatch) {
    config.body = {
      type: "raw",
      content: bodyMatch[1],
      formData: [],
    };
  }

  return config;
}
