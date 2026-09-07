# Release Gate

The final gate is Step 7 (`/gate7-ship`) in cross-model mode or the independent final review in
Codex multi-agent mode. Release only when the scored verdict clears the bar.

## Gate Rule

- Score `>= 9.0` and Status `APPROVED` means cleared for release.
- Anything below `9.0` is `BLOCKED`.
- Any Must Fix caps at `8.9`.
- Any security, privacy, data-loss, or build/test-breaking issue caps at `7.9` or lower.

## Before Final Review

- [ ] All required gates or multi-agent slice reviews scored `>= 9.0`.
- [ ] `make verify` or the target repo equivalent passes.
- [ ] Every acceptance criterion in the task is met.
- [ ] Tests cover the risky paths named in the plan/design.
- [ ] PR text says what users can now do, not the branch history.
- [ ] Migrations, data changes, rollout, and rollback are called out where relevant.
- [ ] No secrets, credentials, or private data appear in shipped text.
- [ ] Accessibility and mobile behavior have been checked for user-facing flows.
