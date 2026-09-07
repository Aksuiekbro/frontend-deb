# Agent Development Pipeline

This `.ai/` directory is the coordination layer for building with either Claude Code (Opus) plus
GPT Codex, or a primary Codex agent orchestrating independent Codex subagents. It is a lightweight
operational paper trail, not a transcript archive.

Use the full seven-step flow for large or ambiguous features. Bounded issues that already contain
evidence and acceptance criteria may use the Codex multi-agent fast path described below. Every
formal review advances only when the reviewer scores it `>= 9.0 / 10`.

## Operating Model

Each step has one doer and one reviewer. The invariant is author independence: no agent reviews or
approves work it authored. In cross-model mode the reviewer is the other model. In Codex
multi-agent mode the reviewer is a different, read-only Codex agent.

```
Doer produces the step artifact.
Reviewer scores it out of 10.
Score >= 9.0 -> proceed to the next step.
Score <  9.0 -> doer fixes only the cited Must Fix items and resubmits.
```

Reviewers run read-only and return a scored verdict only. Doers fix only the reviewer's cited Must
Fix items on a block. No scope creep, no opportunistic refactors, no extra product decisions hidden
inside a fix pass.

## Execution Modes

### Cross-model seven-step mode

Use this mode when both Opus and GPT Codex are available or when a feature needs the full artifact
trail.

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

### Codex multi-agent fast path

Use this mode when the user asks Codex to implement or orchestrate work, or when Opus is
unavailable. It is intended for bounded bugs and features that already have clear evidence and
acceptance criteria.

1. **Plan:** The primary agent maps each acceptance criterion to a small implementation slice,
   records dependencies and file ownership, and identifies focused and repository-wide checks.
2. **Build:** The primary delegates independent slices to implementation subagents. The primary may
   implement an integration slice, but must not review that slice itself.
3. **Slice review:** A non-authoring agent reviews each diff read-only against the issue and plan.
   Any BLOCKED slice returns only its Must Fix items to an implementer, then is re-reviewed.
4. **Integration:** The primary inspects all diffs, resolves conflicts, preserves unrelated user
   changes, and checks cross-slice behavior.
5. **Test:** Run focused tests for each issue, then lint, typecheck/build, and the repository-wide
   suite appropriate to the changed stacks. Record pre-existing failures with evidence.
6. **Final review:** A Codex agent that did not author the integrated changes performs the read-only
   release review and must score it at least 9.0.
7. **Ship:** Commit, push, open a PR, deploy, or merge only when the user requests that external
   action and the release gate passes.

For the fast path, a GitHub issue or task description plus an in-session plan may replace separate
think, plan, and design files. Create the full artifacts when the work is ambiguous, introduces a
migration, changes security architecture, or cannot be reviewed as small slices.

### Codex multi-agent full-artifact variant

When Opus is unavailable and the work is large, ambiguous, migration-heavy, security-sensitive, or
privacy-sensitive, keep the Codex multi-agent ownership rules but require the complete artifact
trail: task, think, plan, design, per-slice build verdicts, holistic review, test log, and handoff.
Each artifact or code slice has a named Codex doer and a different read-only Codex reviewer. The
same scoring thresholds and BLOCKED/re-review loop apply. The `.claude` slash commands remain the
cross-model entry points; Codex agents create and review the equivalent artifacts directly.

Concurrency rules:

- Give each implementation agent one bounded outcome and explicit ownership boundaries.
- Avoid concurrent edits to the same file. If overlap is unavoidable, serialize those slices.
- Agents share the worktree; never discard or overwrite another agent's or the user's changes.
- The primary agent is the integration owner, not an automatic reviewer of its own code.

Dirty-worktree preflight and review:

1. Before any write, capture `git status --short`, the current diff, and untracked paths separately
   for every repository in scope. Persist the record in `.ai/runs/<feature>-baseline-<repo>.txt` for
   the full-artifact variant, or keep it in the active session log for the fast path.
2. Add an ownership table to the plan naming each task-owned file. If a task-owned file already has
   changes, record its pre-existing diff/hunks and assign that file to one implementation agent at a
   time.
3. If an unexpected overlap appears, stop that slice and serialize it through the primary agent.
   Never restore, reformat, or replace unrelated hunks to make a patch apply.
4. Slice and final reviewers compare task changes with the recorded baseline, verify pre-existing
   hunks remain intact, and identify any new unowned path as a Must Fix.

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

Reviewer: <Opus | GPT Codex | GPT Codex agent:task-name>
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

## How to Run a Feature in Cross-model Mode

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

- Cross-model mode: Claude Code for Opus steps and Codex CLI for GPT Codex steps.
- Codex multi-agent mode: a primary Codex session with subagent support.
- Git in the target app repo, because build/review/test/ship gates inspect diffs.
- `make verify` wired to the real stack. The root `Makefile` contains the verification targets.

## What to Commit

Commit `.ai/README.md`, `checklists/`, templates, meaningful feature docs, root
`AGENTS.md`, root `CLAUDE.md`, `.claude/commands/`, `.gitignore`, and `Makefile`.

Do not commit `.ai/scratch/`, `.ai/runs/`, `.ai/transcripts/`, raw transcripts, local credentials,
or sensitive content.
