#!/usr/bin/env node

/**
 * 05-timesetup/timesetup.mjs
 *
 * Deterministic script for Step 5 (Set Time-Bound Variables and Ensure Directories).
 *
 * Usage:
 *   node 05-timesetup/timesetup.mjs <personal-dir-location> <project-repo-location> <item-id>
 *
 * Outputs JSON:
 * {
 *   "status": "OK" | "ERROR",
 *   "message": "...",
 *   "time": { "year", "month", "day", "hour", "minutes", "timestamp" },
 *   "folderName": "...",
 *   "outputDir": "...",
 *   "checks": {
 *     "isolation": { "status", "detail" },
 *     "directory":  { "status", "detail" }
 *   },
 *   "errors": []
 * }
 */

import { existsSync, mkdirSync } from "fs";
import { resolve, sep } from "path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY = { OK: 0, WARNING: 1, ERROR: 2 };

function worstStatus(a, b) {
  return (SEVERITY[a] ?? 0) >= (SEVERITY[b] ?? 0) ? a : b;
}

/**
 * Derive folder name from item-id.
 * If item-id starts with "pbi" or "bug" (case-insensitive) and the remainder
 * is all digits (with total length >= 5), use only the numeric part.
 * Otherwise use item-id unchanged.
 */
function deriveFolderName(itemId) {
  const lower = itemId.toLowerCase();
  for (const prefix of ["pbi", "bug"]) {
    if (lower.startsWith(prefix)) {
      const remainder = itemId.slice(prefix.length);
      if (remainder.length > 0 && /^\d+$/.test(remainder) && itemId.length >= 5) {
        return remainder;
      }
    }
  }
  return itemId;
}

/**
 * Normalize a path for comparison: resolve, lowercase, ensure trailing separator.
 */
function normForContains(p) {
  return resolve(p).toLowerCase().replace(/[\\/]+/g, sep) + sep;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const personalDir = args[0] || "";
  const projectRepo = args[1] || "";
  const itemId = args[2] || "";

  const result = {
    status: "OK",
    message: "",
    time: {},
    folderName: null,
    outputDir: null,
    checks: {
      isolation: { status: "OK", detail: "" },
      directory: { status: "OK", detail: "" },
    },
    errors: [],
  };

  // -----------------------------------------------------------------------
  // (a-f) Capture time values
  // -----------------------------------------------------------------------
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  const year = String(now.getFullYear());
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hour = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const timestamp = `${year}${month}${day}-${hour}${minutes}`;

  result.time = { year, month, day, hour, minutes, timestamp };

  // -----------------------------------------------------------------------
  // (g) Safety check: personal-dir-location NOT inside project-repo-location
  // -----------------------------------------------------------------------
  if (!personalDir || !projectRepo) {
    result.checks.isolation.status = "ERROR";
    result.checks.isolation.detail =
      "personal-dir-location or project-repo-location is empty.";
    result.status = "ERROR";
    result.errors.push(result.checks.isolation.detail);
  } else {
    const normPersonal = normForContains(personalDir);
    const normProject = normForContains(projectRepo);

    if (normPersonal.startsWith(normProject)) {
      result.checks.isolation.status = "ERROR";
      result.checks.isolation.detail = `personal-dir-location ("${personalDir}") is inside project-repo-location ("${projectRepo}"). They must be separate.`;
      result.status = "ERROR";
      result.errors.push(result.checks.isolation.detail);
    } else {
      result.checks.isolation.detail = "Directories are properly isolated.";
    }
  }

  // -----------------------------------------------------------------------
  // (h-k) Derive folder name and ensure directories
  // -----------------------------------------------------------------------
  const folderName = deriveFolderName(itemId);
  result.folderName = folderName;

  const outputDir = resolve(personalDir, "notes", year, month, folderName);
  result.outputDir = outputDir;

  if (result.status !== "ERROR") {
    try {
      mkdirSync(outputDir, { recursive: true });
      if (existsSync(outputDir)) {
        result.checks.directory.detail = `Output directory ready: "${outputDir}".`;
      } else {
        result.checks.directory.status = "ERROR";
        result.checks.directory.detail = `Failed to create output directory: "${outputDir}".`;
        result.status = "ERROR";
        result.errors.push(result.checks.directory.detail);
      }
    } catch (err) {
      result.checks.directory.status = "ERROR";
      result.checks.directory.detail = `Error creating directory "${outputDir}": ${err.message}`;
      result.status = "ERROR";
      result.errors.push(result.checks.directory.detail);
    }
  }

  // -----------------------------------------------------------------------
  // Build message
  // -----------------------------------------------------------------------
  if (result.errors.length > 0) {
    result.message = result.errors.join(" ");
  } else {
    result.message = `Timestamp ${timestamp}, output dir "${outputDir}".`;
  }

  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
