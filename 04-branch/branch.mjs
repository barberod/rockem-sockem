#!/usr/bin/env node

/**
 * 04-branch/branch.mjs
 *
 * Deterministic script for Step 4 (Verify Branch and PR).
 *
 * Usage:
 *   node 04-branch/branch.mjs <project-repo-location> <item-id> <handle> [<selected-branch>]
 *
 * - <handle>: the resolved handle value. Pass "" or "_" as described in SKILL.md.
 * - <selected-branch>: optional. If provided, skip branch search and use this
 *   branch directly (used after the agent prompts the user to pick one).
 *
 * Outputs JSON:
 * {
 *   "status": "OK" | "WARNING" | "ERROR",
 *   "message": "...",
 *   "checks": {
 *     "branchSearch":  { "status", "detail", "matches": [...], "designated": "..." | null },
 *     "checkout":      { "status", "detail", "currentBranch": "..." },
 *     "workingTree":   { "status", "detail", "blockingState": "..." | null },
 *     "openPR":        { "status", "detail", "pr": { "number", "title", "url" } | null }
 *   },
 *   "needsUserChoice": false,
 *   "needsUserConfirm": false,
 *   "errors": [],
 *   "warnings": []
 * }
 *
 * needsUserChoice = true when multiple branches match (agent must ask user to pick).
 * needsUserConfirm = true when handle was empty and exactly one match (agent should confirm).
 */

import { existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY = { OK: 0, WARNING: 1, ERROR: 2 };

function worstStatus(a, b) {
  return (SEVERITY[a] ?? 0) >= (SEVERITY[b] ?? 0) ? a : b;
}

function git(repoDir, cmd) {
  try {
    return execSync(`git -C "${repoDir}" ${cmd}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

function ghPrList(repoDir, branchName) {
  try {
    const raw = execSync(
      `gh pr list --state open --head "${branchName}" --json number,title,url`,
      {
        encoding: "utf-8",
        cwd: repoDir,
        stdio: ["pipe", "pipe", "pipe"],
      }
    ).trim();
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const repoDir = args[0] || ".";
  const itemId = args[1] || "";
  const handle = args[2] ?? "";
  const selectedBranch = args[3] || null;

  const result = {
    status: "OK",
    message: "",
    checks: {
      branchSearch: { status: "OK", detail: "", matches: [], designated: null },
      checkout: { status: "OK", detail: "", currentBranch: null },
      workingTree: { status: "OK", detail: "", blockingState: null },
      openPR: { status: "OK", detail: "", pr: null },
    },
    needsUserChoice: false,
    needsUserConfirm: false,
    errors: [],
    warnings: [],
  };

  // -----------------------------------------------------------------------
  // (a) Find designated branch
  // -----------------------------------------------------------------------
  let designated = null;

  if (selectedBranch) {
    // User already selected — skip search
    designated = selectedBranch;
    result.checks.branchSearch.designated = designated;
    result.checks.branchSearch.matches = [designated];
    result.checks.branchSearch.detail = `Using user-selected branch: "${designated}".`;
  } else {
    // Get all branches (local)
    const branchOutput = git(repoDir, "branch --list --format=%(refname:short)");
    if (branchOutput === null) {
      result.checks.branchSearch.status = "ERROR";
      result.checks.branchSearch.detail = "Failed to list git branches.";
      result.status = "ERROR";
      result.errors.push(result.checks.branchSearch.detail);
      result.message = result.errors.join(" ");
      process.stdout.write(JSON.stringify(result, null, 2));
      return;
    }

    const allBranches = branchOutput
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    // Also get remote branches not yet tracked locally
    const remoteOutput = git(repoDir, "branch -r --format=%(refname:short)");
    if (remoteOutput) {
      const remoteBranches = remoteOutput
        .split("\n")
        .map((b) => b.trim())
        .filter((b) => b.length > 0 && !b.includes("HEAD"))
        .map((b) => b.replace(/^origin\//, ""));
      // Add remote branches not already in local list
      for (const rb of remoteBranches) {
        if (!allBranches.includes(rb)) {
          allBranches.push(rb);
        }
      }
    }

    const useHandle = handle && handle !== "_";
    const matches = allBranches.filter((b) => {
      const lower = b.toLowerCase();
      if (useHandle) {
        return (
          lower.includes(handle.toLowerCase()) &&
          lower.includes(itemId.toLowerCase())
        );
      }
      return lower.includes(itemId.toLowerCase());
    });

    result.checks.branchSearch.matches = matches;

    if (matches.length === 0) {
      result.checks.branchSearch.status = "ERROR";
      const searchDesc = useHandle
        ? `both "${handle}" and "${itemId}"`
        : `"${itemId}"`;
      result.checks.branchSearch.detail = `No branches found containing ${searchDesc}.`;
      result.status = "ERROR";
      result.errors.push(result.checks.branchSearch.detail);
      result.message = result.errors.join(" ");
      process.stdout.write(JSON.stringify(result, null, 2));
      return;
    }

    if (matches.length === 1) {
      designated = matches[0];
      result.checks.branchSearch.designated = designated;
      result.checks.branchSearch.detail = `Found branch: "${designated}".`;

      // If handle was empty (not "_"), agent should confirm with user
      if (!handle) {
        result.needsUserConfirm = true;
        result.checks.branchSearch.detail += " (handle was empty — confirmation recommended)";
      }
    } else {
      // Multiple matches — agent must ask user to select
      result.needsUserChoice = true;
      result.checks.branchSearch.status = "WARNING";
      result.checks.branchSearch.detail = `Multiple branches match: ${matches.join(", ")}. User must select one.`;
      result.warnings.push(result.checks.branchSearch.detail);
      // Return early — cannot proceed with checkout/PR checks without a branch
      result.status = "WARNING";
      result.message = result.checks.branchSearch.detail;
      process.stdout.write(JSON.stringify(result, null, 2));
      return;
    }
  }

  // -----------------------------------------------------------------------
  // (b) Confirm designated branch is checked out
  // -----------------------------------------------------------------------
  const currentBranch = git(repoDir, "rev-parse --abbrev-ref HEAD");
  result.checks.checkout.currentBranch = currentBranch;

  if (!currentBranch) {
    result.checks.checkout.status = "ERROR";
    result.checks.checkout.detail = "Could not determine current branch.";
    result.status = worstStatus(result.status, "ERROR");
    result.errors.push(result.checks.checkout.detail);
  } else if (currentBranch !== designated) {
    result.checks.checkout.status = "ERROR";
    result.checks.checkout.detail = `Branch "${designated}" is not checked out. Current branch is "${currentBranch}".`;
    result.status = worstStatus(result.status, "ERROR");
    result.errors.push(result.checks.checkout.detail);
  } else {
    result.checks.checkout.detail = `Branch "${designated}" is checked out.`;
  }

  // -----------------------------------------------------------------------
  // (c) Confirm working tree is ready for edits
  // -----------------------------------------------------------------------
  const blockingFiles = [
    { path: ".git/MERGE_HEAD", state: "merge" },
    { path: ".git/rebase-merge", state: "rebase" },
    { path: ".git/rebase-apply", state: "rebase" },
    { path: ".git/CHERRY_PICK_HEAD", state: "cherry-pick" },
    { path: ".git/REVERT_HEAD", state: "revert" },
    { path: ".git/BISECT_LOG", state: "bisect" },
  ];

  let blockingState = null;
  for (const { path, state } of blockingFiles) {
    if (existsSync(join(repoDir, path))) {
      blockingState = state;
      break;
    }
  }

  result.checks.workingTree.blockingState = blockingState;

  if (blockingState) {
    result.checks.workingTree.status = "ERROR";
    result.checks.workingTree.detail = `Working tree has an in-progress ${blockingState}. Resolve it before continuing.`;
    result.status = worstStatus(result.status, "ERROR");
    result.errors.push(result.checks.workingTree.detail);
  } else {
    result.checks.workingTree.detail = "Working tree is clean of blocking operations.";
  }

  // -----------------------------------------------------------------------
  // (d) Find open PR
  // -----------------------------------------------------------------------
  const prs = ghPrList(repoDir, designated);

  if (prs === null) {
    result.checks.openPR.status = "ERROR";
    result.checks.openPR.detail = `Failed to query GitHub for open PRs on branch "${designated}". Is "gh" installed and authenticated?`;
    result.status = worstStatus(result.status, "ERROR");
    result.errors.push(result.checks.openPR.detail);
  } else if (prs.length === 0) {
    result.checks.openPR.status = "ERROR";
    result.checks.openPR.detail = `No open PR found for branch "${designated}" targeting main.`;
    result.status = worstStatus(result.status, "ERROR");
    result.errors.push(result.checks.openPR.detail);
  } else {
    const pr = prs[0];
    result.checks.openPR.pr = pr;
    result.checks.openPR.detail = `Found PR #${pr.number}: "${pr.title}" (${pr.url}).`;
  }

  // -----------------------------------------------------------------------
  // Build message
  // -----------------------------------------------------------------------
  const parts = [];
  if (result.errors.length > 0) parts.push(...result.errors);
  if (result.warnings.length > 0) parts.push(...result.warnings);
  if (parts.length === 0) parts.push("Branch and PR verified.");
  result.message = parts.join(" ");

  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
