# Account profile parity: implementation plan

Doer: primary Codex agent. Design approval: independent research agents before implementation.

Fresh checkouts live in work/account-parity/frontend and work/account-parity/backend. Each has branch codex/account-profile-parity from current main. Baselines for HEAD, status, diff, and untracked files are in audit/account-parity-20260908 and copied to .ai/runs. Both task checkouts began clean. The old .deploy frontend worktree contains user changes and is excluded from all implementation.

| Owner | Issues | Owned paths |
| --- | --- | --- |
| frontend_profile implementer | frontend #40, #42 | app/profile/[id]/ProfileClient.tsx; app/profile/[id]/page.test.tsx; new components/profile/EditProfileForm.tsx and its test |
| frontend_account_ui implementer | frontend #41, #43 | new components/profile/ChangePasswordForm.tsx and its test; app/auth/AuthPageClient.tsx and its existing auth test |
| backend_implementation implementer | backend #17, #18, #19 | user controller/service/mapper/update DTO/repository; AuthController, AuthProvider, SecurityConfig; relevant error handling and user/account/auth tests; narrow session/JSON remember-me helpers; persistent_logins migration and master include; backend token design addendum |
| primary | integration and evidence | .ai task/think/plan/design/runs/handoff; standalone account Playwright config/spec and browser evidence; backend .gitignore exclusions for local evidence; no application files unless explicitly reassigned |
| competitor_research | independent review | read-only frontend/artifact review; review verdict artifacts only |
| backend_audit | independent review | read-only backend/artifact review; review verdict artifacts only |

All new paths must be reported to the primary before changes outside these boundaries. No shared file edits concurrently. frontend_profile owns integrating ChangePasswordForm in the owner-only account area after coordinating its props contract with frontend_account_ui. Use existing API methods/types and shared error handling; avoid changing unrelated hooks.

Sequence: research and issue filing; artifact review; independent frontend and backend implementation; non-author slice reviews; integration verification; independent holistic review; local handoff with issue-to-change mapping. Issue authors never implement their own fixes.

Verification: backend baseline full Maven suite recorded before edits. Run new focused user/auth tests plus full Maven suite. Frontend focused Jest tests cover all new forms and ownership/error paths, including pending responses after route/account changes and cancel/reopen, then full Jest, lint, typecheck, and production build (make verify equivalent). Add an isolated browser spec with deterministic local API responses for keyboard navigation, request payloads, success/error and desktop/mobile layout. Backend HTTP/session tests provide real persistence and security evidence; browser mocks do not establish production integration. Capture known skipped integration tests explicitly. Repeat checks only for new changes or failures.

No commit, push, deployment, or merge is implied by the local handoff. GitHub issue creation is explicitly authorized. Keep issues open pending delivery; report local resolution clearly rather than claiming production changes.
