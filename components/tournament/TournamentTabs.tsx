"use client"

import { RefObject } from "react"

interface TournamentTabsProps {
  activeTab: string
  onChangeTab: (tab: string) => void
  selectedMainInfoOption: string
  isMainInfoDropdownOpen: boolean
  onToggleMainInfoDropdown: () => void
  onMainInfoOptionSelect: (option: "Announcements" | "Schedule" | "Map") => void
  mainInfoDropdownRef: RefObject<HTMLDivElement | null>
  selectedResultsOption: string
  isResultsDropdownOpen: boolean
  onToggleResultsDropdown: () => void
  onResultsOptionSelect: (option: "APF" | "BPF" | "LD") => void
  resultsDropdownRef: RefObject<HTMLDivElement | null>
}

const SECONDARY_TABS = ["Teams", "Judges", "Pairing and Matches"]
const SIMPLE_TABS = ["News", "Feedback"]

export function TournamentTabs({
  activeTab,
  onChangeTab,
  selectedMainInfoOption,
  isMainInfoDropdownOpen,
  onToggleMainInfoDropdown,
  onMainInfoOptionSelect,
  mainInfoDropdownRef,
  selectedResultsOption,
  isResultsDropdownOpen,
  onToggleResultsDropdown,
  onResultsOptionSelect,
  resultsDropdownRef,
}: TournamentTabsProps) {
  return (
    <div role="tablist" className="flex border-b border-gray-300 mb-8">
      <div className="relative" ref={mainInfoDropdownRef}>
        <button
          role="tab"
          aria-selected={activeTab === "Main Info"}
          aria-controls="main-info-panel"
          tabIndex={activeTab === "Main Info" ? 0 : -1}
          onClick={() => {
            onChangeTab("Main Info")
            onToggleMainInfoDropdown()
          }}
          className={`px-6 py-3 text-[18px] font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "Main Info"
              ? "text-[#0D1321] border-[#0D1321]"
              : "text-[#9a8c98] border-transparent hover:text-[#4a4e69]"
          }`}
        >
          {selectedMainInfoOption}
          <svg
            className={`w-4 h-4 transition-transform ${isMainInfoDropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isMainInfoDropdownOpen && (
          <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[160px]">
            {(["Announcements", "Schedule", "Map"] as const).map((option) => (
              <button
                key={option}
                onClick={() => onMainInfoOptionSelect(option)}
                className="w-full text-left px-4 py-2 text-[16px] text-[#4a4e69] hover:bg-gray-100 hover:text-[#0D1321]"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {SECONDARY_TABS.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls={`${tab.toLowerCase().replace(/\s+/g, "-")}-panel`}
          tabIndex={activeTab === tab ? 0 : -1}
          onClick={() => onChangeTab(tab)}
          className={`px-6 py-3 text-[18px] font-medium border-b-2 transition-colors ${
            activeTab === tab ? "text-[#0D1321] border-[#0D1321]" : "text-[#9a8c98] border-transparent hover:text-[#4a4e69]"
          }`}
        >
          {tab}
        </button>
      ))}

      <div className="relative" ref={resultsDropdownRef}>
        <button
          role="tab"
          aria-selected={activeTab === "Results and Statistics"}
          aria-controls="results-and-statistics-panel"
          tabIndex={activeTab === "Results and Statistics" ? 0 : -1}
          onClick={() => {
            onChangeTab("Results and Statistics")
            onToggleResultsDropdown()
          }}
          className={`px-6 py-3 text-[18px] font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "Results and Statistics"
              ? "text-[#0D1321] border-[#0D1321]"
              : "text-[#9a8c98] border-transparent hover:text-[#4a4e69]"
          }`}
        >
          Results and Statistics
          <svg
            className={`w-4 h-4 transition-transform ${isResultsDropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isResultsDropdownOpen && (
          <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[120px]">
            {(["APF", "BPF", "LD"] as const).map((option) => (
              <button
                key={option}
                onClick={() => onResultsOptionSelect(option)}
                className="w-full text-left px-4 py-2 text-[16px] text-[#4a4e69] hover:bg-gray-100 hover:text-[#0D1321]"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {SIMPLE_TABS.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls={`${tab.toLowerCase()}-panel`}
          tabIndex={activeTab === tab ? 0 : -1}
          onClick={() => onChangeTab(tab)}
          className={`px-6 py-3 text-[18px] font-medium border-b-2 transition-colors ${
            activeTab === tab ? "text-[#0D1321] border-[#0D1321]" : "text-[#9a8c98] border-transparent hover:text-[#4a4e69]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
