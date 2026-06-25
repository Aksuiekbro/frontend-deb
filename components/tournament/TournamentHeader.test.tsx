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
  isTournamentEnabled: true,
  toggleTournamentLoading: false,
  onToggleTournament: jest.fn(),
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
})
