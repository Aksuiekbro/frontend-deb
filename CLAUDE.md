# CLAUDE.md

House rules for Claude Code and other AI agents working in this project.

The formal multi-agent workflow lives in `.ai/`. Agent-specific role rules live in `AGENTS.md`.

## 1. Think Before Coding

Do not assume. Do not hide confusion. Surface tradeoffs.

- State assumptions explicitly.
- If multiple interpretations exist, present them before implementation.
- Ask when a decision materially changes product behavior or user trust.

## 2. Simplicity First

Build the minimum complete solution that satisfies the task.

- No speculative abstractions.
- No features beyond the approved scope.
- Prefer boring, understandable code.
- Avoid building a platform before the app has real usage.

## 3. Surgical Changes

Touch only what the task requires.

- Match the existing style and architecture.
- Do not refactor unrelated code.
- Remove only dead code created by your change.
- Keep every changed line traceable to the task, plan, or design.

## 4. Goal-Driven Execution

Every task needs observable success criteria.

- Convert features into verifiable acceptance criteria.
- Run the relevant tests, lint, typecheck, and build.
- If a check fails, prove whether it is caused by the change or pre-existing.
- Record exact verification commands in handoffs.

## Definition of Done

A change is done only when:

- the relevant `.ai` gate clears with Score `>= 9.0`
- acceptance criteria are demonstrably met
- verification commands pass or failures are proven pre-existing
- accessibility constraints are satisfied

## Commit Rules

- When committing, do not say it was co-authored by Claude or Codex.
- Do not add AI agents as collaborators in the GitHub project.

## Agent skills

### Issue tracker

Issues are tracked on GitHub (`Aksuiekbro/frontend-deb`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
