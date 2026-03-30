### How to Use the "Rock'em Sock'em" Skill

Fetch, evaluate, and resolve PR review comments in one run.

```
/rockem-sockem [--item-id:value] [--handle:value] [--quiet[:false|true|force]] [--private[:bool]] [--unanswered[:bool]] [--git-user-email:value] [--git-user-name:value]
```

| Param | Type | Default | What it does |
|-------|------|---------|--------------|
| `--item-id` | string | *(prompted)* | Work item ID (e.g., `20525`) |
| `--handle` | string | *(config)* | Developer handle for branch matching; `_` skips filtering |
| `--quiet` | `false` \| `true` \| `force` | `false` | `false`: normal. `true`: skip skill confirmations. `force`: skip all interruptions. |
| `--private` | bool | `false` | Skip posting replies to GitHub |
| `--unanswered` | bool | `false` | Include resolved-but-unanswered comments |
| `--git-user-email` | string | *(config)* | Override git email check; `_` skips |
| `--git-user-name` | string | *(config)* | Override git name check; `_` skips |

Booleans: `--quiet` = true, `--quiet:true` = true, `--quiet:false` = false, `--quiet:force` = force (max automation).
Omitted params use defaults from `config.json` > `"defaults"`.

**Identity parameters** (`--handle`, `--git-user-email`, `--git-user-name`) fall back to the corresponding top-level config key (`handle`, `git-user-email`, `git-user-name`) rather than the `defaults` object. They are never prompted for.

**Examples:**
- `/rockem-sockem --item-id:20525 --quiet`
- `/rockem-sockem --item-id:20525 --private:true --unanswered:true`
- `/rockem-sockem --handle:_ --git-user-email:_` *(skip handle filtering and email check)*
- `/rockem-sockem` *(prompts for item-id, rest from config)*

**Pipeline:** Fetch > Evaluate > Formulate > Respond > Implement > Sanity Check > Glean > Finalize
