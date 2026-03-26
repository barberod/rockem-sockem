---
name: rockem-sockem
description: Automate the processing of comments on GitHub pull requests written by AI agents as well as human reviewers.
---

# Rockem Sockem

**When to use:** Invoke with `/rockem-sockem` to fetch, evaluate, grade, respond to, and implement fixes for unresolved PR review comments (from GitHub Copilot, Claude, or human reviewers) on a designated development branch.

**Usage:** `/rockem-sockem [item-id] [quiet]`

- If `item-id` is passed, Step 3 skips the prompt and uses it directly (still validated).
- If `quiet` is passed, the skill runs in quiet mode (see Step 4e below).
- Both can be combined: `/rockem-sockem 19739 quiet`

## Overview

This skill orchestrates an end-to-end pipeline for processing unresolved pull request comments. It walks through 8 sequential phases — each defined by its own frontmatter file in this skill directory — producing documentation artifacts in the developer's personal notes folder and making code changes + commits in the project repo.

The 8 phases: ⬇️ **Fetch** → 📊 **Evaluate** → 📐 **Formulate** → 💬 **Respond** → 🏗️ **Implement** → 🤔 **Sanity Check** → 📓 **Glean** → 📦 **Finalize**

---

## Instructions

### Step 1 — Load Configuration

Read `config.json` from this skill's directory. This file defines:

| Key | Description |
|-----|-------------|
| `project-repo-location` | Local path to the main codebase repo |
| `personal-dir-location` | Local path to the developer's personal files (outside the repo) |
| `git-user-email` | Developer's git email |
| `git-user-name` | Developer's git name |
| `developer-handle` | Short handle used in branch names |
| `product-text` | Description of your product (tech stack, architecture, frameworks) — injected into all phase files |
| `sanity-text` | Lettered self-audit questions run after implementation — injected into the SANITY CHECK phase |
| `guidance-text` | Architectural rules, coding conventions, and workflow constraints — injected into FORMULATE and IMPLEMENT phases |

If `config.json` is missing or unreadable, stop and alert the user.

### Step 2 — Check Requirements

Validate all of the following. If any check fails, notify the user with a clear explanation and prompt them to fix the issue and try again.

**(a)** `project-repo-location` exists and contains accessible git metadata (i.e., it is a git repository).

**(b)** `personal-dir-location` exists and is accessible.

**(c)** The git user email configured in the repo at `project-repo-location` matches `git-user-email` from config.

**(d)** The git user name configured in the repo at `project-repo-location` matches `git-user-name` from config.

**(e)** `developer-handle` is present. It may be empty — this is allowed, but branch matching in Step 4 will fall back to `item-id` only.

**(f)** All 8 frontmatter files exist in this skill directory and are non-empty:
- `FETCH.md`
- `EVALUATE.md`
- `FORMULATE.md`
- `RESPOND.md`
- `IMPLEMENT.md`
- `SANITYCHECK.md`
- `GLEAN.md`
- `FINALIZE.md`

### Step 3 — Prompt for Item ID

If `item-id` was passed as a parameter, use it. Otherwise, ask the user for an `item-id`. Either way, validate:

- Only letters, numbers, hyphens, and underscores allowed
- No spaces
- No punctuation besides hyphens and underscores
- No emoji
- Minimum 5 characters, maximum 24 characters

If validation fails, explain which rule failed and prompt again.

### Step 4 — Verify Branch and PR

**(a) Find the designated branch.** If `developer-handle` is non-empty, search for branches whose name contains **both** `developer-handle` and `item-id`. If `developer-handle` is empty, search for branches containing `item-id` only. If exactly one match exists, that is the "designated branch." If multiple matches exist, list them and ask the user to select one. If none exist, stop and alert the user. If `developer-handle` was empty and a single match was found, confirm the branch with the user before proceeding.

**(b) Confirm the designated branch is checked out.** If it is not the currently checked-out branch, stop and alert the user.

**(c) Confirm the branch is ready for edits.** The working tree must not have an in-progress merge, rebase, or other blocking state. If it does, stop and alert the user.

**(d) Find an open PR.** On GitHub, there must be an open Pull Request that merges the designated branch into `main`. Use:
```bash
gh pr list --state open --head "{designated-branch-name}" --json number,title,url
```
If no open PR exists, stop and alert the user.

**(e) Establish quiet mode.** If `quiet` was passed as a parameter, quiet mode is on. Otherwise, ask the user: "Allow all edits for this run?" If they confirm, quiet mode is on. If they decline (or do not respond affirmatively), quiet mode is off.

When quiet mode is **on**, the skill proceeds through all phases without pausing for confirmations — it will not ask the user to approve individual edits, file writes, or git operations. When quiet mode is **off**, the skill may pause to confirm significant actions with the user as it normally would.

### Step 5 — Set Time-Bound Variables and Ensure Directories

**(a-f) Capture time values once** (these are reused for the entire run, never refreshed mid-run):

| Placeholder | Format | Example |
|---|---|---|
| `{year}` | 4-digit year | `2026` |
| `{month}` | 2-digit month (zero-padded) | `03` |
| `{day}` | 2-digit day (zero-padded) | `26` |
| `{hour}` | 2-digit hour, 24h (zero-padded) | `14` |
| `{minutes}` | 2-digit minutes (zero-padded) | `07` |
| `{timestamp}` | `{year}{month}{day}-{hour}{minutes}` | `20260326-1407` |

**(g) Safety check:** Verify that `personal-dir-location` is NOT inside `project-repo-location`. If it is, stop and alert the user.

**(h-k) Ensure personal subdirectories exist.** Create the full path if any segment is missing:
```
{personal-dir-location}/notes/{year}/{month}/{item-id}/
```

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
| 6 | ⬇️ | Fetch | `FETCH.md` | `comments_{timestamp}.md` |
| 7 | 📊 | Evaluate | `EVALUATE.md` | `evaluation_{timestamp}.md` |
| 8 | 📐 | Formulate | `FORMULATE.md` | `plan_{timestamp}.md` |
| 9 | 💬 | Respond | `RESPOND.md` | Comments posted to GitHub PR |
| 10 | 🏗️ | Implement | `IMPLEMENT.md` | Code changes in the repo |
| 11 | 🤔 | Sanity Check | `SANITYCHECK.md` | `sanity-check_{timestamp}.md` |
| 12 | 📓 | Glean | `GLEAN.md` | `lessons_{timestamp}.md` |
| 13 | 📦 | Finalize | `FINALIZE.md` | Git commits (not pushed) |

All markdown output files are saved to: `{personal-dir-location}/notes/{year}/{month}/{item-id}/`

### Step 14 — Process Complete

The process is finished. Inform the user:

1. Responses have been posted to unresolved PR comment threads, but the user must still **manually mark each conversation as resolved** in GitHub.
2. New commits have been created on the designated branch, but the user must still **push** them.

All time-bound and run-scoped variables are now unset. A fresh `/rockem-sockem` invocation will set its own values.

---

## Important Notes

- **One-shot time values.** Time-bound variables are captured once at Step 5 and reused for the entire run. They are not refreshed mid-run.
- **Isolation.** `personal-dir-location` must never be inside `project-repo-location`. The skill checks this and stops if violated.
- **Fail-safe.** On any step failure, the skill stops and alerts the user rather than continuing with partial or incorrect work.
- **No attribution.** Per FINALIZE.md, git commits must not include "Co-Authored-By" or any agent attribution lines.
- **No push.** The skill creates commits but never pushes them. The user pushes manually.
