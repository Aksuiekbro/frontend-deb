"use client"

import { Pencil, Trash2 } from "lucide-react"

import { Skeleton } from "@/components/ui/loading"
import type { PageResult } from "@/types/page"
import type { SimpleTournamentParticipantResponse } from "@/types/tournament/tournament-participant"
import type { SimpleTeamResponse, TeamResponse } from "@/types/tournament/team"

interface TeamsSectionProps {
  teams?: PageResult<SimpleTeamResponse>
  teamsLoading: boolean
  teamsError?: Error
  checkInStatus: Record<number, boolean>
  onToggleCheckIn: (teamId: number) => void
  onDeleteTeam?: (teamId: number) => void
  onEditTeam?: (team: SimpleTeamResponse) => void
  isDebaterView?: boolean
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
  isDebaterView = false,
}: TeamsSectionProps) {
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
            <th className="border border-gray-300 px-4 py-3 text-center text-[#0D1321] font-medium">Actions</th>
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
                <td className="border border-gray-300 px-4 py-3 text-center"><Skeleton className="h-4 w-4 mx-auto" /></td>
              </tr>
            ))
          ) : teamsError ? (
            <tr>
              <td colSpan={9} className="border border-gray-300 px-4 py-8 text-center text-red-500">
                Failed to load teams
              </td>
            </tr>
          ) : teams && teams.content.length > 0 ? (
            teams.content.map((team) => {
              const members = hasMemberDetails(team) ? team.members : undefined
              const primaryMember = members?.[0]
              const secondaryMember = members?.[1]

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
                    <span
                      className={`text-lg cursor-pointer ${checkInStatus[team.id] ? "text-green-500" : "text-red-500"}`}
                      onClick={() => onToggleCheckIn(team.id)}
                    >
                      {checkInStatus[team.id] ? "✓" : "✕"}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {isDebaterView ? (
                      <button
                        type="button"
                        disabled={!onEditTeam}
                        onClick={() => onEditTeam?.(team)}
                        className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[#3E5C76] transition hover:border-[#CBD3EC] hover:text-[#0B1327] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Edit ${team.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!onDeleteTeam}
                        onClick={() => onDeleteTeam?.(team.id)}
                        className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[#9a8c98] transition hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Delete ${team.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={9} className="border border-gray-300 px-4 py-8 text-center text-[#4a4e69]">
                No teams registered yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
