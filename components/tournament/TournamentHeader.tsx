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
    <section className="db-hero" style={{ minHeight: 200, isolation: 'isolate' }}>
      <div className="db-page-backdrop" aria-hidden="true" style={{ position: 'absolute', ['--db-backdrop-focal' as string]: '50% 40%' }}>
        <img src="/images/senate/triumphal-procession.webp" alt="" />
        <div className="db-page-backdrop__scrim" />
      </div>
      <div className="db-hero__content db-container" style={{ width: '100%' }}>
        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
          {tournamentLoading ? (
            <Skeleton className="h-12 w-96" />
          ) : tournamentError ? (
            <h1 className="db-hero__title" style={{ fontSize: 'clamp(28px,4vw,48px)', marginBottom: 0 }}>Tournament: Error loading data</h1>
          ) : (
            <h1 className="db-hero__title" style={{ fontSize: 'clamp(28px,4vw,48px)', marginBottom: 0 }}>Tournament: {tournamentName || "Unknown Tournament"}</h1>
          )}
          <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:gap-4">
            {isOrganizer && onStartTournament && (
              <button
                type="button"
                onClick={onStartTournament}
                disabled={startTournamentLoading || tournamentLoading}
                className="db-btn db-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {startTournamentLoading ? "Starting..." : "Start tournament"}
              </button>
            )}
            {isOrganizer && (
              <div className="flex items-center gap-3 rounded-lg px-4 py-2" style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.25)' }}>
                <span className="text-sm font-medium text-white">
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
                className="db-btn db-btn-ghost-on-dark"
              >
                Invite
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
