/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import type { ComponentPropsWithoutRef } from "react"
import { useSWRConfig } from "swr"

import { api } from "@/lib/api"
import { Role } from "@/types/user/user"
import type { OrganizerInvitationResponse } from "@/types/util/request/invitation"
import { OrganizerInvitationInbox } from "./OrganizerInvitationInbox"

jest.mock("swr", () => ({
  useSWRConfig: jest.fn(),
}))

type MockLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & { href: string }

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, ...props }: MockLinkProps) => <a href={href} {...props} />,
}))

jest.mock("@/lib/api", () => ({
  api: {
    getReceivedOrganizerInvitations: jest.fn(),
    acceptOrganizerInvitation: jest.fn(),
    rejectOrganizerInvitation: jest.fn(),
  },
}))

const apiMock = api as jest.Mocked<typeof api>
const useSWRConfigMock = useSWRConfig as jest.MockedFunction<typeof useSWRConfig>
const mutateCacheMock = jest.fn()

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

function invitation(status: "PENDING" | "ACCEPTED" | "DECLINED" = "PENDING") {
  return {
    id: 11,
    inviter: {
      id: 21,
      username: "host",
      firstName: "Harper",
      lastName: "Host",
      role: Role.ORGANIZER,
    },
    invitee: {
      id: 22,
      username: "invitee",
      firstName: "Ivy",
      lastName: "Invitee",
      role: Role.ORGANIZER,
    },
    tournament: { id: 31, name: "Autumn Open" },
    timestamp: "2026-08-24T09:30:00",
    accepted: status === "ACCEPTED" ? true : status === "DECLINED" ? null : false,
    status,
  } as unknown as OrganizerInvitationResponse
}

function invitationPage(content: OrganizerInvitationResponse[]) {
  return response({ content, totalElements: content.length, totalPages: 1 })
}

describe("OrganizerInvitationInbox", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mutateCacheMock.mockResolvedValue(undefined)
    useSWRConfigMock.mockReturnValue({ mutate: mutateCacheMock } as unknown as ReturnType<typeof useSWRConfig>)
    apiMock.getReceivedOrganizerInvitations.mockResolvedValue(invitationPage([]))
    apiMock.acceptOrganizerInvitation.mockResolvedValue(response({}, 204))
    apiMock.rejectOrganizerInvitation.mockResolvedValue(response({}, 204))
  })

  it("makes pending invitations discoverable with tournament and actions", async () => {
    apiMock.getReceivedOrganizerInvitations.mockResolvedValue(invitationPage([invitation()]))

    render(<OrganizerInvitationInbox />)

    expect(await screen.findByText("Autumn Open")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View tournament" })).toHaveAttribute("href", "/tournament/31")
    expect(screen.getByRole("button", { name: "Accept invitation to Autumn Open" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Decline invitation to Autumn Open" })).toBeEnabled()
  })

  it("accepts and then shows the refreshed accepted status", async () => {
    apiMock.getReceivedOrganizerInvitations
      .mockResolvedValueOnce(invitationPage([invitation()]))
      .mockResolvedValueOnce(invitationPage([invitation("ACCEPTED")]))

    render(<OrganizerInvitationInbox />)

    fireEvent.click(await screen.findByRole("button", { name: "Accept invitation to Autumn Open" }))

    await waitFor(() => expect(apiMock.acceptOrganizerInvitation).toHaveBeenCalledWith(11))
    expect(await screen.findByText("Accepted")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Accept invitation to Autumn Open" })).not.toBeInTheDocument()
  })

  it("invalidates the invitee membership and tournament organizer caches after acceptance", async () => {
    apiMock.getReceivedOrganizerInvitations
      .mockResolvedValueOnce(invitationPage([invitation()]))
      .mockResolvedValueOnce(invitationPage([invitation("ACCEPTED")]))

    render(<OrganizerInvitationInbox />)

    fireEvent.click(await screen.findByRole("button", { name: "Accept invitation to Autumn Open" }))

    await waitFor(() => expect(mutateCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      undefined,
      { revalidate: true },
    ))
    const matchesMembershipChanges = mutateCacheMock.mock.calls[0][0] as (key: unknown) => boolean
    expect(matchesMembershipChanges(["my-tournaments", 22, undefined, { page: 0 }])).toBe(true)
    expect(matchesMembershipChanges(["my-tournaments", 23, undefined, { page: 0 }])).toBe(false)
    expect(matchesMembershipChanges(["tournament-organizers", 31])).toBe(true)
    expect(matchesMembershipChanges(["tournament-organizers", 32])).toBe(false)
    expect(matchesMembershipChanges(["tournament-judges", 31, 22, undefined, { page: 0, size: 100 }])).toBe(true)
    expect(matchesMembershipChanges(["tournament-judges", 31, 23, undefined, { page: 0, size: 100 }])).toBe(false)
    expect(matchesMembershipChanges(["tournament-judges", 32, 22, undefined, { page: 0, size: 100 }])).toBe(false)
    expect(matchesMembershipChanges(["tournament", 31])).toBe(false)
  })

  it("still invalidates membership caches when acceptance finishes after unmount", async () => {
    const acceptRequest = deferred<Response>()
    apiMock.getReceivedOrganizerInvitations.mockResolvedValueOnce(invitationPage([invitation()]))
    apiMock.acceptOrganizerInvitation.mockReturnValueOnce(acceptRequest.promise)

    const view = render(<OrganizerInvitationInbox />)
    fireEvent.click(await screen.findByRole("button", { name: "Accept invitation to Autumn Open" }))
    await waitFor(() => expect(apiMock.acceptOrganizerInvitation).toHaveBeenCalledWith(11))

    view.unmount()
    await act(async () => {
      acceptRequest.resolve(response({}, 204))
      await acceptRequest.promise
    })

    expect(mutateCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      undefined,
      { revalidate: true },
    )
  })

  it("declines and then shows the refreshed declined status", async () => {
    apiMock.getReceivedOrganizerInvitations
      .mockResolvedValueOnce(invitationPage([invitation()]))
      .mockResolvedValueOnce(invitationPage([invitation("DECLINED")]))

    render(<OrganizerInvitationInbox />)

    fireEvent.click(await screen.findByRole("button", { name: "Decline invitation to Autumn Open" }))

    await waitFor(() => expect(apiMock.rejectOrganizerInvitation).toHaveBeenCalledWith(11))
    expect(await screen.findByText("Declined")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Decline invitation to Autumn Open" })).not.toBeInTheDocument()
  })

  it("restores handled statuses on a fresh load", async () => {
    apiMock.getReceivedOrganizerInvitations.mockResolvedValue(invitationPage([invitation("ACCEPTED")]))

    render(<OrganizerInvitationInbox />)

    expect(await screen.findByText("Accepted")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /invitation to Autumn Open/ })).not.toBeInTheDocument()
  })

  it("keeps the optimistic handled status when the follow-up refresh fails", async () => {
    apiMock.getReceivedOrganizerInvitations
      .mockResolvedValueOnce(invitationPage([invitation()]))
      .mockResolvedValueOnce(response({ message: "Refresh failed" }, 500))

    render(<OrganizerInvitationInbox />)

    fireEvent.click(await screen.findByRole("button", { name: "Accept invitation to Autumn Open" }))

    expect(await screen.findByText("Accepted")).toBeInTheDocument()
    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Accept invitation to Autumn Open" })).not.toBeInTheDocument()
  })

  it("disables invitation actions while a manual refresh is in flight", async () => {
    const refreshRequest = deferred<Response>()
    apiMock.getReceivedOrganizerInvitations
      .mockResolvedValueOnce(invitationPage([invitation()]))
      .mockReturnValueOnce(refreshRequest.promise)

    render(<OrganizerInvitationInbox />)

    const acceptButton = await screen.findByRole("button", { name: "Accept invitation to Autumn Open" })
    fireEvent.click(screen.getByRole("button", { name: "Refresh organizer invitations" }))

    expect(acceptButton).toBeDisabled()
    expect(screen.getByRole("button", { name: "Decline invitation to Autumn Open" })).toBeDisabled()

    await act(async () => {
      refreshRequest.resolve(invitationPage([invitation()]))
      await refreshRequest.promise
    })

    await waitFor(() => expect(acceptButton).toBeEnabled())
  })
})
