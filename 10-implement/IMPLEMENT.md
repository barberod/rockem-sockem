---
name: Implement Changes
phase: execution
step: 10
description: Agent implements the plan by making code changes. verify-changes.mjs confirms something was changed.
---

# 🏗️ Step 10 — Implement

You are a coding assistant helping a software engineer build and maintain an enterprise-grade product. Prioritize accuracy, professionalism, industry standards, Applied Computer Science principles, and Software Engineering best practices.

{product-text}

## Before

Set the progress state array position 10 (index 9) to `"ACTIVE"`. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 10: Implement
{bar}
```

## Execute (inference)

Read the plan file at `{output-dir}/plan_{timestamp}.md`.

Implement the plan by making changes to the codebase at `{project-repo-location}`. Do not rush. Take all the time you need. If new discoveries during the coding session cause you to reconsider or reformulate the plan or its implementation, communicate with the user and append the changes to `{output-dir}/plan_{timestamp}.md`, leaving the original content in place for documentation.

{guidance-text}

## Verify

After making changes, run the verification script:

```bash
node {skill-dir}/10-implement/verify-changes.mjs "{project-repo-location}" "{hasAccepts}"
```

Where `{hasAccepts}` is the `hasAccepts` value from Step 7's validation result (`"true"` or `"false"`).

Parse the JSON output:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"SKIP"` \| `"ERROR"` | Whether changes were detected |
| `message` | string | Human-readable summary |
| `filesChanged` | number | Number of files with changes |
| `diffStat` | string | Git diff stat output |

If `status` is `"SKIP"`, all comments were rejected and no changes are expected.

If `status` is `"ERROR"`, accepted comments expected changes but none were made. Stop and alert the user.

## After

Set the progress state array position 10 (index 9) to the `status` value from the verification script. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 10: Implement — {message}
{bar}
```

Where `{message}` is the `message` from the verification result, and `{bar}` is the `bar` from the progress output.
