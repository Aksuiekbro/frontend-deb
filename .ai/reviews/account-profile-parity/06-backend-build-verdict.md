# Review Verdict

Reviewer: GPT Codex agent:backend_audit
Step: build
Score: 9.4 / 10
Status: APPROVED

## Reason

Independently reviewed the backend application diff, generated UserMapper implementation, new AccountSessionService and JsonRememberMeServices, migration/master inclusion, account/provider/migration tests, backend handoff, token addendum, prior independent concurrency verdicts, original clean baseline, and focused test evidence against issues #17–19 and the approved design. The reviewer authored the research issues but no implementation. Changes remain within the approved backend scope plus the independently reviewed token migration/helper amendment.

The profile patch, normalized field boundaries, null preservation, conflict handling, wrong-old-password behavior, current-user cache refresh, owner/admin identity, and authentication trust preservation are implemented coherently. Login failures return consistent safe 401 JSON, successful tokens retain no plaintext credentials, and real HTTP tests cover login and registration. Old-name token revocation shares the edit transaction and stable-user lock. Issuance, restoration, and logout safeguards address name reuse, including managed-entity staleness during issuance. The migration uses the standard JDBC token shape and preserves compatible existing rows.

The initial 8.7/BLOCKED verdict found that ordinary token expiry revoked every device's persistent login. The implementer removed that account-wide deletion and now delegates post-lock reread, expiration rejection, and cookie cancellation to the existing Spring implementation. The new two-device real-JDBC test expires only token A, proves A is rejected and canceled, retains both stored series, and authenticates the original stable user ID using fresh token B without an HTTP session. This resolves the sole Must Fix without altering theft, rename, or explicit logout revocation.

## Must Fix

None. The cross-device expiration regression identified in the initial review is resolved and independently re-reviewed.

## Should Consider

None for this bounded batch. PostgreSQL validation limits are documented below rather than treated as an unproven code defect.

## Tests Reviewed

The final focused log `.ai/runs/account-profile-parity-focused.log` reports 49 tests, 0 failures, 0 errors, 0 skips, and BUILD SUCCESS: 42 real HTTP/persistence/security account cases, 3 provider, 3 existing service, and 1 PostgreSQL-mode migration/JDBC case. I inspected the changed expiry implementation and regression assertions, broader account tests, and generated mapper. Existing theft-cleanup, rename, logout, transaction rollback, trust, and authorization regressions remain covered. `git diff --check` passed during both review passes. Parent owns the full Maven suite; this reviewer did not start a conflicting Maven process.

## Release Risk

Moderate, with no outstanding implementation blocker. The application H2 tests plus the separate H2 PostgreSQL-mode migration test do not establish production PostgreSQL concurrency or deployment behavior. Production requires the new persistent_logins migration. No production migration, credential mutation, commit, push, or deployment was performed by this reviewer. The primary agent still owns full-suite and cross-repository integration verification before local handoff.
