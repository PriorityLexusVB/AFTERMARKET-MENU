import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectWhitespaceEnvVars, checkDistDirectory, getMemorySnapshot } from '../utils/runtime-checks.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('runtime-checks utilities', () => {
  describe('detectWhitespaceEnvVars', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      // Save original environment
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      // Restore original environment
      process.env = originalEnv;
    });

    it('should detect environment variables with leading whitespace', () => {
      process.env[' TEST_VAR'] = 'value';
      const issues = detectWhitespaceEnvVars();
      
      expect(issues.length).toBeGreaterThan(0);
      const testVarIssue = issues.find(i => i.original === ' TEST_VAR');
      expect(testVarIssue).toBeDefined();
      expect(testVarIssue?.trimmed).toBe('TEST_VAR');
    });

    it('should detect environment variables with trailing whitespace', () => {
      process.env['TEST_VAR '] = 'value';
      const issues = detectWhitespaceEnvVars();
      
      expect(issues.length).toBeGreaterThan(0);
      const testVarIssue = issues.find(i => i.original === 'TEST_VAR ');
      expect(testVarIssue).toBeDefined();
      expect(testVarIssue?.trimmed).toBe('TEST_VAR');
    });

    it('should return empty array when no whitespace issues exist', () => {
      // Clean environment - only set proper variables
      const cleanEnv: Record<string, string> = {
        'PROPER_VAR': 'value',
        'ANOTHER_VAR': 'value2'
      };
      process.env = cleanEnv;
      
      const issues = detectWhitespaceEnvVars();
      expect(issues).toEqual([]);
    });
  });

  describe('checkDistDirectory', () => {
    const testDir = path.join(__dirname, 'test-dist');

    afterEach(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    it('should detect non-existent directory', () => {
      const result = checkDistDirectory(testDir);
      
      expect(result.exists).toBe(false);
      expect(result.readable).toBe(false);
      expect(result.indexHtmlExists).toBe(false);
    });

    it('should detect existing directory with files', () => {
      // Create test directory with files
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, 'index.html'), '<html></html>');
      fs.writeFileSync(path.join(testDir, 'test.js'), 'console.log("test")');
      
      const result = checkDistDirectory(testDir);
      
      expect(result.exists).toBe(true);
      expect(result.readable).toBe(true);
      expect(result.indexHtmlExists).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.sample).toContain('index.html');
    });

    it('should handle empty directory', () => {
      // Create empty directory
      fs.mkdirSync(testDir, { recursive: true });
      
      const result = checkDistDirectory(testDir);
      
      expect(result.exists).toBe(true);
      expect(result.readable).toBe(true);
      expect(result.indexHtmlExists).toBe(false);
      expect(result.files).toEqual([]);
    });
  });

  describe('getMemorySnapshot', () => {
    it('should return memory usage information', () => {
      const snapshot = getMemorySnapshot();
      
      expect(snapshot).toHaveProperty('rss');
      expect(snapshot).toHaveProperty('heapTotal');
      expect(snapshot).toHaveProperty('heapUsed');
      expect(snapshot).toHaveProperty('external');
      expect(snapshot).toHaveProperty('arrayBuffers');
      expect(snapshot).toHaveProperty('timestamp');
      
      // Check format (should be like "1.23 MB")
      expect(snapshot.rss).toMatch(/^[\d.]+ (B|KB|MB|GB)$/);
      expect(snapshot.heapTotal).toMatch(/^[\d.]+ (B|KB|MB|GB)$/);
      expect(snapshot.heapUsed).toMatch(/^[\d.]+ (B|KB|MB|GB)$/);
    });

    it('should have valid timestamp', () => {
      const snapshot = getMemorySnapshot();
      const timestamp = new Date(snapshot.timestamp);
      
      expect(timestamp.getTime()).toBeGreaterThan(0);
      expect(timestamp.toISOString()).toBe(snapshot.timestamp);
    });
  });
});
