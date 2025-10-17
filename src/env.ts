/**
 * Provides a consistent way to access environment variables across different
 * runtimes (Vite during local development, Google AI Studio, plain browsers).
 *
 * Google AI Studio does not always expose a Node-style `process.env`. Some
 * integrations surface secrets on `globalThis.secrets` or other global bags.
 * By checking a handful of common locations we can gracefully read values
 * without throwing reference errors in the browser.
 */

type EnvLike = Record<string, unknown> | Map<string, unknown> | undefined;

const coerceSecretValue = (candidate: unknown): string | undefined => {
  if (typeof candidate === 'string') {
    return candidate;
  }

  if (candidate && typeof candidate === 'object') {
    const record = candidate as Record<string, unknown>;
    if (typeof record.value === 'string') {
      return record.value;
    }
    if (typeof record.default === 'string') {
      return record.default;
    }
  }

  return undefined;
};

const tryReadFromSource = (source: EnvLike, key: string): string | undefined => {
  if (!source) {
    return undefined;
  }

  try {
    if (source instanceof Map) {
      const fromMap = source.get(key);
      const mapped = coerceSecretValue(fromMap);
      if (mapped) {
        return mapped;
      }
    }
  } catch (_error) {
    // Some environments proxy Map-like objects across realms which can throw on instanceof.
    // Swallow and continue with other strategies.
  }

  const recordSource = source as Record<string, unknown>;
  const direct = coerceSecretValue(recordSource[key]);
  if (direct) {
    return direct;
  }

  const maybeGet = (recordSource.get ?? (recordSource as { getSecret?: unknown }).getSecret) as
    | ((name: string) => unknown)
    | undefined;

  if (typeof maybeGet === 'function') {
    try {
      const fromGetter = maybeGet.call(source, key);
      const coerced = coerceSecretValue(fromGetter);
      if (coerced) {
        return coerced;
      }
    } catch (error) {
      console.warn('Failed to resolve secret using getter:', error);
    }
  }

  return undefined;
};

const getProcessEnv = (): EnvLike => {
  if (typeof process !== 'undefined' && typeof process.env === 'object') {
    return process.env as EnvLike;
  }
  return undefined;
};

const getImportMetaEnv = (): EnvLike => {
  try {
    const meta = (import.meta as { env?: EnvLike })?.env;
    return meta;
  } catch (_error) {
    return undefined;
  }
};

const getGlobalSecrets = (): EnvLike => {
  if (typeof globalThis !== 'undefined') {
    const globalAny = globalThis as Record<string, unknown>;
    const possibleKeys = ['secrets', 'env', '__env__'];
    for (const key of possibleKeys) {
      const value = globalAny[key];
      if (value && typeof value === 'object') {
        return value as EnvLike;
      }
    }
  }
  return undefined;
};

const callGlobalSecretFunctions = (key: string): string | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }

  const globalAny = globalThis as Record<string, unknown>;
  const fnNames = ['getSecret', 'getEnv', 'getEnvironmentVariable'];

  for (const name of fnNames) {
    const candidate = globalAny[name];
    if (typeof candidate === 'function') {
      try {
        const value = (candidate as (variable: string) => unknown).call(globalThis, key);
        const coerced = coerceSecretValue(value);
        if (coerced) {
          return coerced;
        }
      } catch (error) {
        console.warn(`Failed to resolve secret via global function ${name}:`, error);
      }
    }
  }

  return undefined;
};

/**
 * Attempts to read an environment variable from several possible sources.
 * Returns `undefined` when the variable is not set anywhere.
 */
export const getEnvValue = (key: string): string | undefined => {
  const sources = [getProcessEnv(), getImportMetaEnv(), getGlobalSecrets()];
  for (const source of sources) {
    const value = tryReadFromSource(source, key);
    if (value) {
      return value;
    }
  }

  const fallback = callGlobalSecretFunctions(key);
  if (fallback) {
    return fallback;
  }
  return undefined;
};
