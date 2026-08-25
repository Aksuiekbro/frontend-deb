/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import { api } from "@/lib/api"
import { Role, type SimpleUserResponse, type UserResponse } from "@/types/user/user"
import type { OrganizerInvitationResponse } from "@/types/util/request/invitation"
import { InviteModal } from "./InviteModal"

jest.mock("@/lib/api", () => ({
  api: {
    getUsers: jest.fn(),
    getSentOrganizerInvitations: jest.fn(),
    createOrganizerInvitation: jest.fn(),
  },
}))

const apiMock = api as jest.Mocked<typeof api>

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response
}

function organizer(id: number, username: string): UserResponse {
  return {
    id,
    username,
    firstName: username.slice(0, 1).toUpperCase() + username.slice(1),
    lastName: "Organizer",
    role: Role.ORGANIZER,
    email: `${username}@example.invalid`,
    profileId: id * 10,
    socialProfiles: [],
    createdAt: "2026-08-24T09:30:00",
  }
}

function invitation(
  id: number,
  invitee: SimpleUserResponse,
  status: "PENDING" | "ACCEPTED" | "DECLINED" = "PENDING",
  tournamentId = 42,
) {
  return {
    id,
    inviter: organizer(1, "main"),
    invitee,
    tournament: { id: tournamentId, name: tournamentId === 42 ? "Autumn Open" : "Winter Open" },
    timestamp: "2026-08-24T09:30:00",
    accepted: status === "ACCEPTED" ? true : status === "DECLINED" ? null : false,
    status,
  } as unknown as OrganizerInvitationResponse
}

function page(content: unknown[]) {
  return response({ content, totalElements: content.length, totalPages: 1 })
}

const baseProps = {
  isOpen: true,
  members: [],
  activeTab: "invite" as const,
  onTabChange: jest.fn(),
  onClose: jest.fn(),
  tournamentId: 42,
  currentUserId: 1,
  existingOrganizers: [organizer(2, "existing")],
  existingOrganizersLoading: false,
  canInviteOrganizers: true,
}

describe("InviteModal organizer workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    apiMock.getSentOrganizerInvitations.mockResolvedValue(page([]))
    apiMock.getUsers.mockResolvedValue(page([]))
    apiMock.createOrganizerInvitation.mockResolvedValue(response({}, 200))
  })

  it("searches organizers and excludes self, existing organizers, and pending invitees", async () => {
    const pending = organizer(3, "pending")
    const eligible = organizer(4, "eligible")
    const previouslyDeclined = organizer(5, "declined")
    apiMock.getSentOrganizerInvitations.mockResolvedValue(page([
      invitation(8, pending),
      invitation(9, previouslyDeclined, "DECLINED"),
    ]))
    apiMock.getUsers.mockResolvedValue(page([
      organizer(1, "main"),
      organizer(2, "existing"),
      pending,
      eligible,
      previouslyDeclined,
    ]))

    render(<InviteModal {...baseProps} />)

    fireEvent.change(screen.getByRole("searchbox", { name: "Search organizers" }), {
      target: { value: "organ" },
    })
    const searchButton = screen.getByRole("button", { name: "Search" })
    await waitFor(() => expect(searchButton).toBeEnabled())
    fireEvent.click(searchButton)

    await waitFor(() => expect(apiMock.getUsers).toHaveBeenCalledWith(
      { searchUsername: "organ", role: Role.ORGANIZER },
      { page: 0, size: 20 },
    ))
    expect(await screen.findByText("Eligible Organizer")).toBeInTheDocument()
    expect(screen.getByText("Declined Organizer")).toBeInTheDocument()
    expect(screen.queryByText("Main Organizer")).not.toBeInTheDocument()
    expect(screen.queryByText("Existing Organizer")).not.toBeInTheDocument()
    expect(screen.queryByText("Pending Organizer")).not.toBeInTheDocument()
  })

  it("waits for sent invitations before searching so pending invitees cannot flash as eligible", async () => {
    const pending = organizer(3, "pending")
    const eligible = organizer(4, "eligible")
    const invitationsRequest = deferred<Response>()
    apiMock.getSentOrganizerInvitations.mockReturnValue(invitationsRequest.promise)
    apiMock.getUsers.mockResolvedValue(page([pending, eligible]))

    render(<InviteModal {...baseProps} />)

    fireEvent.change(screen.getByRole("searchbox", { name: "Search organizers" }), {
      target: { value: "organ" },
    })
    const searchButton = screen.getByRole("button", { name: "Search" })
    expect(searchButton).toBeDisabled()
    fireEvent.click(searchButton)
    expect(apiMock.getUsers).not.toHaveBeenCalled()

    await act(async () => {
      invitationsRequest.resolve(page([invitation(8, pending)]))
      await invitationsRequest.promise
    })

    await waitFor(() => expect(searchButton).toBeEnabled())
    fireEvent.click(searchButton)

    expect(await screen.findByText("Eligible Organizer")).toBeInTheDocument()
    expect(screen.queryByText("Pending Organizer")).not.toBeInTheDocument()
  })

  it("waits for existing organizers before searching so a late co-organizer stays excluded", async () => {
    const existing = organizer(2, "existing")
    const eligible = organizer(4, "eligible")
    apiMock.getUsers.mockResolvedValue(page([existing, eligible]))

    const { rerender } = render(
      <InviteModal
        {...baseProps}
        existingOrganizers={[]}
        existingOrganizersLoading
      />,
    )

    fireEvent.change(screen.getByRole("searchbox", { name: "Search organizers" }), {
      target: { value: "organ" },
    })
    const searchButton = screen.getByRole("button", { name: "Search" })
    await waitFor(() => expect(apiMock.getSentOrganizerInvitations).toHaveBeenCalled())
    expect(searchButton).toBeDisabled()
    fireEvent.click(searchButton)
    expect(apiMock.getUsers).not.toHaveBeenCalled()

    rerender(
      <InviteModal
        {...baseProps}
        existingOrganizers={[existing]}
        existingOrganizersLoading={false}
      />,
    )

    await waitFor(() => expect(searchButton).toBeEnabled())
    fireEvent.click(searchButton)

    expect(await screen.findByText("Eligible Organizer")).toBeInTheDocument()
    expect(screen.queryByText("Existing Organizer")).not.toBeInTheDocument()
  })

  it("sends a tournament-specific invitation and shows its pending status", async () => {
    const eligible = organizer(4, "eligible")
    const created = invitation(12, eligible)
    apiMock.getUsers.mockResolvedValue(page([eligible]))
    apiMock.createOrganizerInvitation.mockResolvedValue(response(created, 200))
    apiMock.getSentOrganizerInvitations
      .mockResolvedValueOnce(page([]))
      .mockResolvedValueOnce(page([created]))

    render(<InviteModal {...baseProps} />)

    fireEvent.change(screen.getByRole("searchbox", { name: "Search organizers" }), {
      target: { value: "eligible" },
    })
    const searchButton = screen.getByRole("button", { name: "Search" })
    await waitFor(() => expect(searchButton).toBeEnabled())
    fireEvent.click(searchButton)
    fireEvent.click(await screen.findByRole("button", { name: "Invite @eligible" }))

    await waitFor(() => expect(apiMock.createOrganizerInvitation).toHaveBeenCalledWith({
      inviteeUsername: "eligible",
      tournamentId: 42,
    }))
    expect(await screen.findByText("Pending")).toBeInTheDocument()
  })

  it("renders durable accepted and declined statuses after loading", async () => {
    apiMock.getSentOrganizerInvitations.mockResolvedValue(page([
      invitation(13, organizer(5, "accepted"), "ACCEPTED"),
      invitation(14, organizer(6, "declined"), "DECLINED"),
    ]))

    render(<InviteModal {...baseProps} />)

    expect(await screen.findByText("Accepted")).toBeInTheDocument()
    expect(screen.getByText("Declined")).toBeInTheDocument()
  })

  it("ignores stale invitation loads after the account and tournament scope change", async () => {
    const previousScopeRequest = deferred<Response>()
    const nextScopeRequest = deferred<Response>()
    apiMock.getSentOrganizerInvitations
      .mockReturnValueOnce(previousScopeRequest.promise)
      .mockReturnValueOnce(nextScopeRequest.promise)

    const { rerender } = render(<InviteModal {...baseProps} />)
    await waitFor(() => expect(apiMock.getSentOrganizerInvitations).toHaveBeenCalledTimes(1))

    rerender(<InviteModal {...baseProps} tournamentId={43} currentUserId={9} />)
    await waitFor(() => expect(apiMock.getSentOrganizerInvitations).toHaveBeenCalledTimes(2))

    await act(async () => {
      nextScopeRequest.resolve(page([invitation(16, organizer(7, "newscope"), "PENDING", 43)]))
      await nextScopeRequest.promise
    })

    expect(await screen.findByText("@newscope")).toBeInTheDocument()

    await act(async () => {
      previousScopeRequest.resolve(page([invitation(15, organizer(6, "oldscope"))]))
      await previousScopeRequest.promise
    })

    expect(screen.queryByText("@oldscope")).not.toBeInTheDocument()
    expect(screen.getByText("@newscope")).toBeInTheDocument()
  })

  it("does not expose organizer invitation controls without FULL permission", async () => {
    render(<InviteModal {...baseProps} canInviteOrganizers={false} />)

    expect(screen.queryByRole("searchbox", { name: "Search organizers" })).not.toBeInTheDocument()
    expect(apiMock.getSentOrganizerInvitations).not.toHaveBeenCalled()
  })
})
