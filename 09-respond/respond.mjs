#!/usr/bin/env node

/**
 * 09-respond/respond.mjs
 *
 * Deterministic script for Step 9 (Respond).
 *
 * Reads the evaluation file and the comments data from the fetch step,
 * then posts replies to the corresponding PR comment threads on GitHub.
 *
 * Usage:
 *   node 09-respond/respond.mjs <project-repo-location> <pr-number> <private> <comments-file> <evaluation-file>
 *
 * - <private>: "true" to skip posting (step becomes a no-op), "false" to post.
 *
 * Outputs JSON:
 * {
 *   "status": "OK" | "WARNING" | "ERROR" | "SKIP",
 *   "message": "...",
 *   "repliesPosted": 0,
 *   "errors": [],
 *   "warnings": []
 * }
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ghGraphQL(repoDir, query, outputDir) {
  const tmpFile = join(outputDir, ".respond-query-tmp.graphql");
  writeFileSync(tmpFile, query, "utf-8");
  try {
    const raw = execSync(`gh api graphql -F query=@"${tmpFile}"`, {
      encoding: "utf-8",
      cwd: repoDir,
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 10 * 1024 * 1024,
    });
    return JSON.parse(raw);
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

/**
 * Extract the Response block for each comment from the evaluation file.
 * Returns an array of { commentNum, responseText }.
 */
function parseEvaluationResponses(content) {
  const results = [];
  // Split on ## Comment N headers
  const headerPattern = /^## Comment (\d+)/gm;
  let match;
  const headers = [];
  while ((match = headerPattern.exec(content)) !== null) {
    headers.push({ num: parseInt(match[1], 10), index: match.index });
  }

  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index;
    const end = i + 1 < headers.length ? headers[i + 1].index : content.length;
    const section = content.slice(start, end);

    // Extract everything after ### Response
    const responseMatch = section.match(/### Response\s*\n([\s\S]*?)(?=\n---|\n## |$)/);
    if (responseMatch) {
      let responseText = responseMatch[1].trim();
      // Strip wrapping ```plaintext ... ``` if present
      const codeBlockMatch = responseText.match(/^```(?:plaintext)?\s*\n([\s\S]*?)\n```$/);
      if (codeBlockMatch) {
        responseText = codeBlockMatch[1].trim();
      }
      results.push({ commentNum: headers[i].num, responseText });
    }
  }

  return results;
}

/**
 * Get the database IDs of the first comment in each unresolved thread,
 * in the order they appear. These correspond to Comment 1, Comment 2, etc.
 * from the fetch step.
 */
function getUnresolvedThreadCommentIds(repoDir, prNumber, includeUnanswered, outputDir) {
  const repoInfo = execSync("gh repo view --json nameWithOwner -q .nameWithOwner", {
    encoding: "utf-8",
    cwd: repoDir,
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
  const [owner, repo] = repoInfo.split("/");

  const query = `
{
  repository(owner: "${owner}", name: "${repo}") {
    pullRequest(number: ${prNumber}) {
      reviewThreads(first: 100) {
        nodes {
          isResolved
          comments(first: 20) {
            nodes {
              databaseId
            }
          }
        }
      }
    }
  }
}`;

  const data = ghGraphQL(repoDir, query, outputDir);
  const threads = data?.data?.repository?.pullRequest?.reviewThreads?.nodes ?? [];

  const ids = [];
  for (const thread of threads) {
    const comments = thread.comments?.nodes ?? [];
    if (comments.length === 0) continue;

    if (!thread.isResolved) {
      ids.push(comments[0].databaseId);
    } else if (includeUnanswered && comments.length === 1) {
      ids.push(comments[0].databaseId);
    }
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const repoDir = args[0] || ".";
  const prNumber = args[1] || "";
  const isPrivate = (args[2] || "false").toLowerCase() === "true";
  const commentsFile = args[3] || "";
  const evaluationFile = args[4] || "";

  const result = {
    status: "OK",
    message: "",
    repliesPosted: 0,
    errors: [],
    warnings: [],
  };

  // -----------------------------------------------------------------------
  // Private mode — skip
  // -----------------------------------------------------------------------
  if (isPrivate) {
    result.status = "SKIP";
    result.message = "Private mode — no comments posted to GitHub.";
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  // -----------------------------------------------------------------------
  // Read evaluation file
  // -----------------------------------------------------------------------
  if (!evaluationFile || !existsSync(evaluationFile)) {
    result.status = "ERROR";
    result.errors.push(`Evaluation file not found: "${evaluationFile}".`);
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  const evalContent = readFileSync(evaluationFile, "utf-8");
  const responses = parseEvaluationResponses(evalContent);

  if (responses.length === 0) {
    result.status = "WARNING";
    result.message = "No responses found in evaluation file. Nothing to post.";
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  // -----------------------------------------------------------------------
  // Determine if unanswered mode was used (check comments file for tag)
  // -----------------------------------------------------------------------
  let includeUnanswered = false;
  if (commentsFile && existsSync(commentsFile)) {
    const commentsContent = readFileSync(commentsFile, "utf-8");
    includeUnanswered = commentsContent.includes("[resolved-unanswered]");
  }

  // -----------------------------------------------------------------------
  // Get thread comment IDs
  // -----------------------------------------------------------------------
  const outputDir = dirname(evaluationFile);
  let threadIds;
  try {
    threadIds = getUnresolvedThreadCommentIds(repoDir, prNumber, includeUnanswered, outputDir);
  } catch (err) {
    result.status = "ERROR";
    result.errors.push(`Failed to fetch thread IDs: ${err.message}`);
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  if (threadIds.length === 0) {
    result.status = "WARNING";
    result.message = "No unresolved threads found to reply to.";
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  // -----------------------------------------------------------------------
  // Post replies
  // -----------------------------------------------------------------------
  for (const response of responses) {
    const idx = response.commentNum - 1;
    if (idx < 0 || idx >= threadIds.length) {
      result.warnings.push(
        `Comment ${response.commentNum} has no matching thread (only ${threadIds.length} threads found). Skipped.`
      );
      continue;
    }

    const inReplyTo = threadIds[idx];
    const body = `**${response.responseText.match(/^Grade:\s*.+$/m)?.[0] || "Grade: N/A"}**\n\n${response.responseText.replace(/^Grade:\s*.+\n*/m, "").trim()}`;

    try {
      const repoInfo = execSync("gh repo view --json nameWithOwner -q .nameWithOwner", {
        encoding: "utf-8",
        cwd: repoDir,
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();

      // Write body to temp file to avoid shell quoting issues
      const tmpBody = join(outputDir, ".respond-body-tmp.md");
      writeFileSync(tmpBody, body, "utf-8");

      try {
        execSync(
          `gh api repos/${repoInfo}/pulls/${prNumber}/comments -X POST -F in_reply_to=${inReplyTo} -F body=@"${tmpBody}"`,
          {
            encoding: "utf-8",
            cwd: repoDir,
            stdio: ["pipe", "pipe", "pipe"],
          }
        );
        result.repliesPosted++;
      } finally {
        try { unlinkSync(tmpBody); } catch { /* ignore */ }
      }
    } catch (err) {
      result.errors.push(
        `Failed to post reply for Comment ${response.commentNum}: ${err.message}`
      );
    }
  }

  // -----------------------------------------------------------------------
  // Build result
  // -----------------------------------------------------------------------
  if (result.errors.length > 0) {
    result.status = "ERROR";
  } else if (result.warnings.length > 0) {
    result.status = "WARNING";
  }

  const parts = [];
  if (result.errors.length > 0) parts.push(...result.errors);
  if (result.warnings.length > 0) parts.push(...result.warnings);
  if (parts.length === 0) {
    parts.push(`${result.repliesPosted} reply/replies posted to PR #${prNumber}.`);
  }
  result.message = parts.join(" ");

  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
