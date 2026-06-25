/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { FeedbackSection } from "./FeedbackSection"
import { api } from "@/lib/api"

jest.mock("@/lib/api", () => ({
  api: {
    addFeedback: jest.fn(),
  },
}))

const apiMock = api as jest.Mocked<typeof api>

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response
}

describe("FeedbackSection", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("submits trimmed feedback and refreshes the feedback list", async () => {
    const onFeedbackAdded = jest.fn()
    apiMock.addFeedback.mockResolvedValue(response({}))

    render(
      <FeedbackSection
        tournamentId={53}
        feedbacks={{ content: [], totalElements: 0, totalPages: 0 }}
        feedbacksLoading={false}
        onFeedbackAdded={onFeedbackAdded}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "  Good schedule  " } })
    fireEvent.change(screen.getByPlaceholderText("Add feedback..."), { target: { value: "  Please add room maps.  " } })
    fireEvent.click(screen.getByLabelText("Submit feedback"))

    await waitFor(() => {
      expect(apiMock.addFeedback).toHaveBeenCalledWith(53, {
        title: "Good schedule",
        content: "Please add room maps.",
      })
    })
    expect(onFeedbackAdded).toHaveBeenCalledTimes(1)
  })

  it("shows backend errors without clearing the feedback form", async () => {
    apiMock.addFeedback.mockResolvedValue(response({ message: "Only participants can submit feedback" }, 403))

    render(
      <FeedbackSection
        tournamentId={53}
        feedbacks={{ content: [], totalElements: 0, totalPages: 0 }}
        feedbacksLoading={false}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Good schedule" } })
    fireEvent.change(screen.getByPlaceholderText("Add feedback..."), { target: { value: "Please add room maps." } })
    fireEvent.click(screen.getByLabelText("Submit feedback"))

    expect(await screen.findByText("Only participants can submit feedback")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Title")).toHaveValue("Good schedule")
    expect(screen.getByPlaceholderText("Add feedback...")).toHaveValue("Please add room maps.")
  })
})
