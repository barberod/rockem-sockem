---
name: Evaluate Comments
phase: execution
step: 7
description: scaffold-evaluation.mjs builds the evaluation file with verbatim sections pre-filled. Agent replaces each {RESPONSE} placeholder with a grade and analysis. validate-evaluation.mjs confirms the output.
---

# 📊 Step 7 — Evaluate

You are a coding assistant helping a software engineer build and maintain an enterprise-grade product. Prioritize accuracy, professionalism, industry standards, Applied Computer Science principles, and Software Engineering best practices.

{product-text}

## Before

Set the progress state array position 7 (index 6) to `"ACTIVE"`. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 7: Evaluate
{bar}
```

## Scaffold

Run the scaffold script to generate the evaluation file with all verbatim sections pre-filled:

```bash
node {skill-dir}/07-evaluate/scaffold-evaluation.mjs "{output-dir}/comments_{timestamp}.md" "{output-dir}" "{timestamp}" "{pr-number}" "{pr-title}" "{designated-branch}" "{respondent}"
```

**Determining `{respondent}`:** Use your own name (e.g., "Claude", "Copilot", "Gemini"). If uncertain, use "AI Assistant".

Parse the JSON output:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"ERROR"` | Whether the scaffold was created |
| `message` | string | Human-readable summary |
| `scaffoldFile` | string | Path to the generated evaluation file |
| `commentCount` | number | Number of comments scaffolded |
| `errors` | array | Error messages (if any) |

If `status` is `"ERROR"`, stop and display the message.

The scaffold file contains the full evaluation structure for each comment — Author, Location, Diffs Snippet, Comment Body, and Respondent are already filled in verbatim from the comments file. Each comment has a `{RESPONSE}` placeholder where the agent's grade and analysis must go.

## Execute (inference)

Open `{output-dir}/evaluation_{timestamp}.md`. For each `{RESPONSE}` placeholder:

1. Read the comment's body and diffs snippet.
2. Consider the recommendation in the larger context of the codebase at `{project-repo-location}`. Factor in team standards, industry standards, and evident project conventions.
3. Replace `{RESPONSE}` with a code block containing the grade and analysis:

```plaintext
Grade: {A+ through F-}

{Analysis and rationale}

Recommendation: {Accept | Reject | Amend}, {details}
```

**Do not modify** the Author, Location, Diffs Snippet, Comment Body, or Respondent sections — they are already correct.

## Validate

After replacing all `{RESPONSE}` placeholders, run the validation script:

```bash
node {skill-dir}/07-evaluate/validate-evaluation.mjs "{output-dir}/evaluation_{timestamp}.md" "{commentCount}"
```

Where `{commentCount}` is from the scaffold result.

Parse the JSON output:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"WARNING"` \| `"ERROR"` | Validation result |
| `message` | string | Human-readable summary |
| `commentsFound` | number | Number of comment sections found |
| `grades` | array | List of grades found (e.g., `["A+", "B-"]`) |
| `hasAccepts` | boolean | Whether any comment was recommended Accept or Amend |
| `errors` | array | Structural errors (if any) |
| `warnings` | array | Structural warnings (if any) |

If `status` is `"ERROR"`, review the errors, fix the file, and re-run validation.

### If `hasAccepts` is `false`

All comments were rejected — there is nothing to implement or sanity-check. Steps 8 (Formulate) and 9 (Respond) still run (they document the rejections and post responses). But set steps 10–11 (Implement, Sanity Check) to `"SKIP"` in the progress state. After Step 9 completes, skip directly to Step 12 (Glean).

## After

Set the progress state array position 7 (index 6) to the `status` value from the validation script. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 7: Evaluate — {message}
{bar}
```

Where `{message}` is the `message` from the validation result, and `{bar}` is the `bar` from the progress output.
