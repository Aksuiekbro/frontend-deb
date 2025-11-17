"use client"

import { useEffect, useState } from "react"
import { useMatches, useRoundGroups, useRounds } from "@/hooks/use-api"
import type { Pageable } from "@/types/page"

const ELIMINATION_ROUNDS = new Set(["1/16", "1/8", "1/4", "1/2"])

interface UseRoundSelectionArgs {
  tournamentId: number
  selectedRoundLabel: string
  pageable?: Pageable
}

export function useRoundSelection({ tournamentId, selectedRoundLabel, pageable }: UseRoundSelectionArgs) {
  const [selectedRoundGroupId, setSelectedRoundGroupId] = useState<number | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null)

  const { roundGroups } = useRoundGroups(tournamentId)

  useEffect(() => {
    if (!roundGroups || roundGroups.length === 0) return

    const isElimination = ELIMINATION_ROUNDS.has(selectedRoundLabel)
    const preferredType = isElimination ? "TEAM_ELIMINATION" : "PRELIMINARY"
    const preferredGroup = roundGroups.find((group) => group.type === preferredType) ?? roundGroups[0]

    if (preferredGroup && preferredGroup.id !== selectedRoundGroupId) {
      setSelectedRoundGroupId(preferredGroup.id)
    }
  }, [roundGroups, selectedRoundLabel, selectedRoundGroupId])

  const { rounds } = useRounds(tournamentId, selectedRoundGroupId ?? undefined)

  useEffect(() => {
    if (!rounds || rounds.length === 0) return

    let nextRound = rounds.find((round) => round.name === selectedRoundLabel)

    if (!nextRound && selectedRoundLabel.startsWith("Round ")) {
      const roundNumber = parseInt(selectedRoundLabel.replace("Round ", ""), 10)
      if (!Number.isNaN(roundNumber)) {
        nextRound = rounds.find((round) => round.roundNumber === roundNumber)
      }
    }

    nextRound = nextRound ?? rounds[0]

    if (nextRound && nextRound.id !== selectedRoundId) {
      setSelectedRoundId(nextRound.id)
    }
  }, [rounds, selectedRoundLabel, selectedRoundId])

  const matchesQuery = useMatches(
    tournamentId,
    selectedRoundGroupId ?? undefined,
    selectedRoundId ?? undefined,
    pageable ?? { page: 0, size: 50 }
  )

  return {
    selectedRoundGroupId,
    selectedRoundId,
    roundGroups,
    rounds,
    ...matchesQuery,
  }
}
