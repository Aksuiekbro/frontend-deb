# AGENTS.md

Conventions for AI agents working in this project.

## Project Structure & Module Organization

- `app/`: Next.js app router pages, layouts, and route handlers.
- `components/`: Reusable UI components; prefer domain-focused subfolders.
- `hooks/`: Reusable React hooks (client or shared).
- `lib/` and `types/`: Cross-cutting utilities, API helpers, and shared TypeScript types.
- `public/`: Static assets (images, fonts, favicons).
- `styles/`, `tailwind.config.ts`, `postcss.config.mjs`: Global styles and design tokens.
- `docker/` and `docs/`: Deployment tooling and project documentation.

## Build, Test, and Development Commands

- `npm install`: Install dependencies (prefer `npm` over other managers).
- `npm run dev`: Start the local dev server at `http://localhost:3000`.
- `npm run build`: Create a production build.
- `npm run start`: Run the production build locally.
- `npm run lint`: Run ESLint/Next.js linting; fix issues before pushing.

## Vercel Deployment

- Use the locally installed Vercel CLI (`vercel`) for all Vercel project, environment, log, and deployment operations in this repository.
- Do not use a Vercel connector, MCP tool, REST API, browser-based project discovery, or team enumeration for this repository.
- The only allowed Vercel target is project `debetter` in scope `dauren190307-gmailcoms-projects`.
- Before any Vercel read or write, verify `.vercel/project.json` contains project name `debetter`, project ID `prj_QgpQLF0A8S6t3FA9PGqqSufK8yBv`, and org ID `team_2AAGIUaAcpItjn5YW960Tihd`. Stop if any value differs.
- Never select, link, inspect, or deploy through the Dimash team or any other Vercel team.
- Never run an unscoped `vercel link`. If relinking is required, use `vercel link --yes --project debetter --scope dauren190307-gmailcoms-projects`.
- Pass `--scope dauren190307-gmailcoms-projects` and `--project debetter` whenever the CLI command supports those flags. Run `vercel --prod` only after the user explicitly requests a production deployment.

## Coding Style & Naming Conventions

- Use TypeScript (`.ts`, `.tsx`) and 2-space indentation.
- Components: PascalCase file and export names (e.g. `UserCard.tsx`).
- Hooks: `useX` naming in `hooks/` (e.g. `useTournamentData.ts`).
- Prefer functional, stateless components and React Server Components where appropriate.
- Keep Tailwind classes readable; group by layout -> spacing -> color.

## API & Data Layer

- Route all backend calls through the shared client in `lib/api.ts`; avoid raw `fetch`/`axios` in components and hooks.
- Reuse classes and types from the `types/` folder for data structures; do not redeclare ad-hoc interfaces near usage sites.

## Testing Guidelines

- There is no test runner configured yet; when adding tests, prefer Jest + React Testing Library.
- Name test files `*.test.ts(x)` and colocate near the code or in `__tests__/`.
- Cover critical flows (data fetching, forms, navigation) and shared utilities in `lib/`.

## Commit & Pull Request Guidelines

- Commit messages: imperative, concise, and descriptive (e.g. `Refactor tournament hooks`, `Fix tournament copy on homepage`).
- Group related changes into a single commit; avoid mixing refactors with behavioral changes.
- PRs should include: a clear summary, screenshots/GIFs for UI changes, and links to related issues or tickets.
- Ensure `npm run lint` passes and the app runs locally before requesting review.

## Delivery Pipeline

Use one of the execution modes defined in `.ai/README.md`.

### Cross-model mode

- Keep the original seven gates: Opus performs think, design, build, and ship; GPT Codex performs
  plan, review, and test.
- The reviewer is the other model and is read-only.

### Codex multi-agent mode

Use this mode when the user asks Codex to implement or orchestrate work, or when Opus is not
available.

- The primary Codex agent may plan, implement integration work, run tests, and coordinate delivery.
- Delegate independent build slices to Codex subagents with explicit file or subsystem ownership.
- No agent may approve code it authored. A different Codex agent must perform the read-only review;
  primary-authored code must be reviewed by a subagent.
- Keep reviews independent: do not give the reviewer an implementation task in the same pass.
- For a bounded issue that already has evidence and acceptance criteria, an in-session plan may
  replace separate think/design artifacts. For large, ambiguous, migration-heavy, security-, or
  privacy-sensitive work, use the Codex full-artifact variant from `.ai/README.md`; it keeps Codex
  doer/reviewer separation while requiring the complete artifact trail.
- The primary agent owns integration: inspect every diff, resolve overlap without discarding user
  changes, run focused tests and the repository-wide checks, and obtain an independent final review.
- Before delegation, record a per-repository dirty-worktree baseline and task-owned file/hunk map as
  defined in `.ai/README.md`. Serialize any slice that must touch a file with pre-existing changes.

In both modes, a BLOCKED verdict sends only the cited Must Fix items back to an implementation
agent. Re-review the fix before proceeding.

## Review Output

Every reviewer must end with this exact format:

```md
# Review Verdict

Reviewer: <Opus | GPT Codex | GPT Codex agent:task-name>
Step: <think | plan | design | build | review | test | ship>
Score: X.X / 10
Status: APPROVED or BLOCKED

## Reason
## Must Fix
## Should Consider
## Tests Reviewed
## Release Risk
```

Scoring is governed by `.ai/checklists/scoring-rubric.md`:

- Status is APPROVED only if Score is `>= 9.0`.
- Any Must Fix caps the score at `8.9`.
- Any security, data-loss, or build/test-breaking issue caps the score at
  `7.9` or lower.

## Commit Rules

- When committing, do not say it was co-authored by Claude or Codex.
- Do not add AI agents as collaborators in the GitHub project.
