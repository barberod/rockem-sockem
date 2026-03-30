### 🤖 How to Use the "Rock'em Sock'em" Skill

Fetch, evaluate, and resolve PR review comments in one run.

```
/rockem-sockem [--item-id:value] [--quiet[:bool]] [--private[:bool]] [--unanswered[:bool]]
```

| Param | Type | Default | What it does |
|-------|------|---------|--------------|
| `--item-id` | string | *(prompted)* | Work item ID (e.g., `20525`) |
| `--quiet` | bool | `false` | Skip per-action confirmations |
| `--private` | bool | `false` | Skip posting replies to GitHub |
| `--unanswered` | bool | `false` | Include resolved-but-unanswered comments |


Booleans: `--quiet` = true, `--quiet:true` = true, `--quiet:false` = false.
Omitted params use defaults from `config.json` > `"defaults"`.

**Examples:**
- `/rockem-sockem --item-id:20525 --quiet`
- `/rockem-sockem --item-id:20525 --private:true --unanswered:true`
- `/rockem-sockem` *(prompts for item-id, rest from config)*

**Pipeline:** Fetch > Evaluate > Formulate > Respond > Implement > Sanity Check > Glean > Finalize
