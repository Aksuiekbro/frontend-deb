# Review Checklist

Reviewers apply this read-only. Do not edit the artifact.

- [ ] Correctness: does it do what the task says, including edge cases?
- [ ] Scope: no unrelated edits, hidden product decisions, or extra features.
- [ ] Tests: meaningful coverage for risky paths, not only happy paths.
- [ ] Security: authz, injection, SSRF, secrets, sessions, rate limiting, audit logging, unsafe
      defaults.
- [ ] Privacy: user data and accounts are protected.
- [ ] Accessibility: keyboard support, focus, labels, contrast, responsive behavior.
- [ ] Maintainability: simple, local, and consistent with the codebase.
- [ ] Think Before Coding: assumptions and tradeoffs are surfaced.
- [ ] Simplicity First: no needless abstraction or bloat.
- [ ] Surgical Changes: every touched file belongs to the task.
- [ ] Goal-Driven Execution: acceptance criteria are verifiable and verified.
- [ ] Findings cite evidence; uncertain issues stay non-blocking.
- [ ] Status is APPROVED only when Score is `>= 9.0`.
- [ ] Verdict uses the required format.
