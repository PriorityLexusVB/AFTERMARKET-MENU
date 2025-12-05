#!/usr/bin/env node
/**
 * Branch Health Automation Script
 *
 * This script analyzes branches in a GitHub repository and provides
 * recommendations for cleanup, merging, and maintenance.
 *
 * Features:
 * - Branch discovery & classification (stale, behind, merged/unmerged)
 * - Ahead/behind analysis relative to default branch
 * - File-level difference detection
 * - Safe merge/delete operations with dry-run support
 * - JSON and Markdown report generation
 *
 * Usage:
 *   npx tsx scripts/branch-health.ts [options]
 *
 * Options:
 *   --dry-run           Report only, no modifications (default: true)
 *   --apply             Apply safe actions (merge merged branches, delete stale)
 *   --config <path>     Path to config file (default: .github/branch-health.yml)
 *   --output <dir>      Output directory for reports (default: ./branch-health-reports)
 *   --verbose           Enable verbose logging
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// =============================================================================
// Types
// =============================================================================

interface BranchHealthConfig {
  defaultBranch?: string;
  staleness: {
    warning: number;
    stale: number;
    critical: number;
  };
  ignoreBranches: string[];
  autoMerge: {
    enabled: boolean;
    requireStatusChecks: boolean;
    requireNoConflicts: boolean;
    fastForwardOnly: boolean;
  };
  autoDelete: {
    enabled: boolean;
    requireMerged: boolean;
    safeToDeletePatterns: string[];
    minAgeDays: number;
  };
  dryRun: boolean;
  reporting: {
    issueNumber?: number;
    json: boolean;
    markdown: boolean;
  };
}

type MergeStatus = "merged" | "unmerged" | "in-conflict" | "protected" | "ignored";
type ProposedAction = "keep" | "open-pr" | "update-pr" | "auto-merge" | "delete" | "review";
type StalenessLevel = "active" | "warning" | "stale" | "critical";

interface BranchInfo {
  name: string;
  sha: string;
  lastCommitDate: string;
  lastCommitAuthor: string;
  lastCommitMessage: string;
  aheadCount: number;
  behindCount: number;
  mergeStatus: MergeStatus;
  proposedAction: ProposedAction;
  stalenessLevel: StalenessLevel;
  daysSinceLastCommit: number;
  isProtected: boolean;
  isIgnored: boolean;
  hasOpenPR: boolean;
  prNumber?: number;
  changedFiles?: string[];
  conflictsWith?: string[];
}

interface BranchHealthReport {
  generatedAt: string;
  repository: string;
  defaultBranch: string;
  mode: "dry-run" | "apply";
  stalenessThresholds: {
    warning: number;
    stale: number;
    critical: number;
  };
  summary: {
    totalBranches: number;
    activeBranches: number;
    staleBranches: number;
    mergedBranches: number;
    aheadBranches: number;
    behindBranches: number;
    conflictingBranches: number;
    protectedBranches: number;
    ignoredBranches: number;
  };
  branches: BranchInfo[];
  actions: ActionResult[];
}

interface ActionResult {
  branch: string;
  action: string;
  success: boolean;
  message: string;
  timestamp: string;
}

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_CONFIG: BranchHealthConfig = {
  staleness: {
    warning: 30,
    stale: 60,
    critical: 90,
  },
  ignoreBranches: ["main", "master", "develop", "release/*", "hotfix/*"],
  autoMerge: {
    enabled: false,
    requireStatusChecks: true,
    requireNoConflicts: true,
    fastForwardOnly: true,
  },
  autoDelete: {
    enabled: false,
    requireMerged: true,
    safeToDeletePatterns: [],
    minAgeDays: 7,
  },
  dryRun: true,
  reporting: {
    json: true,
    markdown: true,
  },
};

function loadConfig(configPath: string): BranchHealthConfig {
  if (!fs.existsSync(configPath)) {
    console.log(`Config file not found at ${configPath}, using defaults`);
    return DEFAULT_CONFIG;
  }

  const content = fs.readFileSync(configPath, "utf-8");
  // Simple YAML-like parser for our config format
  const config = parseSimpleYaml(content);
  return mergeConfig(DEFAULT_CONFIG, config);
}

function parseSimpleYaml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = content.split("\n");
  
  // Track the current parent context and current array
  let currentSection: Record<string, unknown> = result;
  let currentKey = "";
  let currentArray: unknown[] | null = null;
  let sectionIndent = 0;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    // Skip comments and empty lines
    if (line.trim().startsWith("#") || line.trim() === "") continue;

    const indent = line.search(/\S/);
    if (indent === -1) continue;

    // Check if it's a list item
    const listMatch = line.match(/^(\s*)-\s*(.*)$/);
    if (listMatch && listMatch[2] !== undefined) {
      const value = listMatch[2].trim();
      if (currentArray !== null) {
        (currentArray as unknown[]).push(parseValue(value));
      }
      continue;
    }

    // Parse key: value
    const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);
    if (match && match[2] !== undefined && match[3] !== undefined) {
      const key = match[2].trim();
      const value = match[3].trim();
      
      // If we're at root level (indent 0) or starting a new section
      if (indent === 0) {
        currentSection = result;
        sectionIndent = 0;
      } else if (indent <= sectionIndent && currentKey in result) {
        // Back to root level
        currentSection = result;
        sectionIndent = 0;
      }

      if (value === "") {
        // This is a parent key - could be object or array (determined by next lines)
        const newObj: Record<string, unknown> = {};
        currentSection[key] = newObj;
        currentSection = newObj;
        currentKey = key;
        sectionIndent = indent;
        currentArray = null;
      } else {
        currentSection[key] = parseValue(value);
        // Check if this might be start of an array
        currentArray = null;
      }
    }
  }

  // Handle arrays by post-processing - find keys that should be arrays
  // by checking if they have list items following them
  return postProcessYaml(content);
}

function postProcessYaml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = content.split("\n");
  
  interface StackItem {
    indent: number;
    obj: Record<string, unknown>;
    currentArrayKey: string | null;
  }
  
  const stack: StackItem[] = [{ indent: -1, obj: result, currentArrayKey: null }];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex];
    if (!rawLine) continue;
    const line = rawLine.replace(/\r$/, "");

    // Skip comments and empty lines
    if (line.trim().startsWith("#") || line.trim() === "") continue;

    const indent = line.search(/\S/);
    if (indent === -1) continue;

    // Pop stack to find parent
    while (stack.length > 1) {
      const top = stack[stack.length - 1];
      if (top && top.indent >= indent) {
        stack.pop();
      } else {
        break;
      }
    }
    const parent = stack[stack.length - 1];
    if (!parent) continue;

    // Check if it's a list item
    const listMatch = line.match(/^(\s*)-\s*(.*)$/);
    if (listMatch && listMatch[2] !== undefined) {
      const value = listMatch[2].trim();
      // Add to current array if one exists
      if (parent.currentArrayKey && Array.isArray(parent.obj[parent.currentArrayKey])) {
        (parent.obj[parent.currentArrayKey] as unknown[]).push(parseValue(value));
      }
      continue;
    }

    // Parse key: value
    const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);
    if (match && match[2] !== undefined && match[3] !== undefined) {
      const key = match[2].trim();
      // Strip inline comments (anything after #)
      let value = match[3].trim();
      const commentIndex = value.indexOf("#");
      if (commentIndex !== -1) {
        value = value.substring(0, commentIndex).trim();
      }
      const currentObj = parent.obj;

      if (value === "") {
        // Check if next line is a list item
        const nextNonEmpty = lines.slice(lineIndex + 1).find(l => l.trim() && !l.trim().startsWith("#"));
        const isArray = nextNonEmpty?.trim().startsWith("-") || false;
        
        if (isArray) {
          currentObj[key] = [];
          stack.push({ indent, obj: currentObj, currentArrayKey: key });
        } else {
          // It's a nested object
          const newObj: Record<string, unknown> = {};
          currentObj[key] = newObj;
          stack.push({ indent, obj: newObj, currentArrayKey: null });
        }
      } else {
        currentObj[key] = parseValue(value);
      }
    }
  }

  return result;
}

function parseValue(value: string): string | number | boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  const num = Number(value);
  if (Number.isFinite(num) && String(num) === value.trim()) return num;
  return value;
}

function mergeConfig(
  defaults: BranchHealthConfig,
  overrides: Record<string, unknown>
): BranchHealthConfig {
  const result = JSON.parse(JSON.stringify(defaults));

  for (const [key, value] of Object.entries(overrides)) {
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      key in result
    ) {
      result[key] = { ...result[key], ...(value as Record<string, unknown>) };
    } else if (value !== undefined) {
      result[key as keyof BranchHealthConfig] = value as never;
    }
  }

  return result;
}

// =============================================================================
// Git Operations
// =============================================================================

function git(args: string, options: { silent?: boolean } = {}): string {
  try {
    const result = execSync(`git ${args}`, {
      encoding: "utf-8",
      stdio: options.silent ? ["pipe", "pipe", "pipe"] : undefined,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    return result.trim();
  } catch (error) {
    if (options.silent) return "";
    throw error;
  }
}

function getDefaultBranch(configDefault?: string): string {
  if (configDefault) return configDefault;

  // Try to get from git remote
  try {
    const remoteBranch = git("rev-parse --abbrev-ref origin/HEAD", { silent: true });
    if (remoteBranch && remoteBranch !== "origin/HEAD") {
      return remoteBranch.replace("origin/", "");
    }
  } catch {
    // Ignore
  }

  // Try common defaults
  for (const branch of ["main", "master"]) {
    try {
      git(`rev-parse --verify origin/${branch}`, { silent: true });
      return branch;
    } catch {
      // Branch doesn't exist
    }
  }

  return "main";
}

function getRemoteBranches(): string[] {
  const output = git("branch -r --format='%(refname:short)'");
  return output
    .split("\n")
    .filter((b) => b.startsWith("origin/") && !b.includes("->"))
    .map((b) => b.replace("origin/", ""));
}

function getBranchCommitInfo(
  branch: string
): { sha: string; date: string; author: string; message: string } {
  const format = "%H%n%aI%n%an%n%s";
  const output = git(`log -1 --format="${format}" origin/${branch}`, { silent: true });
  const [sha, date, author, message] = output.split("\n");
  return {
    sha: sha || "",
    date: date || new Date().toISOString(),
    author: author || "unknown",
    message: message || "",
  };
}

function getAheadBehind(
  branch: string,
  defaultBranch: string
): { ahead: number; behind: number } {
  try {
    const output = git(
      `rev-list --left-right --count origin/${defaultBranch}...origin/${branch}`,
      { silent: true }
    );
    const [behind, ahead] = output.split(/\s+/).map(Number);
    return { ahead: ahead || 0, behind: behind || 0 };
  } catch {
    return { ahead: 0, behind: 0 };
  }
}

function isBranchMerged(branch: string, defaultBranch: string): boolean {
  try {
    // Check if all commits in branch are reachable from default
    const mergeBase = git(`merge-base origin/${defaultBranch} origin/${branch}`, {
      silent: true,
    });
    const branchSha = git(`rev-parse origin/${branch}`, { silent: true });
    return mergeBase === branchSha;
  } catch {
    return false;
  }
}

function hasConflicts(branch: string, defaultBranch: string): boolean {
  try {
    // Create a temporary worktree or use merge-tree to check for conflicts
    git(`merge-tree --write-tree origin/${defaultBranch} origin/${branch}`, {
      silent: true,
    });
    return false;
  } catch {
    return true;
  }
}

function getChangedFiles(branch: string, defaultBranch: string): string[] {
  try {
    const output = git(
      `diff --name-only origin/${defaultBranch}...origin/${branch}`,
      { silent: true }
    );
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

// =============================================================================
// GitHub API Operations (using environment variables)
// =============================================================================

interface GitHubContext {
  owner: string;
  repo: string;
  token: string;
}

function getGitHubContext(): GitHubContext | null {
  const token = process.env["GITHUB_TOKEN"];
  const repository = process.env["GITHUB_REPOSITORY"];

  if (!token || !repository) return null;

  const parts = repository.split("/");
  if (parts.length !== 2) return null;
  
  const owner = parts[0];
  const repo = parts[1];
  if (!owner || !repo) return null;
  
  return { owner, repo, token };
}

async function githubApi<T>(
  ctx: GitHubContext,
  endpoint: string,
  method = "GET",
  body?: unknown
): Promise<T | null> {
  try {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${ctx.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`GitHub API error: ${error}`);
    return null;
  }
}

interface GitHubPR {
  number: number;
  state: string;
  head: { ref: string };
}

async function getOpenPRs(ctx: GitHubContext): Promise<Map<string, number>> {
  const prs = await githubApi<GitHubPR[]>(
    ctx,
    `/repos/${ctx.owner}/${ctx.repo}/pulls?state=open&per_page=100`
  );

  const prMap = new Map<string, number>();
  if (prs) {
    for (const pr of prs) {
      prMap.set(pr.head.ref, pr.number);
    }
  }
  return prMap;
}

interface GitHubBranch {
  name: string;
  protected: boolean;
}

async function getProtectedBranches(ctx: GitHubContext): Promise<Set<string>> {
  const branches = await githubApi<GitHubBranch[]>(
    ctx,
    `/repos/${ctx.owner}/${ctx.repo}/branches?per_page=100`
  );

  const protectedSet = new Set<string>();
  if (branches) {
    for (const branch of branches) {
      if (branch.protected) {
        protectedSet.add(branch.name);
      }
    }
  }
  return protectedSet;
}

async function deleteBranch(ctx: GitHubContext, branch: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${ctx.owner}/${ctx.repo}/git/refs/heads/${branch}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${ctx.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}

async function createPR(
  ctx: GitHubContext,
  branch: string,
  defaultBranch: string,
  title: string,
  body: string
): Promise<number | null> {
  const result = await githubApi<{ number: number }>(
    ctx,
    `/repos/${ctx.owner}/${ctx.repo}/pulls`,
    "POST",
    {
      title,
      body,
      head: branch,
      base: defaultBranch,
    }
  );
  return result?.number || null;
}

async function postIssueComment(
  ctx: GitHubContext,
  issueNumber: number,
  body: string
): Promise<boolean> {
  const result = await githubApi(
    ctx,
    `/repos/${ctx.owner}/${ctx.repo}/issues/${issueNumber}/comments`,
    "POST",
    { body }
  );
  return result !== null;
}

// =============================================================================
// Branch Analysis
// =============================================================================

function matchesPattern(branchName: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      if (regex.test(branchName)) return true;
    } else if (branchName === pattern) {
      return true;
    }
  }
  return false;
}

function calculateStaleness(
  daysSinceCommit: number,
  config: BranchHealthConfig
): StalenessLevel {
  if (daysSinceCommit >= config.staleness.critical) return "critical";
  if (daysSinceCommit >= config.staleness.stale) return "stale";
  if (daysSinceCommit >= config.staleness.warning) return "warning";
  return "active";
}

function determineProposedAction(branch: BranchInfo, config: BranchHealthConfig): ProposedAction {
  // Protected or ignored branches: keep
  if (branch.isProtected || branch.isIgnored) return "keep";

  // Already has open PR: keep monitoring
  if (branch.hasOpenPR) return "keep";

  // Fully merged: candidate for deletion
  if (branch.mergeStatus === "merged") {
    if (config.autoDelete.enabled && branch.daysSinceLastCommit >= config.autoDelete.minAgeDays) {
      return "delete";
    }
    return "review";
  }

  // Has conflicts: needs manual review
  if (branch.mergeStatus === "in-conflict") return "review";

  // Ahead of default (has unmerged commits)
  if (branch.aheadCount > 0) {
    // If behind too, needs PR/rebase
    if (branch.behindCount > 0) {
      return "open-pr";
    }

    // Clean fast-forward possible
    if (config.autoMerge.enabled && config.autoMerge.fastForwardOnly) {
      return "auto-merge";
    }
    return "open-pr";
  }

  // Behind default (nothing to contribute)
  if (branch.behindCount > 0 && branch.aheadCount === 0) {
    if (branch.stalenessLevel === "critical" || branch.stalenessLevel === "stale") {
      return "delete";
    }
    return "review";
  }

  return "keep";
}

async function analyzeBranches(
  config: BranchHealthConfig,
  verbose: boolean
): Promise<BranchInfo[]> {
  const defaultBranch = getDefaultBranch(config.defaultBranch);
  if (verbose) console.log(`Default branch: ${defaultBranch}`);

  // Fetch all remote refs first
  try {
    git("fetch --all --prune", { silent: !verbose });
  } catch {
    console.warn("Warning: Could not fetch remote branches");
  }

  const branches = getRemoteBranches();
  if (verbose) console.log(`Found ${branches.length} remote branches`);

  // Get GitHub context for API calls
  const ctx = getGitHubContext();
  let openPRs = new Map<string, number>();
  let protectedBranches = new Set<string>();

  if (ctx) {
    [openPRs, protectedBranches] = await Promise.all([
      getOpenPRs(ctx),
      getProtectedBranches(ctx),
    ]);
    if (verbose) {
      console.log(`Found ${openPRs.size} open PRs`);
      console.log(`Found ${protectedBranches.size} protected branches`);
    }
  }

  const results: BranchInfo[] = [];

  for (const branch of branches) {
    if (branch === defaultBranch) continue; // Skip default branch

    if (verbose) console.log(`Analyzing: ${branch}`);

    const commitInfo = getBranchCommitInfo(branch);
    const { ahead, behind } = getAheadBehind(branch, defaultBranch);

    const commitDate = new Date(commitInfo.date);
    const now = new Date();
    const daysSinceCommit = Math.floor(
      (now.getTime() - commitDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isIgnored = matchesPattern(branch, config.ignoreBranches);
    const isProtected = protectedBranches.has(branch);
    const hasOpenPR = openPRs.has(branch);
    const prNumber = openPRs.get(branch);

    // Determine merge status
    let mergeStatus: MergeStatus;
    if (isProtected) {
      mergeStatus = "protected";
    } else if (isIgnored) {
      mergeStatus = "ignored";
    } else if (isBranchMerged(branch, defaultBranch)) {
      mergeStatus = "merged";
    } else if (ahead > 0 && hasConflicts(branch, defaultBranch)) {
      mergeStatus = "in-conflict";
    } else {
      mergeStatus = "unmerged";
    }

    const info: BranchInfo = {
      name: branch,
      sha: commitInfo.sha,
      lastCommitDate: commitInfo.date,
      lastCommitAuthor: commitInfo.author,
      lastCommitMessage: commitInfo.message,
      aheadCount: ahead,
      behindCount: behind,
      mergeStatus,
      proposedAction: "keep", // Will be set below
      stalenessLevel: calculateStaleness(daysSinceCommit, config),
      daysSinceLastCommit: daysSinceCommit,
      isProtected,
      isIgnored,
      hasOpenPR,
      prNumber,
    };

    // Get changed files for branches ahead of default
    if (ahead > 0) {
      info.changedFiles = getChangedFiles(branch, defaultBranch);
    }

    info.proposedAction = determineProposedAction(info, config);
    results.push(info);
  }

  // Sort by staleness (most stale first)
  results.sort((a, b) => b.daysSinceLastCommit - a.daysSinceLastCommit);

  return results;
}

// =============================================================================
// Actions
// =============================================================================

async function applyActions(
  branches: BranchInfo[],
  _config: BranchHealthConfig,
  defaultBranch: string,
  dryRun: boolean,
  verbose: boolean
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];
  const ctx = getGitHubContext();

  for (const branch of branches) {
    if (branch.proposedAction === "keep" || branch.proposedAction === "review") {
      continue;
    }

    const timestamp = new Date().toISOString();

    if (branch.proposedAction === "delete") {
      if (dryRun) {
        results.push({
          branch: branch.name,
          action: "delete",
          success: true,
          message: "[DRY-RUN] Would delete branch",
          timestamp,
        });
        if (verbose) console.log(`[DRY-RUN] Would delete: ${branch.name}`);
      } else if (ctx) {
        const success = await deleteBranch(ctx, branch.name);
        results.push({
          branch: branch.name,
          action: "delete",
          success,
          message: success ? "Branch deleted" : "Failed to delete branch",
          timestamp,
        });
        if (verbose) {
          console.log(
            success ? `Deleted: ${branch.name}` : `Failed to delete: ${branch.name}`
          );
        }
      }
    } else if (branch.proposedAction === "open-pr") {
      if (!branch.hasOpenPR) {
        if (dryRun) {
          results.push({
            branch: branch.name,
            action: "open-pr",
            success: true,
            message: "[DRY-RUN] Would open PR",
            timestamp,
          });
          if (verbose) console.log(`[DRY-RUN] Would open PR for: ${branch.name}`);
        } else if (ctx) {
          const title = `Merge ${branch.name} into ${defaultBranch}`;
          const body = `Automated PR created by branch-health workflow.\n\n**Branch:** ${branch.name}\n**Ahead of ${defaultBranch}:** ${branch.aheadCount} commits\n**Behind ${defaultBranch}:** ${branch.behindCount} commits`;
          const prNumber = await createPR(ctx, branch.name, defaultBranch, title, body);
          results.push({
            branch: branch.name,
            action: "open-pr",
            success: prNumber !== null,
            message: prNumber !== null ? `Opened PR #${prNumber}` : "Failed to open PR",
            timestamp,
          });
          if (verbose) {
            console.log(
              prNumber !== null
                ? `Opened PR #${prNumber} for: ${branch.name}`
                : `Failed to open PR for: ${branch.name}`
            );
          }
        }
      }
    } else if (branch.proposedAction === "auto-merge") {
      // Auto-merge is complex and should be done via GitHub merge API
      // For safety, we'll just log it as requiring manual intervention
      results.push({
        branch: branch.name,
        action: "auto-merge",
        success: false,
        message: dryRun
          ? "[DRY-RUN] Would attempt auto-merge"
          : "Auto-merge requires manual intervention for safety",
        timestamp,
      });
      if (verbose) console.log(`Auto-merge candidate: ${branch.name}`);
    }
  }

  return results;
}

// =============================================================================
// Reporting
// =============================================================================

function generateReport(
  branches: BranchInfo[],
  actions: ActionResult[],
  config: BranchHealthConfig,
  defaultBranch: string,
  dryRun: boolean
): BranchHealthReport {
  const ctx = getGitHubContext();
  const repository = ctx ? `${ctx.owner}/${ctx.repo}` : "unknown";

  return {
    generatedAt: new Date().toISOString(),
    repository,
    defaultBranch,
    mode: dryRun ? "dry-run" : "apply",
    stalenessThresholds: {
      warning: config.staleness.warning,
      stale: config.staleness.stale,
      critical: config.staleness.critical,
    },
    summary: {
      totalBranches: branches.length,
      activeBranches: branches.filter((b) => b.stalenessLevel === "active").length,
      staleBranches: branches.filter(
        (b) => b.stalenessLevel === "stale" || b.stalenessLevel === "critical"
      ).length,
      mergedBranches: branches.filter((b) => b.mergeStatus === "merged").length,
      aheadBranches: branches.filter((b) => b.aheadCount > 0).length,
      behindBranches: branches.filter((b) => b.behindCount > 0 && b.aheadCount === 0).length,
      conflictingBranches: branches.filter((b) => b.mergeStatus === "in-conflict").length,
      protectedBranches: branches.filter((b) => b.isProtected).length,
      ignoredBranches: branches.filter((b) => b.isIgnored).length,
    },
    branches,
    actions,
  };
}

function generateMarkdownReport(report: BranchHealthReport): string {
  const lines: string[] = [];

  lines.push("# Branch Health Report");
  lines.push("");
  lines.push(`**Generated:** ${new Date(report.generatedAt).toLocaleString()}`);
  lines.push(`**Repository:** ${report.repository}`);
  lines.push(`**Default Branch:** \`${report.defaultBranch}\``);
  lines.push(`**Mode:** ${report.mode.toUpperCase()}`);
  lines.push("");

  // Summary table
  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("|--------|-------|");
  lines.push(`| Total Branches | ${report.summary.totalBranches} |`);
  lines.push(`| Active (< ${report.stalenessThresholds.warning} days) | ${report.summary.activeBranches} |`);
  lines.push(`| Stale (> ${report.stalenessThresholds.stale} days) | ${report.summary.staleBranches} |`);
  lines.push(`| Fully Merged | ${report.summary.mergedBranches} |`);
  lines.push(`| Ahead of Default | ${report.summary.aheadBranches} |`);
  lines.push(`| Behind Only | ${report.summary.behindBranches} |`);
  lines.push(`| Has Conflicts | ${report.summary.conflictingBranches} |`);
  lines.push(`| Protected | ${report.summary.protectedBranches} |`);
  lines.push(`| Ignored | ${report.summary.ignoredBranches} |`);
  lines.push("");

  // Branch table
  lines.push("## Branch Details");
  lines.push("");
  lines.push(
    "| Branch | Last Commit | Ahead/Behind | Status | Action |"
  );
  lines.push("|--------|-------------|--------------|--------|--------|");

  for (const branch of report.branches) {
    const dateStr = new Date(branch.lastCommitDate).toLocaleDateString();
    const aheadBehind = `+${branch.aheadCount}/-${branch.behindCount}`;
    const statusEmoji = getStatusEmoji(branch.mergeStatus);
    const actionEmoji = getActionEmoji(branch.proposedAction);

    lines.push(
      `| \`${branch.name}\` | ${dateStr} (${branch.daysSinceLastCommit}d ago) | ${aheadBehind} | ${statusEmoji} ${branch.mergeStatus} | ${actionEmoji} ${branch.proposedAction} |`
    );
  }
  lines.push("");

  // Actions taken
  if (report.actions.length > 0) {
    lines.push("## Actions");
    lines.push("");
    lines.push("| Branch | Action | Result | Message |");
    lines.push("|--------|--------|--------|---------|");

    for (const action of report.actions) {
      const resultEmoji = action.success ? "✅" : "❌";
      lines.push(
        `| \`${action.branch}\` | ${action.action} | ${resultEmoji} | ${action.message} |`
      );
    }
    lines.push("");
  }

  // Stale branches detail
  const staleBranches = report.branches.filter(
    (b) => b.stalenessLevel === "stale" || b.stalenessLevel === "critical"
  );
  if (staleBranches.length > 0) {
    lines.push("## Stale Branches (Require Attention)");
    lines.push("");
    for (const branch of staleBranches) {
      lines.push(`### \`${branch.name}\``);
      lines.push("");
      lines.push(`- **Last Commit:** ${branch.lastCommitDate} (${branch.daysSinceLastCommit} days ago)`);
      lines.push(`- **Author:** ${branch.lastCommitAuthor}`);
      lines.push(`- **Message:** ${branch.lastCommitMessage}`);
      lines.push(`- **Status:** ${branch.mergeStatus}`);
      lines.push(`- **Recommendation:** ${branch.proposedAction}`);
      lines.push("");
    }
  }

  // Branches ahead of default
  const aheadBranches = report.branches.filter(
    (b) => b.aheadCount > 0 && !b.isProtected && !b.isIgnored
  );
  if (aheadBranches.length > 0) {
    lines.push("## Branches Ahead of Default (May Need Merging)");
    lines.push("");
    for (const branch of aheadBranches) {
      lines.push(`### \`${branch.name}\``);
      lines.push("");
      lines.push(`- **Ahead:** ${branch.aheadCount} commits`);
      lines.push(`- **Behind:** ${branch.behindCount} commits`);
      lines.push(`- **Status:** ${branch.mergeStatus}`);
      if (branch.hasOpenPR) {
        lines.push(`- **Open PR:** #${branch.prNumber}`);
      }
      if (branch.changedFiles && branch.changedFiles.length > 0) {
        lines.push(`- **Changed Files:** ${branch.changedFiles.length}`);
        if (branch.changedFiles.length <= 10) {
          for (const file of branch.changedFiles) {
            lines.push(`  - \`${file}\``);
          }
        } else {
          for (const file of branch.changedFiles.slice(0, 10)) {
            lines.push(`  - \`${file}\``);
          }
          lines.push(`  - ... and ${branch.changedFiles.length - 10} more`);
        }
      }
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("*Generated by [branch-health workflow](/.github/workflows/branch-health.yml)*");

  return lines.join("\n");
}

function getStatusEmoji(status: MergeStatus): string {
  switch (status) {
    case "merged":
      return "✅";
    case "unmerged":
      return "🔀";
    case "in-conflict":
      return "⚠️";
    case "protected":
      return "🔒";
    case "ignored":
      return "⏭️";
  }
}

function getActionEmoji(action: ProposedAction): string {
  switch (action) {
    case "keep":
      return "📌";
    case "open-pr":
      return "📝";
    case "update-pr":
      return "🔄";
    case "auto-merge":
      return "🚀";
    case "delete":
      return "🗑️";
    case "review":
      return "👀";
  }
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let dryRun = true;
  let configPath = ".github/branch-health.yml";
  let outputDir = "./branch-health-reports";
  let verbose = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--dry-run":
        dryRun = true;
        break;
      case "--apply":
        dryRun = false;
        break;
      case "--config":
        configPath = args[++i] ?? configPath;
        break;
      case "--output":
        outputDir = args[++i] ?? outputDir;
        break;
      case "--verbose":
      case "-v":
        verbose = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Branch Health Automation Script

Usage: npx tsx scripts/branch-health.ts [options]

Options:
  --dry-run          Report only, no modifications (default)
  --apply            Apply safe actions (delete merged, open PRs)
  --config <path>    Path to config file (default: .github/branch-health.yml)
  --output <dir>     Output directory for reports (default: ./branch-health-reports)
  --verbose, -v      Enable verbose logging
  --help, -h         Show this help message
        `);
        process.exit(0);
    }
  }

  console.log("🔍 Branch Health Analysis");
  console.log("=".repeat(50));

  // Load configuration
  const config = loadConfig(configPath);
  if (dryRun) {
    config.dryRun = true;
  }

  console.log(`Mode: ${config.dryRun ? "DRY-RUN" : "APPLY"}`);
  console.log(`Config: ${configPath}`);

  // Get default branch
  const defaultBranch = getDefaultBranch(config.defaultBranch);
  console.log(`Default branch: ${defaultBranch}`);

  // Analyze branches
  console.log("\nAnalyzing branches...");
  const branches = await analyzeBranches(config, verbose);
  console.log(`Found ${branches.length} branches to analyze`);

  // Apply actions if not dry-run
  console.log("\nProcessing actions...");
  const actions = await applyActions(branches, config, defaultBranch, config.dryRun, verbose);

  // Generate report
  const report = generateReport(branches, actions, config, defaultBranch, config.dryRun);

  // Save reports
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (config.reporting.json) {
    const jsonPath = path.join(outputDir, "branch-health-report.json");
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 JSON report saved: ${jsonPath}`);
  }

  if (config.reporting.markdown) {
    const mdPath = path.join(outputDir, "branch-health-report.md");
    const markdown = generateMarkdownReport(report);
    fs.writeFileSync(mdPath, markdown);
    console.log(`📄 Markdown report saved: ${mdPath}`);
  }

  // Post to issue if configured
  if (config.reporting.issueNumber) {
    const ctx = getGitHubContext();
    if (ctx) {
      const markdown = generateMarkdownReport(report);
      const posted = await postIssueComment(ctx, config.reporting.issueNumber, markdown);
      if (posted) {
        console.log(`💬 Report posted to issue #${config.reporting.issueNumber}`);
      }
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary");
  console.log("=".repeat(50));
  console.log(`Total branches: ${report.summary.totalBranches}`);
  console.log(`Active: ${report.summary.activeBranches}`);
  console.log(`Stale: ${report.summary.staleBranches}`);
  console.log(`Merged: ${report.summary.mergedBranches}`);
  console.log(`Ahead of default: ${report.summary.aheadBranches}`);
  console.log(`Behind only: ${report.summary.behindBranches}`);
  console.log(`Conflicting: ${report.summary.conflictingBranches}`);

  if (actions.length > 0) {
    console.log(`\nActions taken: ${actions.length}`);
    const successful = actions.filter((a) => a.success).length;
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${actions.length - successful}`);
  }

  console.log("\n✅ Branch health analysis complete");

  // Set outputs for GitHub Actions
  const githubOutput = process.env["GITHUB_OUTPUT"];
  if (githubOutput) {
    fs.appendFileSync(githubOutput, `total-branches=${report.summary.totalBranches}\n`);
    fs.appendFileSync(githubOutput, `stale-branches=${report.summary.staleBranches}\n`);
    fs.appendFileSync(githubOutput, `merged-branches=${report.summary.mergedBranches}\n`);
    fs.appendFileSync(githubOutput, `ahead-branches=${report.summary.aheadBranches}\n`);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
