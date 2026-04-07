import { Environment, KeyValuePair } from "@/types";

/**
 * Resolves variables in a string using the provided environments.
 * Supports the <<variable_name>> syntax as seen in the user's screenshots.
 */
export function resolveVariables(
  text: string,
  environments: Environment[],
  activeId: string | null,
  extraVariables: KeyValuePair[] = [],
): string {
  if (!text) return text;

  // 1. Get Global variables
  const globalEnv = environments.find((e) => e.id === "global");
  const globalVars = globalEnv
    ? [...globalEnv.variables, ...globalEnv.secrets]
    : [];

  // 2. Get Active variables
  const activeEnv = activeId
    ? environments.find((e) => e.id === activeId)
    : null;
  const activeVars = activeEnv
    ? [...activeEnv.variables, ...activeEnv.secrets]
    : [];

  // 3. Create a map of keys to values (active variables override global ones)
  const varMap: Record<string, string> = {};

  // Fill with global first
  globalVars.forEach((v) => {
    if (v.enabled !== false && v.key) {
      varMap[v.key] = v.currentValue;
    }
  });

  // Override with active
  activeVars.forEach((v) => {
    if (v.enabled !== false && v.key) {
      varMap[v.key] = v.currentValue;
    }
  });

  // Override with collection/folder extra variables
  extraVariables.forEach((v) => {
    if (v.enabled !== false && v.key) {
      varMap[v.key] = v.value;
    }
  });

  // 4. Replace occurrences of <<key>> with value
  // We use a regex to match <<any_character_not_closing>>
  return text.replace(/<<(.+?)>>/g, (match, key) => {
    return varMap[key] !== undefined ? varMap[key] : match;
  });
}
