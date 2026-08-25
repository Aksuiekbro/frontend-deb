/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { useSWRConfig } from "swr"

import NewsDetailPage from "./page"
import { useCurrentUser, useSingleNews } from "@/hooks/use-api"
import { api } from "@/lib/api"
import type { NewsResponse } from "@/types/news"
import { Role, type UserResponse } from "@/types/user/user"

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "42" }),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

jest.mock("swr", () => ({
  useSWRConfig: jest.fn(),
}))

jest.mock("@/hooks/use-api", () => ({
  useCurrentUser: jest.fn(),
  useSingleNews: jest.fn(),
}))

jest.mock("@/lib/api", () => ({
  api: {
    updateNews: jest.fn(),
    deleteNews: jest.fn(),
  },
}))

const mockUseCurrentUser = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>
const mockUseSingleNews = useSingleNews as jest.MockedFunction<typeof useSingleNews>
const mockUseSWRConfig = useSWRConfig as jest.MockedFunction<typeof useSWRConfig>
const mockApi = api as jest.Mocked<typeof api>
const mockMutateNews = jest.fn()
const mockMutateCache = jest.fn()

const newsItem: NewsResponse = {
  id: 42,
  title: "Championship recap",
  content: "A full recap of the final rounds.",
  timestamp: "2026-08-24T12:30:00",
  thumbnailUrl: { id: 100, url: "https://cdn.example.com/news/cover.jpg" },
  images: [
    { id: 101, url: "https://cdn.example.com/news/gallery-a.jpg" },
    { id: 102, url: "https://cdn.example.com/news/gallery-b.jpg" },
  ],
  tags: [{ name: "tournament:53" }, { name: "highlights" }],
  author: { organizedTournaments: [], coOrganizedTournaments: [] },
  user: {
    id: 7,
    username: "main.organizer",
    firstName: "Main",
    lastName: "Organizer",
    role: Role.ORGANIZER,
  },
}

const owner: UserResponse = {
  ...newsItem.user,
  email: "organizer@example.com",
  profileId: 70,
  socialProfiles: [],
  createdAt: "2026-01-01T00:00:00",
}

function currentUserResult(user: UserResponse | undefined) {
  return {
    user,
    isLoading: false,
    error: undefined,
    mutate: jest.fn(),
  } as ReturnType<typeof useCurrentUser>
}

function newsResult() {
  return {
    newsItem,
    isLoading: false,
    error: undefined,
    mutate: mockMutateNews,
  } as ReturnType<typeof useSingleNews>
}

function okResponse(body?: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body ?? {}),
    text: jest.fn().mockResolvedValue(body === undefined ? "" : JSON.stringify(body)),
  } as unknown as Response
}

function errorResponse(message: string, status = 500): Response {
  return {
    ok: false,
    status,
    json: jest.fn().mockResolvedValue({ message }),
    text: jest.fn().mockResolvedValue(JSON.stringify({ message })),
  } as unknown as Response
}

describe("NewsDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSingleNews.mockReturnValue(newsResult())
    mockUseCurrentUser.mockReturnValue(currentUserResult(owner))
    mockApi.updateNews.mockResolvedValue(okResponse(newsItem))
    mockApi.deleteNews.mockResolvedValue(okResponse())
    mockMutateNews.mockResolvedValue(newsItem)
    mockMutateCache.mockResolvedValue(undefined)
    mockUseSWRConfig.mockReturnValue({ mutate: mockMutateCache } as unknown as ReturnType<typeof useSWRConfig>)
  })

  it("renders the cover and every gallery photo", () => {
    render(<NewsDetailPage />)

    expect(screen.getByRole("img", { name: "Championship recap cover" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/news/cover.jpg",
    )
    expect(screen.getByRole("img", { name: "Championship recap photo 1" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/news/gallery-a.jpg",
    )
    expect(screen.getByRole("img", { name: "Championship recap photo 2" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/news/gallery-b.jpg",
    )
  })

  it("shows edit and delete only to the post owner", () => {
    const { unmount } = render(<NewsDetailPage />)

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument()

    unmount()
    mockUseCurrentUser.mockReturnValue(currentUserResult({ ...owner, id: 99 }))
    render(<NewsDetailPage />)

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument()
  })

  it("shows the not-found state when the News request returns 404", () => {
    mockUseSingleNews.mockReturnValue({
      newsItem: undefined,
      isLoading: false,
      error: Object.assign(new Error("API Error: 404"), { status: 404 }),
      mutate: mockMutateNews,
    } as ReturnType<typeof useSingleNews>)

    render(<NewsDetailPage />)

    expect(screen.getByText("News post not found.")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("retains selected existing photos, uploads new photos, and leaves tags to the backend", async () => {
    render(<NewsDetailPage />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
      target: { value: "Championship recap — updated" },
    })
    fireEvent.change(screen.getByRole("textbox", { name: "Article" }), {
      target: { value: "The updated recap with the award ceremony." },
    })

    // The first existing gallery image stays selected; the second is removed.
    fireEvent.click(screen.getByRole("button", { name: "Remove gallery photo 2" }))
    const newPhoto = new File(["new gallery image"], "awards.png", { type: "image/png" })
    fireEvent.change(screen.getByLabelText("Add gallery photos"), {
      target: { files: [newPhoto] },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(mockApi.updateNews).toHaveBeenCalledWith(
        42,
        {
          title: "Championship recap — updated",
          content: "The updated recap with the award ceremony.",
        },
        undefined,
        [newPhoto],
        [101],
        [1],
      )
    })
    expect(mockMutateNews).toHaveBeenCalledWith(newsItem, { revalidate: false })
    expect(mockMutateCache).toHaveBeenCalledWith(
      expect.any(Function),
      undefined,
      { revalidate: true },
    )
    const matchesNewsList = mockMutateCache.mock.calls[0][0] as (key: unknown) => boolean
    expect(matchesNewsList(["news", undefined, { page: 0 }])).toBe(true)
    expect(matchesNewsList(["news-item", 42])).toBe(false)
  })

  it("does not replace concurrent gallery media or tags during a text-only edit", async () => {
    render(<NewsDetailPage />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
      target: { value: "Text-only update" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(mockApi.updateNews).toHaveBeenCalledWith(
        42,
        {
          title: "Text-only update",
          content: "A full recap of the final rounds.",
        },
        undefined,
        undefined,
        undefined,
        undefined,
      )
    })
  })

  it("moves an existing gallery photo earlier and submits retained image ids in that order", async () => {
    render(<NewsDetailPage />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    fireEvent.click(screen.getByRole("button", { name: "Move gallery photo 2 earlier" }))
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(mockApi.updateNews).toHaveBeenCalledWith(
        42,
        {
          title: "Championship recap",
          content: "A full recap of the final rounds.",
        },
        undefined,
        undefined,
        [102, 101],
        undefined,
      )
    })
  })

  it("moves a newly uploaded gallery photo earlier and submits files in that order", async () => {
    const firstNewPhoto = new File(["first new image"], "awards.png", { type: "image/png" })
    const secondNewPhoto = new File(["second new image"], "audience.png", { type: "image/png" })
    render(<NewsDetailPage />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    fireEvent.change(screen.getByLabelText("Add gallery photos"), {
      target: { files: [firstNewPhoto, secondNewPhoto] },
    })
    fireEvent.click(screen.getByRole("button", { name: "Move new photo 2 earlier" }))
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(mockApi.updateNews).toHaveBeenCalledWith(
        42,
        {
          title: "Championship recap",
          content: "A full recap of the final rounds.",
        },
        undefined,
        [secondNewPhoto, firstNewPhoto],
        [101, 102],
        [2, 3],
      )
    })
  })

  it("moves a new photo before retained photos and submits one unified gallery order", async () => {
    const newPhoto = new File(["new lead image"], "lead.png", { type: "image/png" })
    render(<NewsDetailPage />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    fireEvent.change(screen.getByLabelText("Add gallery photos"), {
      target: { files: [newPhoto] },
    })
    fireEvent.click(screen.getByRole("button", { name: "Move new photo 1 earlier" }))
    fireEvent.click(screen.getByRole("button", { name: "Move new photo 1 earlier" }))
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(mockApi.updateNews).toHaveBeenCalledWith(
        42,
        {
          title: "Championship recap",
          content: "A full recap of the final rounds.",
        },
        undefined,
        [newPhoto],
        [101, 102],
        [0],
      )
    })
  })

  it("keeps the successful edit when refreshing the News cache fails", async () => {
    mockMutateNews.mockRejectedValue(new Error("Refresh failed"))
    render(<NewsDetailPage />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument())
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("preserves the complete edit when PATCH fails so the owner can retry", async () => {
    const newPhoto = new File(["new gallery image"], "retry.png", { type: "image/png" })
    mockApi.updateNews.mockResolvedValueOnce(errorResponse("News update is temporarily unavailable."))
    render(<NewsDetailPage />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
      target: { value: "Retry this title" },
    })
    fireEvent.change(screen.getByLabelText("Add gallery photos"), {
      target: { files: [newPhoto] },
    })
    fireEvent.click(screen.getByRole("button", { name: "Move new photo 1 earlier" }))
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("News update is temporarily unavailable.")
    })
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Retry this title")
    expect(screen.getByText("retry.png")).toBeInTheDocument()
    expect(mockMutateNews).not.toHaveBeenCalled()

    mockApi.updateNews.mockResolvedValueOnce(okResponse(newsItem))
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(mockApi.updateNews).toHaveBeenCalledTimes(2))
    expect(mockApi.updateNews.mock.calls[1]).toEqual(mockApi.updateNews.mock.calls[0])
  })

  it("requires delete confirmation, honours cancellation, and returns to News after deletion", async () => {
    render(<NewsDetailPage />)

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    let confirmation = screen.getByRole("alertdialog")
    expect(mockApi.deleteNews).not.toHaveBeenCalled()

    fireEvent.click(within(confirmation).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(mockApi.deleteNews).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    confirmation = screen.getByRole("alertdialog")
    fireEvent.click(within(confirmation).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(mockApi.deleteNews).toHaveBeenCalledWith(42))
    expect(mockMutateNews).toHaveBeenCalledWith(undefined, { revalidate: false })
    expect(mockMutateCache).toHaveBeenCalledWith(
      expect.any(Function),
      undefined,
      { revalidate: true },
    )
    const matchesNewsList = mockMutateCache.mock.calls[0][0] as (key: unknown) => boolean
    expect(matchesNewsList(["news", undefined, { page: 0 }])).toBe(true)
    expect(matchesNewsList(["news-item", 42])).toBe(false)
    expect(mockReplace).toHaveBeenCalledWith("/news")
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("supports keyboard dismissal and restores focus for delete confirmation", async () => {
    render(<NewsDetailPage />)

    const deleteTrigger = screen.getByRole("button", { name: "Delete" })
    fireEvent.click(deleteTrigger)
    const confirmation = screen.getByRole("alertdialog")
    const cancelButton = within(confirmation).getByRole("button", { name: "Cancel" })

    await waitFor(() => expect(cancelButton).toHaveFocus())
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" })

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(deleteTrigger).toHaveFocus()
    expect(mockApi.deleteNews).not.toHaveBeenCalled()
  })

  it("keeps delete confirmation open and shows a useful error when deletion fails", async () => {
    mockApi.deleteNews.mockResolvedValue(
      errorResponse("News deletion is temporarily unavailable."),
    )
    render(<NewsDetailPage />)

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    const confirmation = screen.getByRole("alertdialog")
    fireEvent.click(within(confirmation).getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument()
      expect(within(screen.getByRole("alertdialog")).getByRole("alert")).toHaveTextContent(
        "News deletion is temporarily unavailable.",
      )
    })
    expect(mockReplace).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockMutateNews).not.toHaveBeenCalled()
    expect(mockMutateCache).not.toHaveBeenCalled()
  })
})
