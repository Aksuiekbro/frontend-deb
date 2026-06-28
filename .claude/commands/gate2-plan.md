---
description: "Step 2 (plan): GPT Codex does, Opus reviews"
argument-hint: <feature-name>
---

# Step 2 - plan: GPT Codex does, Opus reviews

**Doer = GPT Codex, write-enabled.** Run this from the pipeline root:

```bash
codex exec --sandbox workspace-write "$(cat .ai/prompts/doer.md)
You are GPT Codex, the doer for the PLAN step of $1. Read .ai/tasks/$1.md and the approved think doc .ai/think/$1.md. Write ONLY .ai/plans/$1-plan.md using .ai/plans/TEMPLATE.md. Make small independently reviewable slices. Name failure modes. State what each test proves. Address DeBetter constraints: tournament flows, accessibility, and mobile behavior. Do NOT edit code, tests, or any other file."
```

**Reviewer = Opus, fresh context.** Do not review inline. Spawn a clean-context Opus reviewer with
the Agent tool, passing:

```text
<contents of .ai/prompts/reviewer.md>
You are Opus, the reviewer. Step: plan. Read ONLY .ai/plans/$1-plan.md, .ai/think/$1.md, and .ai/tasks/$1.md. Apply the plan lens: minimum viable change, existing code reuse, named failure modes, what each test proves, and DeBetter constraints. Output the verdict EXACTLY as the charter specifies (Reviewer: Opus, Step: plan). Status is APPROVED only if Score >= 9.0.
```

Save the verdict block to `.ai/reviews/$1/02-plan-verdict.md`, incrementing if needed. Stop after
reporting Score and Status.
