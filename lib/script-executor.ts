import { Environment, ResponseData } from "@/types";

interface ScriptContext {
  environments: Environment[];
  activeEnvironmentId: string | null;
  response?: ResponseData;
  setEnvironmentVariable: (envId: string, key: string, value: string) => void;
  log: (msg: any) => void;
}

/**
 * Executes a pre or post-request script in a semi-sandboxed environment.
 * Provides a `pm` object similar to Postman.
 */
export function executeScript(code: string, context: ScriptContext) {
  if (!code) return;

  const {
    environments,
    activeEnvironmentId,
    response,
    setEnvironmentVariable,
    log,
  } = context;

  const pm = {
    environment: {
      set: (key: string, value: string) => {
        if (activeEnvironmentId) {
          setEnvironmentVariable(activeEnvironmentId, key, value);
        } else {
          // Fallback to Global if no active environment
          setEnvironmentVariable("global", key, value);
        }
      },
      get: (key: string) => {
        const env = environments.find((e) => e.id === activeEnvironmentId);
        const v =
          env?.variables.find((v) => v.key === key) ||
          env?.secrets.find((v) => v.key === key);
        return v?.currentValue;
      },
      has: (key: string) => {
        const env = environments.find((e) => e.id === activeEnvironmentId);
        return !!(
          env?.variables.find((v) => v.key === key) ||
          env?.secrets.find((v) => v.key === key)
        );
      },
    },
    globals: {
      set: (key: string, value: string) => {
        setEnvironmentVariable("global", key, value);
      },
      get: (key: string) => {
        const env = environments.find((e) => e.id === "global");
        const v =
          env?.variables.find((v) => v.key === key) ||
          env?.secrets.find((v) => v.key === key);
        return v?.currentValue;
      },
    },
    response: response
      ? {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          json: () => {
            try {
              return JSON.parse(response.body);
            } catch (e) {
              return null;
            }
          },
          text: () => response.body,
          time: response.time,
          size: response.size,
        }
      : null,
    log: (...args: any[]) => {
      log(
        args
          .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
          .join(" "),
      );
    },
  };

  try {
    // Basic execution context
    const fn = new Function("pm", "console", code);
    fn(pm, { log: pm.log, error: pm.log, warn: pm.log, info: pm.log });
  } catch (err: any) {
    log(`Script Error: ${err.message}`);
  }
}
