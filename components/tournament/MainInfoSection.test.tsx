/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import { MainInfoSection } from "./MainInfoSection"
import { Role } from "@/types/user/user"
import { LocaleProvider } from "@/lib/i18n"

const announcement = {
  id: 11,
  title: "Registration open",
  content: "Teams can register now.",
  imageUrl: { id: 11, url: "/announcement.png" },
  timestamp: "2026-06-18T10:00:00",
  author: { organizedTournaments: [], coOrganizedTournaments: [] },
  user: {
    id: 2,
    username: "organizer",
    firstName: "Org",
    lastName: "User",
    role: Role.ORGANIZER,
  },
  comments: [
    {
      id: 31,
      content: "Can we register two teams?",
      timestamp: "2026-06-18T11:00:00",
      author: {
        id: 3,
        username: "debater",
        firstName: "Deb",
        lastName: "Ater",
        role: Role.PARTICIPANT,
      },
    },
  ],
  tags: [],
}

const baseProps = {
  selectedOption: "Announcements",
  tournamentLoading: false,
  tournamentError: undefined,
  announcements: { content: [announcement], totalElements: 1, totalPages: 1 },
  announcementsLoading: false,
  announcementsError: undefined,
  schedules: [],
  schedulesLoading: false,
  schedulesError: undefined,
  map: null,
  mapLoading: false,
  mapError: undefined,
  onOpenModal: jest.fn(),
}

const tournamentMap = {
  id: 7,
  title: "Tournament venue",
  description: "Registration is beside the east entrance.",
  imageUrl: { id: 17, url: "/uploads/maps/venue.png" },
}

describe("MainInfoSection announcement comments", () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl
    window.localStorage.removeItem("debetter-locale")
  })

  it.each([["ru", "Объявления"], ["kk", "Хабарландырулар"]] as const)("translates announcement headings for %s", async (locale, heading) => {
    window.localStorage.setItem("debetter-locale", locale)
    render(<LocaleProvider><MainInfoSection {...baseProps} /></LocaleProvider>)
    expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument()
  })

  it("resolves backend upload image paths before rendering announcements", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://backend.test/api/"
    const uploadAnnouncement = {
      ...announcement,
      imageUrl: { id: 53, url: "/uploads/announcements/53.jpg" },
    }

    render(
      <MainInfoSection
        {...baseProps}
        announcements={{ content: [uploadAnnouncement], totalElements: 1, totalPages: 1 }}
      />
    )

    expect(screen.getByAltText("Registration open")).toHaveAttribute(
      "src",
      "https://backend.test/api/uploads/announcements/53.jpg"
    )
  })

  it("hides a broken announcement image after the browser reports an error", () => {
    render(<MainInfoSection {...baseProps} />)

    fireEvent.error(screen.getByAltText("Registration open"))

    expect(screen.queryByAltText("Registration open")).not.toBeInTheDocument()
    expect(screen.getByText("Registration open")).toBeInTheDocument()
  })

  it("renders announcement comments and submits a new comment through the wired handler", async () => {
    const onAddAnnouncementComment = jest.fn().mockResolvedValue(undefined)

    render(<MainInfoSection {...baseProps} onAddAnnouncementComment={onAddAnnouncementComment} />)

    expect(screen.getByText("Can we register two teams?")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Announcement comment"), {
      target: { value: "Yes, if each participant is unique." },
    })
    fireEvent.click(screen.getByRole("button", { name: "Add comment" }))

    await waitFor(() => {
      expect(onAddAnnouncementComment).toHaveBeenCalledWith(11, "Yes, if each participant is unique.")
    })
    expect(screen.getByLabelText("Announcement comment")).toHaveValue("")
  })

  it("wires organizer edit action for the active announcement", () => {
    const onEditAnnouncement = jest.fn()

    render(<MainInfoSection {...baseProps} onEditAnnouncement={onEditAnnouncement} />)

    fireEvent.click(screen.getByRole("button", { name: "Edit announcement" }))

    expect(onEditAnnouncement).toHaveBeenCalledWith(expect.objectContaining({
      id: 11,
      title: "Registration open",
    }))
  })

  it("hides organizer-only add controls when no modal handler is wired", () => {
    const readOnlyProps = { ...baseProps, onOpenModal: undefined }

    render(<MainInfoSection {...readOnlyProps} />)

    expect(screen.queryByRole("button", { name: "Add announcement" })).not.toBeInTheDocument()
  })

  it("renders a saved map and lets an organizer edit it", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://backend.test/api/"
    const onEditMap = jest.fn()

    render(
      <MainInfoSection
        {...baseProps}
        selectedOption="Map"
        map={tournamentMap}
        onEditMap={onEditMap}
      />,
    )

    expect(screen.getByRole("heading", { name: "Tournament venue" })).toBeInTheDocument()
    expect(screen.getByText("Registration is beside the east entrance.")).toBeInTheDocument()
    expect(screen.getByAltText("Tournament venue")).toHaveAttribute(
      "src",
      "https://backend.test/api/uploads/maps/venue.png",
    )

    fireEvent.click(screen.getByRole("button", { name: "Edit map" }))
    expect(onEditMap).toHaveBeenCalledWith(tournamentMap)
    expect(screen.queryByRole("button", { name: "Add map" })).not.toBeInTheDocument()
  })

  it("renders the empty map state and lets an organizer add a map", () => {
    const onOpenModal = jest.fn()

    render(
      <MainInfoSection
        {...baseProps}
        selectedOption="Map"
        map={null}
        onOpenModal={onOpenModal}
      />,
    )

    expect(screen.getByText("No map has been added yet")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Add map" }))
    expect(onOpenModal).toHaveBeenCalledWith("map")
    expect(screen.queryByRole("button", { name: "Edit map" })).not.toBeInTheDocument()
  })

  it("does not render map management controls for guests", () => {
    render(
      <MainInfoSection
        {...baseProps}
        selectedOption="Map"
        map={tournamentMap}
        onOpenModal={undefined}
      />,
    )

    expect(screen.getByAltText("Tournament venue")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add map" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Edit map" })).not.toBeInTheDocument()
  })

  it("distinguishes map loading and load failures from the empty state", () => {
    const { rerender } = render(
      <MainInfoSection
        {...baseProps}
        selectedOption="Map"
        mapLoading
        onOpenModal={undefined}
      />,
    )

    expect(screen.queryByText("No map has been added yet")).not.toBeInTheDocument()

    rerender(
      <MainInfoSection
        {...baseProps}
        selectedOption="Map"
        mapError={new Error("network unavailable")}
        onOpenModal={undefined}
      />,
    )

    expect(screen.getByText("Unable to load the tournament map")).toBeInTheDocument()
    expect(screen.queryByText("No map has been added yet")).not.toBeInTheDocument()
  })
})
