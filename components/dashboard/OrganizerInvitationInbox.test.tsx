/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import type { ComponentPropsWithoutRef } from "react"

import { api } from "@/lib/api"
import { Role } from "@/types/user/user"
import type { OrganizerInvitationResponse } from "@/types/util/request/invitation"
import { OrganizerInvitationInbox } from "./OrganizerInvitationInbox"

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
})
