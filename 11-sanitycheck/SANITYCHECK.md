---
name: Sanity Check
phase: execution
step: 11
description: Agent reviews changes against sanity check questions and writes a prose reflection. validate-sanitycheck.mjs confirms the output file exists.
---

# 🤔 Step 11 — Sanity Check

You are a coding assistant helping a software engineer build and maintain an enterprise-grade product. Prioritize accuracy, professionalism, industry standards, Applied Computer Science principles, and Software Engineering best practices.

{product-text}

## Before

Set the progress state array position 11 (index 10) to `"ACTIVE"`. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 11: Sanity Check
{bar}
```

## Execute (inference)

Consider the comments (`{output-dir}/comments_{timestamp}.md`), the evaluation (`{output-dir}/evaluation_{timestamp}.md`), the plan (`{output-dir}/plan_{timestamp}.md`), and the recent changes to the codebase at `{project-repo-location}` (which are probably still unstaged).

Then, be sure you can confidently answer "No" to each of the following questions:

{sanity-text}

### "Go" or "No Go"

**"No Go":** If you cannot confidently answer "No" to any question, return to Step 10 (Implement) and continue to work on the codebase. Communicate with the user. If you adjust the plan, append the changes to `{output-dir}/plan_{timestamp}.md`, leaving the original content in place.

**"Go":** Write the sanity check file to `{output-dir}/sanity-check_{timestamp}.md`.

The sanity check file is a short reflection on the questions. Fully prosaic. No bullets. No emoji. No bold or italic formatting. No subsections or subheaders. No links. Length: 10 to 250 words.

## Validate

After writing the sanity check file, run the validation script:

```bash
node {skill-dir}/11-sanitycheck/validate-sanitycheck.mjs "{output-dir}/sanity-check_{timestamp}.md"
```

Parse the JSON output:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"ERROR"` | Whether the file exists and has content |
| `message` | string | Human-readable summary |
| `errors` | array | Error messages (if any) |

If `status` is `"ERROR"`, the file is missing or empty. Fix and re-run.

## After

Set the progress state array position 11 (index 10) to the `status` value from the validation script. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 11: Sanity Check — {message}
{bar}
```

Where `{message}` is the `message` from the validation result, and `{bar}` is the `bar` from the progress output.
