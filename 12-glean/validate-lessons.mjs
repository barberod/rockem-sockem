#!/usr/bin/env node

/**
 * 12-glean/validate-lessons.mjs
 *
 * Deterministic validation script for Step 12 (Glean).
 *
 * Checks that the lessons file exists and has content.
 *
 * Usage:
 *   node 12-glean/validate-lessons.mjs <lessons-file-path>
 *
 * Outputs JSON:
 * {
 *   "status": "OK" | "ERROR",
 *   "message": "...",
 *   "errors": []
 * }
 */

import { readFileSync, existsSync } from "fs";

function main() {
  const filePath = process.argv[2] || "";

  const result = {
    status: "OK",
    message: "",
    errors: [],
  };

  if (!filePath || !existsSync(filePath)) {
    result.status = "ERROR";
    result.errors.push(`Lessons file not found: "${filePath}".`);
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  const content = readFileSync(filePath, "utf-8").trim();

  if (content.length === 0) {
    result.status = "ERROR";
    result.errors.push("Lessons file is empty.");
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  result.message = "Lessons file exists and has content.";
  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
