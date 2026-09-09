# Account profile parity

Doer: primary Codex agent. Reviewer: independent backend_audit and competitor_research agents.

The user requested nickname, name, and email editing, a comparison of similar account features with competing debate platforms, GitHub issues written by research subagents, and fixes implemented by different subagents.

Approved issues: frontend #40 (profile editor), #41 (password change), #42 (owner-only account footer), #43 (dead password recovery link); backend #17 (profile PATCH), #18 (invalid login response), #19 (remember-me opt-in). Repositories are Aksuiekbro/frontend-deb and Aksuiekbro/debetter-backend-sync.

Success means all seven issues have implementation and meaningful verification in isolated local branches. Publication, deployment, and merging are separate actions. Preserve existing external worktrees. No real user account is used in tests.

The competitor comparison uses Tabroom's documented account editing/password management and Tabbycat's distinct administrative/private-URL account model. It does not assert that Tabbycat offers participant profiles. Research evidence and issue URLs are recorded in the workspace audit/account-parity-20260908 directory.

The batch does not add recovery emails, email ownership verification, account deletion, or change public email visibility. The dead recovery link is removed, with no substitute fake success path.

Acceptance: owners edit and persist valid profile fields; owners change passwords using their old password; other profile viewers see no account-management actions; sign-in has no dead recovery link; PATCH validation/conflicts/session identity behave correctly; invalid login fails with 401; explicit remember-me opt-in survives session loss and is revoked on logout/rename. Support English, Russian, and Kazakh UI, keyboard use, and mobile widths.
