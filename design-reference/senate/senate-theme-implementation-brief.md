# Senate Theme — Implementation Brief for Claude Code

This is the handoff document for getting the "Senate" theme (and the mobile-responsive pass) out of this OpenDesign prototype and into the real `debetter_1` Next.js codebase. It's written to be read directly by a coding agent (Claude Code or similar) working inside that repo.

**Status: scope now covers the whole app** (expanded from the original 5-page brief per the user's request). See §2.

---

## 0. First: copy the reference files into the repo

I can't write into `debetter_1` from here — it's linked read-only to this design project. Run this yourself (PowerShell, on this machine) once, before opening Claude Code:

```powershell
$src = "C:\Users\nuamy\AppData\Roaming\Open Design\namespaces\release-stable-win\data\projects\e806e844-3618-4abf-9f0a-8ef44ff66a3c"
$dst = "C:\Users\nuamy\Desktop\debetter_1\design-reference\senate"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item "$src\landing.html","$src\auth.html","$src\profile.html","$src\join-debates.html","$src\create-debate.html","$src\index.html","$src\brand-spec.md","$src\senate-theme-implementation-brief.md" -Destination $dst
Copy-Item "$src\assets" -Destination $dst -Recurse
Copy-Item "$src\assets-extended" -Destination $dst -Recurse
```

This puts a working, verified HTML/CSS prototype for the 5 core pages, plus `brand-spec.md`, plus reference images for the rest of the app, at `design-reference/senate/` inside your repo. **The prototype is ground truth for the 5 core pages** — colors, spacing, and behavior should be read directly from `design-reference/senate/assets/theme.css`, not re-derived or guessed. The `assets-extended/` images are reference material for the newly in-scope pages — Claude Code is designing those pages itself (see §4b), using these images and the same token system, not copying a pre-built layout.

---

## 1. The prompt to paste into Claude Code

Open Claude Code in `debetter_1`, then paste this as your first message:

```
Implement the "Senate" visual theme plus a full mobile-responsive pass across
this ENTIRE app, following design-reference/senate/senate-theme-implementation-brief.md
exactly. Before writing any code, read that entire file and everything under
design-reference/senate/. The 5 HTML/CSS files there (landing, auth, profile,
join-debates, create-debate) are a working, verified prototype and are ground
truth for every color, spacing value, and interaction on those pages — don't
invent or approximate values that are already defined there. For the
additional pages in §4b, you're designing the actual layout yourself — use
the theme tokens, the reference images provided, and the page's real current
content/logic as your basis, using your own design judgment for composition.

Work in this order and show me a plan before you start each phase:
1. Wire up the theme token system and the single Classic/Senate toggle button.
2. Restyle the 5 core pages/components to match the prototype exactly.
3. Design and restyle the additional pages listed in §4b, using the token
   system and assigned reference images — use your judgment on how literal
   vs. restrained each page's treatment should be (§4b has notes per page).
4. Do a mobile-responsive pass on anything not already covered.

Ask me before touching anything not listed in the brief's scope table.
```

---

## 2. Scope

| Area | Gets the Senate theme | Mobile-responsive |
|---|---|---|
| Header / footer (global chrome) | ✅ full | ✅ |
| Landing (`app/page.tsx` → `debetter-homepage.tsx`) | ✅ full — ground-truth prototype | ✅ |
| Auth (`app/auth`, `AuthPageClient.tsx`) | ✅ full — ground-truth prototype | ✅ |
| Profile (`app/profile`, `ProfileClient.tsx`) | ✅ full — ground-truth prototype | ✅ |
| Join Debates (`app/join`) | ✅ full — ground-truth prototype | ✅ |
| Host/Create Debate (`app/create-tournament`, `HostDebate.tsx`) | ✅ full — ground-truth prototype | ✅ |
| Dashboard (`app/dashboard`) | ✅ Claude designs it, see §4b | ✅ |
| Organizer home (`app/organizer`, `WelcomeCard.tsx`, `OrganizerBelow.tsx`) | ✅ Claude designs it, see §4b | ✅ |
| My Tournaments (`app/my-tournaments`) | ✅ Claude designs it, see §4b | ✅ |
| Rating (`app/rating`) | ✅ Claude designs it, see §4b | ✅ |
| News (`app/news`) | ✅ Claude designs it, see §4b | ✅ |
| Tournament detail/control (`app/tournament/[id]`, `components/tournament/*`) | ⚠️ header band only, see §4b — not a full backdrop | ✅ |

The toggle button switches the Senate look across the whole app. Every page keeps its Classic look pixel-identical to today when the toggle is set to Classic.

`app/tournament/create/page.tsx` is an unlinked duplicate of `app/create-tournament` (same `HostDebate` component, no nav link to it) — leave it alone unless it turns out to be used somewhere.

**Why the tournament detail page gets a lighter treatment:** it's the one genuinely data-dense operational screen in the app — pairings, results, teams, judges, live scoring. A full-bleed photo backdrop behind dense tables would hurt legibility and would be decoration for its own sake. Keep the Senate identity present (tokens, typography, a header band with `triumphal-procession.webp`) without putting a photo behind working data. Use your judgment here; this is the one page where "restrained" beats "literal."

---

## 3. Why this needs a real architecture change (not just new colors)

The live app currently hardcodes colors directly in JSX as Tailwind arbitrary values (`bg-[#0D1321]`, `text-[#4a4e69]`, etc.) — there's no token layer to swap. `app/globals.css` has an unused shadcn `:root`/`.dark` block, and `components/theme-provider.tsx` (next-themes) exists but isn't wired into `app/layout.tsx`. That's for light/dark mode and is **not** what this uses — don't reuse it.

The approach that makes this a clean, reusable swap instead of forking every component:

1. Add both token sets as CSS custom properties in `app/globals.css`, scoped under `[data-theme="classic"]` / `[data-theme="senate"]` — copy them verbatim from `design-reference/senate/assets/theme.css`. Classic's values must match today's real hex values exactly (they already do in the prototype — they were read from this same codebase).
2. Set `data-theme` on `<html>` via a small inline script in `app/layout.tsx` `<head>` (runs before hydration, avoids a flash of the wrong theme) that reads `localStorage.getItem('debetter-theme')`, defaulting to `"classic"`.
3. Add a small client component (`components/theme-toggle.tsx`) — one pill-style button, same visual spec as the prototype's `.theme-toggle` — that flips `document.documentElement.dataset.theme` and persists to `localStorage`. Mount it in `components/Header.tsx`.
4. On every in-scope page, replace hardcoded hex Tailwind classes with arbitrary-value **CSS-variable** references — e.g. `bg-[#0D1321]` → `bg-[var(--surface)]`, `text-[#4a4e69]` → `text-[var(--muted)]`. Same JSX/markup, same logic, the CSS variable swap is what makes it re-theme. Token names are in `brand-spec.md` and `assets/theme.css`.
5. Use the same fixed full-page backdrop pattern from the prototype (`.page-backdrop`, see `assets/theme.css`) for the new pages too, except tournament detail (§2) — one `<img>` + scrim, `position: fixed; inset: 0; z-index: -1`, content in `.panel` frosted cards on top. Don't use `background-attachment: fixed` (unreliable on mobile Safari) — the prototype's fixed-positioned-div approach is deliberate.

---

## 4. Per-file map — the 5 core pages (ground truth, pixel-match the prototype)

| Prototype file | Real file(s) to edit | Notes |
|---|---|---|
| `assets/theme.css` | `app/globals.css` (add a scoped block) | Copy the `:root`/token/component CSS verbatim; keep existing Tailwind layers intact |
| — | `app/layout.tsx` | Add the inline anti-FOUC theme script to `<head>`; import Cinzel via `next/font/google` alongside the existing Hikasami setup |
| — | `components/theme-toggle.tsx` (new) | Toggle button component; see `.theme-toggle` in the prototype for exact markup/behavior |
| `landing.html` (header/footer sections) | `components/Header.tsx`, `components/HeaderWrapper.tsx` | Restyle nav, add mobile hamburger + drawer (see prototype `.nav-drawer`), mount theme toggle. Footer currently only exists inline in `app/join/page.tsx` in the real app — extract it into a shared `components/Footer.tsx`, used on every in-scope page |
| `landing.html` | `app/page.tsx`, `debetter-homepage.tsx` | Full-page fixed backdrop (`assets/senate/forum-panorama.png`), hero, Upcoming Debates cards, Community Voices — reuse real API data (`useUpcomingTournaments`), just restyle |
| `auth.html` | `app/auth/AuthPageClient.tsx` | Restyle only — keep all existing state/validation/API-call logic exactly as-is. Backdrop: `assets/senate/river-council.png` |
| `profile.html` | `app/profile/[id]/ProfileClient.tsx`, `app/profile/page.tsx` | Restyle only — keep `AvatarWithEdit`, `SocialsManager`, `LogoutButton` and their logic. Backdrop: `assets/senate/aqueduct.png` |
| `join-debates.html` | `app/join/page.tsx` | Restyle filters sidebar (→ mobile sheet), cards, search/sort, registration modal — keep all fetch/filter/registration logic exactly as-is. Backdrop: `assets/senate/senate-oration.png` |
| `create-debate.html` | `app/create-tournament/page.tsx`, `components/host/HostDebate.tsx` | Restyle the form shell only — keep every field, validation rule, and submit handler exactly as-is. Backdrop: `assets/senate/senate-assembly.png` |

Images: copy `design-reference/senate/assets/senate/*.png` into `public/images/senate/`. Fonts: `design-reference/senate/assets/fonts/*.woff2` are the same files already in `public/fonts/` — no need to duplicate, just add the Cinzel `@font-face`/`next/font`.

---

## 4b. Per-file map — additional pages (Claude designs these; images + notes provided)

These pages don't have a pre-built HTML prototype — I read their real current content below so the image choice fits, but the actual layout/composition is yours to design using the token system and the discipline in this brief (one accent used sparingly, frosted `.panel` cards over the backdrop, no horizontal scroll, 44px touch targets, contrast rules from §3 of `brand-spec.md`).

Reference images are at `design-reference/senate/assets-extended/`. **They're large, unoptimized originals (5–10MB some of them)** — export/compress reasonably-sized web versions when you actually use them (same visual quality, much smaller file size), same as the 6 already in `assets/senate/`.

| Page | Real file(s) | What's actually on it today | Assigned image | Treatment notes |
|---|---|---|---|---|
| Dashboard | `app/dashboard/page.tsx` | Personal home: welcome hero, gradient "welcome back" panel with avatar + stats grid (tournaments/upcoming/rating/ranking), Upcoming Debates cards, Past Debates cards, Community Highlights, Leaderboard teaser | `fortress-harbor.jpg` (epic fortress/harbor, marching red-cloaked army) | Full-page backdrop, same pattern as Landing. This is the logged-in equivalent of Landing — should feel related but distinct |
| Organizer home | `app/organizer/page.tsx`, `components/organizer/WelcomeCard.tsx`, `components/organizer/OrganizerBelow.tsx` | Reuses the public homepage top sections plus an organizer-specific `WelcomeCard` (avatar, stats: Tournaments/Active Tournaments) and `OrganizerBelow` | `plaza-assembly.jpg` (grand plaza, red-robed crowd approaching a domed civic building) | Full-page backdrop. The crowd-before-a-civic-building mood fits "running the event," distinct from Dashboard's fortress |
| My Tournaments | `app/my-tournaments/page.tsx` | Past/Ongoing/Upcoming tabs over a list of dark tournament cards (image, location, date, tags, status, description, team count) | `greek-overlook.jpg` (sunlit Greek temple overlooking a valley) | Full-page backdrop. Calmer/brighter mood for a personal-history page — deliberately different energy from the crowd scenes elsewhere |
| Rating | `app/rating/page.tsx` | Currently just a disabled "Champions" placeholder with ghost text — genuinely thin content today | `ceremony-baptism.webp` (Raphael's *Baptism of Constantine* fresco — public domain) | Full-page backdrop. Literal fit for "Champions" — a formal, ceremonial scene. Since content is currently just a placeholder, keep the empty state honest (don't invent fake leaderboard data) |
| News | `app/news/page.tsx` | "Past debates" ghost-text heading over a 3-column grid of news cards (gradient thumbnail + title + tags + date + excerpt) | `golden-harbor.jpg` (golden-hour harbor city with temples and boats, chronicle/archive mood) | Full-page backdrop or a header band — your call based on how the card grid reads against it; if full backdrop, make sure card thumbnails (which have their own gradient) don't visually compete with the page backdrop |
| Tournament detail/control | `app/tournament/[id]/page.tsx`, `components/tournament/TournamentHeader.tsx`, `TournamentTabs.tsx`, `PairingsSection.tsx`, `ResultsSection.tsx`, `TeamsSection.tsx`, `JudgesSection.tsx`, `NewsSection.tsx`, `FeedbackSection.tsx` | Dense operational control panel: header, tabbed sections for pairings/results/teams/judges/news/feedback, several modals (add judge, add post, invite, edit team) | `triumphal-procession.webp` (ornate classical fresco, triumphal procession) | **Header band only** — see §2 for why. Everything below the header stays on plain token surfaces (`--bg`/`--surface`/`--panel`), no photo behind tables or forms |

**Two more images weren't previewable here** (AVIF format, my tools couldn't decode them): `VN4VK5R75RE7DELIJ67G6NPPZ4.avif` and `gettyimages-802428712.avif`, both at project root in Design Files (not yet copied into `assets-extended/`). They're unassigned spares — open them yourself or have Claude Code look at them if you want an alternate for any page above, or a treatment for a secondary state (e.g., an empty-state illustration).

---

## 5. Mobile requirements (apply everywhere)

- No horizontal scroll at 360/390/430/600/768/820/1024/1366/1440/1920px on **every** page.
- All interactive elements ≥44px touch target.
- Header collapses to a hamburger + slide-in drawer below ~860px (see prototype `.nav-drawer`).
- Join Debates filters collapse into a bottom sheet below 900px (see prototype's `data-filter-drawer` pattern) — the filter controls must be the same DOM nodes moved into the sheet, not a duplicate copy, so state stays in sync.
- Registration modal and any other dialogs become full-height bottom sheets below ~560px.
- Cards/lists that are side-by-side on desktop stack full-width on mobile.
- Tournament detail page: its many tabs/tables need real mobile treatment (horizontal tab scroll or a select-style switcher, tables that reflow to cards) — this page has the most mobile risk in the app, budget real time for it.

---

## 6. Acceptance checklist

- [ ] Classic theme is visually identical to the current production app, pixel for pixel, on every page
- [ ] One toggle button in the header, persisted via `localStorage`, present and effective on every page
- [ ] Each core page's backdrop image matches §4, each additional page's matches §4b, all copied locally (not hotlinked) and reasonably compressed for the web
- [ ] Scrims are strong enough that text passes 4.5:1 (body) / 3:1 (large text/icons) at every breakpoint, on every page
- [ ] Tournament detail page: header band only, no photo behind data tables/forms
- [ ] All existing logic (auth flow, registration flow, filters, HostDebate submit/validation, tournament pairings/results/judging) unchanged — this is a visual-only pass
- [ ] No horizontal scroll anywhere in the app at any of the breakpoints in §5
- [ ] Real browser check: run the dev server, click through every page in both themes, resize to mobile, check the console for errors

---

## Next step

1. Run the PowerShell copy command in §0 (now includes `assets-extended/`).
2. Paste the prompt in §1 into Claude Code inside `debetter_1`.
3. Since Claude Code is doing real layout design on the pages in §4b (not just restyling a ground-truth prototype like the 5 core pages), expect to review and give feedback on its first pass rather than a one-shot perfect result — that's normal for pages without a pre-built reference.
