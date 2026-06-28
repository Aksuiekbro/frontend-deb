---
description: "Step 6 (test): GPT Codex does, Opus reviews"
argument-hint: <feature-name> <repo-path>
---

# Step 6 - test: GPT Codex does, Opus reviews

GPT Codex authors or strengthens tests so the builder does not grade its own work.

Invoke as `/gate6-test <feature-name> <repo-path>`.

**Doer = GPT Codex, write-enabled.** Run this from the pipeline root:

```bash
codex exec --sandbox workspace-write "$(cat .ai/prompts/doer.md)
You are GPT Codex, the doer for the TEST step of $1 in repo $2. Read .ai/tasks/$1.md, .ai/think/$1.md, .ai/plans/$1-plan.md, .ai/design/$1-design.md, and 'git -C $2 --no-pager diff'. Add or strengthen tests that prove risky paths: tournament flows, match results, team management, round progression, accessibility-critical behavior, and failure states named in the plan/design. Then run the target repo verification, such as 'make -C $2 verify' or the repo's test command, until it passes. Write exact commands and pass/fail counts to .ai/runs/$1-test.txt. Touch ONLY test files and fixtures under $2 plus the run log. Do NOT change production code. If a test reveals a real production bug, report it in the log instead of patching it."
```

**Reviewer = Opus, fresh context.** Spawn a clean-context Opus reviewer with the Agent tool,
passing:

```text
<contents of .ai/prompts/reviewer.md>
You are Opus, the reviewer. Step: test. Inspect tests added or changed with 'git -C $2 --no-pager diff' and read .ai/runs/$1-test.txt plus the task/think/plan/design artifacts. Apply the test lens: do tests cover risky paths or only happy paths, did verification run green, and are any pre-existing failures proven on the base branch? Output the verdict EXACTLY as the charter specifies (Reviewer: Opus, Step: test). Status is APPROVED only if Score >= 9.0.
```

Save the verdict block to `.ai/reviews/$1/06-test-verdict.md`, incrementing if needed. Stop after
reporting Score and Status.
