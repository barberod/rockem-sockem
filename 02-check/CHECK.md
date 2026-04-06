---
name: Check Requirements
phase: setup
step: 2
description: Run check.mjs to validate repo, personal directory, git credentials, and required skill files. Agent only acts on errors.
---

# Step 2 — Check Requirements

## Before

Set the progress state array position 2 (index 1) to `"ACTIVE"`. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 2: Check Requirements
{bar}
```

## Execute

Run the following command, substituting resolved values from Step 1:

```bash
node {skill-dir}/02-check/check.mjs {skill-dir} "{project-repo-location}" "{personal-dir-location}" "{user-mail}" "{user-name}" "{handle}"
```

**Argument notes:**
- `{user-mail}` and `{user-name}` come from the resolved `params` in Step 1. If null/unset, pass an empty string `""`.
- `{handle}` comes from the resolved `params` in Step 1. If empty, pass `""`.

Parse the JSON output. The result object has these fields:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"WARNING"` \| `"ERROR"` | Overall result of the check step |
| `message` | string | Human-readable summary |
| `checks` | array | Individual check results, each with `id`, `label`, `status`, `detail` |
| `errors` | array | Error messages (if any) |
| `warnings` | array | Warning messages (if any) |

## Act on the result

### If `status` is `"ERROR"`

Stop. Display the `message` to the user. List each failed check from `checks` where `status` is `"ERROR"`, showing the `detail`. Do not continue.

### If `status` is `"OK"` or `"WARNING"`

Continue to the next step. If there are warnings, display them to the user.

## After

Set the progress state array position 2 (index 1) to the `status` value from the script result. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 2: Check Requirements — {message}
{bar}
```

Where `{message}` is the `message` from the script result, and `{bar}` is the `bar` from the progress output.
