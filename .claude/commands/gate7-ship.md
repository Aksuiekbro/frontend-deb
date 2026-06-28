---
description: "Step 7 (ship): Opus does, GPT Codex reviews"
argument-hint: <feature-name> <repo-path>
---

# Step 7 - ship: Opus does, GPT Codex reviews

Invoke as `/gate7-ship <feature-name> <repo-path>`.

**Doer = Opus.** Draft the release handoff and PR text in `.ai/handoffs/$1-handoff.md` using
`.ai/handoffs/TEMPLATE.md`.

The PR body is for users: say what organizers or debaters can now do. Do not narrate branch history.
Confirm the text contains no secrets, credentials, or private data.

**Reviewer = GPT Codex, read-only.** Run this from the pipeline root:

```bash
codex exec --sandbox read-only "$(cat .ai/prompts/final-release-review.md)
This is the final release review for $1. First run 'git -C $2 --no-pager diff main...HEAD' and 'git -C $2 status' to see the full change set. Then review the full diff against the base branch, tests, verification output, possible regressions, and .ai/handoffs/$1-handoff.md. Apply DeBetter release blockers: security, privacy, accessibility, secrets, migrations, rollback, and PR honesty. You are read-only and must NEVER edit any file. Score 0-10 per .ai/checklists/scoring-rubric.md and output the verdict EXACTLY as the prompt specifies (Reviewer: GPT Codex, Step: ship). Status is APPROVED only if Score is 9.0 or higher."
```

Save only the verdict block to `.ai/reviews/$1/07-ship-verdict.md`, incrementing if needed. Stop
after reporting Score and Status. An APPROVED verdict clears the change for release.
