#!/usr/bin/env node

/**
 * 13-finalize/verify-commits.mjs
 *
 * Deterministic verification script for Step 13 (Finalize).
 *
 * Checks that new commits were created and that they do not contain
 * agent attribution lines (Co-Authored-By, etc.).
 *
 * Usage:
 *   node 13-finalize/verify-commits.mjs <project-repo-location> <head-before>
 *
 * - <head-before>: the commit SHA that HEAD pointed to before the agent
 *   started creating commits. All commits after this are checked.
 *
 * Outputs JSON:
 * {
 *   "status": "OK" | "WARNING" | "ERROR",
 *   "message": "...",
 *   "newCommits": 0,
 *   "commits": [ { "sha": "...", "subject": "..." } ],
 *   "errors": [],
 *   "warnings": []
 * }
 */

import { execSync } from "child_process";

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

function main() {
  const repoDir = process.argv[2] || ".";
  const headBefore = process.argv[3] || "";

  const result = {
    status: "OK",
    message: "",
    newCommits: 0,
    commits: [],
    errors: [],
    warnings: [],
  };

  if (!headBefore) {
    result.status = "ERROR";
    result.errors.push("No head-before SHA provided.");
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  // -----------------------------------------------------------------------
  // Get commits since headBefore
  // -----------------------------------------------------------------------
  const log = git(repoDir, `log ${headBefore}..HEAD --format="%H|||%s"`);

  if (!log) {
    result.status = "SKIP";
    result.message = "No new commits — nothing to finalize.";
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  const lines = log.split("\n").filter(Boolean);
  for (const line of lines) {
    const [sha, ...subjectParts] = line.split("|||");
    result.commits.push({ sha: sha.trim(), subject: subjectParts.join("|||").trim() });
  }
  result.newCommits = result.commits.length;

  // -----------------------------------------------------------------------
  // Check for attribution lines in commit messages
  // -----------------------------------------------------------------------
  const attributionPatterns = [
    /co-authored-by/i,
    /co_authored_by/i,
    /generated.by/i,
    /authored.by.*claude/i,
    /authored.by.*copilot/i,
    /authored.by.*gemini/i,
    /authored.by.*ai/i,
  ];

  for (const commit of result.commits) {
    const fullMessage = git(repoDir, `log -1 --format=%B ${commit.sha}`);
    if (fullMessage) {
      for (const pattern of attributionPatterns) {
        if (pattern.test(fullMessage)) {
          result.errors.push(
            `Commit ${commit.sha.slice(0, 8)} ("${commit.subject}") contains attribution: matched "${pattern}".`
          );
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Build result
  // -----------------------------------------------------------------------
  if (result.errors.length > 0) {
    result.status = "ERROR";
  }

  const parts = [];
  if (result.errors.length > 0) parts.push(...result.errors);
  if (result.warnings.length > 0) parts.push(...result.warnings);
  if (parts.length === 0) {
    parts.push(`${result.newCommits} commit(s) created. No attribution found.`);
  }
  result.message = parts.join(" ");

  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
