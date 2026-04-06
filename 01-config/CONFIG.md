---
name: Load Configuration
phase: setup
step: 1
description: Run config.mjs to load config, read support files, and parse/resolve parameters. Agent handles prompting and help display only.
---

# Step 1 — Load Configuration

## Before

Set the progress state array position 1 (index 0) to `"ACTIVE"`. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 1: Load Configuration
{bar}
```

## Execute

Run the following command, substituting `{skill-dir}` with the absolute path to this skill's directory, and `{raw-args}` with the raw argument string the user passed to `/rockem-sockem` (may be empty):

```bash
node {skill-dir}/01-config/config.mjs {skill-dir} -- "{raw-args}"
```

Parse the JSON output. The result object has these fields:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"WARNING"` \| `"ERROR"` | Overall result of the config step |
| `message` | string | Human-readable summary |
| `config` | object | Parsed contents of config.json |
| `sanityText` | string | Content of the sanity check rules file |
| `sanitySource` | string | Which file was used (`SANITYCHECK-RULES.md` or `.example`) |
| `guidanceText` | string | Content of the guidance file |
| `guidanceSource` | string | Which file was used (`GUIDANCE.md` or `.example`) |
| `params` | object | Resolved parameters (values are strings, or `"needs-prompt"`) |
| `helpRequested` | boolean | True if `--help` was in the arguments |
| `errors` | array | Error messages (if any) |
| `warnings` | array | Warning messages (if any) |

## Act on the result

### If `status` is `"ERROR"`

Stop. Display the `message` to the user. Do not continue.

### If `helpRequested` is `true`

Read `HELP.md` from this skill directory and display its contents to the user. Then stop — do not continue with the rest of the skill.

### If `status` is `"OK"` or `"WARNING"`

Store the following values from the result for use in all subsequent steps:

- `config` → all config key-value pairs
- `sanityText` → set as `{sanity-text}` placeholder
- `guidanceText` → set as `{guidance-text}` placeholder
- All values in `params` → resolved parameter values

**Handle `"needs-prompt"` parameters.** For each parameter in `params` whose value is `"needs-prompt"`, ask the user for a value:

- `item-id`: Ask the user to provide an item-id. (This is expected when `--item-id` was not passed on the command line.)
- `quiet`: Ask the user: "Allow all edits for this run? (no / yes / force)". Map their answer: "no" → `"false"`, "yes" → `"true"`, "force" → `"force"`.
- `private`: Ask the user if they want private mode (no GitHub comments posted).
- `unanswered`: Ask the user if they want to include resolved-but-unanswered comments.

**Note:** `handle`, `user-mail`, and `user-name` will never be `"needs-prompt"` — they resolve from config or default to empty/null.

## After

Set the progress state array position 1 (index 0) to the `status` value from the script result. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 1: Load Configuration — {message}
{bar}
```

Where `{message}` is the `message` from the script result, and `{bar}` is the `bar` from the progress output.
