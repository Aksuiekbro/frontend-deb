# Tournament Access and Privacy — Design

## Authorization Matrix

| Operation | Guest | Unrelated user/organizer | VIEW participant | EDIT co-organizer | FULL organizer |
| --- | --- | --- | --- | --- | --- |
| List visible tournament | Allow | Allow | Allow | Allow | Allow |
| List hidden tournament publicly | Omit | Omit | Omit | Omit | Omit |
| Read visible detail/subresource | Allow | Allow | Allow | Allow | Allow |
| Read hidden detail/subresource | Deny | Deny | Deny | Allow | Allow |
| Toggle visibility | Deny | Deny | Deny | Deny | Allow |
| Read judge email/phone | Deny | Deny | Deny | Allow | Allow |
| Filter judges by email/phone | Deny | Deny | Deny | Allow | Allow |
| Sort judges by email/phone | Deny | Deny | Deny | Allow | Allow |
| Read `/tournaments/mine` | Deny | Own roles only | Own roles only | Own roles only | Own roles only |

`disabled == true` is hidden; `false` or legacy null remains public. Authorization always comes from
the backend. Frontend visibility is presentation only.

## #22 Read Contract

Tournament specifications are deliberately composable:

```text
baseFilters(params, entityManager)       // search/tags/dates/league/nonFull only
publiclyVisible()                        // disabled != true only
membershipVisibleTo(principalUserId)     // own role and role-aware disabled rule only

GET /tournaments      = baseFilters AND publiclyVisible
GET /tournaments/mine = baseFilters AND membershipVisibleTo
```

The Slice A agent exclusively owns the base/public refactor in `TournamentSpecification.java` and
lands that seam before Slice C consumes it. Slice C must not add `publiclyVisible()` to `/mine`,
because doing so would hide disabled EDIT/FULL organizer memberships.

Public list:

```http
GET /tournaments?...pageable
200 { "content": [/* disabled != true only */], "totalElements": N, "totalPages": P }
```

ID-scoped GET decision:

```text
if tournament does not exist -> allow service/controller to produce existing 404
if disabled != true          -> allow
if principal is User and role row is EDIT or FULL -> allow
otherwise                    -> deny without response body data
```

The decision belongs in `TournamentSecurity` and is referenced by method-security annotations on
every public ID-scoped GET. Mutation authorization remains unchanged. Database list filtering must
be part of the criteria query, not post-page filtering.

Frontend separates:

```ts
isOrganizer: boolean          // existing EDIT/FULL management UI
canControlVisibility: boolean // current user is main/FULL organizer
```

The header uses the second value only for the switch; the server remains authoritative.

## #23 Response Contract

Public/VIEW/unrelated response:

```json
{
  "id": 12,
  "fullName": "Aigerim Judge",
  "socialProfiles": [],
  "checkedIn": false
}
```

EDIT/FULL response from the same route:

```json
{
  "id": 12,
  "fullName": "Aigerim Judge",
  "email": "judge@example.com",
  "phoneNumber": "+77010000000",
  "socialProfiles": [],
  "checkedIn": false
}
```

`email` and `phoneNumber` use `NON_NULL` omission. Public mapping explicitly ignores both values;
it must not map then rely on frontend hiding. Contact permission is:

```text
authenticated User AND global role ORGANIZER AND tournament role in {EDIT, FULL}
```

The same decision selects list/detail mapping and permits private filters/sorts. Validate the full
sort order list before repository access:

```text
public sort properties:    id, fullName, checkedIn
EDIT/FULL additions:       email, phoneNumber
unauthorized private term: 403
other unsupported term:    400
```

Thus public calls containing `searchEmail`, `phoneNumber`, `sort=email`, or `sort=phoneNumber`
fail with 403, including when a private term is the second item in a multi-sort. Existing
`MatchMapper` contact redaction remains and gets a regression assertion.

Frontend contract:

```ts
interface JudgeResponse {
  id: number
  fullName: string
  email?: string
  phoneNumber?: string
  socialProfiles: SocialProfileResponse[]
  checkedIn: boolean
}
```

`JudgesSection` accepts an explicit `showContactDetails` boolean. When false it omits both headers
and cells, adjusts `colSpan`, and retains name/check-in. Organizer mutations remain separately
controlled by existing callbacks.

## #25 Membership Contract

```http
GET /tournaments/mine?startDateFrom=...&page=0&size=20&sort=startDate,asc
Cookie: authenticated session
```

Response reuses `PageableResult<TournamentView>`. There is no `userId`, username, profile ID, or role
parameter.

Conceptual predicate:

```sql
SELECT DISTINCT t
FROM Tournament t
JOIN t.tournamentRoles membership
WHERE membership.user.id = :principalUserId
  AND (
    t.disabled IS NOT TRUE
    OR membership.role IN ('EDIT', 'FULL')
  )
  AND <reusable base TournamentGetParams predicates; no public visibility predicate>
ORDER BY <Pageable sort>
```

The unique `(user_id, tournament_id)` constraint is the primary deduplication guarantee; DISTINCT
is defensive. Invitation rows are deliberately not joined. Once an acceptance transaction assigns
VIEW or EDIT, the next read includes the tournament.

Use a dedicated controller/service/membership specification rather than modifying profile DTOs.
The membership service consumes Slice A's reusable base predicates and adds its own role-aware
visibility predicate; it never composes `publiclyVisible()`. This keeps authorization
principal-bound, includes hidden EDIT/FULL work, and avoids touching shared `TournamentService`.

Frontend adds:

```ts
api.getMyTournaments(params, pageable) // GET /tournaments/mine
useMyTournaments(params, pageable)     // separate SWR key
useTournamentMainOrganizer(id)         // added by Slice C only if #22 integration needs it
```

`hooks/use-api.ts` is exclusively owned by Slice C for this delivery. Slice A does not edit it. My
Tournaments changes only its hook calls; current translations, cards, tabs, filters, and empty
states stay intact.

## Failure Modes

| Condition | Result |
| --- | --- |
| Hidden GET by guest/VIEW | 403, no tournament/subresource payload |
| Missing tournament | Existing 404 path |
| Private judge filter without permission | 403, no query result/count |
| Private judge sort without permission | 403 before query; no ordering oracle |
| Unsupported public judge sort | 400 before query |
| Public judge has null source contact | Field omitted, never rendered |
| `/tournaments/mine` without valid session | 401/403, no data |
| Stale/pending invitation | No role row, so absent |
| Membership removed | Role removal makes it absent on refresh |
| Hidden VIEW membership | Absent from My Tournaments and direct reads |
| Hidden EDIT/FULL membership | Present in My Tournaments and directly manageable |

## Test Boundaries

- Authorization assertions must inspect HTTP status and JSON absence, not only mocked helper calls.
- Repository tests verify filtering occurs before pagination/sorting and that base/public/membership
  specifications are composed independently.
- Judge tests cover private fields as the first and later sort order, EDIT/FULL success, public
  whitelist success, and unsupported-sort rejection.
- Parameterized nested-route coverage prevents an unannotated controller from becoming a privacy
  bypass.
- Frontend tests verify DOM absence of protected columns/values and principal-scoped API selection.
- No E2E test may place real emails, phone numbers, credentials, or production data in fixtures or
  logs.

## Deployment and Compatibility

- No schema or data migration.
- Deploy backend privacy enforcement before or with frontend changes.
- `/tournaments/mine` is additive. Public `/tournaments` remains compatible except that hidden
  records are correctly removed.
- Judge clients must tolerate omitted contact keys; this repository's type becomes optional in the
  same release.
