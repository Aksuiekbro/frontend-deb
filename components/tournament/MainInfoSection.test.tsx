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
  onOpenModal: jest.fn(),
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

  it("switches the photo and all announcement details together", () => {
    const olderAnnouncement = {
      ...announcement,
      id: 12,
      title: "Venue update",
      content: "The final round moved to Hall B.",
      imageUrl: { id: 12, url: "/venue-update.jpg" },
      timestamp: "2026-06-17T10:00:00",
      tags: [{ id: 4, name: "Info" }],
      comments: [{
        ...announcement.comments[0],
        id: 32,
        content: "Thanks for the update.",
      }],
    }
    const newestAnnouncement = {
      ...announcement,
      tags: [{ id: 3, name: "Important" }],
    }

    render(
      <MainInfoSection
        {...baseProps}
        announcements={{
          content: [olderAnnouncement, newestAnnouncement],
          totalElements: 2,
          totalPages: 1,
        }}
      />
    )

    expect(screen.getByAltText("Registration open")).toHaveAttribute("src", "/announcement.png")
    expect(screen.getByText("Teams can register now.")).toBeInTheDocument()
    expect(screen.getByText("Important")).toBeInTheDocument()
    expect(screen.getByText("Can we register two teams?")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Next announcement" }))

    expect(screen.getByAltText("Venue update")).toHaveAttribute("src", "/venue-update.jpg")
    expect(screen.getByText("The final round moved to Hall B.")).toBeInTheDocument()
    expect(screen.getByText("Info")).toBeInTheDocument()
    expect(screen.getByText("Thanks for the update.")).toBeInTheDocument()
    expect(screen.getByText("2/2")).toBeInTheDocument()
    expect(screen.queryByAltText("Registration open")).not.toBeInTheDocument()
    expect(screen.queryByText("Can we register two teams?")).not.toBeInTheDocument()
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
})
