---
name: Respond to Comments
phase: execution
step: 9
description: Run respond.mjs to post evaluation replies to PR comment threads on GitHub. Fully deterministic — no agent inference needed. Skipped if --private is true.
---

# 💬 Step 9 — Respond

## Before

Set the progress state array position 9 (index 8) to `"ACTIVE"`. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 9: Respond
{bar}
```

## Execute

Run the following command, substituting resolved values from previous steps:

```bash
node {skill-dir}/09-respond/respond.mjs "{project-repo-location}" "{pr-number}" "{private}" "{output-dir}/comments_{timestamp}.md" "{output-dir}/evaluation_{timestamp}.md"
```

Parse the JSON output. The result object has these fields:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"WARNING"` \| `"ERROR"` \| `"SKIP"` | Overall result |
| `message` | string | Human-readable summary |
| `repliesPosted` | number | Number of replies successfully posted |
| `errors` | array | Error messages (if any) |
| `warnings` | array | Warning messages (if any) |

## Act on the result

### If `status` is `"SKIP"`

`--private` is `true`. No comments were posted. Continue to Step 10.

### If `status` is `"ERROR"`

Stop. Display the `message` to the user. Do not continue.

### If `status` is `"OK"` or `"WARNING"`

Replies have been posted. Continue to Step 10.

## After

Set the progress state array position 9 (index 8) to the `status` value from the script result. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 9: Respond — {message}
{bar}
```

Where `{message}` is the `message` from the script result, and `{bar}` is the `bar` from the progress output.
