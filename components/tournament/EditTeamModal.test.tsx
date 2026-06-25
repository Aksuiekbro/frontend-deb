/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import { EditTeamModal } from "./EditTeamModal"

describe("EditTeamModal", () => {
  it("submits trimmed team, club, and participant usernames", async () => {
    const onSave = jest.fn()

    render(
      <EditTeamModal
        isOpen
        teamName=" Team A "
        clubName=" KTL "
        speakerUsernames={["speaker1", "speaker2"]}
        onClose={jest.fn()}
        onSave={onSave}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText("Enter team name"), { target: { value: " Team B " } })
    fireEvent.change(screen.getByPlaceholderText("Enter club name"), { target: { value: " NIS " } })
    fireEvent.change(screen.getByLabelText("Speaker 1 username"), { target: { value: " alpha " } })
    fireEvent.change(screen.getByLabelText("Speaker 2 username"), { target: { value: " beta " } })
    fireEvent.change(screen.getByLabelText("Speaker 3 username"), { target: { value: " gamma " } })

    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        name: "Team B",
        club: "NIS",
        speakerUsernames: ["alpha", "beta", "gamma"],
      })
    })
  })

  it("does not trigger a render loop when closed without speaker usernames", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined)
    const { rerender } = render(
      <EditTeamModal
        isOpen={false}
        teamName="Team A"
        clubName="KTL"
        onClose={jest.fn()}
        onSave={jest.fn()}
      />,
    )

    rerender(
      <EditTeamModal
        isOpen={false}
        teamName="Team A"
        clubName="KTL"
        onClose={jest.fn()}
        onSave={jest.fn()}
      />,
    )

    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining("Maximum update depth exceeded"))
    consoleError.mockRestore()
  })
})
