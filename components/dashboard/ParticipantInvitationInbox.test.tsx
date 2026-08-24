/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import type { ComponentPropsWithoutRef } from "react"
import { useSWRConfig } from "swr"

import { api } from "@/lib/api"
import type { ParticipantInvitationResponse } from "@/types/util/request/invitation"
import { ParticipantInvitationInbox } from "./ParticipantInvitationInbox"

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
    getReceivedParticipantInvitations: jest.fn(),
    acceptParticipantInvitation: jest.fn(),
    rejectParticipantInvitation: jest.fn(),
  },
}))

const apiMock = api as jest.Mocked<typeof api>
const useSWRConfigMock = useSWRConfig as jest.MockedFunction<typeof useSWRConfig>
const mutateCacheMock = jest.fn()

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response
}

function invitation(
  overrides: Partial<ParticipantInvitationResponse> = {},
): ParticipantInvitationResponse {
  return {
    id: 11,
    inviter: {
      id: 21,
      username: "captain",
      firstName: "Casey",
      lastName: "Captain",
      role: "PARTICIPANT",
    },
    invitee: {
      id: 22,
      username: "invitee",
      firstName: "Ivy",
      lastName: "Invitee",
      role: "PARTICIPANT",
    },
    tournament: {
      id: 31,
      name: "Autumn Open",
      description: "Debate tournament",
      imageUrl: { id: 1, url: "/tournament.png" },
      league: "UNIVERSITY",
      preliminaryFormat: "APF",
      teamEliminationFormat: "APF",
      tags: [],
    },
    team: {
      id: 41,
      name: "Falcons",
      club: { id: 51, name: "Debate Club" },
    },
    timestamp: "2026-08-24T09:30:00",
    accepted: false,
    ...overrides,
  } as ParticipantInvitationResponse
}

function invitationPage(
  content: ParticipantInvitationResponse[],
  totalPages = 1,
) {
  return response({ content, totalElements: content.length, totalPages })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const renderInbox = () => render(<ParticipantInvitationInbox key={22} userId={22} />)

describe("ParticipantInvitationInbox", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mutateCacheMock.mockResolvedValue(undefined)
    useSWRConfigMock.mockReturnValue({ mutate: mutateCacheMock } as unknown as ReturnType<typeof useSWRConfig>)
    apiMock.getReceivedParticipantInvitations.mockResolvedValue(invitationPage([]))
    apiMock.acceptParticipantInvitation.mockResolvedValue(response({}, 204))
    apiMock.rejectParticipantInvitation.mockResolvedValue(response({}, 204))
  })

  it("loads every page before showing pending invitations", async () => {
    const handledInvitation = invitation({ id: 10, accepted: true })
    const pendingInvitation = invitation({ id: 12, team: { id: 42, name: "Owls", club: { id: 52, name: "City Club" } } })
    apiMock.getReceivedParticipantInvitations
      .mockResolvedValueOnce(invitationPage([handledInvitation], 2))
      .mockResolvedValueOnce(invitationPage([pendingInvitation], 2))

    renderInbox()

    expect(screen.getByRole("status")).toHaveTextContent("Loading team invitations")
    expect(await screen.findByText("Team: Owls")).toBeInTheDocument()
    expect(screen.queryByText("Team: Falcons")).not.toBeInTheDocument()
    expect(apiMock.getReceivedParticipantInvitations).toHaveBeenNthCalledWith(1, {
      page: 0,
      size: 50,
      sort: "timestamp,desc",
    })
    expect(apiMock.getReceivedParticipantInvitations).toHaveBeenNthCalledWith(2, {
      page: 1,
      size: 50,
      sort: "timestamp,desc",
    })
  })

  it("isolates the new participant from old invitations and pending actions", async () => {
    const acceptRequest = deferred<Response>()
    const nextInbox = deferred<Response>()
    const nextInvitation = invitation({
      id: 12,
      invitee: {
        ...invitation().invitee,
        id: 23,
        username: "next-invitee",
        firstName: "Nora",
        lastName: "Next",
      },
      team: { id: 42, name: "Owls", club: { id: 52, name: "City Club" } },
    })
    apiMock.getReceivedParticipantInvitations
      .mockResolvedValueOnce(invitationPage([invitation()]))
      .mockReturnValueOnce(nextInbox.promise)
    apiMock.acceptParticipantInvitation.mockReturnValueOnce(acceptRequest.promise)

    const view = renderInbox()
    expect(await screen.findByText("Team: Falcons")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Accept invitation to Falcons" }))
    await waitFor(() => expect(apiMock.acceptParticipantInvitation).toHaveBeenCalledWith(11))

    view.rerender(<ParticipantInvitationInbox key={23} userId={23} />)
    await waitFor(() => expect(apiMock.getReceivedParticipantInvitations).toHaveBeenCalledTimes(2))

    expect(screen.queryByText("Team: Falcons")).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Loading team invitations")

    await act(async () => {
      nextInbox.resolve(invitationPage([nextInvitation]))
      await nextInbox.promise
    })

    expect(await screen.findByText("Team: Owls")).toBeInTheDocument()
    expect(screen.queryByText("Team: Falcons")).not.toBeInTheDocument()

    await act(async () => {
      acceptRequest.resolve(response({}, 204))
      await acceptRequest.promise
    })

    expect(mutateCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      undefined,
      { revalidate: true },
    )
    const matchesOldMembership = mutateCacheMock.mock.calls[0][0] as (key: unknown) => boolean
    expect(matchesOldMembership(["my-tournaments", 22])).toBe(true)
    expect(matchesOldMembership(["my-tournaments", 23])).toBe(false)
    expect(screen.getByText("Team: Owls")).toBeInTheDocument()
    expect(screen.queryByText("You joined Falcons.")).not.toBeInTheDocument()
  })

  it("accepts an invitation and refreshes the inbox", async () => {
    apiMock.getReceivedParticipantInvitations
      .mockResolvedValueOnce(invitationPage([invitation()]))
      .mockResolvedValueOnce(invitationPage([]))

    renderInbox()

    fireEvent.click(await screen.findByRole("button", { name: "Accept invitation to Falcons" }))

    await waitFor(() => expect(apiMock.acceptParticipantInvitation).toHaveBeenCalledWith(11))
    expect(await screen.findByText("You joined Falcons.")).toBeInTheDocument()
    expect(screen.getByText("No pending team invitations")).toBeInTheDocument()
    expect(apiMock.getReceivedParticipantInvitations).toHaveBeenCalledTimes(2)
    expect(mutateCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      undefined,
      { revalidate: true },
    )
    const matchesCurrentMembership = mutateCacheMock.mock.calls[0][0] as (key: unknown) => boolean
    expect(matchesCurrentMembership(["my-tournaments", 22, undefined, { page: 0 }])).toBe(true)
    expect(matchesCurrentMembership(["my-tournaments", 23, undefined, { page: 0 }])).toBe(false)
    expect(matchesCurrentMembership(["tournaments", 22])).toBe(false)
  })

  it("invalidates tournament memberships when acceptance finishes after unmount", async () => {
    const acceptRequest = deferred<Response>()
    apiMock.getReceivedParticipantInvitations.mockResolvedValueOnce(invitationPage([invitation()]))
    apiMock.acceptParticipantInvitation.mockReturnValueOnce(acceptRequest.promise)

    const view = renderInbox()
    fireEvent.click(await screen.findByRole("button", { name: "Accept invitation to Falcons" }))
    await waitFor(() => expect(apiMock.acceptParticipantInvitation).toHaveBeenCalledWith(11))

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

  it("declines an invitation and refreshes the inbox", async () => {
    apiMock.getReceivedParticipantInvitations
      .mockResolvedValueOnce(invitationPage([invitation()]))
      .mockResolvedValueOnce(invitationPage([]))

    renderInbox()

    fireEvent.click(await screen.findByRole("button", { name: "Decline invitation to Falcons" }))

    await waitFor(() => expect(apiMock.rejectParticipantInvitation).toHaveBeenCalledWith(11))
    expect(await screen.findByText("You declined the invitation to Falcons.")).toBeInTheDocument()
    expect(screen.getByText("No pending team invitations")).toBeInTheDocument()
    expect(apiMock.getReceivedParticipantInvitations).toHaveBeenCalledTimes(2)
  })

  it("keeps decline available when accepting fails with an ordinary 400 response", async () => {
    apiMock.getReceivedParticipantInvitations.mockResolvedValueOnce(invitationPage([invitation()]))
    apiMock.acceptParticipantInvitation.mockResolvedValueOnce(response({ message: "Team is full" }, 400))

    renderInbox()

    fireEvent.click(await screen.findByRole("button", { name: "Accept invitation to Falcons" }))

    expect(await screen.findByText("Team is full")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Decline invitation to Falcons" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Accept invitation to Falcons" })).toBeEnabled()
    expect(apiMock.getReceivedParticipantInvitations).toHaveBeenCalledTimes(1)
  })

  it("marks a genuinely stale invitation as unavailable and refreshes", async () => {
    apiMock.getReceivedParticipantInvitations
      .mockResolvedValueOnce(invitationPage([invitation()]))
      .mockResolvedValueOnce(invitationPage([invitation()]))
    apiMock.acceptParticipantInvitation.mockResolvedValueOnce(response({ message: "Invitation not found" }, 404))

    renderInbox()

    fireEvent.click(await screen.findByRole("button", { name: "Accept invitation to Falcons" }))

    expect(await screen.findByText(/This invitation is no longer available/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Accept invitation to Falcons" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Decline invitation to Falcons" })).not.toBeInTheDocument()
    expect(apiMock.getReceivedParticipantInvitations).toHaveBeenCalledTimes(2)
  })

  it("recovers from an inbox load failure", async () => {
    apiMock.getReceivedParticipantInvitations
      .mockResolvedValueOnce(response({ message: "Inbox unavailable" }, 503))
      .mockResolvedValueOnce(invitationPage([]))

    renderInbox()

    expect(await screen.findByText("Inbox unavailable")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByText("No pending team invitations")).toBeInTheDocument()
    expect(apiMock.getReceivedParticipantInvitations).toHaveBeenCalledTimes(2)
  })

  it("keeps actions available after a retryable action failure", async () => {
    apiMock.getReceivedParticipantInvitations.mockResolvedValueOnce(invitationPage([invitation()]))
    apiMock.rejectParticipantInvitation.mockResolvedValueOnce(response({ message: "Temporary service error" }, 503))

    renderInbox()

    fireEvent.click(await screen.findByRole("button", { name: "Decline invitation to Falcons" }))

    expect(await screen.findByText("Temporary service error")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Accept invitation to Falcons" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Decline invitation to Falcons" })).toBeEnabled()
  })

  it("does not let an older refresh overwrite a newer action refresh", async () => {
    const olderRefresh = deferred<Response>()
    const actionRefresh = deferred<Response>()
    apiMock.getReceivedParticipantInvitations
      .mockResolvedValueOnce(invitationPage([invitation()]))
      .mockReturnValueOnce(olderRefresh.promise)
      .mockReturnValueOnce(actionRefresh.promise)

    renderInbox()

    const acceptButton = await screen.findByRole("button", { name: "Accept invitation to Falcons" })
    fireEvent.click(screen.getByRole("button", { name: "Refresh team invitations" }))
    await waitFor(() => expect(apiMock.getReceivedParticipantInvitations).toHaveBeenCalledTimes(2))

    fireEvent.click(acceptButton)
    await waitFor(() => expect(apiMock.acceptParticipantInvitation).toHaveBeenCalledWith(11))
    await waitFor(() => expect(apiMock.getReceivedParticipantInvitations).toHaveBeenCalledTimes(3))

    await act(async () => {
      actionRefresh.resolve(invitationPage([]))
      await actionRefresh.promise
    })
    expect(await screen.findByText("No pending team invitations")).toBeInTheDocument()

    await act(async () => {
      olderRefresh.resolve(invitationPage([invitation()]))
      await olderRefresh.promise
    })
    expect(screen.queryByText("Team: Falcons")).not.toBeInTheDocument()
  })
})
