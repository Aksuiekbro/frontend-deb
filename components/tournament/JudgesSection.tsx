"use client"

interface JudgesSectionProps {
  onAddJudge: () => void
}

export function JudgesSection({ onAddJudge }: JudgesSectionProps) {
  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Name</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Club</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Number</th>
              <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Check In</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="border border-gray-300 px-6 py-8 text-center text-[#4a4e69]">
                No judges assigned yet
              </td>
            </tr>
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
