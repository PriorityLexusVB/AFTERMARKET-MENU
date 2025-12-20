import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  validateEnvVarNames,
} from './validate-env-vars.js';

const cloneEnv = () => ({ ...process.env });

describe('validate-env-vars normalization', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = cloneEnv();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('normalizes whitespace-padded keys', () => {
    process.env = { ...originalEnv, ' VITE_FIREBASE_PROJECT_ID': 'whitespace-value' };

    const result = validateEnvVarNames();

    expect(result).toBe(true);
    expect(process.env.VITE_FIREBASE_PROJECT_ID).toBe('whitespace-value');
    expect(process.env[' VITE_FIREBASE_PROJECT_ID']).toBeUndefined();
  });

  it('treats collisions as failures and preserves existing trimmed value', () => {
    process.env = {
      ...originalEnv,
      VITE_FIREBASE_PROJECT_ID: 'existing',
      ' VITE_FIREBASE_PROJECT_ID': 'newer',
    };

    const result = validateEnvVarNames();

    expect(result).toBe(false);
    expect(process.env.VITE_FIREBASE_PROJECT_ID).toBe('existing');
    expect(process.env[' VITE_FIREBASE_PROJECT_ID']).toBeDefined();
  });

  it('fails when multiple whitespace keys normalize to the same name', () => {
    process.env = {
      ...originalEnv,
      ' VITE_FIREBASE_PROJECT_ID': 'first',
      '\tVITE_FIREBASE_PROJECT_ID ': 'second',
    };

    const result = validateEnvVarNames();

    expect(result).toBe(false);
    expect(process.env.VITE_FIREBASE_PROJECT_ID).toBe('first');
    expect(process.env[' VITE_FIREBASE_PROJECT_ID']).toBeUndefined();
    expect(process.env['\tVITE_FIREBASE_PROJECT_ID ']).toBeDefined();
  });

  it('ignores whitespace-only keys without creating empty entries', () => {
    process.env = { ...originalEnv, '   ': 'value' };

    const result = validateEnvVarNames();

    expect(result).toBe(true);
    expect(process.env['']).toBeUndefined();
    expect(process.env['   ']).toBe('value');
  });
});
