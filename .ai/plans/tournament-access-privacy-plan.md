# Tournament Access and Privacy — Implementation Plan

## Delivery Order

Slice A first performs the small, shared `TournamentSpecification.java` refactor: reusable base
filters plus a separate public-visibility predicate. After that seam lands, A and C proceed in
parallel; Slice C consumes the base but does not edit the shared file. Slice B may proceed in
parallel except for `JudgeController.java`, whose #22 authorization hunk must land before the #23
response hunk. The primary agent serializes all dirty frontend integration files.

## Ownership

| Owner | Task-owned paths | Constraints |
| --- | --- | --- |
| Slice A agent (#22) | backend `TournamentSecurity.java`, exclusive `TournamentSpecification.java` base/public refactor, public tournament controller GET authorization annotations, focused visibility tests; frontend `TournamentHeader.tsx` and test | Do not edit `hooks/use-api.ts` or judge response mapping; publish the base-spec seam before Slice C and hand dirty tournament page/test integration to primary |
| Slice B agent (#23) | backend `JudgeView.java`, `JudgeMapper.java`, `JudgeController.java` response/filter logic, focused judge privacy tests; frontend `types/tournament/judge.ts`, `JudgesSection.tsx` and test | Begin `JudgeController` after Slice A annotation hunk; hand dirty tournament page/test prop integration to primary |
| Slice C agent (#25) | new backend membership controller/service/specification and focused tests; exclusive frontend `hooks/use-api.ts`, `app/my-tournaments/page.tsx` and test | Consume but never edit `TournamentSpecification.java`; add both `useMyTournaments` and any required #22 main-organizer hook in this one hook-file edit; hand locked `lib/api.ts` and `lib/api.test.ts` additions to primary |
| Primary integration | locked frontend `app/tournament/[id]/page.tsx`, its test, `lib/api.ts`, and its test; cross-slice conflict resolution and full verification | Preserve every baseline News hunk byte-for-byte; no unrelated cleanup |

Backend News/media/announcement/Docker/changelog paths and tests in the recorded baseline remain
unowned and locked. The four coordination artifacts are owned by `/root/security_artifacts`.

## Slice A — #22 Hidden Tournament Enforcement

1. Add a null-safe `canReadTournament(Authentication, tournamentId)` decision:
   visible/non-disabled is public; hidden requires EDIT/FULL; missing ID proceeds to the existing
   not-found behavior. Do not let VIEW bypass.
2. As the sole owner of `TournamentSpecification.java`, extract reusable base predicates for all
   `TournamentGetParams` fields, add a separate `publiclyVisible()` predicate, and make the public
   list compose `baseFilters(...).and(publiclyVisible())` before pagination. The base contains no
   disabled predicate.
3. Apply the read decision to all public ID-scoped GET methods in Tournament, Team,
   TournamentParticipant, Announcement/comments, Schedule, Judge, Feedback, RoundGroup, Round, and
   Match controllers. Keep mutation annotations unchanged.
4. Add `canControlVisibility` to `TournamentHeader`; retain `isOrganizer` for start/invite. Slice A
   does not edit hooks. Slice C adds a main-organizer hook in its exclusive `hooks/use-api.ts` edit
   if needed; primary integration compares the authenticated user to that main organizer.
5. Tests:
   - public list/search content and pagination omit hidden;
   - visible guest GETs still pass;
   - parameterized hidden detail/subresource GETs reject guest and VIEW;
   - EDIT/FULL can read hidden; only FULL can disable/enable;
   - re-enabled tournament returns to public list/detail;
   - FULL sees the toggle while EDIT/VIEW/guest do not.

## Slice B — #23 Judge Contact Privacy

1. Make `JudgeView.email` and `.phoneNumber` omitted when null. Add mapper methods for:
   - organizer view: current fields;
   - public view: no email/phone copy.
2. In judge list/detail GETs, compute contact permission from `Authentication` and tournament
   EDIT/FULL membership, then choose the mapper. Guests, VIEW participants, and unrelated organizers
   always use public mapping.
3. Validate both filters and every `Pageable.sort` order before querying:
   - without EDIT/FULL, reject `searchEmail`, `phoneNumber`, `sort=email`, or
     `sort=phoneNumber` with 403;
   - public sort whitelist is `id`, `fullName`, `checkedIn`;
   - EDIT/FULL sort whitelist additionally includes `email`, `phoneNumber`;
   - reject other unsupported sort properties with 400.
   Keep public name/social/check-in filters unchanged.
4. Make frontend contact fields optional. Render Email/Phone headers and cells only in an explicit
   organizer-contact state; primary passes that state from the existing organizer decision.
5. Tests:
   - guest, VIEW, and unrelated organizer list/detail JSON has no email/phone paths;
   - EDIT/FULL list/detail includes exact values;
   - private filter attempts and single/multi-order private sorts are rejected for unauthorized
     callers and work for EDIT/FULL;
   - public whitelist sorts work for all callers and unsupported fields return 400;
   - public component has no contact headers or values; organizer component retains them;
   - existing public match response remains contact-redacted.

## Slice C — #25 My Tournaments Membership Source

1. Add a dedicated controller at `GET /tournaments/mine` with `@PreAuthorize("isAuthenticated()")`.
   Bind existing `TournamentGetParams` and `Pageable`; derive `User.id` from `Authentication` only.
2. Add a dedicated membership service/specification joining `Tournament.tournamentRoles` for that
   user. Consume Slice A's reusable base `TournamentGetParams` specification, then compose only the
   role-aware membership visibility predicate. Never compose `publiclyVisible()`. Include visible
   VIEW/EDIT/FULL; include hidden only when the joined role is EDIT/FULL. Use distinct results
   defensively.
3. Return the existing `PageableResult<TournamentView>` contract.
4. Primary adds `api.getMyTournaments(...)` in the locked API client. Slice C adds a distinct SWR
   `useMyTournaments` key/hook and replaces only the three data-source calls on My Tournaments.
5. Tests:
   - one user with FULL, EDIT, and VIEW across different tournaments receives the deduplicated union;
   - unrelated and pending-invitation tournaments are absent;
   - accepted participant/co-organizer role rows appear after refresh;
   - hidden VIEW is absent and hidden EDIT/FULL is present, explicitly guarding against accidental
     reuse of the public visibility predicate;
   - anonymous denied; arbitrary `userId` cannot select another user;
   - date filters, pageable metadata, and sorting still work;
   - all three UI tabs call the scoped hook and preserve existing rendering/error/empty behavior.

## Integration Checks

1. Compare both repository diffs to the recorded baselines; any new unowned path is blocking.
2. Confirm #22 guards `/tournaments/mine` correctly: its literal route is authenticated and not
   mistaken for a numeric ID route.
3. Confirm #22 hidden rules and #25 hidden membership rules agree.
4. Confirm #23 organizer contact permission uses EDIT/FULL, while #22 visibility mutation remains
   FULL-only.
5. Confirm `hooks/use-api.ts` was changed only by Slice C and contains both scoped hooks required by
   integration; any later hook change is serialized through Slice C or primary.
6. Run focused tests, then the full frontend and backend commands from the task artifact.
7. Obtain independent per-slice reviews, integrate, then obtain a non-authoring final review with a
   score of at least 9.0 before any requested ship action.

## Rollback

- Backend and frontend for each slice can be reverted independently; there is no migration.
- Do not release frontend #25 before `/tournaments/mine` exists.
- If #23 frontend lags, optional contact fields prevent runtime breakage, but the backend privacy
  change must deploy first or atomically because frontend-only hiding is not protection.
