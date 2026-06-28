---
description: "Step 1 (think): Opus does, GPT Codex reviews"
argument-hint: <feature-name>
---

# Step 1 - think: Opus does, GPT Codex reviews

DeBetter context: debate tournament platform. Do not copy proprietary content, branding, code,
or assets from other platforms.

**Doer = Opus.** Before running this gate, write `.ai/think/$1.md` from
`.ai/think/TEMPLATE.md`. Frame the problem, assumptions, options, recommendation, DeBetter
constraints, open questions, and success criteria. If the file does not exist, write it now.

**Reviewer = GPT Codex, read-only.** Run this from the pipeline root:

```bash
codex exec --sandbox read-only "$(cat .ai/prompts/reviewer.md)
You are GPT Codex, the reviewer. Step: think. Review ONLY .ai/think/$1.md and .ai/tasks/$1.md if present. Apply the think lens for DeBetter: problem framing, assumptions, options, accessibility, and tournament UX. You are read-only and must NEVER edit any file. Score 0-10 per .ai/checklists/scoring-rubric.md and output the verdict EXACTLY as the charter specifies (Reviewer: GPT Codex, Step: think). Status is APPROVED only if Score is 9.0 or higher."
```

Then save only the verdict block to `.ai/reviews/$1/01-think-verdict.md`, incrementing the suffix
if needed. Stop after reporting Score and Status.
