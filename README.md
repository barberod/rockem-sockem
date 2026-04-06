# Rockem Sockem

A [Claude Code](https://claude.ai/code) skill that automates processing of PR review comments. It fetches comments from GitHub Copilot, Claude, Gemini, or human reviewers, evaluates them, formulates a plan, posts responses, implements fixes, and commits the results -- all in one invocation.

## Pipeline

The skill runs 14 steps: 5 setup steps, 8 sequential phases, and a completion step. Every step has at least one deterministic Node.js script. Steps that require judgment (evaluating comments, writing plans, implementing code) use inference for the creative work and scripts for validation.

### Setup (Steps 1–5) — Fully Deterministic

The agent executes a script, reads the JSON result, and acts on it. No inference needed for validation, parsing, or file I/O.

| Step | Folder | Script | Description |
|------|--------|--------|-------------|
| 1 | `01-config/` | `config.mjs` | Load `config.json`, read sanity-check rules and guidance files, parse and resolve named parameters |
| 2 | `02-check/` | `check.mjs` | Validate repo exists, personal directory accessible, git credentials match, required skill files present |
| 3 | `03-resolve/` | `resolve.mjs` | Validate item-id format (length, allowed characters, no emoji) |
| 4 | `04-branch/` | `branch.mjs` | Find designated branch, verify checkout, check for blocking state, locate open PR |
| 5 | `05-timesetup/` | `timesetup.mjs` | Capture timestamps, validate directory isolation, derive folder name, create output directories |

### Phases (Steps 6–13) — Deterministic + Inference

Each phase has a markdown file (agent instructions) and one or more scripts (deterministic work or validation). The split varies by phase:

| Step | | Phase | Scripts | What's deterministic | What needs inference |
|------|-|-------|---------|---------------------|---------------------|
| 6 | ⬇️ | **Fetch** | `fetch.mjs` | Everything: GitHub query, thread filtering, markdown formatting | Nothing |
| 7 | 📊 | **Evaluate** | `scaffold-evaluation.mjs`, `validate-evaluation.mjs` | Scaffold (copies verbatim sections), validation (checks grades/structure) | Grading and analysis (fills `{RESPONSE}` placeholders) |
| 8 | 📐 | **Formulate** | `validate-plan.mjs` | Validation (file exists) | Plan writing |
| 9 | 💬 | **Respond** | `respond.mjs` | Everything: parses evaluation, posts replies via GitHub API | Nothing |
| 10 | 🏗️ | **Implement** | `verify-changes.mjs` | Verification (git diff check, hasAccepts-aware) | Code changes |
| 11 | 🤔 | **Sanity Check** | `validate-sanitycheck.mjs` | Validation (file exists) | Go/No-Go judgment and prose reflection |
| 12 | 📓 | **Glean** | `validate-lessons.mjs` | Validation (file exists) | Lesson extraction |
| 13 | 📦 | **Finalize** | `verify-commits.mjs` | Verification (commits exist, no attribution) | Commit grouping and messages |

Markdown artifacts are saved to a personal notes directory outside the repo.

### Step 14 — Completion

Reports status and reminds the user to mark conversations as resolved in GitHub and push commits.

## Architecture

Each step lives in its own numbered subfolder (`01-config/`, `02-check/`, etc.) containing:
- A **markdown file** (agent instructions: Before/Execute/Validate/Act/After)
- One or more **`.mjs` scripts** (deterministic logic: validation, data gathering, verification)

A shared `progress.mjs` utility renders a 13-emoji progress bar (`🟩🟩🟣⬛⬛...`) that updates before and after each step, showing success, warnings, errors, skips, and active status at a glance.

## Prerequisites

- [Claude Code](https://claude.ai/code) CLI, IDE extension, or compatible AI coding agent
- [Node.js](https://nodejs.org/) (for deterministic scripts)
- [GitHub CLI](https://cli.github.com/) (`gh`) authenticated
- A git repo with an open PR targeting `main`
- The PR's branch checked out locally with a clean working tree

## Install

1. Copy this directory into your Claude Code skills folder:
   ```
   ~/.claude/skills/rockem-sockem/
   ```

2. Copy the example config and fill in your values:
   ```bash
   cp config.example.json config.json
   ```

3. Edit `config.json`:
   ```json
   {
     "project-repo-location": "C:\\path\\to\\your\\project-repo",
     "personal-dir-location": "C:\\path\\to\\your\\personal-notes",
     "user-mail": "you@example.com",
     "user-name": "Your Name",
     "handle": "yourhandle",
     "product-text": "Description of your product and tech stack",
     "defaults": {
       "quiet": false,
       "private": false,
       "unanswered": false
     }
   }
   ```

   | Key | Description |
   |-----|-------------|
   | `project-repo-location` | Local path to the repo you work in |
   | `personal-dir-location` | Path for notes/artifacts (must be outside the repo) |
   | `user-mail` | Must match `git config user.email` in your repo (or `_` to skip check; overridable via `--user-mail` param) |
   | `user-name` | Must match `git config user.name` in your repo (or `_` to skip check; overridable via `--user-name` param) |
   | `handle` | Short handle that appears in your branch names (optional; `_` to skip filtering; overridable via `--handle` param) |
   | `product-text` | Description of your product and tech stack -- injected into phase instructions |
   | `defaults` | Default values for parameters (see Usage below) |

   See `config.example.json` for the full template with all keys.

4. Set up sanity check rules:
   ```bash
   cp SANITYCHECK-RULES.md.example SANITYCHECK-RULES.md
   ```
   Customize the lettered self-audit questions to match your project's standards. This file is **required**.

5. Set up guidance:
   ```bash
   cp GUIDANCE.md.example GUIDANCE.md
   ```
   Add your architectural rules, coding conventions, and workflow constraints. This file is **required**.

## Usage

```
/rockem-sockem [--item-id:value] [--handle:value] [--quiet[:false|true|force]] [--private[:bool]] [--unanswered[:bool]] [--user-mail:value] [--user-name:value]
```

> **Tip:** Pass `--help` for a quick-reference card with all parameters, defaults, and examples.

Parameters use `--name:value` syntax, in any order. Booleans accept `--name`, `--name:true`, or `--name:false`. The `--quiet` parameter also accepts `--quiet:force` for maximum automation. Omitted parameters fall back to config defaults.

| Param | Type | Config Default | Effect |
|-------|------|----------------|--------|
| `--item-id` | string | *(none -- prompted)* | Work item identifier (e.g., `20525`) |
| `--handle` | string | *(config `handle` key)* | Developer handle for branch matching; `_` skips filtering |
| `--quiet` | `false` \| `true` \| `force` | `false` | `false`: pause for confirmations. `true`: skip skill confirmations. `force`: skip all interruptions including tool approvals. |
| `--private` | bool | `false` | Skip posting comments to GitHub |
| `--unanswered` | bool | `false` | Also process resolved unanswered comments |
| `--user-mail` | string | *(config `user-mail` key)* | Override git email check; `_` skips |
| `--user-name` | string | *(config `user-name` key)* | Override git name check; `_` skips |

Identity parameters (`--handle`, `--user-mail`, `--user-name`) fall back to the corresponding top-level config key rather than the `defaults` object. They are never prompted for.

**Examples:**
- `/rockem-sockem` — prompts for item-id, uses config defaults for the rest
- `/rockem-sockem --item-id:19739` — use item ID 19739, config defaults for the rest
- `/rockem-sockem --item-id:19739 --quiet` — fast mode, no confirmations
- `/rockem-sockem --item-id:19739 --private:true --unanswered:true` — no GitHub comments, include unanswered
- `/rockem-sockem --item-id:19739 --quiet:false` — override a config default of quiet=true
- `/rockem-sockem --handle:_ --user-mail:_` — skip handle filtering and email check

When it finishes:
- Unless `--private` resolved to `true`, PR comment replies have been posted — **mark conversations as resolved** in GitHub
- Commits have been created locally — you still need to **push**

## Directory Structure

```
rockem-sockem/
├── SKILL.md                        # Orchestrator -- ties all steps together
├── progress.mjs                    # Shared utility for emoji progress bar
├── config.json                     # User config (gitignored)
├── config.example.json             # Config template
├── GUIDANCE.md                     # Architectural guidance (gitignored)
├── GUIDANCE.md.example             # Guidance template
├── SANITYCHECK-RULES.md            # Sanity check rules (gitignored)
├── SANITYCHECK-RULES.md.example    # Sanity check template
├── HELP.md                         # Quick reference (shown on --help)
├── README.md                       # This file
│
├── 01-config/                      # Step 1: Load Configuration
│   ├── CONFIG.md
│   └── config.mjs
├── 02-check/                       # Step 2: Check Requirements
│   ├── CHECK.md
│   └── check.mjs
├── 03-resolve/                     # Step 3: Resolve Item ID
│   ├── RESOLVE.md
│   └── resolve.mjs
├── 04-branch/                      # Step 4: Verify Branch and PR
│   ├── BRANCH.md
│   └── branch.mjs
├── 05-timesetup/                   # Step 5: Set Timestamps and Directories
│   ├── TIMESETUP.md
│   └── timesetup.mjs
│
├── 06-fetch/                       # Step 6: Fetch PR Comments
│   ├── FETCH.md
│   └── fetch.mjs
├── 07-evaluate/                    # Step 7: Evaluate Comments
│   ├── EVALUATE.md
│   ├── scaffold-evaluation.mjs
│   └── validate-evaluation.mjs
├── 08-formulate/                   # Step 8: Formulate Plan
│   ├── FORMULATE.md
│   └── validate-plan.mjs
├── 09-respond/                     # Step 9: Respond to Comments
│   ├── RESPOND.md
│   └── respond.mjs
├── 10-implement/                   # Step 10: Implement Changes
│   ├── IMPLEMENT.md
│   └── verify-changes.mjs
├── 11-sanitycheck/                 # Step 11: Sanity Check
│   ├── SANITYCHECK.md
│   └── validate-sanitycheck.mjs
├── 12-glean/                       # Step 12: Glean Lessons
│   ├── GLEAN.md
│   └── validate-lessons.mjs
└── 13-finalize/                    # Step 13: Finalize Commits
    ├── FINALIZE.md
    └── verify-commits.mjs
```

## Design Principles

- **Deterministic where possible.** Every step has at least one Node.js script. Setup steps are fully scripted. Phase steps use scripts for I/O, scaffolding, and validation while reserving inference for judgment calls.
- **Probabilistic where necessary.** Evaluating comment quality, formulating plans, writing code, and extracting lessons require judgment -- these remain LLM-driven.
- **Agent-agnostic.** The skill does not assume Claude. The respondent name, author detection, and instructions work with any AI coding agent.
- **Fail-safe.** On any step failure, the skill stops and alerts the user rather than continuing with partial work.
- **Skip-aware.** When a step has nothing to do (no comments, all rejected, private mode), it cleanly skips downstream steps rather than running them on empty data.
- **No push.** Commits are created locally but never pushed. The user pushes manually.
- **No attribution.** Git commits must not include "Co-Authored-By" or agent attribution lines. The verify-commits script enforces this deterministically.
- **Consistent output.** The progress bar, step messages, and file structures are deterministic, so the user sees largely the same output shape every run regardless of which agent runs the skill.

## License

MIT
