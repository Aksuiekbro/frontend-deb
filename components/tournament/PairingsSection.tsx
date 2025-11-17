"use client"

import type { PageResult } from "@/types/page"
import type { MatchResponse } from "@/types/tournament/match"

interface PairingsSectionProps {
  matches?: PageResult<MatchResponse>
  matchesLoading: boolean
  matchesError?: Error
  selectedRound: string
  onSelectRound: (round: string) => void
}

const ELIMINATION_ROUNDS = ["1/16", "1/8", "1/4", "1/2"] as const

export function PairingsSection({ matches, matchesLoading, matchesError, selectedRound, onSelectRound }: PairingsSectionProps) {
  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction 1</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction 2</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Room</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Judge Name</th>
            </tr>
          </thead>
          <tbody>
            {matchesLoading ? (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-6 py-6 text-center text-[#4a4e69]">Loading matches...</td>
              </tr>
            ) : matchesError ? (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-6 py-6 text-center text-red-500">Failed to load matches</td>
              </tr>
            ) : matches && matches.content.length > 0 ? (
              matches.content.map((match) => (
                <tr key={match.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">{match.team1?.name ?? "-"}</td>
                  <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">{match.team2?.name ?? "-"}</td>
                  <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">{match.location ?? "-"}</td>
                  <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">{match.judge?.fullName ?? "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-6 py-6 text-center text-[#4a4e69]">No matches</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-4 mt-8 mb-8">
        <button className="px-8 py-3 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-50 text-[16px] font-medium transition-colors">
          Randomize
        </button>
        <button className="px-8 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors">
          Submit
        </button>
      </div>

      <div className="bg-[#0D1321] rounded-lg p-4">
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: 4 }).map((_, index) => {
            const roundLabel = `Round ${index + 1}`

            return (
              <button
                key={roundLabel}
                className={`px-4 py-2 ${selectedRound === roundLabel ? "bg-white text-[#0D1321]" : "text-white hover:bg-[#3E5C76]"} rounded text-[14px] font-medium transition-colors`}
                onClick={() => onSelectRound(roundLabel)}
              >
                {roundLabel}
              </button>
            )
          })}
          <span className="text-white mx-2">|</span>
          {ELIMINATION_ROUNDS.map((round) => (
            <button
              key={round}
              className={`px-3 py-2 ${selectedRound === round ? "bg-white text-[#0D1321]" : "text-white hover:bg-[#3E5C76]"} rounded text-[14px] font-medium transition-colors`}
              onClick={() => onSelectRound(round)}
            >
              {round}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
