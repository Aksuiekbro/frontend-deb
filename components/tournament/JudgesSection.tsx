"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import type { PageResult } from "@/types/page"
import type { JudgeResponse } from "@/types/tournament/judge"

interface JudgesSectionProps {
  judges?: PageResult<JudgeResponse>
  judgesLoading: boolean
  judgesError?: Error
  onAddJudge?: () => void
  onToggleJudgeCheckIn?: (judge: JudgeResponse) => void
  onEditJudge?: (judge: JudgeResponse) => void
  onDeleteJudge?: (judge: JudgeResponse) => void
  updatingJudgeId?: number | null
  deletingJudgeId?: number | null
}

export function JudgesSection({
  judges,
  judgesLoading,
  judgesError,
  onAddJudge,
  onToggleJudgeCheckIn,
  onEditJudge,
  onDeleteJudge,
  updatingJudgeId,
  deletingJudgeId,
}: JudgesSectionProps) {
  const rows = judges?.content ?? []
  const hasActions = Boolean(onEditJudge || onDeleteJudge)
  const columnCount = hasActions ? 5 : 4

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Name</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Email</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Phone</th>
              <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Check In</th>
              {hasActions ? (
                <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {judgesLoading ? (
              <tr>
                <td colSpan={columnCount} className="border border-gray-300 px-6 py-8 text-center text-[#4a4e69]">
                  Loading judges...
                </td>
              </tr>
            ) : judgesError ? (
              <tr>
                <td colSpan={columnCount} className="border border-gray-300 px-6 py-8 text-center text-red-500">
                  Failed to load judges
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((judge) => (
                <tr key={judge.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-6 py-4 text-[#0D1321] font-medium">{judge.fullName}</td>
                  <td className="border border-gray-300 px-6 py-4 text-[#4a4e69]">{judge.email || "—"}</td>
                  <td className="border border-gray-300 px-6 py-4 text-[#4a4e69]">{judge.phoneNumber || "—"}</td>
                  <td className="border border-gray-300 px-6 py-4 text-center text-[#0D1321]">
                    {onToggleJudgeCheckIn ? (
                      <button
                        type="button"
                        onClick={() => onToggleJudgeCheckIn(judge)}
                        disabled={updatingJudgeId === judge.id}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-lg font-semibold transition ${
                          judge.checkedIn
                            ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                            : "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                        aria-label={`${judge.checkedIn ? "Uncheck" : "Check in"} ${judge.fullName}`}
                      >
                        {updatingJudgeId === judge.id ? "..." : judge.checkedIn ? "✓" : "✕"}
                      </button>
                    ) : (
                      judge.checkedIn ? <span className="text-green-600">✓</span> : <span className="text-red-500">✕</span>
                    )}
                  </td>
                  {hasActions ? (
                    <td className="border border-gray-300 px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center gap-2">
                        {onEditJudge ? (
                          <button
                            type="button"
                            onClick={() => onEditJudge(judge)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-[#0D1321] hover:bg-gray-50"
                            aria-label={`Edit ${judge.fullName}`}
                            title={`Edit ${judge.fullName}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                        {onDeleteJudge ? (
                          <button
                            type="button"
                            onClick={() => onDeleteJudge(judge)}
                            disabled={deletingJudgeId === judge.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-100 bg-white text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Delete ${judge.fullName}`}
                            title={`Delete ${judge.fullName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnCount} className="border border-gray-300 px-6 py-8 text-center text-[#4a4e69]">
                  No judges assigned yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {onAddJudge ? (
      <div className="absolute bottom-6 right-6">
        <button
          type="button"
          onClick={onAddJudge}
          className="w-14 h-14 bg-[#3E5C76] hover:bg-[#2D3748] text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          aria-label="Add judge"
        >
          <Plus className="h-8 w-8" />
        </button>
      </div>
      ) : null}
    </div>
  )
}
