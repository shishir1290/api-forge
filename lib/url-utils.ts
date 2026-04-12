import { KeyValuePair } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Parses query parameters from a URL string and syncs them with existing params.
 * Attempts to preserve IDs and enabled states for existing keys.
 */
export function parseQueryParams(
  url: string,
  currentParams: KeyValuePair[],
): KeyValuePair[] {
  const questionMarkIndex = url.indexOf("?");
  if (questionMarkIndex === -1) return [];

  const queryString = url.substring(questionMarkIndex + 1);
  if (!queryString) return [];

  const pairs = queryString.split("&");
  const newParams: KeyValuePair[] = [];

  for (const pair of pairs) {
    if (!pair) continue;
    const [key, ...valueParts] = pair.split("=");
    const decodedKey = decodeURIComponent(key);
    const decodedValue =
      valueParts.length > 0 ? decodeURIComponent(valueParts.join("=")) : "";

    // Try to find an existing parameter with the same key and value to preserve state
    const existing = currentParams.find(
      (p) => p.key === decodedKey && p.value === decodedValue && p.enabled,
    );

    newParams.push({
      id: existing?.id || uuidv4(),
      key: decodedKey,
      value: decodedValue,
      enabled: existing ? existing.enabled : true,
    });
  }

  return newParams;
}

/**
 * Rebuilds the URL string by replacing its query parameters with the provided ones.
 * Only includes enabled parameters with non-empty keys.
 */
export function buildUrlWithParams(
  url: string,
  params: KeyValuePair[],
): string {
  const questionMarkIndex = url.indexOf("?");
  const baseUrl =
    questionMarkIndex === -1 ? url : url.substring(0, questionMarkIndex);

  const enabledParams = params.filter((p) => p.enabled && p.key.trim() !== "");
  if (enabledParams.length === 0) return baseUrl;

  const queryString = enabledParams
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join("&");

  return `${baseUrl}?${queryString}`;
}
