---
description: "Step 5 (review): GPT Codex does, Opus reviews"
argument-hint: <feature-name> <repo-path>
---

# Step 5 - review: GPT Codex does, Opus reviews

This is a holistic, adversarial whole-change pass. It is distinct from Step 4, which gates each
build slice.

Invoke as `/gate5-review <feature-name> <repo-path>`.

**Doer = GPT Codex, read-only.** Run this from the pipeline root:

```bash
codex exec --sandbox read-only "$(cat .ai/prompts/reviewer.md)
You are GPT Codex, the doer for the REVIEW step of $1. Perform one holistic adversarial pass over the whole change. First run 'git -C $2 --no-pager diff' and 'git -C $2 status'. Review the full change against .ai/tasks/$1.md, .ai/think/$1.md, .ai/plans/$1-plan.md, and .ai/design/$1-design.md. Hunt what per-slice gates miss: cross-cutting regressions, state bugs, resource leaks, security, privacy leaks, swallowed failures, accessibility failures, and unmet acceptance criteria. Cite file:line. You are read-only and must NEVER edit any file. Output findings as a verdict EXACTLY as the charter specifies (Reviewer: GPT Codex, Step: review)."
```

Save GPT Codex's verdict block to `.ai/reviews/$1/05-review-pass.md`, incrementing if needed.

**Reviewer = Opus, fresh context.** Do not judge GPT Codex's review inline. Spawn a clean-context
Opus reviewer with the Agent tool, passing:

```text
<contents of .ai/prompts/reviewer.md>
You are Opus, the reviewer. Step: review. Read .ai/reviews/$1/05-review-pass.md, inspect the change with 'git -C $2 --no-pager diff' and 'git -C $2 status', and read the task/think/plan/design artifacts. Score the quality of GPT Codex's review: did it miss real defects, raise false Must Fix items, or fail to cite evidence? Output the verdict EXACTLY as the charter specifies (Reviewer: Opus, Step: review). Status is APPROVED only if Score >= 9.0.
```

Save the verdict block to `.ai/reviews/$1/05-review-verdict.md`, incrementing if needed. Stop after
reporting Score and Status.
