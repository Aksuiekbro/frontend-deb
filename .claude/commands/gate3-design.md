---
description: "Step 3 (design): Opus does, GPT Codex reviews"
argument-hint: <feature-name>
---

# Step 3 - design: Opus does, GPT Codex reviews

**Doer = Opus.** Before running this gate, write `.ai/design/$1-design.md` from
`.ai/design/TEMPLATE.md`. The design must trace to the approved task, think doc, and plan.

Cover architecture, data model, interfaces, happy/unhappy paths, rejected alternatives, test
strategy, security, privacy, accessibility, and release notes.

**Reviewer = GPT Codex, read-only.** Run this from the pipeline root:

```bash
codex exec --sandbox read-only "$(cat .ai/prompts/reviewer.md)
You are GPT Codex, the reviewer. Step: design. Review ONLY .ai/design/$1-design.md against .ai/plans/$1-plan.md, .ai/think/$1.md, and .ai/tasks/$1.md. Apply the design lens: coupling, state transitions, data flow on unhappy paths, interfaces, data model, privacy, accessibility, and tournament UX. You are read-only and must NEVER edit any file. Score 0-10 per .ai/checklists/scoring-rubric.md and output the verdict EXACTLY as the charter specifies (Reviewer: GPT Codex, Step: design). Status is APPROVED only if Score is 9.0 or higher."
```

Save only the verdict block to `.ai/reviews/$1/03-design-verdict.md`, incrementing if needed. Stop
after reporting Score and Status.
