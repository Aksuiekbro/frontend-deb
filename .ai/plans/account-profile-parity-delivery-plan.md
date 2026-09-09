# Account profile parity: GitHub delivery

Date: 2026-09-09. Coordinator: root. Independent final reviewer: astra_release_review.

The user resumed the seven-issue task and requested GPT-6 Astra subagents at high reasoning and Fast speed. New `astra_frontend_finish` and `astra_backend_finish` agents were explicitly spawned with `model=gpt-6-astra` and `reasoning_effort=high`; the collaboration tool lists priority service for Astra and has no separate Fast-mode parameter. Both agents checked the live issue bodies and existing implementation, found no remaining defect, and preserved the reviewed source.

This continuation packages the completed fixes into ordinary feature-branch commits and two GitHub PRs, then observes their actual CI and review state. It supersedes the earlier local-only handoff boundary for commits, push and PR creation. It does not authorize production deployment or bypass protections. PR landing requires a fresh readiness result and explicit user confirmation for each PR's exact head.

## Baseline and ownership

Both `codex/account-profile-parity` branches still match their original main baselines: frontend `dca470f3c13ca4c5861df767e50be5c07bd488fc`, backend `16224939841c393be985108cc72bcc6a36bf6a57`. Fresh origin/main fetches match them. All 10 frontend and 19 backend source/test/config hashes match the prior verified manifest. New baseline captures are in workspace `audit/account-parity-20260909`.

The original app ownership and independent review history remain valid. This continuation adds the following bounded ownership:

| Owner | Paths/actions |
| --- | --- |
| astra_frontend_finish | Recheck frontend #40–43; any necessary fixes only in the original frontend owned paths; commit phase after independent clearance. |
| astra_backend_finish | Recheck backend #17–19; any necessary fixes only in the original backend owned paths; commit phase after independent clearance. |
| root | Delivery plan, synthetic screenshots and README under docs/account-profile-parity; PR body files and runtime evidence outside tracked source; normal pushes/PR creation/watcher. |
| astra_release_review | Read-only final source, evidence and delivery-document review; verdict artifact only. |

No files in the earlier `.deploy` worktree or other projects are in scope. Do not stage node_modules, build outputs, raw logs, local credentials or unrelated workspace content. Historical review/handoff files describe the already-completed local phase and remain evidence of that phase.

## Verification and delivery

Fresh focused verification: frontend four suites/117 tests passed; backend 49 tests passed with no skips; diff checks clean. Existing full verification is still bound to identical source: frontend 520 tests; backend 296 executed tests plus six baseline Docker/PostgreSQL skips; eight browser checks; lint/typecheck/build pass. Do not rerun unchanged suites solely to generate more output. Run any checks invalidated by a real fix and consume GitHub CI after push.

Repository workflows establish the CI contract: frontend `make verify` on Node 22; backend `./mvnw --batch-mode verify` on Java 21 with Docker available. The backend CI should exercise the six cases skipped locally. Record real remote results without treating local H2 as PostgreSQL proof.

Create frontend PR closing #40–43 and backend PR closing #17–19. Cross-link them and document the additive persistent_logins migration and backend-first rollout. Include the saved profile/mobile screenshots generated with synthetic API fixtures. Follow the PR Completion watcher for checks, review threads and head freshness. Fix actionable failures through their owning agent and obtain independent re-review of new source changes.
