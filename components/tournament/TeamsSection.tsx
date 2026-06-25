"use client"

import { Ban, Pencil, RotateCcw, Trash2 } from "lucide-react"

import { Skeleton } from "@/components/ui/loading"
import type { PageResult } from "@/types/page"
import type { SimpleTournamentParticipantResponse } from "@/types/tournament/tournament-participant"
import type { SimpleTeamResponse, TeamResponse } from "@/types/tournament/team"

interface TeamsSectionProps {
  teams?: PageResult<SimpleTeamResponse>
  teamsLoading: boolean
  teamsError?: Error
  checkInStatus: Record<number, boolean>
  onToggleCheckIn?: (teamId: number) => void
  onDeleteTeam?: (teamId: number) => void
  onEditTeam?: (team: SimpleTeamResponse) => void
  onDisqualifyTeam?: (teamId: number) => void
  onRequalifyTeam?: (teamId: number) => void
}

const hasMemberDetails = (team: SimpleTeamResponse): team is TeamResponse =>
  Array.isArray((team as TeamResponse).members)

const getMemberName = (member?: SimpleTournamentParticipantResponse) =>
  member ? `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() || member.user.username : "—"

const getInstitutionName = (member?: SimpleTournamentParticipantResponse) =>
  member?.participantProfile?.institution?.name ?? "—"

const getCityName = (member?: SimpleTournamentParticipantResponse) =>
  member?.participantProfile?.city?.name ?? "—"

export function TeamsSection({
  teams,
  teamsLoading,
  teamsError,
  checkInStatus,
  onToggleCheckIn,
  onDeleteTeam,
  onEditTeam,
  onDisqualifyTeam,
  onRequalifyTeam,
}: TeamsSectionProps) {
  const showActions = Boolean(onEditTeam || onDeleteTeam || onDisqualifyTeam || onRequalifyTeam)
  const columnCount = showActions ? 9 : 8

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Team Name</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Speaker 1</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Speaker 2</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Study Location</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Club</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">City</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Number</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Check In</th>
            {showActions ? (
              <th className="border border-gray-300 px-4 py-3 text-center text-[#0D1321] font-medium">Actions</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {teamsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                <td className="border border-gray-300 px-4 py-3 text-center"><Skeleton className="h-4 w-4 mx-auto" /></td>
                {showActions ? (
                  <td className="border border-gray-300 px-4 py-3 text-center"><Skeleton className="h-4 w-4 mx-auto" /></td>
                ) : null}
              </tr>
            ))
          ) : teamsError ? (
            <tr>
              <td colSpan={columnCount} className="border border-gray-300 px-4 py-8 text-center text-red-500">
                Failed to load teams
              </td>
            </tr>
          ) : teams && teams.content.length > 0 ? (
            teams.content.map((team) => {
              const members = hasMemberDetails(team) ? team.members : undefined
              const primaryMember = members?.[0]
              const secondaryMember = members?.[1]
              const isDisqualified = Boolean((team as TeamResponse).disqualified)

              return (
                <tr key={team.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 text-[#0D1321] font-medium">{team.name}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{getMemberName(primaryMember)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{getMemberName(secondaryMember)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{getInstitutionName(primaryMember)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{team.club?.name ?? "—"}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{getCityName(primaryMember)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{String(team.id).padStart(3, "0")}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled={!onToggleCheckIn}
                      className={`text-lg transition disabled:cursor-default ${checkInStatus[team.id] ? "text-green-500" : "text-red-500"}`}
                      onClick={() => onToggleCheckIn?.(team.id)}
                      aria-label={checkInStatus[team.id] ? `Uncheck ${team.name}` : `Check in ${team.name}`}
                    >
                      {checkInStatus[team.id] ? "✓" : "✕"}
                    </button>
                  </td>
                  {showActions ? (
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        {onEditTeam ? (
                          <button
                            type="button"
                            onClick={() => onEditTeam(team)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[#3E5C76] transition hover:border-[#CBD3EC] hover:text-[#0B1327]"
                            aria-label={`Edit ${team.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={!onDeleteTeam}
                          onClick={() => onDeleteTeam?.(team.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[#9a8c98] transition hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Delete ${team.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {isDisqualified ? (
                          <button
                            type="button"
                            disabled={!onRequalifyTeam}
                            onClick={() => onRequalifyTeam?.(team.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[#3E5C76] transition hover:border-[#CBD3EC] hover:text-[#0B1327] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Requalify ${team.name}`}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!onDisqualifyTeam}
                            onClick={() => onDisqualifyTeam?.(team.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[#9a8c98] transition hover:border-amber-200 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Disqualify ${team.name}`}
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  ) : null}
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={columnCount} className="border border-gray-300 px-4 py-8 text-center text-[#4a4e69]">
                No teams registered yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
