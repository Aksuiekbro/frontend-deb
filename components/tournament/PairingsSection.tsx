"use client"

import { useState } from "react"
import { RefreshCw, Trash2 } from "lucide-react"

import type { PageResult } from "@/types/page"
import type { MatchResponse } from "@/types/tournament/match"

interface PairingsSectionProps {
  matches?: PageResult<MatchResponse>
  matchesLoading: boolean
  matchesError?: Error
  selectedRound: string
  onSelectRound: (round: string) => void
}

const STAGE_TABS = [
  { id: "preliminary", label: "Preliminary(APF)" },
  { id: "team", label: "Team elimination(BPF)" },
  { id: "solo", label: "Solo elimination(LD)" },
] as const

const STANDARD_ROUNDS = ["Round 1", "Round 2", "Round 3", "Round 4"] as const
const ELIMINATION_ROUNDS = ["1/16", "1/8", "1/4", "1/2"] as const

export function PairingsSection({ matches, matchesLoading, matchesError, selectedRound, onSelectRound }: PairingsSectionProps) {
  const [activeStage, setActiveStage] = useState<(typeof STAGE_TABS)[number]["id"]>(STAGE_TABS[0].id)

  const renderRows = () => {
    if (matchesLoading) {
      return (
        <tr>
          <td colSpan={4} className="px-6 py-10 text-center text-[#7A83A0]">
            Loading matches...
          </td>
        </tr>
      )
    }

    if (matchesError) {
      return (
        <tr>
          <td colSpan={4} className="px-6 py-10 text-center text-red-500">
            Failed to load matches
          </td>
        </tr>
      )
    }

    if (!matches || matches.content.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="px-6 py-10 text-center text-[#7A83A0]">
            No matches
          </td>
        </tr>
      )
    }

    return matches.content.map((match) => (
      <tr key={match.id} className="border-b border-[#E2E6F2] last:border-none">
        <td className="px-6 py-4 text-lg font-semibold text-[#0B1327]">{match.team1?.name ?? "-"}</td>
        <td className="px-6 py-4 text-lg font-semibold text-[#0B1327]">{match.team2?.name ?? "-"}</td>
        <td className="px-6 py-4 text-sm text-[#7A83A0]">{match.location ?? "-"}</td>
        <td className="px-6 py-4 text-sm text-[#7A83A0]">{match.judge?.fullName ?? "-"}</td>
      </tr>
    ))
  }

  return (
    <section className="rounded-3xl border border-[#E2E6F2] bg-white text-[#050A18] shadow-[0_20px_50px_rgba(12,21,44,0.08)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E6F2] px-6 py-4">
        <nav className="flex flex-wrap gap-2">
          {STAGE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveStage(tab.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                activeStage === tab.id
                  ? "bg-[#0B1327] text-white"
                  : "border border-[#D5D9E7] text-[#0B1327] hover:bg-[#F5F7FC]"
              }`}
            >
              <span>{tab.label}</span>
              {activeStage === tab.id && (
                <span className="flex items-center gap-2 text-white/80">
                  <span className="h-5 w-px bg-white/30" aria-hidden="true" />
                  <RefreshCw className="h-4 w-4" />
                  <span className="h-5 w-px bg-white/30" aria-hidden="true" />
                  <Trash2 className="h-4 w-4" />
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <div className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#0B1327] text-xs uppercase tracking-[0.08em] text-white/70">
              <th className="px-6 py-4">Fraction 1</th>
              <th className="px-6 py-4">Fraction 2</th>
              <th className="px-6 py-4">Room</th>
              <th className="px-6 py-4">Judge Name</th>
            </tr>
          </thead>
          <tbody>{renderRows()}</tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-6 text-[#0B1327]">
        <button
          type="button"
          className="rounded-2xl border border-[#D5D9E7] px-6 py-3 text-sm font-semibold text-[#9AA1B9]"
          disabled
        >
          Proceed to next round
        </button>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-2xl border border-[#D5D9E7] px-6 py-3 text-sm font-semibold text-[#0B1327] hover:bg-[#F5F7FC]"
          >
            Randomize
          </button>
          <button
            type="button"
            className="rounded-2xl bg-[#0B1327] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#050918]"
          >
            Submit
          </button>
        </div>
      </div>

      <div className="rounded-b-3xl border-t border-white/5 bg-[#040814] px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {STANDARD_ROUNDS.map((round) => (
            <button
              key={round}
              type="button"
              onClick={() => onSelectRound(round)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                selectedRound === round ? "bg-white text-[#050A18]" : "text-white/70 hover:bg-white/10"
              }`}
            >
              {round}
            </button>
          ))}

          <div className="h-6 w-px bg-white/15" />

          {ELIMINATION_ROUNDS.map((round) => (
            <button
              key={round}
              type="button"
              onClick={() => onSelectRound(round)}
              className={`rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${
                selectedRound === round ? "bg-white text-[#050A18]" : "text-white/70 hover:bg-white/10"
              }`}
            >
              {round}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
