# Review Verdict

Reviewer: GPT Codex agent:astra_release_review
Step: ship
Score: 9.5 / 10
Status: APPROVED

## Reason

The seven approved account issues are ready for ordinary feature-branch commits and publication as the two planned pull requests. This reviewer independently inspected the current frontend and backend patches, acceptance/design/ownership artifacts, prior verdict, fresh Astra finishing reports, actual verification logs, and the root-authored delivery plan, screenshot README and PR body drafts. No application or test code was authored or changed by this reviewer, and no evidenced Must Fix remains.

All 29 source/test/config hashes match the original verified manifest exactly: 10 frontend and 19 backend paths. Both HEADs remain at their recorded baselines at review time: frontend `dca470f3c13ca4c5861df767e50be5c07bd488fc` and backend `16224939841c393be985108cc72bcc6a36bf6a57`. The additional delivery plan and three screenshot copies/README have explicit root ownership; the screenshot copies are byte-identical to the previously verified evidence. The reviewed frontend and backend PR drafts in workspace `audit/account-parity-20260909` accurately describe behavior, verification limits, companion rollout and issue closure on merge. Their temporary companion issue links are to be replaced with the actual companion PR URLs after creation.

The frontend implements owner-only profile/password forms, changed-field account updates, localized feedback, exact password handling, cancellation and identity/request isolation. The backend implements persisted validated PATCH updates, atomic conflicts/password changes, stable-ID session refresh and admin isolation, safe invalid-login responses, explicit JSON persistent-login opt-in, and the additive token migration. Source and HTTP/persistence test inspection cover rename/name reuse, stale managed principals, transactional token issuance/restoration/logout, theft cleanup and ordinary expiry isolation. The new delivery plan correctly supersedes the historical local-only handoff boundary for commits and PR publication.

## Must Fix

None.

## Should Consider

None within this bounded publication review. Consume the actual GitHub CI/review results and replace the companion links when the two PR URLs exist, as already required by the delivery plan.

## Tests Reviewed

- Fresh frontend focused log: four suites, 117 tests passed. Fresh backend focused log: 49 tests, zero failures/errors/skips, BUILD SUCCESS on Java 21.
- Original frontend full log: 53 suites, 520 tests passed; lint has zero errors and 50 warnings; TypeScript and production build logs succeed. All corresponding source hashes remain unchanged.
- Original backend full log: 302 tests, zero failures/errors, six skipped, hence 296 passed. Independently compared the baseline log: the same one TournamentMapPostgresMigrationTest and five MatchResultsPostgresIntegrationTest cases were skipped before these changes.
- Original production-build browser log: eight Chromium tests passed. Inspected the isolated Playwright configuration/spec, including synthetic request payloads, save/reload, rejected edits, password confirmation/rejection and empty inputs after reopening, owner/guest/other-user boundaries, and 390px English/Russian/Kazakh layouts.
- Visually inspected the three proposed published screenshots: saved desktop profile, Russian mobile profile editor and Kazakh mobile password editor. Controls and labels are readable without visible clipping; screenshots use synthetic account data and match the original evidence bytes.
- Inspected meaningful backend HTTP/session/JPA/JDBC cases for persisted edits, permissions, rollback on database/token errors, exact passwords, invalid login, migration idempotence and token concurrency. Inspected frontend request cancellation, keyed identity remounting and guarded cache update behavior.
- Independently ran `git diff --check` in both repositories; both passed. Read the existing CI contracts: frontend `make verify` on Node 22; backend Maven `verify` on Java 21 with Docker. No redundant full suites were rerun during this review, and no remote CI result is claimed.

## Release Risk

Medium for subsequent rollout. Local account tests use real Spring/security/persistence behavior with H2; they do not establish production PostgreSQL concurrency. Browser fixtures verify the frontend contract and layout, not a deployed frontend/backend connection. The companion backend and additive persistent_logins migration must precede or accompany the frontend; rename deliberately revokes remembered logins indexed by the old nickname while retaining the active session.

This verdict approves ordinary commits and PR publication under the current delivery plan. It is not user approval to merge, enter a merge queue, enable auto-merge, deploy, or run a production migration. Actual remote checks/reviews and fresh explicit user confirmation for each PR's exact head remain required for landing. This reviewer performed no commit, push, PR creation, merge, deployment or real-user credential mutation.
