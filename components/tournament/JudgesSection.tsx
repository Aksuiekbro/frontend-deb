"use client"

import type { PageResult } from "@/types/page"
import type { JudgeResponse } from "@/types/tournament/judge"

interface JudgesSectionProps {
  judges?: PageResult<JudgeResponse>
  judgesLoading: boolean
  judgesError?: Error
  onAddJudge: () => void
}

export function JudgesSection({ judges, judgesLoading, judgesError, onAddJudge }: JudgesSectionProps) {
  const rows = judges?.content ?? []

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
            </tr>
          </thead>
          <tbody>
            {judgesLoading ? (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-6 py-8 text-center text-[#4a4e69]">
                  Loading judges...
                </td>
              </tr>
            ) : judgesError ? (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-6 py-8 text-center text-red-500">
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
                    {judge.checkedIn ? <span className="text-green-600">✓</span> : <span className="text-red-500">✕</span>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-6 py-8 text-center text-[#4a4e69]">
                  No judges assigned yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="absolute bottom-6 right-6">
        <button
          type="button"
          onClick={onAddJudge}
          className="w-14 h-14 bg-[#3E5C76] hover:bg-[#2D3748] text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          aria-label="Add judge"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}
