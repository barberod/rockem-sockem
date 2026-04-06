---
name: Set Time-Bound Variables and Ensure Directories
phase: setup
step: 5
description: Run timesetup.mjs to capture timestamps, validate directory isolation, derive folder name, and create output directories. Fully deterministic — no agent inference needed.
---

# Step 5 — Set Time-Bound Variables and Ensure Directories

## Before

Set the progress state array position 5 (index 4) to `"ACTIVE"`. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 5: Set Time-Bound Variables and Ensure Directories
{bar}
```

## Execute

Run the following command, substituting resolved values from previous steps:

```bash
node {skill-dir}/05-timesetup/timesetup.mjs "{personal-dir-location}" "{project-repo-location}" "{item-id}"
```

Parse the JSON output. The result object has these fields:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"OK"` \| `"ERROR"` | Overall result |
| `message` | string | Human-readable summary |
| `time.year` | string | 4-digit year (e.g., `"2026"`) |
| `time.month` | string | 2-digit month, zero-padded (e.g., `"04"`) |
| `time.day` | string | 2-digit day, zero-padded (e.g., `"06"`) |
| `time.hour` | string | 2-digit hour, 24h, zero-padded (e.g., `"14"`) |
| `time.minutes` | string | 2-digit minutes, zero-padded (e.g., `"07"`) |
| `time.timestamp` | string | `{year}{month}{day}-{hour}{minutes}` (e.g., `"20260406-1407"`) |
| `folderName` | string | Derived folder name from item-id |
| `outputDir` | string | Full path to the output directory (created by the script) |
| `checks.isolation` | object | Whether personal dir is outside project repo |
| `checks.directory` | object | Whether output directory was created successfully |
| `errors` | array | Error messages (if any) |

## Act on the result

### If `status` is `"ERROR"`

Stop. Display the `message` to the user. Do not continue.

### If `status` is `"OK"`

Store the following values for use in all subsequent steps. **These values are captured once and never refreshed mid-run.**

- `time.year` → `{year}`
- `time.month` → `{month}`
- `time.day` → `{day}`
- `time.hour` → `{hour}`
- `time.minutes` → `{minutes}`
- `time.timestamp` → `{timestamp}`
- `folderName` → `{folder-name}`
- `outputDir` → `{output-dir}`

## After

Set the progress state array position 5 (index 4) to the `status` value from the script result. Render the progress bar:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

Display to the user:

```
Step 5: Set Time-Bound Variables and Ensure Directories — {message}
{bar}
```

Where `{message}` is the `message` from the script result, and `{bar}` is the `bar` from the progress output.
