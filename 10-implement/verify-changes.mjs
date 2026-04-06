#!/usr/bin/env node

/**
 * 10-implement/verify-changes.mjs
 *
 * Deterministic verification script for Step 10 (Implement).
 *
 * Checks that the repo has uncommitted changes after the agent's
 * implementation work. Does not judge the quality of the changes —
 * just confirms work was done.
 *
 * Usage:
 *   node 10-implement/verify-changes.mjs <project-repo-location> <has-accepts>
 *
 * - <has-accepts>: "true" if the evaluation had accepted/amended comments,
 *   "false" if all comments were rejected. When true and no changes are
 *   detected, this is an ERROR (the agent should have made changes).
 *   When false, no changes is a SKIP (expected).
 *
 * Outputs JSON:
 * {
 *   "status": "OK" | "SKIP" | "ERROR",
 *   "message": "...",
 *   "filesChanged": 0,
 *   "diffStat": "..."
 * }
 */

import { execSync } from "child_process";

function main() {
  const repoDir = process.argv[2] || ".";
  const hasAccepts = (process.argv[3] || "false").toLowerCase() === "true";

  const result = {
    status: "OK",
    message: "",
    filesChanged: 0,
    diffStat: "",
  };

  try {
    const stat = execSync("git diff --stat", {
      encoding: "utf-8",
      cwd: repoDir,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const stagedStat = execSync("git diff --cached --stat", {
      encoding: "utf-8",
      cwd: repoDir,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const combined = [stat, stagedStat].filter(Boolean).join("\n");
    result.diffStat = combined || "(no changes)";

    // Count unique changed files from both staged and unstaged
    const fileLines = combined
      .split("\n")
      .filter((l) => l.includes("|"))
      .map((l) => l.split("|")[0].trim());
    const uniqueFiles = new Set(fileLines);
    result.filesChanged = uniqueFiles.size;

    if (result.filesChanged === 0) {
      if (hasAccepts) {
        result.status = "ERROR";
        result.message = "No changes detected, but accepted comments expected implementation. Something went wrong.";
      } else {
        result.status = "SKIP";
        result.message = "No changes detected — all comments were rejected, so this is expected.";
      }
    } else {
      result.message = `${result.filesChanged} file(s) changed.`;
    }
  } catch (err) {
    result.status = "ERROR";
    result.message = `Could not check repo state: ${err.message}`;
  }

  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
