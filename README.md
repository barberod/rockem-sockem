# Rockem Sockem

A [Claude Code](https://claude.ai/code) skill that automates processing of PR review comments. It fetches comments from GitHub Copilot, Claude, or human reviewers, evaluates them, formulates a plan, posts responses, implements fixes, and commits the results -- all in one invocation.

## Pipeline

The skill runs 8 sequential phases:

| | Phase | What it does | Output |
|---|-------|-------------|--------|
| ⬇️ | **Fetch** | Pulls PR comments from GitHub (unresolved; +unanswered resolved if param set) | `comments_{timestamp}.md` |
| 📊 | **Evaluate** | Grades each comment (valid, nitpick, wrong, etc.) | `evaluation_{timestamp}.md` |
| 📐 | **Formulate** | Plans code changes for accepted comments | `plan_{timestamp}.md` |
| 💬 | **Respond** | Posts replies to each PR comment thread | GitHub PR comments |
| 🏗️ | **Implement** | Makes the code changes | Modified files in repo |
| 🤔 | **Sanity Check** | Verifies changes don't break anything | `sanity-check_{timestamp}.md` |
| 📓 | **Glean** | Extracts lessons learned for future reference | `lessons_{timestamp}.md` |
| 📦 | **Finalize** | Commits changes (does not push) | Git commits |

Markdown artifacts are saved to a personal notes directory outside the repo.

## Prerequisites

- [Claude Code](https://claude.ai/code) CLI or IDE extension
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
     "git-user-email": "you@example.com",
     "git-user-name": "Your Name",
     "developer-handle": "yourhandle"
   }
   ```

   | Key | Description |
   |-----|-------------|
   | `project-repo-location` | Local path to the repo you work in |
   | `personal-dir-location` | Path for notes/artifacts (must be outside the repo) |
   | `git-user-email` | Must match `git config user.email` in your repo |
   | `git-user-name` | Must match `git config user.name` in your repo |
   | `developer-handle` | Short handle that appears in your branch names (optional) |
   | `product-text` | Description of your product and tech stack |
   | `sanity-text` | Self-audit questions run after implementation |
   | `guidance-text` | Architectural rules and coding conventions |

   See `config.example.json` for the full template with all keys.

## Usage

```
/rockem-sockem [item-id] [quiet] [private] [unanswered]
```

All parameters are optional:

| Param | Effect |
|-------|--------|
| `item-id` | Skip the item ID prompt (e.g., `19739`) |
| `quiet` | Allow all edits without per-action confirmations |
| `private` | Skip posting comments to GitHub |
| `unanswered` | Also process resolved comments that received no reply |

**Examples:**
- `/rockem-sockem` — interactive, prompts for everything
- `/rockem-sockem 19739` — use item ID 19739
- `/rockem-sockem 19739 quiet` — fast mode, no confirmations
- `/rockem-sockem quiet private` — no confirmations, no GitHub comments
- `/rockem-sockem 19739 unanswered` — include unanswered resolved comments

When it finishes:
- Unless `private` was used, PR comment replies have been posted — **mark conversations as resolved** in GitHub
- Commits have been created locally — you still need to **push**

## How it works

Each phase is defined by a markdown file (`FETCH.md`, `EVALUATE.md`, etc.) that contains instructions Claude follows at runtime. `SKILL.md` is the orchestrator that ties them together. There is no compiled code -- the entire skill is structured prompts.

## License

MIT
