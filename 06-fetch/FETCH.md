---
name: Fetch PR Comments
phase: execution
step: 6
description: Run fetch.mjs to retrieve unresolved (and optionally resolved-unanswered) PR review threads from GitHub, format them, and save the comments file. Agent only acts on edge cases.
---

# ⬇️ Step 6 — Fetch

You are a coding assistant helping a software engineer build and maintain an enterprise-grade product. Prioritize accuracy, professionalism, industry standards, Applied Computer Science principles, and Software Engineering best practices.

{product-text}

## Before

Set the progress state array position 6 (index 5) to `"ACTIVE"`. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 6: Fetch
{bar}
```

## Execute

Run the following command, substituting resolved values from previous steps:

```bash
node {skill-dir}/06-fetch/fetch.mjs "{project-repo-location}" "{pr-number}" "{unanswered}" "{output-dir}" "{timestamp}" "{designated-branch}" "{pr-title}"
```

Parse the JSON output. The result object has these fields:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"WARNING"` \| `"ERROR"` | Overall result |
| `message` | string | Human-readable summary |
| `commentCount` | number | Number of qualifying comments found |
| `outputFile` | string | Path to the written comments markdown file |
| `errors` | array | Error messages (if any) |

## Act on the result

### If `status` is `"ERROR"`

Stop. Display the `message` to the user. Do not continue.

### If `commentCount` is `0`

There are no comments to process. Set this step's status to `"OK"`. Set steps 7–13 (indices 6–12) to `"SKIP"` in the progress state. Render the final bar and display it. Inform the user there is nothing to do, then skip directly to Step 14 (Process Complete).

### If `status` is `"OK"` and `commentCount` > 0

The comments file has been written to `{output-dir}/comments_{timestamp}.md`. Store `outputFile` for reference in subsequent steps. Continue to Step 7.

## After

Set the progress state array position 6 (index 5) to the `status` value from the script result. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 6: Fetch — {message}
{bar}
```

Where `{message}` is the `message` from the script result, and `{bar}` is the `bar` from the progress output.
