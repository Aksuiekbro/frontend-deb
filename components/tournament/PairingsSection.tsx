"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw, Trash2 } from "lucide-react"

import type { PageResult } from "@/types/page"
import type { MatchResponse } from "@/types/tournament/match"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"

interface PairingsSectionProps {
  matches?: PageResult<MatchResponse>
  matchesLoading: boolean
  matchesError?: Error
  selectedRound: string
  onSelectRound: (round: string) => void
}

const STAGE_TABS = [
  { id: "preliminary", label: "Preliminary", defaultFormat: "APF" },
  { id: "team", label: "Team elimination", defaultFormat: "BPF" },
  { id: "solo", label: "Solo elimination", defaultFormat: "LD" },
] as const

const STANDARD_ROUNDS = ["Round 1", "Round 2", "Round 3", "Round 4"] as const
const ELIMINATION_ROUNDS = ["1/16", "1/8", "1/4", "1/2"] as const
const FORMAT_OPTIONS = ["APF", "BPF", "LD"] as const
type StageId = (typeof STAGE_TABS)[number]["id"]
type FormatOption = (typeof FORMAT_OPTIONS)[number]

export function PairingsSection({ matches, matchesLoading, matchesError, selectedRound, onSelectRound }: PairingsSectionProps) {
  const [activeStage, setActiveStage] = useState<StageId>(STAGE_TABS[0].id)
  const [formatMenuStage, setFormatMenuStage] = useState<StageId | null>(null)
  const [stageFormats, setStageFormats] = useState<Record<StageId, FormatOption>>(() =>
    STAGE_TABS.reduce((acc, tab) => {
      acc[tab.id] = tab.defaultFormat
      return acc
    }, {} as Record<StageId, FormatOption>)
  )
  const controlsRef = useRef<HTMLDivElement | null>(null)
  const [pendingFormat, setPendingFormat] = useState<{ stage: StageId; nextFormat: FormatOption } | null>(null)
  const [deleteConfirmStage, setDeleteConfirmStage] = useState<StageId | null>(null)

  useEffect(() => {
    if (!formatMenuStage) return

    const handleClickOutside = (event: MouseEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
        setFormatMenuStage(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [formatMenuStage])

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
          {STAGE_TABS.map((tab) => {
            const isActive = activeStage === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveStage(tab.id)
                  setFormatMenuStage(null)
                }}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "bg-[#0B1327] text-white" : "border border-[#D5D9E7] text-[#0B1327] hover:bg-[#F5F7FC]"
                }`}
              >
                <span>
                  {tab.label}({stageFormats[tab.id]})
                </span>
                {isActive && (
                  <div className="relative flex items-center gap-2 text-white/80" ref={controlsRef}>
                    <span className="h-5 w-px bg-white/30" aria-hidden="true" />
                    <button
                      type="button"
                      className="rounded-full border border-white/30 p-1 transition hover:border-white/60"
                      aria-haspopup="menu"
                      aria-expanded={formatMenuStage === tab.id}
                      onClick={(event) => {
                        event.stopPropagation()
                        setFormatMenuStage((prev) => (prev === tab.id ? null : tab.id))
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <span className="h-5 w-px bg-white/30" aria-hidden="true" />
                    <button
                      type="button"
                      className="rounded-full border border-white/30 p-1 transition hover:border-white/60"
                      onClick={(event) => {
                        event.stopPropagation()
                        setDeleteConfirmStage(tab.id)
                      }}
                      aria-label="Clear matches"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    {formatMenuStage === tab.id && (
                      <div className="absolute right-0 top-full z-10 mt-2 w-32 rounded-2xl border border-white/20 bg-[#050b1f] text-left text-sm shadow-lg">
                        {FORMAT_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className="flex w-full items-center justify-between px-4 py-3 text-white transition hover:bg-white/10"
                            onClick={(event) => {
                              event.stopPropagation()
                              if (stageFormats[tab.id] === option) {
                                setFormatMenuStage(null)
                                return
                              }
                              setPendingFormat({ stage: tab.id, nextFormat: option })
                              setFormatMenuStage(null)
                            }}
                          >
                            <span>{option}</span>
                            {stageFormats[tab.id] === option && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </nav>
      </header>
      <Dialog open={Boolean(pendingFormat)} onOpenChange={(open) => !open && setPendingFormat(null)}>
        <DialogContent className="rounded-3xl border border-[#E2E6F2] bg-white p-10 shadow-[0_20px_70px_rgba(6,14,39,0.25)] sm:max-w-md">
          <DialogTitle className="text-center text-lg font-semibold text-[#0B1327]">
            {pendingFormat
              ? `Are you sure to change the format of this round group from ${stageFormats[pendingFormat.stage]} to ${pendingFormat.nextFormat}?`
              : ""}
          </DialogTitle>
          <DialogFooter className="mt-6 flex w-full flex-row gap-4 px-6">
            <button
              type="button"
              className="flex-1 rounded-2xl border border-[#0B1327] px-6 py-3 text-sm font-semibold text-[#4A5A7A] transition hover:bg-[#EEF2FB]"
              onClick={() => setPendingFormat(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-2xl bg-[#2B3F63] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E2D48]"
              onClick={() => {
                if (!pendingFormat) return
                setStageFormats((prev) => ({
                  ...prev,
                  [pendingFormat.stage]: pendingFormat.nextFormat,
                }))
                setPendingFormat(null)
              }}
            >
              Change
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deleteConfirmStage)} onOpenChange={(open) => !open && setDeleteConfirmStage(null)}>
        <DialogContent className="rounded-3xl border border-[#E2E6F2] bg-white p-10 shadow-[0_20px_70px_rgba(6,14,39,0.25)] sm:max-w-md">
          <DialogTitle className="text-center text-lg font-semibold text-[#0B1327]">
            {deleteConfirmStage
              ? `Are you sure you want to delete the pairings for ${STAGE_TABS.find((tab) => tab.id === deleteConfirmStage)?.label ?? "this round"}?`
              : ""}
          </DialogTitle>
          <DialogFooter className="mt-6 flex w-full flex-row gap-4 px-6">
            <button
              type="button"
              className="flex-1 rounded-2xl border border-[#0B1327] px-6 py-3 text-sm font-semibold text-[#4A5A7A] transition hover:bg-[#EEF2FB]"
              onClick={() => setDeleteConfirmStage(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-2xl bg-[#2B3F63] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E2D48]"
              onClick={() => {
                // Hook up deletion logic here
                setDeleteConfirmStage(null)
              }}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
