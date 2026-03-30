# ⬇️ FETCH

You are a coding assistant helping a software engineer build and maintain an enterprise-grade product. Accuracy is paramount. Professionalism is very important. Industry standards are crucial. Fundamental principles of Applied Computer Science matter. Best practices of Software Engineering are highly valued.

{product-text}

## Background Information

### Locations

#### Notes and Analysis

Work in the following directory: `{personal-dir-location}\notes\{year}\{month}\{folder-name}`. Also known as "the notes".

#### Codebase

The codebase for the pull request is in the following directory: `{project-repo-location}`. Also known as "the code".

## Task

Now, you will scan the Pull Request for comments to process.

**Default behavior:** Gather comments from unresolved conversations only.

**If `unanswered` mode is active:** Also gather comments from resolved conversations where the original reviewer comment received no reply. These are comments that were marked resolved without being addressed in the conversation thread. Tag each such comment with `[resolved-unanswered]` in the output so subsequent phases can distinguish them from unresolved comments.

## Elements

Create a markdown file containing these elements from qualifying comments (per the rules above).

- number (you will create this; auto-increment from 1)

- author (ie, Copilot, Claude, Bob Miller)

- file location
 -- lines where diffs snippet is located

- diffs snippet

- comment body

Omit the sentence "Copilot is powered by AI, so mistakes are possible. Review output carefully before use." as well as any similar statements.

### Example

An excellent example will be written in markdown and will look like this...

## Comment 1

### Author

Copilot

### Location

`src/Infrastructure/EntityConfiguration/OrderItemEntityTypeConfiguration.cs`, lines 1-5

### Diffs Snippet

```
using Domain.AggregatesModel.OrderAggregate;

namespace Infrastructure.EntityConfiguration;

public class OrderItemEntityTypeConfiguration : IEntityTypeConfiguration<OrderItem>
{
```

### Comment Body

This new file is missing the standard repository copyright header at the top. Please add the same header used by other entity configuration files in this folder.

---

## Output

Save a markdown file in the dir `{personal-dir-location}\notes\{year}\{month}\{folder-name}`. Name the file `comments_{timestamp}.md`.
