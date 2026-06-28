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

## Roles: 7-Step Pipeline

Every feature flows through the process in `.ai/README.md`.

- Codex reviews steps 1 (think), 3 (design), 4 (build), and 7 (ship). Codex is read-only on these
  steps and returns a scored verdict only.
- Codex is the doer on steps 2 (plan), 5 (review), and 6 (test). On steps 2 and 6 Codex may write
  only the named plan/test artifacts. On step 5 Codex is read-only and writes the holistic review
  pass for Claude to persist.
- The reviewer is always the other model. No model grades its own work.
- On a BLOCKED verdict, the doer fixes only the cited Must Fix items and resubmits.

## Review Output

Every reviewer must end with this exact format:

```md
# Review Verdict

Reviewer: <Opus | GPT Codex>
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
