---
name: Formulate Plan
phase: execution
step: 8
description: Agent formulates a plan to address accepted comments. validate-plan.mjs confirms the output structure.
---

# 📐 Step 8 — Formulate

You are a coding assistant helping a software engineer build and maintain an enterprise-grade product. Prioritize accuracy, professionalism, industry standards, Applied Computer Science principles, and Software Engineering best practices.

{product-text}

## Before

Set the progress state array position 8 (index 7) to `"ACTIVE"`. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 8: Formulate
{bar}
```

## Execute (inference)

Read the evaluation file at `{output-dir}/evaluation_{timestamp}.md`.

Consider the evaluation results. For comments recommended to **Accept** or **Amend**, formulate a plan to make changes to the codebase at `{project-repo-location}` to correctly and comprehensively address them. For comments recommended to **Reject**, make no changes.

{guidance-text}

Write the plan file to `{output-dir}/plan_{timestamp}.md`.

Use whatever format best communicates the plan. If the plan requires adjustments during Step 10 (Implement), append the changes to `{output-dir}/plan_{timestamp}.md` — leave the original content in place for documentation.

## Validate

After writing the plan file, run the validation script:

```bash
node {skill-dir}/08-formulate/validate-plan.mjs "{output-dir}/plan_{timestamp}.md"
```

Parse the JSON output:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"ERROR"` | Whether the plan file exists and has content |
| `message` | string | Human-readable summary |
| `errors` | array | Error messages (if any) |

If `status` is `"ERROR"`, the plan file is missing or empty. Fix and re-run.

## After

Set the progress state array position 8 (index 7) to the `status` value from the validation script. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 8: Formulate — {message}
{bar}
```

Where `{message}` is the `message` from the validation result, and `{bar}` is the `bar` from the progress output.
