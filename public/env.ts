type EnvLike = Record<string, string | undefined> | undefined;

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

export const getEnvValue = (key: string): string | undefined => {
  const sources = [getProcessEnv, getImportMetaEnv, getGlobalSecrets];
  for (const getSource of sources) {
    const source = getSource();
    if (source && typeof source[key] === 'string') {
      return source[key];
    }
  }
  return undefined;
};

