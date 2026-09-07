/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import { TournamentHeader } from "./TournamentHeader"

const baseProps = {
  tournamentName: "Climate Cup",
  tournamentLoading: false,
  tournamentError: undefined,
  canControlVisibility: false,
  areResultsVisible: true,
  resultsVisibilityUpdating: false,
  onToggleResultsVisibility: jest.fn(),
}

describe("TournamentHeader", () => {
  it("hides invite controls from non-organizers", () => {
    render(<TournamentHeader {...baseProps} isOrganizer={false} />)

    expect(screen.queryByRole("button", { name: "Invite" })).not.toBeInTheDocument()
  })

  it("shows invite controls for organizers", () => {
    const onOpenInvite = jest.fn()

    render(<TournamentHeader {...baseProps} isOrganizer onOpenInvite={onOpenInvite} />)
    fireEvent.click(screen.getByRole("button", { name: "Invite" }))

    expect(onOpenInvite).toHaveBeenCalledTimes(1)
  })

  it("shows the visibility control only with explicit permission", () => {
    const { rerender } = render(
      <TournamentHeader {...baseProps} isOrganizer canControlVisibility={false} />,
    )

    expect(screen.queryByRole("switch", { name: "Toggle results visibility" })).not.toBeInTheDocument()

    rerender(<TournamentHeader {...baseProps} isOrganizer canControlVisibility />)

    expect(screen.getByRole("switch", { name: "Toggle results visibility" })).toBeInTheDocument()
  })

  it("labels the switch as results visibility", () => {
    render(<TournamentHeader {...baseProps} isOrganizer canControlVisibility areResultsVisible={false} />)

    expect(screen.getByText("Results hidden from participants")).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: "Toggle results visibility" })).not.toBeChecked()
  })
})
