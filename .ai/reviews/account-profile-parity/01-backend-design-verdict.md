# Review Verdict

Reviewer: GPT Codex agent:backend_audit
Step: design
Score: 9.4 / 10
Status: APPROVED

## Reason

Reviewed the root-authored task, think, plan, and design artifacts for account-profile-parity against source-confirmed backend issues #17, #18, and #19 and their frontend integration contracts. The plan addresses the actual mapper, validation, session identity, login-result, and JSON remember-me defects while preserving PATCH shape, stable user IDs, owner/admin authorization, null-ignore updates, and password checks. Research authors and implementers are different agents, file ownership is explicit, and meaningful persistence/session/HTTP verification is required. No implementation was authored by this reviewer.

The plan correctly requires old-username token revocation and prevents an admin editing another user from adopting that identity. The API normalization and field boundaries align with the frontend forms; password values remain untrimmed and outside UI caches. Recovery email and unrelated profile privacy changes are explicitly excluded.

## Must Fix

None at the design stage.

## Should Consider

- Preserve the authentication trust level when refreshing a principal, as well as ID and authorities; updating a remember-me-authenticated principal should not accidentally promote its authentication type. Current source has no fully-authenticated gate, so this is an implementation guard rather than a scope blocker.
- Confirm the existing `persistent_logins` schema when exercising real remember-me persistence. `SecurityConfig` uses JDBC tokens with create-table-on-startup disabled; the repository contains no creation migration for that table. The plan says no migration is expected, but integration evidence must establish that assumption rather than a mocked token repository hiding it.
- Keep rename and old-token revocation in a transactionally consistent order, so a failed profile conflict cannot silently revoke tokens and a released old username cannot retain usable persistent tokens.

## Tests Reviewed

Reviewed planned tests, existing UserService partial-update/wrong-password coverage, and the baseline log at `audit/account-parity-20260908/backend-baseline-test.log`. It reports 256 tests, 0 failures, 0 errors, 6 skipped, and BUILD SUCCESS before edits. This is design approval, not implementation or deployment approval; the new contract/session tests and final full suite remain required.

## Release Risk

Moderate: username changes affect login identity and persistent authentication, and the remember-me fix activates a previously ineffective path. The proposed HTTP/session/token tests and independent backend review address that risk. Frontend and backend must be delivered together for nickname editing; no production mutation or deployment is authorized by this artifact.
