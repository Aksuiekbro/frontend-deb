/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import { JudgesSection } from "./JudgesSection"
import type { PageResult } from "@/types/page"
import type { JudgeResponse } from "@/types/tournament/judge"

const judges: PageResult<JudgeResponse> = {
  content: [
    {
      id: 12,
      fullName: "Aigerim Judge",
      email: "judge@example.com",
      phoneNumber: "+77010000000",
      socialProfiles: [],
      checkedIn: false,
    },
  ],
  totalElements: 1,
  totalPages: 1,
}

describe("JudgesSection", () => {
  it("omits contact columns and values from the public roster even if data contains them", () => {
    render(<JudgesSection judges={judges} judgesLoading={false} showContactDetails={false} />)

    expect(screen.getByText("Aigerim Judge")).toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: "Email" })).not.toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: "Phone" })).not.toBeInTheDocument()
    expect(screen.queryByText("judge@example.com")).not.toBeInTheDocument()
    expect(screen.queryByText("+77010000000")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add judge" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Edit Aigerim Judge" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Delete Aigerim Judge" })).not.toBeInTheDocument()
  })

  it("renders contact columns and values in the organizer management view", () => {
    render(<JudgesSection judges={judges} judgesLoading={false} showContactDetails />)

    expect(screen.getByRole("columnheader", { name: "Email" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Phone" })).toBeInTheDocument()
    expect(screen.getByText("judge@example.com")).toBeInTheDocument()
    expect(screen.getByText("+77010000000")).toBeInTheDocument()
  })

  it("wires organizer add, edit, delete, and check-in actions", () => {
    const onAddJudge = jest.fn()
    const onEditJudge = jest.fn()
    const onDeleteJudge = jest.fn()
    const onToggleJudgeCheckIn = jest.fn()

    render(
      <JudgesSection
        judges={judges}
        judgesLoading={false}
        showContactDetails
        onAddJudge={onAddJudge}
        onEditJudge={onEditJudge}
        onDeleteJudge={onDeleteJudge}
        onToggleJudgeCheckIn={onToggleJudgeCheckIn}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Add judge" }))
    fireEvent.click(screen.getByRole("button", { name: "Edit Aigerim Judge" }))
    fireEvent.click(screen.getByRole("button", { name: "Delete Aigerim Judge" }))
    fireEvent.click(screen.getByRole("button", { name: "Check in Aigerim Judge" }))

    expect(onAddJudge).toHaveBeenCalledTimes(1)
    expect(onEditJudge).toHaveBeenCalledWith(judges.content[0])
    expect(onDeleteJudge).toHaveBeenCalledWith(judges.content[0])
    expect(onToggleJudgeCheckIn).toHaveBeenCalledWith(judges.content[0])
  })
})
