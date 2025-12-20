#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 * 
 * This script validates environment variables to catch common issues:
 * - Leading/trailing whitespace in variable names
 * - Missing required variables at build time
 * - Invalid variable formats
 * 
 * Usage: node scripts/validate-env-vars.js
 * 
 * Exit codes:
 *   0 - All environment variables are valid
 *   1 - Validation failed
 */

// Required build-time environment variables for production
const REQUIRED_BUILD_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

/**
 * Validates that environment variable names don't have leading/trailing spaces
 */
function validateEnvVarNames() {
  logInfo('Checking for malformed environment variable names...');
  let normalized = 0;

  Object.keys(process.env).forEach(key => {
    // Check for leading/trailing whitespace
    const trimmedKey = key.trim();
    if (key !== trimmedKey) {
      logWarning(`Environment variable has leading/trailing whitespace: "${key}"`);
      logWarning(`  Normalizing to: "${trimmedKey}"`);
      if (!(trimmedKey in process.env)) {
        process.env[trimmedKey] = process.env[key];
        normalized += 1;
      }
    }

    // Check for VITE_ variables with common typos
    if (key.includes('VITE') && !key.startsWith('VITE_')) {
      logWarning(`Possible typo in environment variable: "${key}"`);
      logWarning('  VITE variables must start with "VITE_" prefix');
    }
  });

  if (normalized > 0) {
    logInfo(`Normalized ${normalized} environment variable(s)`);
  }

  logSuccess('Environment variable name check completed');

  return true;
}

/**
 * Validates that required build-time variables are present
 */
function validateRequiredVars() {
  logInfo('Checking for required build-time environment variables...');
  
  const missing = [];
  const empty = [];
  
  REQUIRED_BUILD_VARS.forEach(varName => {
    if (!(varName in process.env)) {
      missing.push(varName);
    } else if (!process.env[varName] || process.env[varName].trim() === '') {
      empty.push(varName);
    }
  });

  if (missing.length > 0) {
    logWarning('Missing required environment variables:');
    missing.forEach(v => logWarning(`  - ${v}`));
    logWarning('The app will use mock data in demo mode.');
  }

  if (empty.length > 0) {
    logError('Empty required environment variables:');
    empty.forEach(v => logError(`  - ${v}`));
    logError('Empty values are not allowed - either set them or remove them entirely.');
    return false;
  }

  if (missing.length === 0 && empty.length === 0) {
    logSuccess('All required environment variables are present');
  }

  return empty.length === 0; // Only fail on empty, not missing (demo mode ok)
}

/**
 * Validates environment variable values
 */
function validateEnvVarValues() {
  logInfo('Validating environment variable values...');
  let hasIssues = false;

  // Check for common placeholder values that weren't replaced
  const placeholders = ['YOUR_', 'REPLACE_', 'TODO', 'CHANGEME', 'XXX'];
  
  Object.entries(process.env).forEach(([key, value]) => {
    if (!key.startsWith('VITE_')) return; // Only check VITE_ vars
    
    // Check for placeholders
    if (value && placeholders.some(p => value.includes(p))) {
      logWarning(`Environment variable "${key}" appears to contain a placeholder value`);
      hasIssues = true;
    }

    // Check Firebase variables for common format issues
    if (key === 'VITE_FIREBASE_PROJECT_ID' && value && value.includes(' ')) {
      logError(`"${key}" contains spaces, which is invalid for Firebase project IDs`);
      hasIssues = true;
    }
  });

  if (!hasIssues) {
    logSuccess('Environment variable values appear valid');
  }

  return !hasIssues;
}

/**
 * Validates PORT environment variable
 */
function validatePort() {
  logInfo('Validating PORT configuration...');
  
  const port = process.env.PORT;
  
  if (!port) {
    logInfo('PORT not set, will use default (8080)');
    return true;
  }

  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    logError(`Invalid PORT value: "${port}"`);
    logError('PORT must be a number between 1 and 65535');
    return false;
  }

  logSuccess(`PORT is valid: ${port}`);
  return true;
}

/**
 * Main validation function
 */
function main() {
  log('\n=== Environment Variable Validation ===\n', 'blue');
  
  let allValid = true;

  // Run validations
  if (!validateEnvVarNames()) allValid = false;
  if (!validatePort()) allValid = false;
  if (!validateRequiredVars()) allValid = false;
  if (!validateEnvVarValues()) allValid = false;

  // Summary
  log('\n=== Validation Summary ===\n', 'blue');

  if (allValid) {
    logSuccess('All environment variable checks passed!');
    process.exit(0);
  } else {
    logError('Some environment variable checks failed');
    logError('Please fix the issues before deploying');
    process.exit(1);
  }
}

// Run validation
main();
