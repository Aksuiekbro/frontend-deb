"use client"

import { Skeleton } from "@/components/ui/loading"
import { Switch } from "@/components/ui/switch"

interface TournamentHeaderProps {
  tournamentName?: string
  tournamentLoading: boolean
  tournamentError?: Error
  isOrganizer: boolean
  isTournamentEnabled: boolean
  toggleTournamentLoading: boolean
  onToggleTournament: (checked: boolean) => void
  onOpenInvite?: () => void
  onStartTournament?: () => void
  startTournamentLoading?: boolean
}

export function TournamentHeader({
  tournamentName,
  tournamentLoading,
  tournamentError,
  isOrganizer,
  isTournamentEnabled,
  toggleTournamentLoading,
  onToggleTournament,
  onOpenInvite,
  onStartTournament,
  startTournamentLoading = false,
}: TournamentHeaderProps) {
  return (
    <section className="px-12 py-8">
      <div className="flex justify-between items-center mb-8">
        {tournamentLoading ? (
          <Skeleton className="h-12 w-96" />
        ) : tournamentError ? (
          <h1 className="text-[#0D1321] text-[48px] font-bold">Tournament: Error loading data</h1>
        ) : (
          <h1 className="text-[#0D1321] text-[48px] font-bold">Tournament: {tournamentName || "Unknown Tournament"}</h1>
        )}
        <div className="flex items-center gap-4">
          {isOrganizer && onStartTournament && (
            <button
              type="button"
              onClick={onStartTournament}
              disabled={startTournamentLoading || tournamentLoading}
              className="rounded-lg bg-[#0D1321] px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#1D2D44] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {startTournamentLoading ? "Starting..." : "Start tournament"}
            </button>
          )}
          {isOrganizer && (
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <span className="text-sm font-medium text-[#0D1321]">
                {isTournamentEnabled ? "Visible to participants" : "Hidden from participants"}
              </span>
              <Switch
                checked={isTournamentEnabled}
                onCheckedChange={onToggleTournament}
                disabled={toggleTournamentLoading || tournamentLoading}
                aria-label="Toggle participant visibility"
              />
            </div>
          )}
          {isOrganizer && onOpenInvite ? (
            <button
              onClick={onOpenInvite}
              className="px-6 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors"
            >
              Invite
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
