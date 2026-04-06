#!/usr/bin/env node

/**
 * 07-evaluate/scaffold-evaluation.mjs
 *
 * Reads the comments file from Step 6 and generates a pre-filled evaluation
 * markdown file with all verbatim sections populated. The agent only needs
 * to replace each {RESPONSE} placeholder with its grade and analysis.
 *
 * Usage:
 *   node 07-evaluate/scaffold-evaluation.mjs <comments-file> <output-dir> <timestamp> <pr-number> <pr-title> <designated-branch> <respondent>
 *
 * Outputs JSON:
 * {
 *   "status": "OK" | "ERROR",
 *   "message": "...",
 *   "scaffoldFile": "...",
 *   "commentCount": 0,
 *   "errors": []
 * }
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Parser: extract structured comments from the comments markdown file
// ---------------------------------------------------------------------------

function parseComments(content) {
  const comments = [];
  // Split on ## Comment N headers
  const sections = content.split(/^## Comment \d+/m);
  // First section is the file header — skip it
  // Re-match to get the full header text (including tags like [resolved-unanswered])
  const headerMatches = [...content.matchAll(/^## (Comment \d+.*?)$/gm)];

  for (let i = 0; i < headerMatches.length; i++) {
    const header = headerMatches[i][1]; // e.g. "Comment 1" or "Comment 2 [resolved-unanswered]"
    const body = sections[i + 1] || "";

    const comment = {
      header,
      author: extractSection(body, "Author"),
      location: extractSection(body, "Location"),
      diffsSnippet: extractDiffsSnippet(body),
      commentBody: extractSection(body, "Comment Body"),
    };

    comments.push(comment);
  }

  return comments;
}

function extractSection(body, sectionName) {
  // Match from ### SectionName to the next ### or end
  const pattern = new RegExp(
    `### ${escapeRegex(sectionName)}\\s*\\n([\\s\\S]*?)(?=\\n### |\\n---|$)`,
    "m"
  );
  const match = body.match(pattern);
  if (!match) return "";
  return match[1].trim();
}

function extractDiffsSnippet(body) {
  // The diffs snippet is inside a code fence under ### Diffs Snippet
  const pattern = /### Diffs Snippet\s*\n\s*```[^\n]*\n([\s\S]*?)```/m;
  const match = body.match(pattern);
  if (!match) return "";
  return match[1].trimEnd();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const commentsFile = args[0] || "";
  const outputDir = args[1] || ".";
  const timestamp = args[2] || "00000000-0000";
  const prNumber = args[3] || "";
  const prTitle = args[4] || "";
  const designatedBranch = args[5] || "";
  const respondent = args[6] || "AI Assistant";

  const result = {
    status: "OK",
    message: "",
    scaffoldFile: "",
    commentCount: 0,
    errors: [],
  };

  // -----------------------------------------------------------------------
  // Read comments file
  // -----------------------------------------------------------------------
  if (!commentsFile || !existsSync(commentsFile)) {
    result.status = "ERROR";
    result.errors.push(`Comments file not found: "${commentsFile}".`);
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  const content = readFileSync(commentsFile, "utf-8");
  const comments = parseComments(content);

  if (comments.length === 0) {
    result.status = "ERROR";
    result.errors.push("No comments found in the comments file.");
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  // -----------------------------------------------------------------------
  // Build scaffold
  // -----------------------------------------------------------------------
  const lines = [];
  lines.push(`# Evaluation — ${timestamp}`);
  lines.push("");
  lines.push(`PR #${prNumber}: "${prTitle}"`);
  lines.push(`Branch: ${designatedBranch}`);
  lines.push("");
  lines.push("---");

  for (const comment of comments) {
    lines.push("");
    lines.push(`## ${comment.header}`);
    lines.push("");
    lines.push("### Author");
    lines.push("");
    lines.push(comment.author);
    lines.push("");
    lines.push("### Location");
    lines.push("");
    lines.push(comment.location);
    lines.push("");
    lines.push("### Diffs Snippet");
    lines.push("");
    lines.push("```");
    lines.push(comment.diffsSnippet);
    lines.push("```");
    lines.push("");
    lines.push("### Comment Body");
    lines.push("");
    lines.push(comment.commentBody);
    lines.push("");
    lines.push("### Respondent");
    lines.push("");
    lines.push(respondent);
    lines.push("");
    lines.push("### Response");
    lines.push("");
    lines.push("{RESPONSE}");
    lines.push("");
    lines.push("---");
  }

  // -----------------------------------------------------------------------
  // Write scaffold file
  // -----------------------------------------------------------------------
  const scaffoldFile = join(outputDir, `evaluation_${timestamp}.md`);
  try {
    writeFileSync(scaffoldFile, lines.join("\n") + "\n", "utf-8");
  } catch (err) {
    result.status = "ERROR";
    result.errors.push(`Failed to write scaffold file: ${err.message}`);
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  result.commentCount = comments.length;
  result.scaffoldFile = scaffoldFile;
  result.message = `Scaffold created with ${comments.length} comment(s). Replace each {RESPONSE} placeholder.`;

  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
