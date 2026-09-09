# Account profile parity handoff

Implemented locally on `codex/account-profile-parity` in separate frontend and backend checkouts. Research agents created seven GitHub issues; different agents implemented the fixes and non-authoring agents reviewed them. Production has not been changed. Issues remain open pending delivery.

## Issue-to-change map

| Issue | Implemented behavior | Implementer |
| --- | --- | --- |
| [Frontend #40](https://github.com/Aksuiekbro/frontend-deb/issues/40) | Owner edits nickname, first/last name and email; changed-field saves, validation, localized errors, cache refresh, cancellation and stale-response guards. | frontend_profile |
| [Frontend #41](https://github.com/Aksuiekbro/frontend-deb/issues/41) | Owner changes password with current/new/confirmation fields; exact password handling, localized rejection, secret clearing and late-response isolation. | frontend_account_ui |
| [Frontend #42](https://github.com/Aksuiekbro/frontend-deb/issues/42) | Account controls appear only on the resolved current owner's profile. | frontend_profile |
| [Frontend #43](https://github.com/Aksuiekbro/frontend-deb/issues/43) | Removes the nonfunctional password-recovery link; preserves login, registration, Remember me and locale controls. | frontend_account_ui |
| [Backend #17](https://github.com/Aksuiekbro/debetter-backend-sync/issues/17) | PATCH persists nickname/identity fields with validation, atomic conflicts, current-session refresh, stable-ID permissions and safe token revocation on rename. | backend_implementation |
| [Backend #18](https://github.com/Aksuiekbro/debetter-backend-sync/issues/18) | Invalid login returns consistent safe 401; absent credentials produce 4xx; successful session tokens do not retain plaintext credentials. | backend_implementation |
| [Backend #19](https://github.com/Aksuiekbro/debetter-backend-sync/issues/19) | JSON opt-in creates usable persistent login cookies; JDBC migration, cookie-only login/logout, expiry and concurrent rename handling work. An expired cookie does not revoke fresh cookies on other devices. | backend_implementation |

## Verification

- Frontend: 53 Jest suites, 520 tests passed.
- Backend: 302 tests run, 296 passed, 6 skipped, zero failures/errors. All 49 focused account/auth/migration tests pass without skips.
- Frontend lint succeeds with 50 warnings; no errors. Typecheck and production build succeed. Targeted lint on the new browser tests/config is clean.
- Production-build Chromium suite: 8 tests passed. It covers edits/cancel/reload, duplicate correction, password confirmation/rejection/clearing after reopen, owner/guest/other-user controls, and 390px profile/password layouts in English, Russian and Kazakh.
- Seven desktop/mobile screenshots were captured and visually checked; no horizontal overflow, clipped labels, or obstructed controls were found.
- Existing deployment-worktree changes were compared against the saved baseline and remain byte-for-byte intact.

The six skipped backend tests are the same PostgreSQL/Docker-dependent cases skipped before edits: TournamentMapPostgresMigrationTest (1) and MatchResultsPostgresIntegrationTest (5). Account tests use real Spring HTTP/security, generated mapper, BCrypt, JPA and JDBC against H2; the new migration also has an H2 PostgreSQL-mode JDBC/idempotence test. This does not establish production PostgreSQL concurrency. Browser API responses are synthetic local fixtures; they verify the frontend contract and UI, not a live deployed frontend/backend connection.

Logs are in each repository's ignored `.ai/runs/` directory and workspace `audit/account-parity-20260908`. Screenshots are preserved in that audit directory's `screenshots/`. Slice reviews are under `.ai/reviews/account-profile-parity/`; final independent review is recorded there as `07-final-verdict.md`.

## Scope and rollout

The account comparison used [Tabroom account documentation](https://docs.tabroom.com/account/your-account) and [Tabbycat account documentation](https://tabbycat.readthedocs.io/en/stable/features/user-accounts.html). Tabroom supplies direct self-service profile/password evidence; Tabbycat normally uses public/private URLs for participants and account logins for administration. The research did not claim equivalent participant profile models or audit all competitor features.

Email-based recovery, verification emails, account deletion, and public-profile email visibility were not added. Removing a dead recovery link does not implement recovery.

Deploy the companion backend changes before or with the frontend editor. Backend includes the additive `create_persistent_logins.sql` migration referenced by the master changelog; it preserves compatible existing rows. A self-rename revokes old-name persistent tokens and clears the caller's stale remember-me cookie while retaining the active session. Existing remembered devices need a new explicit login. This prevents a released nickname's old tokens from authenticating a replacement account.

Frontend rollback removes the new controls. The additive token table can remain during code rollback; do not remove live session data as a routine rollback step. Restoring old backend code restores the previous account/authentication defects.

No commit, push, pull request, merge, deployment, production migration, or real-user credential change was performed. Both implementation directories retain reviewable local changes against their original main baselines.

## Reproduce checks

Frontend: `npm test -- --runInBand`, `npm run lint`, `npm run typecheck`, then build with `NEXT_PUBLIC_API_URL=/api BACKEND_URL=http://127.0.0.1:9/api NEXT_PUBLIC_PREVIEW_MODE=false NEXT_PUBLIC_DEMO_MODE=false npm run build` and run `npx playwright test --config playwright.account.config.ts`. The special browser suite uses loopback port 3108 and intercepts its API requests.

Backend: use Java 21 and run `./mvnw test`. The test configurations use synthetic identities and local test databases.
