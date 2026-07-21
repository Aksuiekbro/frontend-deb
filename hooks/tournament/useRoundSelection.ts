"use client"

import { useMemo } from "react"
import { useMatches, useRoundGroups, useRounds } from "@/hooks/use-api"
import type { Pageable } from "@/types/page"
import { RoundGroupType } from "@/types/tournament/round/round-group"
import type { StageId } from "@/components/tournament/PairingsSection"
import { displayRoundLabel } from "@/lib/round-label"

const ROUND_GROUP_TYPE_BY_STAGE: Record<StageId, RoundGroupType> = {
  preliminary: RoundGroupType.PRELIMINARY,
  team: RoundGroupType.TEAM_ELIMINATION,
  solo: RoundGroupType.SOLO_ELIMINATION,
}

interface UseRoundSelectionArgs {
  tournamentId: number
  selectedStage: StageId
  selectedRoundLabel: string
  pageable?: Pageable
}

export function useRoundSelection({ tournamentId, selectedStage, selectedRoundLabel, pageable }: UseRoundSelectionArgs) {
  const { roundGroups, mutate: mutateRoundGroups } = useRoundGroups(tournamentId)

  const selectedRoundGroup = useMemo(() => {
    if (!roundGroups || roundGroups.length === 0) return
    const preferredType = ROUND_GROUP_TYPE_BY_STAGE[selectedStage]
    return roundGroups.find((group) => group.type === preferredType) ?? roundGroups[0]
  }, [roundGroups, selectedStage])

  const selectedRoundGroupId = selectedRoundGroup?.id ?? null
  const { rounds: fetchedRounds, mutate: mutateRounds } = useRounds(tournamentId, selectedRoundGroupId ?? undefined)

  // The backend returns rounds in unspecified order; keep bracket progression stable.
  const rounds = useMemo(
    () => fetchedRounds ? [...fetchedRounds].sort((a, b) => a.roundNumber - b.roundNumber) : fetchedRounds,
    [fetchedRounds],
  )

  const selectedRound = useMemo(() => {
    if (!rounds || rounds.length === 0) return

    let nextRound = rounds.find((round) => displayRoundLabel(round.name) === displayRoundLabel(selectedRoundLabel))

    if (!nextRound && selectedRoundLabel.startsWith("Round ")) {
      const roundNumber = parseInt(selectedRoundLabel.replace("Round ", ""), 10)
      if (!Number.isNaN(roundNumber)) {
        nextRound = rounds.find((round) => round.roundNumber === roundNumber)
      }
    }

    return nextRound ?? rounds[0]
  }, [rounds, selectedRoundLabel])

  const selectedRoundId = selectedRound?.id ?? null
  const selectedRoundNumber = selectedRound?.roundNumber ?? null
  const currentRoundNumber = selectedRoundGroup?.currentRoundNumber ?? null

  const matchesQuery = useMatches(
    tournamentId,
    selectedRoundGroupId ?? undefined,
    selectedRoundId ?? undefined,
    pageable ?? { page: 0, size: 50 }
  )

  return {
    selectedRoundGroupId,
    selectedRoundId,
    selectedRoundNumber,
    currentRoundNumber,
    selectedRoundGroup,
    selectedRound,
    roundGroups,
    rounds,
    mutateRoundGroups,
    mutateRounds,
    ...matchesQuery,
  }
}
