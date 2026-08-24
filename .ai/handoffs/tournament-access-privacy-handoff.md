# Tournament Access, Privacy, and UX Handoff

Date: 2026-08-24

## Outcome

Issues [#22](https://github.com/Aksuiekbro/frontend-deb/issues/22),
[#23](https://github.com/Aksuiekbro/frontend-deb/issues/23),
[#24](https://github.com/Aksuiekbro/frontend-deb/issues/24),
[#25](https://github.com/Aksuiekbro/frontend-deb/issues/25), and
[#26](https://github.com/Aksuiekbro/frontend-deb/issues/26) are implemented locally. The original
mistaken-image report, [#21](https://github.com/Aksuiekbro/frontend-deb/issues/21), was verified as
already covered by the existing accessible remove control and upload-state tests and remains closed.

## What Changed

### #22 — hidden tournament visibility

- Public tournament discovery excludes `disabled=true` and still accepts legacy `null` rows.
- All 20 tournament ID-scoped GET routes use the same null-safe read guard.
- Hidden tournaments deny guests, unrelated users, and VIEW membership; EDIT/FULL remain allowed.
- Missing IDs continue to reach the existing 404 path.
- Only the main organizer sees the visibility switch; start and invite remain available to assigned
  organizers under their existing rules.

### #23 — judge contact privacy

- Public judge list/detail JSON omits email and phone rather than returning null placeholders.
- EDIT/FULL organizers retain exact contact details.
- Unauthorized contact filters and private sorts return 403 before repository access.
- Unsupported sort properties return 400 for every caller.
- The judge table defaults closed and renders contact columns only for assigned organizers.

### #24 — participant invitation inbox

- Participant dashboards show a localized, accessible team-invitation inbox.
- All received pages are loaded before pending invitations are derived.
- Accept and decline update immediately, refresh safely, and retain retry actions for ordinary 400/5xx
  responses; only 404/409 are treated as stale.
- The Playwright tester scenario now accepts through the dashboard UI.

### #25 — principal-scoped My Tournaments

- Added authenticated `GET /tournaments/mine`; it derives identity only from the authenticated
  principal and accepts no target-user input.
- Database filtering includes visible VIEW/EDIT/FULL memberships and hidden EDIT/FULL memberships,
  while excluding hidden VIEW, unrelated, and pending invitations.
- Existing filters, sort, pagination, totals, and pages are preserved.
- Past, ongoing, and upcoming My Tournaments views now use the dedicated endpoint.

### #26 — stable Load More

- Initial and filter-reset requests fetch page 0 once, including React Strict Mode.
- Load More requests the next page once, appends without duplicate IDs, and never resets filters.
- Synchronous in-flight protection blocks double clicks; stale filter responses cannot overwrite newer
  results.

## API and Deployment Notes

- Deploy the backend `/tournaments/mine`, visibility guards, and judge redaction in the same release as
  the frontend changes.
- No database migration is required for #22, #23, or #25.
- Judge email and phone become optional client fields and are absent for public callers.
- Rollback is code-only, but rolling back the backend before the frontend would break My Tournaments.

## Verification

- Independent design review: 9.8 / 10.
- Independent #22 review: 9.6 / 10.
- Independent #23 review: 9.5 / 10.
- Independent #24 review: 9.5 / 10.
- Independent #25 review: 9.6 / 10.
- Independent #26 review: 9.4 / 10.
- Final holistic review: 9.5 / 10.
- Focused frontend at final state: 55 / 55 task-owned tests passed.
- Focused backend security/membership: 49 / 49 passed.
- ESLint: passed with existing warnings.
- Next.js production build: passed.
- Both repositories: `git diff --check` passed.

The raw test record is in `.ai/runs/tournament-access-privacy-test.txt` (intentionally uncommitted).

## Unrelated Concurrent Work Preserved

- Existing News/media/Docker/changelog work was not overwritten.
- ResultsSection/elimination-navigation edits arrived during final verification. Their current page test
  failure is outside #22-#26.
- Organizer-invitation tests and authorization work also arrived during verification. Four failures in
  that full backend suite are outside #22-#26.
- Standalone TypeScript remains blocked by previously documented errors outside these issue hunks.

## Suggested PR Summary

Enforce tournament visibility and judge contact privacy at the API boundary, scope My Tournaments to
the authenticated user's memberships, add a participant invitation inbox, and make Join page
pagination append safely. The implementation adds explicit role-aware tests, frontend permission
integration, race protection, and independent review evidence without changing the database schema.
