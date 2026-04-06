#!/usr/bin/env node

/**
 * 02-check/check.mjs
 *
 * Deterministic script for Step 2 (Check Requirements).
 *
 * Usage:
 *   node 02-check/check.mjs <skill-dir> <project-repo-location> <personal-dir-location> <user-mail> <user-name> <handle>
 *
 * All arguments are required. Pass "_" for user-mail or user-name to skip those checks.
 * Pass "" (empty string) for handle if unset.
 *
 * Outputs a single JSON object to stdout:
 * {
 *   "status": "OK" | "WARNING" | "ERROR",
 *   "message": "Human-readable summary",
 *   "checks": [
 *     { "id": "a", "label": "...", "status": "OK"|"WARNING"|"ERROR"|"SKIP", "detail": "..." },
 *     ...
 *   ],
 *   "errors": [],
 *   "warnings": []
 * }
 */

import { existsSync, statSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY = { OK: 0, WARNING: 1, ERROR: 2 };

function worstStatus(a, b) {
  return (SEVERITY[a] ?? 0) >= (SEVERITY[b] ?? 0) ? a : b;
}

function fileExistsAndNonEmpty(filePath) {
  if (!existsSync(filePath)) return false;
  try {
    const stat = statSync(filePath);
    if (!stat.isFile()) return false;
    const content = readFileSync(filePath, "utf-8").trim();
    return content.length > 0;
  } catch {
    return false;
  }
}

function gitConfigValue(repoDir, key) {
  try {
    return execSync(`git -C "${repoDir}" config --get ${key}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const skillDir = resolve(args[0] || ".");
  const projectRepo = args[1] || "";
  const personalDir = args[2] || "";
  const userMail = args[3] || "";
  const userName = args[4] || "";
  const handle = args[5] ?? "";

  const result = {
    status: "OK",
    message: "",
    checks: [],
    errors: [],
    warnings: [],
  };

  function addCheck(id, label, status, detail) {
    result.checks.push({ id, label, status, detail });
    if (status === "ERROR") {
      result.status = worstStatus(result.status, "ERROR");
      result.errors.push(`(${id}) ${detail}`);
    } else if (status === "WARNING") {
      result.status = worstStatus(result.status, "WARNING");
      result.warnings.push(`(${id}) ${detail}`);
    }
  }

  // -----------------------------------------------------------------------
  // (a) project-repo-location is a git repo
  // -----------------------------------------------------------------------
  if (!projectRepo) {
    addCheck("a", "Project repo exists", "ERROR", "project-repo-location is empty.");
  } else if (!existsSync(projectRepo)) {
    addCheck("a", "Project repo exists", "ERROR", `project-repo-location "${projectRepo}" does not exist.`);
  } else if (!existsSync(join(projectRepo, ".git"))) {
    addCheck("a", "Project repo exists", "ERROR", `project-repo-location "${projectRepo}" is not a git repository (no .git found).`);
  } else {
    addCheck("a", "Project repo exists", "OK", `"${projectRepo}" is a git repository.`);
  }

  // -----------------------------------------------------------------------
  // (b) personal-dir-location exists
  // -----------------------------------------------------------------------
  if (!personalDir) {
    addCheck("b", "Personal dir exists", "ERROR", "personal-dir-location is empty.");
  } else if (!existsSync(personalDir)) {
    addCheck("b", "Personal dir exists", "ERROR", `personal-dir-location "${personalDir}" does not exist.`);
  } else {
    addCheck("b", "Personal dir exists", "OK", `"${personalDir}" is accessible.`);
  }

  // -----------------------------------------------------------------------
  // (c) user-mail matches git config (skip if "_")
  // -----------------------------------------------------------------------
  if (userMail === "_") {
    addCheck("c", "Git email matches", "SKIP", "Skipped (user-mail is \"_\").");
  } else if (!userMail) {
    addCheck("c", "Git email matches", "ERROR", "user-mail is not set and was not bypassed with \"_\".");
  } else {
    const gitEmail = gitConfigValue(projectRepo, "user.email");
    if (!gitEmail) {
      addCheck("c", "Git email matches", "ERROR", `Could not read git user.email from "${projectRepo}".`);
    } else if (gitEmail.toLowerCase() !== userMail.toLowerCase()) {
      addCheck("c", "Git email matches", "ERROR", `Git email "${gitEmail}" does not match expected "${userMail}".`);
    } else {
      addCheck("c", "Git email matches", "OK", `Git email matches: "${gitEmail}".`);
    }
  }

  // -----------------------------------------------------------------------
  // (d) user-name matches git config (skip if "_")
  // -----------------------------------------------------------------------
  if (userName === "_") {
    addCheck("d", "Git name matches", "SKIP", "Skipped (user-name is \"_\").");
  } else if (!userName) {
    addCheck("d", "Git name matches", "ERROR", "user-name is not set and was not bypassed with \"_\".");
  } else {
    const gitName = gitConfigValue(projectRepo, "user.name");
    if (!gitName) {
      addCheck("d", "Git name matches", "ERROR", `Could not read git user.name from "${projectRepo}".`);
    } else if (gitName !== userName) {
      addCheck("d", "Git name matches", "ERROR", `Git name "${gitName}" does not match expected "${userName}".`);
    } else {
      addCheck("d", "Git name matches", "OK", `Git name matches: "${gitName}".`);
    }
  }

  // -----------------------------------------------------------------------
  // (e) handle is resolved
  // -----------------------------------------------------------------------
  if (handle === "_") {
    addCheck("e", "Handle resolved", "OK", "Handle is \"_\" — branch matching will use item-id only (no confirmation).");
  } else if (!handle) {
    addCheck("e", "Handle resolved", "WARNING", "Handle is empty — branch matching will use item-id only.");
  } else {
    addCheck("e", "Handle resolved", "OK", `Handle resolved: "${handle}".`);
  }

  // -----------------------------------------------------------------------
  // (f) Required files exist and are non-empty
  // -----------------------------------------------------------------------
  const requiredFiles = [
    "HELP.md",
    "06-fetch/FETCH.md",
    "07-evaluate/EVALUATE.md",
    "08-formulate/FORMULATE.md",
    "09-respond/RESPOND.md",
    "10-implement/IMPLEMENT.md",
    "11-sanitycheck/SANITYCHECK.md",
    "12-glean/GLEAN.md",
    "13-finalize/FINALIZE.md",
  ];

  const missingFiles = [];
  for (const relPath of requiredFiles) {
    const fullPath = join(skillDir, relPath);
    if (!fileExistsAndNonEmpty(fullPath)) {
      missingFiles.push(relPath);
    }
  }

  // Check at-least-one pairs
  const hasSanity =
    fileExistsAndNonEmpty(join(skillDir, "SANITYCHECK-RULES.md")) ||
    fileExistsAndNonEmpty(join(skillDir, "SANITYCHECK-RULES.md.example"));
  const hasGuidance =
    fileExistsAndNonEmpty(join(skillDir, "GUIDANCE.md")) ||
    fileExistsAndNonEmpty(join(skillDir, "GUIDANCE.md.example"));

  if (!hasSanity) missingFiles.push("SANITYCHECK-RULES.md (or .example)");
  if (!hasGuidance) missingFiles.push("GUIDANCE.md (or .example)");

  if (missingFiles.length > 0) {
    addCheck(
      "f",
      "Required files present",
      "ERROR",
      `Missing or empty files: ${missingFiles.join(", ")}`
    );
  } else {
    addCheck("f", "Required files present", "OK", "All required skill files are present and non-empty.");
  }

  // -----------------------------------------------------------------------
  // Build message
  // -----------------------------------------------------------------------
  const parts = [];
  if (result.errors.length > 0) parts.push(...result.errors);
  if (result.warnings.length > 0) parts.push(...result.warnings);
  if (parts.length === 0) parts.push("All requirements passed.");
  result.message = parts.join(" ");

  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
