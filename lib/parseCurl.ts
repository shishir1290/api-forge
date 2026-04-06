import { v4 as uuidv4 } from 'uuid';
import type { RequestConfig, HttpMethod, KeyValuePair } from '@/types';

const VALID_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

function makeKV(key: string, value: string): KeyValuePair {
  return { id: uuidv4(), key, value, enabled: true };
}

/**
 * Tokenises a curl command into an array of shell-like tokens,
 * correctly handling single-quoted, double-quoted, and unquoted segments.
 */
function tokenise(raw: string): string[] {
  // Normalise line continuations and collapse whitespace runs
  const s = raw
    .replace(/\\\n/g, ' ')   // line continuation
    .replace(/\\\r\n/g, ' ') // windows line continuation
    .trim();

  const tokens: string[] = [];
  let i = 0;
  while (i < s.length) {
    // Skip whitespace
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;

    let token = '';
    while (i < s.length && !/\s/.test(s[i])) {
      if (s[i] === "'") {
        // Single-quoted: everything literal until closing '
        i++;
        while (i < s.length && s[i] !== "'") { token += s[i++]; }
        i++; // consume closing '
      } else if (s[i] === '"') {
        // Double-quoted: handle \" escape
        i++;
        while (i < s.length && s[i] !== '"') {
          if (s[i] === '\\' && i + 1 < s.length) { i++; token += s[i++]; }
          else { token += s[i++]; }
        }
        i++; // consume closing "
      } else if (s[i] === '\\') {
        // Backslash escape outside quotes
        i++;
        if (i < s.length) token += s[i++];
      } else {
        token += s[i++];
      }
    }
    if (token) tokens.push(token);
  }
  return tokens;
}

export function parseCurl(raw: string): RequestConfig | null {
  const trimmed = raw.trim();
  if (!trimmed.toLowerCase().startsWith('curl')) return null;

  const tokens = tokenise(trimmed);
  if (tokens[0]?.toLowerCase() !== 'curl') return null;

  let url = '';
  let method: HttpMethod | null = null;
  const headers: KeyValuePair[] = [];
  let bodyContent = '';
  let bodyType: RequestConfig['body']['type'] = 'none';
  const formDataPairs: KeyValuePair[] = [];

  const flagsWithArg = new Set([
    '-X', '--request',
    '-H', '--header',
    '-d', '--data', '--data-raw', '--data-binary', '--data-ascii', '--data-urlencode',
    '-F', '--form',
    '-u', '--user',
    '--url',
    '-A', '--user-agent',
    '-e', '--referer',
    '--cookie', '-b',
    '-o', '--output',
    '-m', '--max-time',
    '--connect-timeout',
  ]);

  let i = 1; // skip 'curl'
  while (i < tokens.length) {
    const tok = tokens[i];

    // Flags that take the next token as argument
    if (flagsWithArg.has(tok)) {
      const val = tokens[i + 1] ?? '';
      i += 2;

      if (tok === '-X' || tok === '--request') {
        const m = val.toUpperCase() as HttpMethod;
        if (VALID_METHODS.includes(m)) method = m;

      } else if (tok === '-H' || tok === '--header') {
        const colonIdx = val.indexOf(':');
        if (colonIdx !== -1) {
          const k = val.slice(0, colonIdx).trim();
          const v = val.slice(colonIdx + 1).trim();
          headers.push(makeKV(k, v));
        }

      } else if (
        tok === '-d' || tok === '--data' ||
        tok === '--data-raw' || tok === '--data-binary' || tok === '--data-ascii'
      ) {
        bodyContent = val;
        // Guess content type from existing headers (will be refined below)
        bodyType = 'raw';

      } else if (tok === '--data-urlencode') {
        // Could be key=value or just value
        bodyContent = bodyContent ? bodyContent + '&' + val : val;
        bodyType = 'x-www-form-urlencoded';

      } else if (tok === '-F' || tok === '--form') {
        const eqIdx = val.indexOf('=');
        if (eqIdx !== -1) {
          formDataPairs.push(makeKV(val.slice(0, eqIdx), val.slice(eqIdx + 1)));
        }
        bodyType = 'form-data';

      } else if (tok === '-u' || tok === '--user') {
        // basic auth user:pass
        // We'll store it in a header for now; auth block handled below
        const encoded = btoa(val);
        headers.push(makeKV('Authorization', `Basic ${encoded}`));

      } else if (tok === '-A' || tok === '--user-agent') {
        headers.push(makeKV('User-Agent', val));

      } else if (tok === '-e' || tok === '--referer') {
        headers.push(makeKV('Referer', val));

      } else if (tok === '--cookie' || tok === '-b') {
        headers.push(makeKV('Cookie', val));

      } else if (tok === '--url') {
        url = val;
      }
      // -o, --output, -m, --max-time, --connect-timeout: skip silently

    } else if (
      tok === '-G' || tok === '--get' ||
      tok === '-I' || tok === '--head' ||
      tok === '--compressed' ||
      tok === '-L' || tok === '--location' ||
      tok === '-s' || tok === '--silent' ||
      tok === '-S' || tok === '--show-error' ||
      tok === '-v' || tok === '--verbose' ||
      tok === '-k' || tok === '--insecure' ||
      tok === '--no-buffer' ||
      tok === '-i' || tok === '--include'
    ) {
      if (tok === '-I' || tok === '--head') method = 'HEAD';
      if (tok === '-G' || tok === '--get') method = 'GET';
      i++;

    } else if (tok.startsWith('-')) {
      // Unknown flag — skip (consume next token only if not a flag itself)
      i++;
      if (i < tokens.length && !tokens[i].startsWith('-')) i++;

    } else {
      // Bare argument = URL (if not yet set)
      if (!url) url = tok;
      i++;
    }
  }

  if (!url) return null;

  // ── Parse URL: separate base URL from query params ──────────────────────────
  let baseUrl = url;
  const params: KeyValuePair[] = [];

  try {
    const parsed = new URL(url);
    baseUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    parsed.searchParams.forEach((v, k) => {
      params.push(makeKV(k, v));
    });
  } catch {
    // If URL is invalid (e.g. uses env vars like {{base}}), keep as-is
  }

  // ── Detect body type from Content-Type header ────────────────────────────────
  const ctHeader = headers.find(
    (h) => h.key.toLowerCase() === 'content-type'
  );
  const ct = ctHeader?.value ?? '';

  if (bodyType === 'raw' || bodyType === 'none') {
    if (ct.includes('application/json') || isJson(bodyContent)) {
      bodyType = 'json';
      // Prettify JSON if possible
      try {
        bodyContent = JSON.stringify(JSON.parse(bodyContent), null, 2);
      } catch { /* keep raw */ }
    } else if (ct.includes('application/x-www-form-urlencoded') && bodyContent) {
      bodyType = 'x-www-form-urlencoded';
    } else if (bodyContent) {
      bodyType = 'raw';
    }
  }

  // ── Parse form-urlencoded body into KV pairs ────────────────────────────────
  const formParsed: KeyValuePair[] = [];
  if (bodyType === 'x-www-form-urlencoded' && bodyContent) {
    try {
      const sp = new URLSearchParams(bodyContent);
      sp.forEach((v, k) => formParsed.push(makeKV(k, v)));
    } catch { /* ignore */ }
  }

  // ── Infer method ─────────────────────────────────────────────────────────────
  if (!method) {
    if (bodyContent || formDataPairs.length > 0 || formParsed.length > 0) {
      method = 'POST';
    } else {
      method = 'GET';
    }
  }

  // ── Detect & extract auth from Authorization header ──────────────────────────
  let auth: RequestConfig['auth'] = { type: 'none' };
  const authHeaderIdx = headers.findIndex(
    (h) => h.key.toLowerCase() === 'authorization'
  );
  if (authHeaderIdx !== -1) {
    const authVal = headers[authHeaderIdx].value;
    if (authVal.toLowerCase().startsWith('bearer ')) {
      auth = { type: 'bearer', bearerToken: authVal.slice(7).trim() };
      headers.splice(authHeaderIdx, 1); // remove from headers
    } else if (authVal.toLowerCase().startsWith('basic ')) {
      try {
        const decoded = atob(authVal.slice(6).trim());
        const colonIdx = decoded.indexOf(':');
        auth = {
          type: 'basic',
          basicUsername: decoded.slice(0, colonIdx),
          basicPassword: decoded.slice(colonIdx + 1),
        };
        headers.splice(authHeaderIdx, 1);
      } catch { /* keep header */ }
    }
  }

  // ── Remove Content-Type from headers if body owns it ─────────────────────────
  // (the app auto-sends it based on body type — keeping it is fine but redundant)
  // We'll leave it so the user sees exactly what was in the curl.

  const finalFormData =
    bodyType === 'form-data' ? formDataPairs :
    bodyType === 'x-www-form-urlencoded' ? formParsed :
    [];

  return {
    id: uuidv4(),
    name: deriveName(baseUrl, method),
    method,
    url: baseUrl,
    headers,
    params,
    auth,
    body: {
      type: bodyType,
      content: bodyType === 'json' || bodyType === 'raw' ? bodyContent : '',
      formData: finalFormData,
    },
  };
}

function isJson(s: string): boolean {
  if (!s) return false;
  const t = s.trim();
  return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
}

function deriveName(url: string, method: HttpMethod): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? parsed.hostname;
    // Capitalise and truncate
    return `${method} ${last.slice(0, 40)}`;
  } catch {
    return `${method} Request`;
  }
}
