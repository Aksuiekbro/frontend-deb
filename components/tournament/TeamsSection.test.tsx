/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import { TeamsSection } from "./TeamsSection"

const teams = {
  content: [
    {
      id: 7,
      name: "Team A",
      club: { id: 3, name: "KTL" },
      checkedIn: false,
      disqualified: false,
      members: [
        {
          id: 101,
          user: { username: "speaker1", firstName: "Speaker", lastName: "One" },
          participantProfile: {
            city: { id: 1, name: "Almaty" },
            institution: { id: 2, name: "NIS" },
          },
        },
      ],
    },
  ],
  totalElements: 1,
  totalPages: 1,
}

describe("TeamsSection", () => {
  it("shows organizer edit actions when edit handler is provided", () => {
    const onEditTeam = jest.fn()

    render(
      <TeamsSection
        teams={teams as never}
        teamsLoading={false}
        checkInStatus={{ 7: false }}
        onEditTeam={onEditTeam}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Edit Team A" }))

    expect(onEditTeam).toHaveBeenCalledWith(expect.objectContaining({ id: 7, name: "Team A" }))
    expect(screen.getByText("Actions")).toBeInTheDocument()
  })

  it("renders a read-only roster when no organizer handlers are provided", () => {
    render(
      <TeamsSection
        teams={teams as never}
        teamsLoading={false}
        checkInStatus={{ 7: false }}
      />,
    )

    expect(screen.queryByText("Actions")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Edit Team A" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Check in Team A" })).toBeDisabled()
  })
})
