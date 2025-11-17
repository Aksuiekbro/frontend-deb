"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { TournamentResponse } from "@/types/tournament/tournament"
import type { useToast } from "@/hooks/use-toast"

export type ToastFn = ReturnType<typeof useToast>["toast"]

interface UseTournamentVisibilityParams {
  tournament?: TournamentResponse
  toast?: ToastFn
}

export function useTournamentVisibility({ tournament, toast }: UseTournamentVisibilityParams) {
  const [isTournamentEnabled, setIsTournamentEnabled] = useState(false)
  const [toggleTournamentLoading, setToggleTournamentLoading] = useState(false)

  useEffect(() => {
    if (typeof tournament?.enabled === "boolean") {
      setIsTournamentEnabled(tournament.enabled)
    }
  }, [tournament?.enabled])

  const handleTournamentToggle = async (nextValue: boolean) => {
    if (!tournament) return

    const previousValue = isTournamentEnabled
    setIsTournamentEnabled(nextValue)
    setToggleTournamentLoading(true)

    try {
      const response = nextValue
        ? await api.enableTournament(tournament.id)
        : await api.disableTournament(tournament.id)

      if (!response.ok) {
        throw new Error("Failed to update tournament visibility")
      }

      toast?.({
        title: nextValue ? "Tournament enabled" : "Tournament disabled",
        description: nextValue
          ? `${tournament.name} is now visible to participants.`
          : `${tournament.name} is now hidden from participants.`,
      })
    } catch (error) {
      console.error("Failed to toggle tournament status", error)
      setIsTournamentEnabled(previousValue)
      toast?.({
        title: "Failed to update tournament",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setToggleTournamentLoading(false)
    }
  }

  return {
    isTournamentEnabled,
    toggleTournamentLoading,
    handleTournamentToggle,
  }
}
