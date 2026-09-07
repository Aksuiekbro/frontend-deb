# Participant Results Visibility Plan

The `disabled` field already persists the organizer setting. Its corrected
meaning is: published outcomes are hidden from non-organizers when true. It is
not a tournament access or discovery flag.

| Slice | Owner | Files | Dependency |
| --- | --- | --- | --- |
| Backend semantics | backend implementation agent | `debetter-backend-sync` visibility specification/security/controllers, match mapping, and focused tests | none |
| Frontend presentation | frontend implementation agent | visibility hook/header, tournament page, notice component, focused tests | backend contract above |
| Integration and release review | primary plus read-only reviewer | both repository diffs | both slices |

## Baseline and ownership

Both repositories are already dirty. The pre-existing task-adjacent frontend
hunks are in `app/tournament/[id]/page.tsx` and its test, plus
`components/tournament/TournamentHeader.tsx` and its test. The task-adjacent
backend hunks are the visibility annotations and filtering in the changed
tournament controllers/security/specifications, the untracked visibility
tests, and `MatchController`. Each is assigned to exactly one implementation
agent. Unrelated dirty files remain out of scope.

## Verification

- Focused Jest tests for the visibility hook, header, notice, and tournament page.
- Focused Maven tests for tournament visibility and match-result reads.
- Repository type/lint/build checks as feasible, followed by independent review.
