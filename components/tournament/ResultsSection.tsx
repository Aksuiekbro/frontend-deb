"use client"

import { ReactNode } from "react"
import { Trash2 } from "lucide-react"
import type { PageResult } from "@/types/page"
import type { SimpleTeamResponse } from "@/types/tournament/team"

interface ResultsSectionProps {
  selectedResultsOption: string
  resultsSubTab: "Speaker Score" | "Results"
  onResultsSubTabChange: (tab: "Speaker Score" | "Results") => void
  bpfSubTab: string
  activeResultsSection: string
  onActiveResultsSectionChange: (section: string) => void
  selectedRound: string
  onSelectedRoundChange: (round: string) => void
  teams?: PageResult<SimpleTeamResponse>
  teamsLoading: boolean
  teamsError?: Error
  canManageTeams: boolean
  onDeleteTeam: (teamId: number, teamName: string) => void
  deletingTeamId: number | null
}

const ELIMINATION_ROUNDS = ["1/16", "1/8", "1/4", "1/2"] as const

export function ResultsSection({
  selectedResultsOption,
  resultsSubTab,
  onResultsSubTabChange,
  bpfSubTab,
  activeResultsSection,
  onActiveResultsSectionChange,
  selectedRound,
  onSelectedRoundChange,
  teams,
  teamsLoading,
  teamsError,
  canManageTeams,
  onDeleteTeam,
  deletingTeamId,
}: ResultsSectionProps) {
  const teamRows = teams?.content ?? []

  const renderTeamRows = (columnCount: number, renderRow: (team: SimpleTeamResponse) => ReactNode) => {
    if (teamsLoading) {
      return (
        <tr>
          <td colSpan={columnCount} className="border border-gray-300 px-6 py-4 text-center text-[#4a4e69]">
            Loading teams...
          </td>
        </tr>
      )
    }

    if (teamsError) {
      return (
        <tr>
          <td colSpan={columnCount} className="border border-gray-300 px-6 py-4 text-center text-red-500">
            Failed to load teams
          </td>
        </tr>
      )
    }

    if (!teamRows.length) {
      return (
        <tr>
          <td colSpan={columnCount} className="border border-gray-300 px-6 py-4 text-center text-[#4a4e69]">
            No teams found
          </td>
        </tr>
      )
    }

    return teamRows.map((team) => renderRow(team))
  }

  const renderDeleteButton = (team: SimpleTeamResponse) => (
    <td className="border border-gray-300 px-6 py-4 text-center">
      <button
        aria-label={`Delete team ${team.name}`}
        className="inline-flex items-center justify-center rounded-md p-2 text-red-600 hover:bg-red-50 hover:text-red-800 transition"
        onClick={() => onDeleteTeam(team.id, team.name)}
        disabled={deletingTeamId === team.id}
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </td>
  )

  const renderFractionRow = (team: SimpleTeamResponse, isDark?: boolean) => (
    <tr key={team.id} className={isDark ? "bg-gradient-to-r from-[#0D1321] to-[#1a1a2e] hover:from-[#1a1a2e] hover:to-[#2d2d3a]" : "hover:bg-gray-50"}>
      <td className={`border border-gray-300 px-6 py-4 text-[16px] font-medium ${isDark ? "text-white" : "text-[#4a4e69]"}`}>
        {team.name}
      </td>
      {Array.from({ length: 4 }).map((_, index) => (
        <td key={index} className={`border border-gray-300 px-6 py-4 text-[16px] text-center ${isDark ? "text-white" : "text-[#4a4e69]"}`}>
          —
        </td>
      ))}
      <td className={`border border-gray-300 px-6 py-4 text-[16px] text-center font-medium ${isDark ? "text-white" : "text-[#4a4e69]"}`}>
        —
      </td>
      <td className={`border border-gray-300 px-6 py-4 text-[16px] ${isDark ? "text-white" : "text-[#4a4e69]"}`}>
        {team.club?.name ?? "—"}
      </td>
      {canManageTeams && renderDeleteButton(team)}
    </tr>
  )

  const isEliminationRound =
    selectedResultsOption !== "LD" &&
    ELIMINATION_ROUNDS.includes(activeResultsSection as (typeof ELIMINATION_ROUNDS)[number])

  type TeamWithEliminationResult = SimpleTeamResponse & {
    eliminationResult?: {
      winnerTeamId?: number
      winnerName?: string
    }
  }

  const getEliminationResult = (team?: SimpleTeamResponse) =>
    team ? (team as TeamWithEliminationResult).eliminationResult : undefined

  const hasWinnerData = teamRows.some((team) => {
    const result = getEliminationResult(team)
    return typeof result?.winnerTeamId === "number" || typeof result?.winnerName === "string"
  })

  const resolveWinnerName = (fraction1?: SimpleTeamResponse, fraction2?: SimpleTeamResponse) => {
    if (!hasWinnerData) {
      return fraction2 ? "—" : fraction1?.name ?? "—"
    }

    const candidates = [fraction1, fraction2]
    for (const team of candidates) {
      const result = getEliminationResult(team)
      if (!result) continue
      if (typeof result.winnerName === "string") {
        return result.winnerName
      }
      if (typeof result.winnerTeamId === "number") {
        if (fraction1?.id === result.winnerTeamId) return fraction1.name
        if (fraction2?.id === result.winnerTeamId) return fraction2?.name ?? "—"
        return team?.name ?? "—"
      }
    }

    return fraction2 ? "—" : fraction1?.name ?? "—"
  }

  const renderEliminationTable = () => {
    const pairs = []
    for (let i = 0; i < teamRows.length; i += 2) {
      const fraction1 = teamRows[i]
      if (!fraction1) break
      const fraction2 = teamRows[i + 1]
      pairs.push({ fraction1, fraction2 })
    }

    if (!pairs.length) {
      return (
        <tr>
          <td colSpan={3} className="border border-gray-300 px-6 py-6 text-center text-[#4a4e69]">
            No matches scheduled for this round
          </td>
        </tr>
      )
    }

    return pairs.map(({ fraction1, fraction2 }, index) => (
      <tr key={`${fraction1.id}-${index}`} className="hover:bg-gray-50">
        <td className="border border-gray-300 px-6 py-4 text-[16px] text-[#0B1327] font-medium">{fraction1.name}</td>
        <td className="border border-gray-300 px-6 py-4 text-[16px] text-[#0B1327]">{fraction2?.name ?? "—"}</td>
        {hasWinnerData && (
          <td className="border border-gray-300 px-6 py-4 text-[16px] text-[#0B1327]">{resolveWinnerName(fraction1, fraction2)}</td>
        )}
      </tr>
    ))
  }

  return (
    <div className="p-8">
      <h2 className="text-[#0D1321] text-[32px] font-bold mb-8">{selectedResultsOption}</h2>

      <div className="relative">
        {isEliminationRound ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
                <thead>
                  <tr className="bg-white text-[14px] uppercase tracking-[0.08em] text-[#4A5168]">
                    <th className="border border-gray-300 px-6 py-4 text-left">Fraction 1</th>
                    <th className="border border-gray-300 px-6 py-4 text-left">Fraction 2</th>
                    {hasWinnerData && <th className="border border-gray-300 px-6 py-4 text-left">Winner</th>}
                  </tr>
                </thead>
                <tbody>{renderEliminationTable()}</tbody>
              </table>
            </div>
            <div className="flex justify-end mt-8 mb-8">
              <button className="px-8 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors">
                Submit
              </button>
            </div>
          </>
        ) : (
          <>
        {selectedResultsOption === "APF" && activeResultsSection === "APF Speaker Score" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Speaker</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction name</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round {index + 1}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Overall</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {renderTeamRows(canManageTeams ? 8 : 7, (team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">{team.club?.name ?? team.name}</td>
                    <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">{team.name}</td>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <td key={index} className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                    ))}
                    <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">—</td>
                    {canManageTeams && renderDeleteButton(team)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedResultsOption === "APF" && resultsSubTab === "Results" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction Name</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round {index + 1}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Win Count</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Judge Name</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>{renderTeamRows(canManageTeams ? 8 : 7, (team) => renderFractionRow(team, true))}</tbody>
            </table>
          </div>
        )}

        {selectedResultsOption === "BPF" && bpfSubTab === "BPF Speaker Score" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Speaker</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction name</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round {index + 1}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Overall</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>{renderTeamRows(canManageTeams ? 8 : 7, (team) => renderFractionRow(team))}</tbody>
            </table>
          </div>
        )}

        {selectedResultsOption === "BPF" && bpfSubTab === "BPF Results" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction Name</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round {index + 1}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Win Count</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Judge Name</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>{renderTeamRows(canManageTeams ? 8 : 7, (team) => renderFractionRow(team))}</tbody>
            </table>
          </div>
        )}

        {selectedResultsOption === "LD" && !isEliminationRound && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction Name</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round {index + 1}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Win Count</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Judge Name</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>{renderTeamRows(canManageTeams ? 8 : 7, (team) => renderFractionRow(team))}</tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-8 mb-8">
          <button className="px-8 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors">
            Submit
          </button>
        </div>
          </>
        )}

        <div className="bg-[#0D1321] rounded-lg p-4">
          <div className="flex items-center justify-center gap-2">
            {selectedResultsOption !== "LD" && (
              <>
                <button
                  className={`px-4 py-2 ${
                    activeResultsSection === `${selectedResultsOption} Results`
                      ? "bg-white text-[#0D1321]"
                      : "text-white hover:bg-[#3E5C76]"
                  } rounded text-[14px] font-medium transition-colors`}
                  onClick={() => {
                    onActiveResultsSectionChange(`${selectedResultsOption} Results`)
                    onResultsSubTabChange("Results")
                  }}
                >
                  {selectedResultsOption} Results
                </button>
                <button
                  className={`px-4 py-2 ${
                    activeResultsSection === `${selectedResultsOption} Speaker Score`
                      ? "bg-white text-[#0D1321]"
                      : "text-white hover:bg-[#3E5C76]"
                  } rounded text-[14px] font-medium transition-colors`}
                  onClick={() => {
                    onActiveResultsSectionChange(`${selectedResultsOption} Speaker Score`)
                    onResultsSubTabChange("Speaker Score")
                  }}
                >
                  {selectedResultsOption} Speaker Score
                </button>
                <span className="text-white mx-2">|</span>
              </>
            )}

            {ELIMINATION_ROUNDS.map((round) => (
              <button
                key={round}
                className={`px-3 py-2 ${
                  activeResultsSection === round ? "bg-white text-[#0D1321]" : "text-white hover:bg-[#3E5C76]"
                } rounded text-[14px] font-medium transition-colors`}
                onClick={() => {
                  onActiveResultsSectionChange(round)
                  onSelectedRoundChange(round)
                  onResultsSubTabChange("Results")
                }}
              >
                {round}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
