# Tournament Access and Privacy Task

## Metadata

- GitHub issues: #22, #23, #25
- Execution mode: Codex multi-agent full-artifact variant
- Repositories: `frontend-deb`, `debetter-backend-sync`
- Risk: High (authorization, privacy, and user-scoped data)
- Artifact doer: GPT Codex agent `/root/security_artifacts`
- Artifact reviewer: must be a different, read-only agent

## Goal

Close three proven access-control gaps without redesigning tournament publishing or account roles:

1. A disabled tournament is absent from public discovery and unreadable through public detail or
   nested GET routes, while its authorized organizers retain access (#22).
2. Judge email and phone values are never serialized to guests, participants, or unrelated
   organizers, while EDIT/FULL tournament organizers retain them (#23).
3. **My Tournaments** reads only the authenticated user's accepted VIEW/EDIT/FULL tournament
   memberships (#25).

## Scope

### Slice A — Hidden tournament reads (#22)

- Refactor the existing `TournamentGetParams` predicates into one reusable base specification with
  no visibility rule. Compose that base with a separate `disabled != true` public-list predicate
  before pagination. `/tournaments/mine` must compose the base with its own role-aware visibility
  predicate and must never reuse the public-list predicate.
- Add one null-safe `TournamentSecurity` read decision and apply it to every public tournament
  detail/subresource GET. Visible tournaments remain public; hidden tournaments require EDIT or
  FULL for that tournament. VIEW does not bypass a state labelled "Hidden from participants."
- Keep the existing FULL-only enable/disable permission.
- Show the visibility control only to the main/FULL organizer; co-organizers retain their existing
  EDIT actions.
- `hooks/use-api.ts` has one owner (Slice C). Slice A does not edit it; any main-organizer hook needed
  by #22 is added by Slice C in its single owned hook-file edit and consumed during integration.

### Slice B — Judge contact privacy (#23)

- Keep the existing judge endpoints and page shape, but select a public-safe or organizer mapping
  from the authenticated request context.
- Public-safe judge JSON omits `email` and `phoneNumber`; EDIT/FULL organizer JSON includes them.
- Reject private email/phone judge filters and any `sort=email` or `sort=phoneNumber` term for
  callers without EDIT/FULL so response counts/order cannot be used as a contact-data oracle.
  Public sort is limited to `id`, `fullName`, and `checkedIn`; EDIT/FULL additionally permits
  `email` and `phoneNumber`.
- Render contact columns only in the organizer management view. Make frontend contact fields
  optional because the public response intentionally omits them.

### Slice C — Authenticated memberships (#25)

- Add authenticated `GET /tournaments/mine` with the existing filter, sort, and pageable contract.
- Derive the user ID only from `Authentication`; accept no target-user ID.
- Query `user_tournament_role`: VIEW = accepted participant, EDIT = accepted co-organizer,
  FULL = main organizer. The table's unique user/tournament key provides union and deduplication.
- Pending invitations remain excluded because they do not create a role until acceptance.
- For hidden tournaments, include EDIT/FULL memberships and exclude VIEW memberships.
- Replace the three generic hooks on My Tournaments with the user-scoped hook while preserving the
  existing Past/Ongoing/Upcoming presentation; date-bucket redesign remains out of scope.

## Acceptance Mapping

| Issue criterion | Required evidence |
| --- | --- |
| #22 public list/search excludes disabled | Repository/controller test asserts content, totals, and pages omit hidden records; specification test proves public visibility is composed separately from base filters |
| #22 direct and nested reads deny guests/VIEW | Parameterized MockMvc coverage across every public tournament GET controller |
| #22 organizers can manage and re-enable | EDIT/FULL hidden read tests; FULL disable/enable/read round trip |
| #22 control matches backend permission | Header/page tests: FULL sees toggle, EDIT/VIEW/guest do not |
| #23 guest/participant receive no contacts | JSON-path absence tests for judge list and detail; unauthorized private filter/sort tests return no results or ordering data |
| #23 authorized organizer retains contacts | EDIT and FULL JSON-path value tests |
| #23 private query controls match permission | Guest/VIEW/unrelated private filters and private sort terms return 403; public-whitelist sorts succeed; EDIT/FULL email/phone filters and sorts succeed; unsupported properties return 400 |
| #23 frontend handles public shape | Component tests prove public table has no contact headers/values and organizer table does |
| #25 accepted role union only | Repository/controller tests for FULL, EDIT, VIEW, unrelated, pending, and mixed memberships, including hidden EDIT/FULL results that would fail if the public visibility predicate were reused |
| #25 no cross-user lookup | Anonymous request denied and endpoint has no user-id input; authenticated result is principal-bound |
| #25 existing tabs use scoped source | Page/hook tests assert all three queries target `/tournaments/mine` and exclude unrelated fixtures |

## Non-Goals

- Draft/publish states, preview-as-participant, invitations UI, notification history, date-bucket
  redesign, dashboard redesign, or general profile privacy.
- Changing FULL/EDIT/VIEW meanings or adding a schema migration.
- Hiding judge names, public social identity, or check-in state beyond the issue's email/phone scope.
- Returning another user's memberships to admins or organizers.

## Failure Policy

- Unauthorized hidden reads return no tournament payload (403 is acceptable); nonexistent resources
  continue through the normal 404 path.
- Unauthorized private judge filters or any pageable sort containing `email`/`phoneNumber` return
  403 instead of being silently ignored. Unsupported non-private sort properties return 400.
- `/tournaments/mine` is method-secured even though the current broad GET matcher permits
  `/tournaments/**`; missing authentication returns no membership data.
- Frontend 401/403/404 responses use existing loading/error behavior; no cached public fallback may
  display protected data.

## Baseline and Constraints

- Compare all work to `.ai/runs/issues-22-26-baseline-frontend.txt` and
  `.ai/runs/issues-22-26-baseline-backend.txt`.
- Frontend locked pre-existing paths: `app/tournament/[id]/page.tsx`, its test, `lib/api.ts`, its
  test, and untracked `app/news/[id]/`. Only the primary integration agent may add serialized,
  task-specific hunks to the four tracked files.
- All pre-existing backend News/media/announcement/Docker/changelog changes and tests are locked.
- If an implementation requires a new dirty-path overlap, stop the slice and hand it to the primary
  integration agent. Do not restore, reformat, or rewrite unrelated hunks.

## Verification

- Focused frontend Jest: header, judges, My Tournaments, API/hook, and serialized page integration.
- Focused backend Maven: tournament visibility/access, judge privacy, and membership query/controller.
- Then frontend `npm test -- --runInBand`, `npm run lint`, `npx tsc --noEmit`, `npm run build`;
  backend `./mvnw test`.
- Independent slice reviews and final read-only review must each score at least 9.0.
