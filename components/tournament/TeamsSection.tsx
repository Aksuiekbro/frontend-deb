"use client"

import { Skeleton } from "@/components/ui/loading"
import type { PageResult } from "@/types/page"
import type { SimpleTeamResponse } from "@/types/tournament/team"

interface TeamsSectionProps {
  teams?: PageResult<SimpleTeamResponse>
  teamsLoading: boolean
  teamsError?: Error
  checkInStatus: Record<number, boolean>
  onToggleCheckIn: (teamId: number) => void
}

const MOCK_TEAM_DETAILS = [
  {
    speaker1: "Hooley",
    speaker2: "Alma",
    studyLocation: "208",
    clubRepresentative: "T. Salybay",
    city: "Astana",
    number: "001",
  },
  {
    speaker1: "Qyrandar",
    speaker2: "Aitpa",
    studyLocation: "991A",
    clubRepresentative: "A. Gurgabay",
    city: "Almaty",
    number: "002",
  },
  {
    speaker1: "45For45",
    speaker2: "Rudolf",
    studyLocation: "121B",
    clubRepresentative: "L. Lomonosov",
    city: "Astana",
    number: "003",
  },
  {
    speaker1: "Fate Sealers",
    speaker2: "PlusPlus",
    studyLocation: "12",
    clubRepresentative: "K. Butov",
    city: "Atyrau",
    number: "004",
  },
] as const

export function TeamsSection({ teams, teamsLoading, teamsError, checkInStatus, onToggleCheckIn }: TeamsSectionProps) {
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
              </tr>
            ))
          ) : teamsError ? (
            <tr>
              <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center text-red-500">
                Failed to load teams
              </td>
            </tr>
          ) : teams && teams.content.length > 0 ? (
            teams.content.map((team, index) => {
              const mock = MOCK_TEAM_DETAILS[index % MOCK_TEAM_DETAILS.length]

              return (
                <tr key={team.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 text-[#0D1321] font-medium">{team.name}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{mock.speaker1}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{mock.speaker2}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{mock.studyLocation}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{team.club.name || mock.clubRepresentative}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{mock.city}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{mock.number}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <span
                      className={`text-lg cursor-pointer ${checkInStatus[team.id] ? "text-green-500" : "text-red-500"}`}
                      onClick={() => onToggleCheckIn(team.id)}
                    >
                      {checkInStatus[team.id] ? "✓" : "✕"}
                    </span>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center text-[#4a4e69]">
                No teams registered yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
