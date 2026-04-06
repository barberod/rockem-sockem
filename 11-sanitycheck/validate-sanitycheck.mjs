#!/usr/bin/env node

/**
 * 11-sanitycheck/validate-sanitycheck.mjs
 *
 * Deterministic validation script for Step 11 (Sanity Check).
 *
 * Checks that the sanity check file exists and has content.
 *
 * Usage:
 *   node 11-sanitycheck/validate-sanitycheck.mjs <sanity-check-file-path>
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
    result.errors.push(`Sanity check file not found: "${filePath}".`);
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  const content = readFileSync(filePath, "utf-8").trim();

  if (content.length === 0) {
    result.status = "ERROR";
    result.errors.push("Sanity check file is empty.");
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  result.message = "Sanity check file exists and has content.";
  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
