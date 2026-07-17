# Post-Preliminary Win/Loss-Only Results Plan

## Status

Implemented locally in the frontend and backend. Focused frontend tests and lint pass; backend test
execution is pending because this machine has no Java 21 runtime.

## Goal

Keep speaker-point entry in `PRELIMINARY` rounds, but make `TEAM_ELIMINATION` and
`SOLO_ELIMINATION` result entry Win/Loss-only.

Example:

- Preliminary APF: Team A = Win, Team B = Loss, and every speaker receives points.
- Team elimination APF: Team A = Win and Team B = Loss; no speaker-point inputs or values.
- Solo elimination LD: Speaker A = Win and Speaker B = Loss; no numeric score inputs or values.

This follows `docs/future-plans/tournament-formats-requirements.md`: speaker points are entered only
during preliminary rounds and LD records the winning speaker.

## Scope

- Pass the selected round-group type into results UI instead of inferring the stage from a round label.
- Make result validation, payload creation, draft persistence, completed/read-only state, and copy
  conditional on the stage.
- Keep all existing preliminary speaker-point entry, repair, standings, and speaker-detail behavior.
- Make Pairings progression use stage-aware completion rules so scoreless elimination results can
  advance the bracket.
- Update unit and end-to-end coverage for the new stage-specific behavior.

## Non-Goals

- Do not change preliminary standings or speaker ranking calculations.
- Do not encode Win/Loss as synthetic `1/0` participant scores.
- Do not infer the stage from names such as `Final`, `1/8`, or `Round 1`.
- Do not redesign the results workspace or introduce a new state-management abstraction.

## Implemented Backend Contract

1. `TEAM_ELIMINATION` accepts `teamResults: [{ teamId, won }]` with `participantScores` omitted.
2. `SOLO_ELIMINATION` accepts `winnerParticipantId` and rejects synthetic speaker points.
3. Match responses expose the persisted `winnerParticipantId` to authorized organizers.
4. Elimination matches expose participant-score completeness/repairability as not applicable.
5. Bracket progression uses team outcome flags or `winnerParticipantId`; legacy LD score winners
   remain readable as a compatibility fallback.

## Implementation Slices

### 1. Align shared result types with the verified backend

- Update `types/tournament/match.ts` only to match the confirmed backend request and response.
- Make team participant scores optional only if the backend permits omission.
- Add the confirmed solo outcome fields.
- Keep preliminary score types unchanged.

### 2. Plumb the explicit stage into result entry

- In `app/tournament/[id]/page.tsx`, pass `selectedRoundGroup?.type` to `ResultsSection`.
- In `ResultsSection`, explicitly recognize team/solo elimination and use
  `requiresSpeakerPoints = !isOutcomeOnlyStage`.
- Treat an unknown/loading stage conservatively: do not enable a scoreless submission until the type
  is known.

### 3. Make team elimination outcome-only

- Preserve the current accessible Team Win/Loss button group.
- Hide the Speaker points header, cells, inputs, and missing-speaker warning outside Preliminary.
- Change the elimination heading from `<round> results and speaker points` to `<round> results`.
- Consider APF complete after exactly one Win and one Loss.
- Consider BPF complete after exactly two Wins and two Losses.
- Build a team-elimination payload with outcome fields only, following the verified backend shape.
- Persist and hydrate result drafts without score drafts.
- Render persisted completed outcomes read-only after reload.
- Make validation/help copy mention only the required outcome count.

### 4. Make solo elimination outcome-only

- Render the same Win/Loss control semantics for each debater instead of deriving the result from
  numeric scores.
- Selecting one side in a two-debater match must automatically select the opposite result for the
  other side, matching the current APF interaction.
- Require exactly one Win and one Loss.
- Submit and hydrate the backend-confirmed solo outcome fields.
- Do not retain hidden numeric score requirements.

### 5. Make Pairings progression stage-aware

- Pass the existing `selectedStage` into completion evaluation.
- Preliminary completion continues to require valid outcomes and all required participant scores.
- Team elimination completion requires only a valid team outcome set.
- Solo elimination completion requires only one winner and one loser.
- Do not show participant-score correction states for valid scoreless elimination matches.
- Enable Proceed to next round only after every match in the selected elimination round has a valid
  outcome.

### 6. Update tests and integrity helpers

- Replace knockout and Final assertions that currently expect speaker-point inputs.
- Keep regression tests proving Preliminary still requires and submits points.
- Update end-to-end fill helpers and headings based on the selected stage.
- Keep authorization, draft rollback, and completed-result read-only coverage.

## Acceptance Criteria

1. Preliminary APF and BPF behavior is unchanged: Win/Loss plus every speaker's points are required,
   and the payload includes participant scores.
2. Team elimination shows only sides and Win/Loss controls; it contains no speaker-point heading,
   column, input, missing-participant blocker, or points-related copy.
3. APF elimination submits after exactly one winner and one loser; BPF elimination submits after
   exactly two winners and two losers.
4. Team elimination payloads contain no synthetic or defaulted participant scores.
5. Solo elimination shows Win/Loss controls for both debaters, submits one winner and one loser using
   the confirmed API fields, and contains no numeric score input.
6. Result-only drafts survive navigation/reload and persisted outcomes render read-only after a
   successful submission.
7. Pairings enables bracket progression for completed outcome-only team and solo elimination rounds.
8. Preliminary matches with missing points still block result submission and progression, including
   the existing repair/non-repairable behavior.
9. Unknown round-group type never silently enables scoreless submission.

## Test Matrix

| Stage | Format | Required input | Expected submission/progression |
| --- | --- | --- | --- |
| Preliminary | APF | 1 Win, 1 Loss, all speaker points | Includes participant scores; may proceed when every match is complete |
| Preliminary | BPF | 2 Wins, 2 Losses, all speaker points | Includes participant scores; may proceed when every match is complete |
| Team elimination | APF | 1 Win, 1 Loss | Outcome-only payload; points absent; may proceed |
| Team elimination | BPF | 2 Wins, 2 Losses | Outcome-only payload; points absent; may proceed |
| Solo elimination | LD | 1 Win, 1 Loss | Solo outcome-only payload; points absent; may proceed |

Add focused coverage in:

- `components/tournament/ResultsSection.test.tsx`
- `components/tournament/PairingsSection.test.tsx`
- `app/tournament/[id]/page.test.tsx`
- `e2e/support/tournament-integrity.ts`
- `e2e/tournament-results-integrity.spec.ts`

## Verification

Run, in order:

1. Focused Jest tests for ResultsSection, PairingsSection, and the tournament page.
2. `npm run lint`.
3. `npm run build`.
4. The tournament result integrity cases for Preliminary, APF/BPF team elimination, LD elimination,
   progression gating, persistence/reload, and authorization against a backend that implements the
   confirmed contract.

## Release Risk and Rollback

Release risk is High until the frontend and backend contracts land together. A frontend-only change
can make elimination submission fail with a 4xx response or leave the bracket unable to progress.

Rollback is limited to the stage-aware result-entry and progression changes. Preliminary result data
must not be migrated or altered.
