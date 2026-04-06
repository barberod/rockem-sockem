---
name: rockem-sockem
description: Automate the processing of comments on GitHub pull requests written by AI agents as well as human reviewers.
---

# Rockem Sockem

**When to use:** Invoke with `/rockem-sockem` to fetch, evaluate, grade, respond to, and implement fixes for PR review comments (from GitHub Copilot, Claude, or human reviewers) on a designated development branch. By default processes unresolved comments; with `--unanswered`, also includes resolved but unanswered comments.

**Usage:** `/rockem-sockem [--item-id:value] [--handle:value] [--quiet[:false|true|force]] [--private[:bool]] [--unanswered[:bool]] [--user-mail:value] [--user-name:value]`

- Parameters use `--name:value` syntax and may appear in **any order**.
- Boolean parameters accept `--name:true`, `--name:false`, or bare `--name` (shorthand for `--name:true`).
- The `--quiet` parameter additionally accepts `--quiet:force` for maximum automation (see Step 4e).
- Any parameter not provided on the command line falls back to the value in `config.json` under the `"defaults"` key. If no default exists, the user is prompted.
- `--item-id` has no config default and will always be prompted if not passed.
- Unrecognized parameter names are rejected with an error listing valid names.
- Bare positional arguments (no `--` prefix) are rejected with a message showing the correct named syntax.
- Pass `--help` to display a quick reference and exit.

**Examples:**
- `/rockem-sockem --item-id:20525 --quiet --private:true --unanswered:true`
- `/rockem-sockem --item-id:20525` — other params use config defaults
- `/rockem-sockem --item-id:20525 --quiet` — shorthand: quiet mode on
- `/rockem-sockem` — prompts for item-id, other params use config defaults

## Overview

This skill orchestrates an end-to-end pipeline for processing unresolved pull request comments. It walks through 8 sequential phases — each defined by its own frontmatter file in this skill directory — producing documentation artifacts in the developer's personal notes folder and making code changes + commits in the project repo.

The 8 phases: ⬇️ **Fetch** → 📊 **Evaluate** → 📐 **Formulate** → 💬 **Respond** → 🏗️ **Implement** → 🤔 **Sanity Check** → 📓 **Glean** → 📦 **Finalize**

---

## Progress Visualization

Throughout execution, maintain a **progress state** — a JSON array of 13 elements (one per step, positions 1–13 mapped to indices 0–12). Each element is one of:

| Value | Emoji | Meaning |
|-------|-------|---------|
| `"ERROR"` | 🟥 | Error — step failed |
| `"WARNING"` | 🟨 | Warning — step completed with warnings |
| `"OK"` | 🟩 | Success — step completed cleanly |
| `"SKIP"` | ⬜ | Intentionally skipped or not applicable |
| `"ACTIVE"` | 🟣 | Currently running |
| `null` | ⬛ | Not yet attempted |

Initialize the state at the start of the run:

```json
[null,null,null,null,null,null,null,null,null,null,null,null,null]
```

**Before each step**, set the step's position to `"ACTIVE"`, render the bar, and display the step name with the bar.
**After each step**, replace `"ACTIVE"` with the step's final status (`"OK"`, `"WARNING"`, `"ERROR"`, or `"SKIP"`), render the bar, and display the updated bar.

Use `progress.mjs` in this skill directory to render the bar deterministically:

```bash
node {skill-dir}/progress.mjs '<state-json>'
```

This outputs `{ "bar": "...", "state": [...] }`. Use the `bar` value for display.

**If a step uses multiple scripts**, compute the overall status deterministically:

```bash
node {skill-dir}/progress.mjs --worst '["OK","WARNING","OK"]'
```

This outputs `{ "status": "WARNING" }` — the most severe status wins. Severity order: ERROR > WARNING > OK.

---

## Instructions

### Steps 1–5 — Setup

Execute each setup step **in order**. For each step, read the corresponding file from this skill directory and execute the tasks it describes. If any step fails, stop and alert the user.

| Step | Setup File | Description |
|------|-----------|-------------|
| 1 | `01-config/CONFIG.md` | Load configuration, parse and resolve parameters |
| 2 | `02-check/CHECK.md` | Validate repo, directories, credentials, and required files |
| 3 | `03-resolve/RESOLVE.md` | Resolve and validate item-id |
| 4 | `04-branch/BRANCH.md` | Find designated branch, confirm checkout, locate PR, establish quiet mode |
| 5 | `05-timesetup/TIMESETUP.md` | Capture timestamps, validate directory isolation, create output directories |

### Steps 6–13 — Execute Frontmatter Phases

Execute each phase **in order**. For each phase:

1. Read the corresponding frontmatter file from this skill directory.
2. Replace all `{placeholders}` with their resolved values (from config, user input, and time variables).
3. Understand the tasks described in the file.
4. Execute the tasks accurately and comprehensively.
5. Produce and save any output files as mandated by the frontmatter file.

**If any phase encounters a problem that prevents 100% accurate execution, stop and alert the user.**

| Step | | Phase | Frontmatter File | Output |
|------|---|-------|------------------|--------|
| 6 | ⬇️ | Fetch | `06-fetch/FETCH.md` | `comments_{timestamp}.md` |
| 7 | 📊 | Evaluate | `07-evaluate/EVALUATE.md` | `evaluation_{timestamp}.md` |
| 8 | 📐 | Formulate | `08-formulate/FORMULATE.md` | `plan_{timestamp}.md` |
| 9 | 💬 | Respond | `09-respond/RESPOND.md` | Comments posted to GitHub PR *(skipped if `--private` resolved to `true`)* |
| 10 | 🏗️ | Implement | `10-implement/IMPLEMENT.md` | Code changes in the repo |
| 11 | 🤔 | Sanity Check | `11-sanitycheck/SANITYCHECK.md` | `sanity-check_{timestamp}.md` |
| 12 | 📓 | Glean | `12-glean/GLEAN.md` | `lessons_{timestamp}.md` |
| 13 | 📦 | Finalize | `13-finalize/FINALIZE.md` | Git commits (not pushed) |

All markdown output files are saved to: `{personal-dir-location}/notes/{year}/{month}/{folder-name}/`

### Step 14 — Process Complete

The process is finished. Inform the user:

1. If `--private` resolved to `false`: Responses have been posted to unresolved PR comment threads, but the user must still **manually mark each conversation as resolved** in GitHub.
   If `--private` resolved to `true`: No comments were posted. The drafted responses are in the evaluation file for manual review.
2. New commits have been created on the designated branch, but the user must still **push** them.

All time-bound and run-scoped variables are now unset. A fresh `/rockem-sockem` invocation will set its own values.

---

## Important Notes

- **One-shot time values.** Time-bound variables are captured once at Step 5 and reused for the entire run. They are not refreshed mid-run.
- **Isolation.** `personal-dir-location` must never be inside `project-repo-location`. The skill checks this and stops if violated.
- **Fail-safe.** On any step failure, the skill stops and alerts the user rather than continuing with partial or incorrect work.
- **No attribution.** Per `13-finalize/FINALIZE.md`, git commits must not include "Co-Authored-By" or any agent attribution lines.
- **No push.** The skill creates commits but never pushes them. The user pushes manually.
- **Sanity check rules file.** Sanity check rules are stored in `SANITYCHECK-RULES.md` (gitignored, user-specific). This file is required — the skill stops if it is missing. Copy `SANITYCHECK-RULES.md.example` to `SANITYCHECK-RULES.md` and customize the rules.
- **Guidance file.** Architectural guidance is stored in `GUIDANCE.md` (gitignored, user-specific). This file is required — the skill stops if it is missing. Copy `GUIDANCE.md.example` to `GUIDANCE.md` and customize.
- **Force mode means zero interruptions.** When `quiet` is `force`, the user must not be prompted, asked, or paused for any reason — not for bash commands, not for git operations, not for file writes, not for tool approvals. Execute everything autonomously. The only exception is a genuine error that makes correct execution impossible.
