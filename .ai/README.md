# Two-Agent Development Pipeline

This `.ai/` directory is the coordination layer for building with two AI coding agents:
Claude Code (Opus) and GPT Codex. It is a lightweight operational paper trail, not a transcript
archive. Every feature flows through a 7-step process, and each step advances only when the
reviewer scores it `>= 9.0 / 10`.

## Operating Model

Each step has one doer and one reviewer. The reviewer is always the other model, so no model grades
its own work.

```
Doer produces the step artifact.
Reviewer scores it out of 10.
Score >= 9.0 -> proceed to the next step.
Score <  9.0 -> doer fixes only the cited Must Fix items and resubmits.
```

Reviewers run read-only and return a scored verdict only. Doers fix only the reviewer's cited Must
Fix items on a block. No scope creep, no opportunistic refactors, no extra product decisions hidden
inside a fix pass.

## The 7 Steps

| # | Step | Doer | Reviewer | Artifact | Command |
|---|------|------|----------|----------|---------|
| 1 | think | Opus | GPT Codex | `.ai/think/<feature>.md` | `/gate1-think <feature>` |
| 2 | plan | GPT Codex | Opus | `.ai/plans/<feature>-plan.md` | `/gate2-plan <feature>` |
| 3 | design | Opus | GPT Codex | `.ai/design/<feature>-design.md` | `/gate3-design <feature>` |
| 4 | build | Opus | GPT Codex | code diff in `<repo-path>` | `/gate4-build <feature> <repo-path>` |
| 5 | review | GPT Codex | Opus | `.ai/reviews/<feature>/05-review-pass.md` | `/gate5-review <feature> <repo-path>` |
| 6 | test | GPT Codex | Opus | tests plus `.ai/runs/<feature>-test.txt` | `/gate6-test <feature> <repo-path>` |
| 7 | ship | Opus | GPT Codex | `.ai/handoffs/<feature>-handoff.md` plus PR text | `/gate7-ship <feature> <repo-path>` |

Two deliberate properties matter:

- Step 4 gates each build slice against the approved plan and design.
- Step 5 is a holistic, adversarial whole-change pass that catches cross-cutting issues.
- Step 6 has GPT Codex author or strengthen tests so the builder does not grade its own work.

## Folder Layout

| Path | Holds | Committed? |
|------|-------|------------|
| `README.md` | This operating manual. | yes |
| `checklists/` | Scoring, implementation, review, and release checklists. | yes |
| `tasks/<feature>.md` | Feature kickoff: goal, scope, acceptance, verification. | yes |
| `think/<feature>.md` | Step 1 problem framing and option selection. | yes |
| `plans/<feature>-plan.md` | Step 2 implementation plan in reviewable slices. | yes |
| `design/<feature>-design.md` | Step 3 architecture, data, interfaces, and test strategy. | yes |
| `reviews/<feature>/` | Numbered scored verdicts and the step-5 review pass. | optional |
| `handoffs/<feature>-handoff.md` | Step 7 handoff and PR text. | yes |
| `scratch/` | Throwaway working files. | no |
| `runs/` | Raw run logs, including step-6 test logs. | no |
| `transcripts/` | Raw model transcripts if manually saved. | no |

## Review Verdict Format

Every reviewer must output exactly this shape:

```md
# Review Verdict

Reviewer: <Opus | GPT Codex>
Step: <think | plan | design | build | review | test | ship>
Score: X.X / 10
Status: APPROVED or BLOCKED

## Reason
<1-3 sentences on why this score>

## Must Fix
<blocking issues as a list, or "None">

## Should Consider
<non-blocking suggestions, or "None">

## Tests Reviewed
<the tests/commands inspected or run, or "N/A">

## Release Risk
Low, Medium, or High
```

Status is `APPROVED` only when score is `>= 9.0`. Any Must Fix caps the score at `8.9`. Any
security, data-loss, or build/test-breaking issue caps the score at `7.9` or lower.

## How to Run a Feature

```sh
cp .ai/tasks/TEMPLATE.md .ai/tasks/<feature>.md

/gate1-think  <feature>
/gate2-plan   <feature>
/gate3-design <feature>
/gate4-build  <feature> <repo-path>
/gate5-review <feature> <repo-path>
/gate6-test   <feature> <repo-path>
/gate7-ship   <feature> <repo-path>
```

`<repo-path>` is the path to the repository that contains the actual application code (typically `.`).

## Prerequisites

- Claude Code for Opus doer/reviewer steps.
- Codex CLI installed and authenticated for GPT Codex doer/reviewer steps.
- Git in the target app repo, because build/review/test/ship gates inspect diffs.
- `make verify` wired to the real stack. The root `Makefile` contains the verification targets.

## What to Commit

Commit `.ai/README.md`, `checklists/`, templates, meaningful feature docs, root
`AGENTS.md`, root `CLAUDE.md`, `.claude/commands/`, `.gitignore`, and `Makefile`.

Do not commit `.ai/scratch/`, `.ai/runs/`, `.ai/transcripts/`, raw transcripts, local credentials,
or sensitive content.
