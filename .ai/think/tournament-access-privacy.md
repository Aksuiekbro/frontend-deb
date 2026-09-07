# Tournament Access and Privacy — Think

## Confirmed Facts

- `Tournament.disabled` is mutated by FULL organizers, but public list/detail/nested GET routes are
  currently permitted and `TournamentSpecification` does not filter it.
- `TournamentSecurity` already owns VIEW/EDIT/FULL decisions. Participant registration and accepted
  participant invitations assign VIEW; accepted co-organizer invitations assign EDIT; tournament
  creation assigns FULL. This is the canonical accepted-membership record.
- `JudgeView` contains email and phone, and `JudgeController` maps it directly for public list/detail
  reads. The public filter object accepts email/phone criteria, and unrestricted `Pageable` sorting
  also permits ordering by those private fields.
- `MatchMapper` already redacts nested judge contacts for non-result-entry viewers; #23 should keep
  that existing protection and close the direct judge endpoints.
- My Tournaments calls the global `useTournaments` hook three times. The backend has no
  principal-scoped tournament endpoint.
- The frontend API client sends cookies (`credentials: "include"`), so the same public endpoint can
  safely produce an authenticated organizer view without a token in the URL.

## Decision Guardrail (40–70 Principle)

There is enough evidence to choose small contracts now, but not enough reason to invent a general
policy engine. The implementation should stop at the three issue outcomes: one reusable tournament
read decision, two judge serialization modes, and one principal-bound membership endpoint. Draft
states, new roles, admin impersonation, and broad privacy redesign are deferred.

## Selected Approach

### #22

- Reuse Spring method security and `TournamentSecurity`; do not create a second authorization
  framework.
- Split tournament querying into a reusable `TournamentGetParams` base specification with no
  visibility condition, a public `disabled != true` predicate, and a membership predicate. Public
  listing composes base + public; `/mine` composes base + membership. This keeps filtering in the
  database without accidentally excluding hidden EDIT/FULL memberships.
- A safe read helper treats `disabled != true` as public and hidden as readable only by EDIT/FULL.
  Apply it to all public GET methods beneath a tournament ID, including organizers, participants,
  teams, announcements/comments, schedules, judges, feedback, round groups, rounds, and matches.
- Preserve FULL-only visibility mutation. Add a separate frontend `canControlVisibility` signal
  derived from the existing main-organizer endpoint rather than treating every organizer as FULL.

This explicit method-security approach is preferred over a URI-parsing interceptor/filter: it uses
the project's current pattern, is auditable per endpoint, and avoids path parsing around `/api` and
the new literal `/tournaments/mine` route.

### #23

- Keep one judge URL and select serialization by `Authentication` plus EDIT/FULL membership.
- Reuse `JudgeView`, make private fields nullable/omitted in JSON, and add explicit public mapping
  methods that never copy email/phone. This minimizes client and routing change while keeping the
  backend authoritative.
- The UI receives optional contact fields and hides the entire contact columns when it is not in the
  authorized organizer-management state; it must not render rows of em dashes that imply missing
  data.
- Deny email/phone query filters and any multi-column sort containing `email` or `phoneNumber` to
  unauthorized callers. Merely removing response fields would leave count and ordering probes.
  Public callers use a documented sort whitelist (`id`, `fullName`, `checkedIn`); EDIT/FULL may also
  sort by `email` and `phoneNumber`.

A second `/judges/private` endpoint was rejected because it duplicates pagination/filter contracts
and requires more client/cache plumbing without improving the acceptance outcome.

### #25

- Add literal `GET /tournaments/mine`, protected by `isAuthenticated()`, with no user-id parameter.
- Use a dedicated membership service/specification joined through `tournamentRoles`, then combine
  the reusable base filters (not the public visibility specification) and pageable sort. This avoids
  profile-type branches, naturally deduplicates accepted roles, and retains hidden EDIT/FULL work.
- Hidden membership predicate is `(disabled != true) OR role IN (EDIT, FULL)`: organizers retain
  hidden work; participant VIEW does not see an event explicitly hidden from participants.
- Keep existing tab/date behavior by switching data source only. A later issue can fix overlapping
  date buckets or add cursor/infinite pagination.

Using organizer-profile and participant-team unions was rejected: it duplicates relationships,
risks mismatched acceptance timing, and is less direct than the role records already used for access.

## Key Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| One nested GET is missed | Inventory every tournament controller and parameterize hidden-route tests |
| Anonymous principal cast throws | New read/contact helpers accept `Authentication` and check principal type before casting |
| Public contact values survive in JSON | Separate public mapper path plus JSON-path absence tests; `NON_NULL` omission |
| Contact search/sort becomes an oracle | Reject email/phone filters and private sort terms without EDIT/FULL; enforce role-specific sort whitelists |
| Hidden event leaks through My Tournaments | Role-aware disabled predicate: only EDIT/FULL bypass |
| Public visibility is accidentally composed into `/mine` | One base specification, separate public/membership predicates, and a hidden EDIT/FULL regression test |
| Accepted invitation is absent | Query the same role row written by invitation acceptance and test refresh behavior |
| Cross-user membership enumeration | No user-id input; controller derives principal ID exclusively |
| Dirty News work is overwritten | Locked baseline plus primary-only serialized edits on dirty files |
| Two agents edit `hooks/use-api.ts` | Slice C owns the file exclusively and carries any #22 main-organizer hook needed by integration |

## Open Assumptions for Reviewer

- Existing semantics are intentional: FULL is the main organizer, EDIT is a co-organizer, VIEW is an
  accepted participant.
- HTTP 403 for a known hidden resource is acceptable under #22; anti-enumeration 404 behavior is not
  part of the issue.
- Judge social profiles and check-in remain public because #23 is expressly limited to email/phone.
- No database migration is required because all three changes use existing columns and role rows.
