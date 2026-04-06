---
name: Resolve Item ID
phase: setup
step: 3
description: Run resolve.mjs to validate item-id. Agent handles prompting if item-id was not provided.
---

# Step 3 — Resolve Item ID

## Before

Set the progress state array position 3 (index 2) to `"ACTIVE"`. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 3: Resolve Item ID
{bar}
```

## Execute

### If `item-id` from Step 1 is `"needs-prompt"`

Ask the user to provide an item-id. Once they respond, proceed to validation below.

### Validate the item-id

Run the following command with the item-id value (either from Step 1 params or from the user prompt):

```bash
node {skill-dir}/03-resolve/resolve.mjs "{item-id}"
```

Parse the JSON output. The result object has these fields:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"ERROR"` | Validation result |
| `message` | string | Human-readable summary |
| `itemId` | string | The item-id that was validated |
| `errors` | array | Specific validation failures (if any) |

## Act on the result

### If `status` is `"ERROR"`

Display the `message` to the user. Ask them to provide a corrected item-id. Run the validation script again with the new value. Repeat until validation passes.

### If `status` is `"OK"`

Store the validated `itemId` as the resolved `{item-id}` for use in all subsequent steps.

## After

Set the progress state array position 3 (index 2) to the `status` value from the script result. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 3: Resolve Item ID — {message}
{bar}
```

Where `{message}` is the `message` from the script result, and `{bar}` is the `bar` from the progress output.
