/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import type { ReactNode } from "react"

import HostDebate from "./HostDebate"
import { api } from "@/lib/api"

const pushMock = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

jest.mock("@/lib/api", () => ({
  api: {
    createTournament: jest.fn(),
  },
}))

type MockSelectProps = {
  value?: string
  onValueChange: (value: string) => void
  children?: ReactNode
}

type MockSelectItemProps = {
  value: string
  children?: ReactNode
}

jest.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: MockSelectProps) => (
    <select value={value ?? ""} onChange={(event) => onValueChange(event.target.value)}>
      <option value="" disabled />
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children?: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: MockSelectItemProps) => <option value={value}>{children}</option>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}))

const createTournamentMock = api.createTournament as jest.Mock

function fillTournamentForm(container: HTMLElement, includeImage = true) {
  fireEvent.change(screen.getByPlaceholderText(/clear and engaging title/i), {
    target: { value: "Debate test" },
  })
  fireEvent.change(screen.getByPlaceholderText(/provide context/i), {
    target: { value: "A useful description for the tournament." },
  })
  fireEvent.change(screen.getByPlaceholderText(/city or venue/i), {
    target: { value: "Almaty" },
  })
  fireEvent.change(screen.getByPlaceholderText(/maximum number of teams/i), {
    target: { value: "32" },
  })
  fireEvent.change(screen.getByPlaceholderText(/total preliminary rounds/i), {
    target: { value: "5" },
  })
  fireEvent.change(screen.getByPlaceholderText(/total elimination rounds/i), {
    target: { value: "3" },
  })

  const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="date"]')
  fireEvent.change(dateInputs[0], { target: { value: "2026-06-27" } })
  fireEvent.change(dateInputs[1], { target: { value: "2026-06-28" } })
  fireEvent.change(dateInputs[2], { target: { value: "2026-06-26" } })

  const selects = container.querySelectorAll<HTMLSelectElement>("select")
  fireEvent.change(selects[0], { target: { value: "SCHOOL" } })
  fireEvent.change(selects[1], { target: { value: "APF" } })
  fireEvent.change(selects[2], { target: { value: "APF" } })

  if (includeImage) {
    const file = new File(["poster"], "poster.png", { type: "image/png" })
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')!
    fireEvent.change(fileInput, { target: { files: [file] } })
    return file
  }

  return null
}

const screenshotTitle = "AI Governance: The Future of Autonomous Decision-Making"
const screenshotDescription =
  "As artificial intelligence systems become increasingly autonomous, the question of who governs their decisions becomes urgent. This tournament explores the ethical, legal, and societal implications of delegating critical decisions to AI - from healthcare diagnostics to criminal justice and financial systems."

afterEach(() => {
  jest.clearAllMocks()
})

describe("HostDebate", () => {
  it("does not render unused debate-side or category fields", () => {
    render(<HostDebate />)

    expect(screen.queryByText(/category/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/proposition side/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/opposition side/i)).not.toBeInTheDocument()
  })

  it("only offers APF and BPF as team-stage formats", () => {
    render(<HostDebate />)

    expect(screen.getAllByRole("option", { name: "APF" })).toHaveLength(2)
    expect(screen.getAllByRole("option", { name: "BPF" })).toHaveLength(2)
    expect(screen.queryByRole("option", { name: "KP" })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "LD" })).not.toBeInTheDocument()
  })

  it("does not submit values that exceed the backend tournament length limits", async () => {
    const { container } = render(<HostDebate />)
    fillTournamentForm(container)

    fireEvent.change(screen.getByPlaceholderText(/clear and engaging title/i), {
      target: { value: screenshotTitle },
    })
    fireEvent.change(screen.getByPlaceholderText(/provide context/i), {
      target: { value: screenshotDescription },
    })

    fireEvent.submit(container.querySelector("form")!)

    expect(await screen.findByRole("alert")).toHaveTextContent(/title must be 50 characters or fewer/i)
    expect(screen.getByRole("alert")).toHaveTextContent(/description must be 200 characters or fewer/i)
    expect(createTournamentMock).not.toHaveBeenCalled()
  })

  it("creates a tournament through the API and opens the created tournament page", async () => {
    createTournamentMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 42 }),
    } as Response)

    const { container } = render(<HostDebate />)
    const file = fillTournamentForm(container)

    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => expect(createTournamentMock).toHaveBeenCalledTimes(1))
    expect(createTournamentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Debate test",
        description: "A useful description for the tournament.",
        startDate: "2026-06-27T00:00:00",
        endDate: "2026-06-28T00:00:00",
        registrationDeadline: "2026-06-26T00:00:00",
        location: "Almaty",
        league: "SCHOOL",
        teamLimit: 32,
        preliminaryFormat: "APF",
        teamEliminationFormat: "APF",
        preliminaryRoundCount: 5,
        eliminationRoundCount: 3,
        ldEnabled: true,
      }),
      file,
    )
    expect(pushMock).toHaveBeenCalledWith("/tournament/42")
  })

  it("lets the organizer opt out of the LD bracket", async () => {
    createTournamentMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 42 }),
    } as Response)

    const { container } = render(<HostDebate />)
    fillTournamentForm(container)

    const ldCheckbox = screen.getByRole("checkbox", { name: /include ld/i })
    expect(ldCheckbox).toBeChecked()
    fireEvent.click(ldCheckbox)

    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => expect(createTournamentMock).toHaveBeenCalledTimes(1))
    expect(createTournamentMock).toHaveBeenCalledWith(
      expect.objectContaining({ ldEnabled: false }),
      expect.anything(),
    )
  })

  it("falls back to the tournaments list when the backend does not return an id", async () => {
    createTournamentMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response)

    const { container } = render(<HostDebate />)
    fillTournamentForm(container)

    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/my-tournaments"))
  })

  it("does not submit without a tournament image", async () => {
    const { container } = render(<HostDebate />)
    fillTournamentForm(container, false)

    fireEvent.submit(container.querySelector("form")!)

    expect(await screen.findByRole("alert")).toHaveTextContent(/upload an image/i)
    expect(createTournamentMock).not.toHaveBeenCalled()
  })

  it("does not submit when registration closes after the start date", async () => {
    const { container } = render(<HostDebate />)
    fillTournamentForm(container)

    const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="date"]')
    fireEvent.change(dateInputs[2], { target: { value: "2026-06-29" } })

    fireEvent.submit(container.querySelector("form")!)

    expect(await screen.findByRole("alert")).toHaveTextContent(/registration deadline must be before/i)
    expect(createTournamentMock).not.toHaveBeenCalled()
  })

  it("shows the backend error and stays on the form when tournament creation fails", async () => {
    createTournamentMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: "Tournament limit exceeded" }),
    } as Response)

    const { container } = render(<HostDebate />)
    fillTournamentForm(container)

    fireEvent.submit(container.querySelector("form")!)

    expect(await screen.findByRole("alert")).toHaveTextContent("Tournament limit exceeded")
    expect(pushMock).not.toHaveBeenCalled()
  })
})
