/**
 * Runtime Self-Check Utilities
 * 
 * Provides diagnostic utilities for detecting Cloud Run misconfigurations
 * and startup issues. These checks help identify:
 * - Environment variables with leading/trailing whitespace
 * - Missing or masked dist directory
 * - Memory usage patterns during startup
 */

import fs from 'fs';
import path from 'path';

/**
 * Scans process.env for keys with leading or trailing whitespace
 * @returns {Array<{original: string, trimmed: string, value: string}>}
 */
export function detectWhitespaceEnvVars() {
  const issues = [];
  
  Object.keys(process.env).forEach(key => {
    const trimmed = key.trim();
    if (key !== trimmed) {
      issues.push({
        original: key,
        trimmed: trimmed,
        value: process.env[key]
      });
    }
  });
  
  return issues;
}

/**
 * Checks if the dist directory exists and is readable
 * @param {string} distPath - Path to the dist directory
 * @returns {Object} Status object with exists, readable, files, and sample properties
 */
export function checkDistDirectory(distPath) {
  const result = {
    exists: false,
    readable: false,
    files: [],
    sample: [],
    indexHtmlExists: false
  };
  
  try {
    result.exists = fs.existsSync(distPath);
    
    if (result.exists) {
      // Check if readable by trying to read directory
      result.files = fs.readdirSync(distPath);
      result.readable = true;
      
      // Get a sample of files (first 10)
      result.sample = result.files.slice(0, 10);
      
      // Check for index.html specifically
      result.indexHtmlExists = fs.existsSync(path.join(distPath, 'index.html'));
    }
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}

/**
 * Formats memory usage information
 * @returns {Object} Formatted memory usage statistics
 */
export function getMemorySnapshot() {
  const usage = process.memoryUsage();
  
  return {
    rss: formatBytes(usage.rss),
    heapTotal: formatBytes(usage.heapTotal),
    heapUsed: formatBytes(usage.heapUsed),
    external: formatBytes(usage.external),
    arrayBuffers: formatBytes(usage.arrayBuffers || 0),
    timestamp: new Date().toISOString()
  };
}

/**
 * Formats bytes to human-readable format
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Logs detailed startup diagnostics
 * @param {Object} options - Configuration options
 */
export function logStartupDiagnostics(options = {}) {
  const {
    distPath = path.join(process.cwd(), 'dist'),
    port = process.env.PORT || 8080
  } = options;
  
  console.log('[DIAGNOSTICS] ========================================');
  console.log('[DIAGNOSTICS] Cloud Run Startup Diagnostics');
  console.log('[DIAGNOSTICS] ========================================');
  
  // Node environment
  console.log('[DIAGNOSTICS] Node version:', process.version);
  console.log('[DIAGNOSTICS] Platform:', process.platform);
  console.log('[DIAGNOSTICS] Architecture:', process.arch);
  console.log('[DIAGNOSTICS] Working directory:', process.cwd());
  console.log('[DIAGNOSTICS] PORT:', port);
  
  // Check for whitespace in env var names
  const whitespaceVars = detectWhitespaceEnvVars();
  if (whitespaceVars.length > 0) {
    console.log('[DIAGNOSTICS] ⚠️  WARNING: Environment variables with whitespace detected!');
    whitespaceVars.forEach(({ original, trimmed }) => {
      console.log(`[DIAGNOSTICS]   ❌ "${original}" (has whitespace)`);
      console.log(`[DIAGNOSTICS]      Should be: "${trimmed}"`);
    });
    console.log('[DIAGNOSTICS] ⚠️  This is a common Cloud Run misconfiguration!');
    console.log('[DIAGNOSTICS] ⚠️  Remove these variables from Cloud Run console.');
  } else {
    console.log('[DIAGNOSTICS] ✓ No whitespace in environment variable names');
  }
  
  // Check dist directory
  console.log('[DIAGNOSTICS] Dist path:', distPath);
  const distCheck = checkDistDirectory(distPath);
  console.log('[DIAGNOSTICS] Dist exists:', distCheck.exists);
  console.log('[DIAGNOSTICS] Dist readable:', distCheck.readable);
  console.log('[DIAGNOSTICS] index.html exists:', distCheck.indexHtmlExists);
  
  if (distCheck.exists && distCheck.readable) {
    console.log('[DIAGNOSTICS] File count:', distCheck.files.length);
    console.log('[DIAGNOSTICS] Sample files:', distCheck.sample.join(', '));
  } else if (distCheck.exists && !distCheck.readable) {
    console.log('[DIAGNOSTICS] ⚠️  WARNING: Dist directory exists but is not readable!');
    console.log('[DIAGNOSTICS] ⚠️  Error:', distCheck.error);
    console.log('[DIAGNOSTICS] ⚠️  This may indicate a GCSFuse mount issue.');
  } else {
    console.log('[DIAGNOSTICS] ⚠️  WARNING: Dist directory does not exist!');
    console.log('[DIAGNOSTICS] ⚠️  Possible causes:');
    console.log('[DIAGNOSTICS]      1. Build step failed or was skipped');
    console.log('[DIAGNOSTICS]      2. GCSFuse volume mounted at /app/dist');
    console.log('[DIAGNOSTICS]      3. Wrong working directory');
  }
  
  // Memory usage
  const memory = getMemorySnapshot();
  console.log('[DIAGNOSTICS] Memory usage at boot:');
  console.log('[DIAGNOSTICS]   RSS:', memory.rss);
  console.log('[DIAGNOSTICS]   Heap Total:', memory.heapTotal);
  console.log('[DIAGNOSTICS]   Heap Used:', memory.heapUsed);
  console.log('[DIAGNOSTICS]   External:', memory.external);
  
  console.log('[DIAGNOSTICS] ========================================');
}

/**
 * Starts periodic memory monitoring for the first 30 seconds
 * Helps detect OOM issues during startup
 */
export function startMemoryMonitoring() {
  const startTime = Date.now();
  const duration = 30000; // 30 seconds
  const interval = 5000; // Log every 5 seconds
  
  console.log('[MEMORY] Starting 30-second memory monitoring...');
  
  const timer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    
    if (elapsed >= duration) {
      clearInterval(timer);
      console.log('[MEMORY] Memory monitoring complete');
      return;
    }
    
    const memory = getMemorySnapshot();
    console.log(`[MEMORY] T+${Math.floor(elapsed / 1000)}s: RSS=${memory.rss}, Heap=${memory.heapUsed}/${memory.heapTotal}`);
  }, interval);
  
  // Don't prevent process from exiting
  timer.unref();
}
