# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js app router pages, layouts, and route handlers.
- `components/`: Reusable UI components; prefer domain‑focused subfolders.
- `hooks/`: Reusable React hooks (client or shared).
- `lib/` and `types/`: Cross‑cutting utilities, API helpers, and shared TypeScript types.
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
- Use TypeScript (`.ts`, `.tsx`) and 2‑space indentation.
- Components: PascalCase file and export names (e.g. `UserCard.tsx`).
- Hooks: `useX` naming in `hooks/` (e.g. `useTournamentData.ts`).
- Prefer functional, stateless components and React Server Components where appropriate.
- Keep Tailwind classes readable; group by layout → spacing → color.

## API & Data Layer
- Route all backend calls through the shared client in `lib/api.ts`; avoid raw `fetch`/`axios` in components and hooks.
- Reuse classes and types from the `types/` folder for data structures; do not redeclare ad‑hoc interfaces near usage sites.

## Testing Guidelines
- There is no test runner configured yet; when adding tests, prefer Jest + React Testing Library.
- Name test files `*.test.ts(x)` and colocate near the code or in `__tests__/`.
- Cover critical flows (data fetching, forms, navigation) and shared utilities in `lib/`.

## Commit & Pull Request Guidelines
- Commit messages: imperative, concise, and descriptive (e.g. `Refactor tournament hooks`, `Fix tournament copy on homepage`).
- Group related changes into a single commit; avoid mixing refactors with behavioral changes.
- PRs should include: a clear summary, screenshots/GIFs for UI changes, and links to related issues or tickets.
- Ensure `npm run lint` passes and the app runs locally before requesting review.
