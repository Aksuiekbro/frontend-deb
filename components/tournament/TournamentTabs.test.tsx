/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { useRef, useState } from "react"

import { TournamentTabs } from "./TournamentTabs"

function Harness() {
  const [activeTab, setActiveTab] = useState("Main Info")
  const [mainInfoOpen, setMainInfoOpen] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)

  return (
    <TournamentTabs
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      selectedMainInfoOption="Announcements"
      isMainInfoDropdownOpen={mainInfoOpen}
      onToggleMainInfoDropdown={() => setMainInfoOpen((open) => !open)}
      onMainInfoOptionSelect={jest.fn()}
      mainInfoDropdownRef={useRef<HTMLDivElement>(null)}
      selectedResultsOption="APF"
      isResultsDropdownOpen={resultsOpen}
      onToggleResultsDropdown={() => setResultsOpen((open) => !open)}
      onResultsOptionSelect={jest.fn()}
      resultsDropdownRef={useRef<HTMLDivElement>(null)}
    />
  )
}

describe("TournamentTabs", () => {
  it("keeps Results selection and dropdown state observable through ARIA", async () => {
    render(<Harness />)

    await waitFor(() => expect(screen.getByRole("tablist")).toHaveAttribute("data-tournament-tabs-hydrated", "true"))
    const mainInfoTab = screen.getByRole("tab", { name: /^Announcements$/ })
    const resultsTab = screen.getByRole("tab", { name: /^Results and Statistics$/ })

    expect(mainInfoTab).toHaveAttribute("aria-selected", "true")
    expect(resultsTab).toHaveAttribute("aria-selected", "false")
    expect(resultsTab).toHaveAttribute("aria-expanded", "false")

    fireEvent.click(resultsTab)

    expect(resultsTab).toHaveAttribute("aria-selected", "true")
    expect(mainInfoTab).toHaveAttribute("aria-selected", "false")
    expect(resultsTab).toHaveAttribute("aria-expanded", "true")

    fireEvent.click(resultsTab)
    expect(resultsTab).toHaveAttribute("aria-expanded", "false")
  })
})
