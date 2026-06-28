---
description: "Step 4 (build): Opus does, GPT Codex reviews"
argument-hint: <feature-name> <repo-path>
---

# Step 4 - build: Opus does, GPT Codex reviews

Invoke as `/gate4-build <feature-name> <repo-path>`. `<repo-path>` is the Git repository holding
the application changes (typically `.`).

**Doer = Opus.** Implement one slice from the approved plan. Keep the target repo green. Do not
start the next slice until this gate clears.

**Reviewer = GPT Codex, read-only.** Run this from the pipeline root:

```bash
codex exec --sandbox read-only "$(cat .ai/prompts/reviewer.md)
You are GPT Codex, the reviewer. Step: build. First run 'git -C $2 --no-pager diff' and 'git -C $2 status'. Review that diff against .ai/tasks/$1.md, .ai/think/$1.md, .ai/plans/$1-plan.md, and .ai/design/$1-design.md. Apply the build lens: correctness, regressions, missing tests, unhandled edge cases, security, privacy, accessibility, and deviations from plan/design. You are read-only and must NEVER edit any file. Score 0-10 per .ai/checklists/scoring-rubric.md and output the verdict EXACTLY as the charter specifies (Reviewer: GPT Codex, Step: build). Status is APPROVED only if Score is 9.0 or higher."
```

Save only the verdict block to `.ai/reviews/$1/04-build-verdict-1.md`, incrementing per slice or
fix. Stop after reporting Score and Status.
