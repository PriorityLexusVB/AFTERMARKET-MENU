/**
 * check-hidden-unicode.mjs
 * 
 * Scans tracked files for hidden/bidi Unicode characters that can cause security issues
 * and make code harder to read.
 * 
 * Usage:
 *   node scripts/check-hidden-unicode.mjs       # Detect mode (exit 1 if found)
 *   node scripts/check-hidden-unicode.mjs --fix # Fix mode (removes characters)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

// Hidden and bidirectional Unicode characters to detect
const HIDDEN_UNICODE = [
  // Zero-width characters
  '\u200B', // Zero Width Space
  '\u200C', // Zero Width Non-Joiner
  '\u200D', // Zero Width Joiner
  '\u200E', // Left-to-Right Mark
  '\u200F', // Right-to-Left Mark
  // Bidirectional text control characters
  '\u202A', // Left-to-Right Embedding
  '\u202B', // Right-to-Left Embedding
  '\u202C', // Pop Directional Formatting
  '\u202D', // Left-to-Right Override
  '\u202E', // Right-to-Left Override
  // Isolate formatting characters
  '\u2066', // Left-to-Right Isolate
  '\u2067', // Right-to-Left Isolate
  '\u2068', // First Strong Isolate
  '\u2069', // Pop Directional Isolate
  // Byte Order Mark
  '\uFEFF', // Zero Width No-Break Space (BOM)
];

// Text-like extensions to scan
const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', 
  '.css', '.md', '.json', 
  '.yml', '.yaml', '.html', '.txt'
]);

/**
 * Create regex pattern to match any hidden unicode character
 */
export function createHiddenUnicodePattern() {
  return new RegExp(`[${HIDDEN_UNICODE.join('')}]`, 'g');
}

// Create regex pattern to match any hidden unicode character
const hiddenUnicodePattern = createHiddenUnicodePattern();

/**
 * Get list of tracked files from git
 */
function getTrackedFiles() {
  try {
    const output = execSync('git ls-files -z', { 
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    // Split by null terminator and filter text files
    return output
      .split('\0')
      .filter(file => {
        if (!file) return false;
        const lastDot = file.lastIndexOf('.');
        if (lastDot === -1) return false; // No extension
        return TEXT_EXTENSIONS.has(file.substring(lastDot));
      });
  } catch (error) {
    console.error('Error getting tracked files:', error.message);
    process.exit(1);
  }
}

/**
 * Calculate line and column from string index
 */
export function getLineCol(content, index) {
  const beforeIndex = content.substring(0, index);
  const line = (beforeIndex.match(/\n/g) || []).length + 1;
  const lastNewline = beforeIndex.lastIndexOf('\n');
  const col = index - lastNewline;
  return { line, col };
}

/**
 * Get character name for display
 */
export function getCharName(char) {
  const codePoint = char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
  const names = {
    '\u200B': 'Zero Width Space',
    '\u200C': 'Zero Width Non-Joiner',
    '\u200D': 'Zero Width Joiner',
    '\u200E': 'Left-to-Right Mark',
    '\u200F': 'Right-to-Left Mark',
    '\u202A': 'Left-to-Right Embedding',
    '\u202B': 'Right-to-Left Embedding',
    '\u202C': 'Pop Directional Formatting',
    '\u202D': 'Left-to-Right Override',
    '\u202E': 'Right-to-Left Override',
    '\u2066': 'Left-to-Right Isolate',
    '\u2067': 'Right-to-Left Isolate',
    '\u2068': 'First Strong Isolate',
    '\u2069': 'Pop Directional Isolate',
    '\uFEFF': 'Zero Width No-Break Space (BOM)',
  };
  return `U+${codePoint} (${names[char] || 'Unknown'})`;
}

/**
 * Scan a file for hidden unicode characters
 */
function scanFile(filepath) {
  try {
    const content = readFileSync(filepath, 'utf8');
    const matches = [];
    let match;
    
    // Reset regex
    hiddenUnicodePattern.lastIndex = 0;
    
    while ((match = hiddenUnicodePattern.exec(content)) !== null) {
      const { line, col } = getLineCol(content, match.index);
      matches.push({
        char: match[0],
        index: match.index,
        line,
        col,
      });
    }
    
    return { filepath, content, matches };
  } catch (error) {
    console.error(`Error reading ${filepath}:`, error.message);
    return { filepath, content: '', matches: [], error: error.message };
  }
}

/**
 * Fix file by removing hidden unicode characters
 */
function fixFile(filepath, content) {
  // Create fresh regex to avoid stateful lastIndex issues
  const cleanPattern = createHiddenUnicodePattern();
  const cleaned = content.replace(cleanPattern, '');
  
  if (cleaned !== content) {
    try {
      writeFileSync(filepath, cleaned, 'utf8');
      return true;
    } catch (error) {
      console.error(`Error writing ${filepath}:`, error.message);
      return false;
    }
  }
  
  return false;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const fixMode = args.includes('--fix');
  
  console.log(fixMode ? 'Running in FIX mode...' : 'Running in DETECT mode...');
  console.log('');
  
  const files = getTrackedFiles();
  console.log(`Scanning ${files.length} tracked text files...`);
  console.log('');
  
  let totalIssues = 0;
  let filesWithIssues = 0;
  let filesFixed = 0;
  let filesFailed = 0;
  let filesWithErrors = 0;
  const errorFiles = [];
  
  for (const file of files) {
    const result = scanFile(file);
    
    if (result.error) {
      filesWithErrors++;
      errorFiles.push(result.filepath);
      continue;
    }
    
    if (result.matches.length > 0) {
      filesWithIssues++;
      totalIssues += result.matches.length;
      
      if (fixMode) {
        const fixed = fixFile(result.filepath, result.content);
        if (fixed) {
          filesFixed++;
          console.log(`✓ Fixed: ${result.filepath} (${result.matches.length} character${result.matches.length > 1 ? 's' : ''} removed)`);
        } else {
          filesFailed++;
          console.log(`✗ Failed to fix: ${result.filepath}`);
        }
      } else {
        // Report up to 3 matches per file to avoid noisy output
        const reportMatches = result.matches.slice(0, 3);
        console.log(`✗ ${result.filepath}`);
        for (const m of reportMatches) {
          console.log(`  Line ${m.line}, Col ${m.col}: ${getCharName(m.char)}`);
        }
        if (result.matches.length > 3) {
          console.log(`  ... and ${result.matches.length - 3} more`);
        }
        console.log('');
      }
    }
  }
  
  // Summary
  console.log('');
  console.log('═'.repeat(60));
  if (fixMode) {
    console.log(`Fixed ${filesFixed} file${filesFixed !== 1 ? 's' : ''}`);
    console.log(`Removed ${totalIssues} hidden unicode character${totalIssues !== 1 ? 's' : ''}`);
    
    if (filesFailed > 0) {
      console.log('');
      console.log(`⚠ Failed to fix ${filesFailed} file${filesFailed !== 1 ? 's' : ''}`);
    }
    
    if (filesWithErrors > 0) {
      console.log('');
      console.log(`⚠ Could not read ${filesWithErrors} file${filesWithErrors !== 1 ? 's' : ''}:`);
      errorFiles.forEach(f => console.log(`  - ${f}`));
    }
    
    if (filesFixed > 0) {
      console.log('');
      console.log('✓ Files have been cleaned!');
      // Exit with error if any fixes failed
      process.exit(filesFailed > 0 || filesWithErrors > 0 ? 1 : 0);
    } else {
      console.log('');
      console.log('✓ No issues found!');
      process.exit(0);
    }
  } else {
    if (filesWithErrors > 0) {
      console.log(`⚠ Could not read ${filesWithErrors} file${filesWithErrors !== 1 ? 's' : ''}:`);
      errorFiles.forEach(f => console.log(`  - ${f}`));
      console.log('');
    }
    
    if (filesWithIssues > 0) {
      console.log(`Found ${totalIssues} hidden unicode character${totalIssues !== 1 ? 's' : ''} in ${filesWithIssues} file${filesWithIssues !== 1 ? 's' : ''}`);
      console.log('');
      console.log('Run with --fix to remove them:');
      console.log('  node scripts/check-hidden-unicode.mjs --fix');
      process.exit(1);
    } else {
      console.log('✓ No hidden unicode characters found!');
      if (filesWithErrors > 0) {
        console.log('');
        console.log('⚠ Scan may be incomplete due to read errors');
        process.exit(1);
      }
      process.exit(0);
    }
  }
}

// Run main if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
