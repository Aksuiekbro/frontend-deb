"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { readResponseError } from "@/lib/http-error"
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
        throw new Error(await readResponseError(response, {
          fallback: "Failed to update tournament visibility",
          unauthorized: "You do not have permission to perform this action.",
          serverError: "Server error. Please try again later.",
        }))
      }

      toast?.({
        title: nextValue ? "Tournament visible" : "Tournament hidden",
        description: nextValue
          ? `${tournament.name} is now visible to participants.`
          : `${tournament.name} is now hidden from participants.`,
      })
    } catch (error) {
      console.error("Failed to toggle tournament status", error)
      setIsTournamentEnabled(previousValue)
      toast?.({
        title: "Failed to update tournament",
        description: error instanceof Error ? error.message : "Please try again later.",
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
