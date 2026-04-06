---
name: Verify Branch and PR
phase: setup
step: 4
description: Run branch.mjs to find the designated branch, verify checkout state, check for blocking operations, and locate the open PR. Agent handles branch selection, confirmation, and quiet-mode prompting.
---

# Step 4 — Verify Branch and PR

## Before

Set the progress state array position 4 (index 3) to `"ACTIVE"`. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 4: Verify Branch and PR
{bar}
```

## Execute

Run the following command, substituting resolved values from previous steps:

```bash
node {skill-dir}/04-branch/branch.mjs "{project-repo-location}" "{item-id}" "{handle}"
```

Parse the JSON output. The result object has these fields:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"WARNING"` \| `"ERROR"` | Overall result |
| `message` | string | Human-readable summary |
| `checks.branchSearch` | object | Branch search result with `matches` array and `designated` branch name |
| `checks.checkout` | object | Whether the designated branch is checked out, with `currentBranch` |
| `checks.workingTree` | object | Whether the tree has blocking state (merge, rebase, etc.) |
| `checks.openPR` | object | Open PR info with `pr` object (`number`, `title`, `url`) or null |
| `needsUserChoice` | boolean | True if multiple branches matched — agent must ask user to select |
| `needsUserConfirm` | boolean | True if handle was empty and one branch matched — agent should confirm |
| `errors` | array | Error messages |
| `warnings` | array | Warning messages |

## Act on the result

### If `needsUserChoice` is `true`

Multiple branches matched. Display the list from `checks.branchSearch.matches` and ask the user to select one. Then re-run the script with the selected branch as the fourth argument:

```bash
node {skill-dir}/04-branch/branch.mjs "{project-repo-location}" "{item-id}" "{handle}" "{selected-branch}"
```

Parse the new result and continue with the checks below.

### If `needsUserConfirm` is `true`

A single branch was found but handle was empty. Ask the user to confirm the designated branch. If they reject, stop. If they confirm, continue. (**Skip this confirmation if handle was `"_"`** — the script already accounts for this.)

### If `status` is `"ERROR"`

Stop. Display the `message` to the user. List each failed check, showing the `detail`. Do not continue.

### If `status` is `"OK"` or `"WARNING"`

Store the following values for use in subsequent steps:

- `checks.branchSearch.designated` → `{designated-branch}`
- `checks.openPR.pr.number` → `{pr-number}`
- `checks.openPR.pr.title` → `{pr-title}`
- `checks.openPR.pr.url` → `{pr-url}`

### Establish quiet mode

The `quiet` parameter was resolved in Step 1. If its value is `"needs-prompt"`, ask the user now:

> "Allow all edits for this run? (no / yes / force)"

Map their answer: `"no"` → `"false"`, `"yes"` → `"true"`, `"force"` → `"force"`.

The three levels are:

| Level | Behavior |
|-------|----------|
| `false` | **Normal.** The skill may pause to confirm significant actions. |
| `true` | **Quiet.** Skip skill-level confirmations. Runtime tool-permission prompts may still appear. |
| `force` | **Force.** Zero interruptions. Execute all commands without asking. Only stop on genuine errors. |

## After

Set the progress state array position 4 (index 3) to the `status` value from the script result. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 4: Verify Branch and PR — {message}
{bar}
```

Where `{message}` is the `message` from the script result, and `{bar}` is the `bar` from the progress output.
