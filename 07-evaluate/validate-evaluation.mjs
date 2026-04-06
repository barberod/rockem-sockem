#!/usr/bin/env node

/**
 * 07-evaluate/validate-evaluation.mjs
 *
 * Deterministic validation script for Step 7 (Evaluate).
 *
 * The agent writes the evaluation file using inference.
 * This script validates the output meets structural requirements.
 *
 * Usage:
 *   node 07-evaluate/validate-evaluation.mjs <evaluation-file-path> <expected-comment-count>
 *
 * Outputs JSON:
 * {
 *   "status": "OK" | "WARNING" | "ERROR",
 *   "message": "...",
 *   "commentsFound": 3,
 *   "grades": ["A+", "B-", "C"],
 *   "hasAccepts": true,
 *   "errors": [],
 *   "warnings": []
 * }
 */

import { readFileSync, existsSync } from "fs";

function main() {
  const args = process.argv.slice(2);
  const filePath = args[0] || "";
  const expectedCount = parseInt(args[1] || "0", 10);

  const result = {
    status: "OK",
    message: "",
    commentsFound: 0,
    grades: [],
    hasAccepts: false,
    errors: [],
    warnings: [],
  };

  // -----------------------------------------------------------------------
  // Check file exists
  // -----------------------------------------------------------------------
  if (!filePath || !existsSync(filePath)) {
    result.status = "ERROR";
    result.errors.push(`Evaluation file not found: "${filePath}".`);
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  const content = readFileSync(filePath, "utf-8");

  // -----------------------------------------------------------------------
  // Count comment sections
  // -----------------------------------------------------------------------
  const commentHeaders = content.match(/^## Comment \d+/gm) || [];
  result.commentsFound = commentHeaders.length;

  if (result.commentsFound === 0) {
    result.status = "ERROR";
    result.errors.push("No comment sections found in the evaluation file.");
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  if (expectedCount > 0 && result.commentsFound !== expectedCount) {
    result.status = "WARNING";
    result.warnings.push(
      `Expected ${expectedCount} comment(s) but found ${result.commentsFound} in evaluation.`
    );
  }

  // -----------------------------------------------------------------------
  // Check for grades
  // -----------------------------------------------------------------------
  const gradePattern = /Grade:\s*([A-F][+-]?)/gi;
  let match;
  while ((match = gradePattern.exec(content)) !== null) {
    result.grades.push(match[1].toUpperCase());
  }

  if (result.grades.length === 0) {
    result.status = "ERROR";
    result.errors.push("No grades found in the evaluation file. Each comment must include a grade (e.g., 'Grade: A-').");
  } else if (result.grades.length < result.commentsFound) {
    result.status = "WARNING";
    result.warnings.push(
      `Found ${result.grades.length} grade(s) for ${result.commentsFound} comment(s). Some comments may be missing grades.`
    );
  }

  // -----------------------------------------------------------------------
  // Check for required sections per comment
  // -----------------------------------------------------------------------
  const requiredSections = ["### Author", "### Location", "### Response"];
  for (const section of requiredSections) {
    const sectionCount = (content.match(new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "gm")) || []).length;
    if (sectionCount < result.commentsFound) {
      result.status = "WARNING";
      result.warnings.push(
        `Only ${sectionCount} "${section}" section(s) found for ${result.commentsFound} comment(s).`
      );
    }
  }

  // -----------------------------------------------------------------------
  // Check for accept/amend recommendations
  // -----------------------------------------------------------------------
  const acceptPattern = /Recommendation:\s*(Accept|Amend)/gi;
  result.hasAccepts = acceptPattern.test(content);

  // -----------------------------------------------------------------------
  // Build message
  // -----------------------------------------------------------------------
  const parts = [];
  if (result.errors.length > 0) parts.push(...result.errors);
  if (result.warnings.length > 0) parts.push(...result.warnings);
  if (parts.length === 0) {
    const gradesSummary = result.grades.join(", ");
    parts.push(
      `${result.commentsFound} comment(s) evaluated. Grades: ${gradesSummary}.`
    );
  }
  result.message = parts.join(" ");

  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
