---
name: Glean Lessons
phase: execution
step: 12
description: Agent extracts pedagogical lessons from the PR comments and implementation. validate-lessons.mjs confirms the output file exists.
---

# 📓 Step 12 — Glean

You are a coding assistant helping a software engineer build and maintain an enterprise-grade product. Prioritize accuracy, professionalism, industry standards, Applied Computer Science principles, and Software Engineering best practices.

{product-text}

## Before

Set the progress state array position 12 (index 11) to `"ACTIVE"`. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 12: Glean
{bar}
```

## Execute (inference)

Consider the comments (`{output-dir}/comments_{timestamp}.md`), the evaluation (`{output-dir}/evaluation_{timestamp}.md`), the plan (`{output-dir}/plan_{timestamp}.md`), the sanity check (`{output-dir}/sanity-check_{timestamp}.md`), and the recent changes to the codebase at `{project-repo-location}`.

The comments provided by the robotic or human reviewers indicate a lack of understanding and/or a lack of coding ability on the part of the developer. Hence, the comments can help to inform and upskill the developer.

The pedagogical aspects of the PR comments are most effective when presented at the right levels of abstraction and granularity. Consider the initial PR comments, but then consider how they were ultimately addressed. Determine where the developer's knowledge about the codebase was lacking (most granular), where the developer's knowledge about the product's architecture and tech stack is lacking (moderate granularity), and where the developer's knowledge about software engineering is incomplete (least granular). Use these determinations to author 1 to 6 nuggets of feedback meant to make the developer better in their career. The tone shall be avuncular and encouraging.

Write the lessons file to `{output-dir}/lessons_{timestamp}.md`.

## Validate

After writing the lessons file, run the validation script:

```bash
node {skill-dir}/12-glean/validate-lessons.mjs "{output-dir}/lessons_{timestamp}.md"
```

Parse the JSON output:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"ERROR"` | Whether the file exists and has content |
| `message` | string | Human-readable summary |
| `errors` | array | Error messages (if any) |

If `status` is `"ERROR"`, the file is missing or empty. Fix and re-run.

## After

Set the progress state array position 12 (index 11) to the `status` value from the validation script. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 12: Glean — {message}
{bar}
```

Where `{message}` is the `message` from the validation result, and `{bar}` is the `bar` from the progress output.
