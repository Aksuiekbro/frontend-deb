/**
 * @jest-environment jsdom
 */
import { StrictMode, useState } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import ProfileClient from "./ProfileClient"
import { useCurrentUser, useUser } from "@/hooks/use-api"
import { Role, type UserResponse } from "@/types/user/user"
import { LocaleProvider } from "@/lib/i18n"
import { api } from "@/lib/api"

jest.mock("../../../components/Header", () => function Header() {
  return <div data-testid="header" />
})

jest.mock("../../../components/profile/AvatarWithEdit", () => function AvatarWithEdit(props: { onChangeImage?: unknown }) {
  return <button type="button" disabled={!props.onChangeImage}>Edit avatar</button>
})

jest.mock("../../../components/profile/SocialsManager", () => function SocialsManager(props: { editable?: boolean }) {
  return <div data-testid="socials" data-editable={String(Boolean(props.editable))} />
})

jest.mock("@/components/profile/LogoutButton", () => function LogoutButton() {
  return <button type="button">Logout</button>
})

jest.mock("@/components/profile/ChangePasswordForm", () => function ChangePasswordForm(props: { userId: number }) {
  return <button type="button" data-user-id={props.userId}>Change password</button>
})

jest.mock("@/lib/api", () => ({
  api: { updateUser: jest.fn(), getUser: jest.fn(), getMe: jest.fn() },
}))

jest.mock("@/hooks/use-api", () => ({
  useCurrentUser: jest.fn(),
  useUser: jest.fn(),
}))

const useCurrentUserMock = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>
const useUserMock = useUser as jest.MockedFunction<typeof useUser>
type CurrentUserHookResult = ReturnType<typeof useCurrentUser>
type UserHookResult = ReturnType<typeof useUser>

const updateUserMock = api.updateUser as jest.MockedFunction<typeof api.updateUser>
const getUserMock = api.getUser as jest.MockedFunction<typeof api.getUser>
const getMeMock = api.getMe as jest.MockedFunction<typeof api.getMe>

const user: UserResponse = {
  id: 1,
  username: "debater",
  firstName: "Deb",
  lastName: "Ater",
  email: "debater@example.com",
  role: Role.PARTICIPANT,
  profileId: 42,
  socialProfiles: [],
  createdAt: "2026-06-18T00:00:00",
}

function response(status: number, body: unknown = user) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) } as Response
}

function editNickname(value = "newname") {
  fireEvent.click(screen.getByRole("button", { name: "Edit profile" }))
  fireEvent.change(screen.getByRole("textbox", { name: "Nickname" }), { target: { value } })
  fireEvent.submit(screen.getByRole("form", { name: "Edit profile" }))
}

function deferredResponse() {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>((done) => { resolve = done })
  return { promise, resolve }
}

describe("ProfilePage actions", () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    updateUserMock.mockReset().mockResolvedValue(response(200, { ...user, username: "newname" }))
    getUserMock.mockReset().mockResolvedValue(response(200, { ...user, username: "newname" }))
    getMeMock.mockReset().mockResolvedValue(response(200, { ...user, username: "newname" }))
    useUserMock.mockReturnValue({
      user,
      isLoading: false,
      error: undefined,
      mutate: jest.fn(),
    } as UserHookResult)
    useCurrentUserMock.mockReturnValue({
      user,
      isLoading: false,
      error: undefined,
      mutate: jest.fn(),
    } as CurrentUserHookResult)
  })

  it("does not expose an enabled delete-account action before backend deletion is wired", async () => {
    render(<ProfileClient userId={1} />)

    expect(screen.getByRole("button", { name: "Delete account" })).toBeDisabled()
  })

  it("enables profile edits only for the signed-in user's own profile", () => {
    render(<ProfileClient userId={1} />)

    expect(screen.getByRole("button", { name: "Edit avatar" })).toBeEnabled()
    expect(screen.getByTestId("socials")).toHaveAttribute("data-editable", "true")
    expect(screen.getByRole("button", { name: "Edit profile" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Change password" })).toHaveAttribute("data-user-id", "1")
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument()
  })

  it("keeps another user's profile read-only", () => {
    useCurrentUserMock.mockReturnValue({
      user: { ...user, id: 2 },
      isLoading: false,
      error: undefined,
      mutate: jest.fn(),
    } as CurrentUserHookResult)

    render(<ProfileClient userId={1} />)

    expect(screen.getByRole("button", { name: "Edit avatar" })).toBeDisabled()
    expect(screen.getByTestId("socials")).toHaveAttribute("data-editable", "false")
    expect(screen.queryByRole("button", { name: "Edit profile" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Change password" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Delete account" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: user.email })).toHaveAttribute("href", `mailto:${user.email}`)
  })

  it.each([
    { user: undefined, isLoading: false, error: undefined },
    { user, isLoading: true, error: undefined },
    { user, isLoading: false, error: new Error("Session unavailable") },
  ])("hides all account actions while authentication is unresolved or unavailable: %p", (auth) => {
    useCurrentUserMock.mockReturnValue({ ...auth, mutate: jest.fn() } as CurrentUserHookResult)
    render(<ProfileClient userId={1} />)
    expect(screen.getByRole("button", { name: "Edit avatar" })).toBeDisabled()
    expect(screen.getByTestId("socials")).toHaveAttribute("data-editable", "false")
    expect(screen.queryByRole("button", { name: "Edit profile" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Change password" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Delete account" })).not.toBeInTheDocument()
  })

  it("does not expose owner actions for stale profile data after navigating", () => {
    render(<ProfileClient userId={2} />)
    expect(screen.queryByRole("button", { name: "Edit profile" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument()
  })

  it("updates the displayed identity and current-user cache, then refreshes both from the API", async () => {
    const changed = { ...user, username: "newname", email: "new@example.com" }
    updateUserMock.mockResolvedValue(response(200, changed))
    getUserMock.mockResolvedValue(response(200, changed))
    getMeMock.mockResolvedValue(response(200, changed))
    const profileMutate = jest.fn()
    const currentMutate = jest.fn()
    let currentCache: UserResponse | null | undefined = user
    useUserMock.mockImplementation(function useProfileCache() {
      const [cached, setCached] = useState<UserResponse | undefined>(user)
      profileMutate.mockImplementation(async (updater: (previous: UserResponse | undefined) => UserResponse | undefined) => {
        setCached(updater)
      })
      return { user: cached, isLoading: false, error: undefined, mutate: profileMutate } as UserHookResult
    })
    useCurrentUserMock.mockImplementation(function useCurrentCache() {
      const [cached, setCached] = useState<UserResponse | undefined>(user)
      currentMutate.mockImplementation(async (updater: (previous: UserResponse | null | undefined) => UserResponse | null | undefined) => {
        currentCache = updater(currentCache)
        setCached(currentCache ?? undefined)
      })
      return { user: cached, isLoading: false, error: undefined, mutate: currentMutate } as CurrentUserHookResult
    })
    render(<ProfileClient userId={1} />)
    fireEvent.click(screen.getByRole("button", { name: "Edit profile" }))
    fireEvent.change(screen.getByRole("textbox", { name: "Nickname" }), { target: { value: " newname " } })
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), { target: { value: "new@example.com" } })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Profile updated."))
    expect(updateUserMock).toHaveBeenCalledWith(1, { username: "newname", email: "new@example.com" })
    expect(screen.getByRole("heading", { name: "newname" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "new@example.com" })).toBeInTheDocument()
    expect(currentCache?.username).toBe("newname")
    expect(currentCache?.email).toBe("new@example.com")
    expect(getUserMock).toHaveBeenCalledWith(1)
    expect(getMeMock).toHaveBeenCalledTimes(1)
    expect(profileMutate).toHaveBeenCalledTimes(2)
    expect(currentMutate).toHaveBeenCalledTimes(2)
  })

  it.each([
    [400, "Check your profile details and try again."],
    [401, "Your session may have expired"],
    [403, "Your session may have expired"],
    [409, "That nickname or email is already in use."],
    [500, "Could not update your profile."],
  ])("shows useful safe HTTP %s feedback and preserves the draft", async (status, message) => {
    updateUserMock.mockResolvedValue(response(status, status === 500 ? { message: "SQL private internals" } : {}))
    render(<ProfileClient userId={1} />)
    editNickname()
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(message))
    expect(screen.getByRole("textbox", { name: "Nickname" })).toHaveValue("newname")
    expect(screen.queryByText("SQL private internals")).not.toBeInTheDocument()
    expect(getMeMock).not.toHaveBeenCalled()
  })

  it("shows safe network feedback without disclosing exception details", async () => {
    updateUserMock.mockRejectedValue(new Error("private host failed"))
    render(<ProfileClient userId={1} />)
    editNickname()
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Could not update your profile."))
    expect(screen.queryByText("private host failed")).not.toBeInTheDocument()
  })

  it.each([
    ["ru", 400, "Редактировать профиль", "Никнейм", "Проверьте данные профиля"],
    ["ru", 409, "Редактировать профиль", "Никнейм", "Этот никнейм или адрес электронной почты уже используется."],
    ["kk", 400, "Профильді өңдеу", "Лақап ат", "Профиль деректерін тексеріп"],
    ["kk", 409, "Профильді өңдеу", "Лақап ат", "Бұл лақап ат немесе электрондық пошта қолданыста."],
  ])("localizes a backend-shaped %s error (%s)", async (locale, status, edit, nickname, expected) => {
    window.localStorage.setItem("debetter-locale", String(locale))
    updateUserMock.mockResolvedValue(response(Number(status), { message: "English server validation or conflict detail" }))
    render(<LocaleProvider><ProfileClient userId={1} /></LocaleProvider>)
    await waitFor(() => expect(screen.getByRole("button", { name: String(edit) })).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: String(edit) }))
    fireEvent.change(screen.getByRole("textbox", { name: String(nickname) }), { target: { value: "newname" } })
    fireEvent.submit(screen.getByRole("form", { name: String(edit) }))
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(String(expected)))
    expect(screen.queryByText("English server validation or conflict detail")).not.toBeInTheDocument()
  })

  it("reports a successful save even when both revalidation reads fail", async () => {
    getUserMock.mockRejectedValue(new Error("network unavailable"))
    getMeMock.mockResolvedValue(response(503))
    render(<ProfileClient userId={1} />)
    editNickname()
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Profile updated."))
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it.each(["account", "profile", "cancel", "unmount"])("ignores a save response after %s changes", async (change) => {
    const pending = deferredResponse()
    updateUserMock.mockReturnValue(pending.promise)
    const profileMutate = jest.fn()
    const currentMutate = jest.fn()
    useUserMock.mockReturnValue({ user, isLoading: false, error: undefined, mutate: profileMutate } as UserHookResult)
    useCurrentUserMock.mockReturnValue({ user, isLoading: false, error: undefined, mutate: currentMutate } as CurrentUserHookResult)
    const { rerender, unmount } = render(<ProfileClient userId={1} />)
    editNickname()
    if (change === "account") {
      useCurrentUserMock.mockReturnValue({ user: { ...user, id: 2 }, isLoading: false, error: undefined, mutate: currentMutate } as CurrentUserHookResult)
      rerender(<ProfileClient userId={1} />)
    } else if (change === "profile") {
      useUserMock.mockReturnValue({ user: { ...user, id: 2 }, isLoading: false, error: undefined, mutate: profileMutate } as UserHookResult)
      rerender(<ProfileClient userId={2} />)
    } else if (change === "cancel") {
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
      fireEvent.click(screen.getByRole("button", { name: "Edit profile" }))
    } else {
      unmount()
    }
    await act(async () => pending.resolve(response(200, { ...user, username: "oldrequest" })))
    expect(profileMutate).not.toHaveBeenCalled()
    expect(currentMutate).not.toHaveBeenCalled()
    expect(getMeMock).not.toHaveBeenCalled()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    if (change === "cancel") expect(screen.getByRole("textbox", { name: "Nickname" })).toHaveValue("debater")
  })

  it("does not apply a late current-user refresh after switching accounts", async () => {
    const pending = deferredResponse()
    getMeMock.mockReturnValue(pending.promise)
    const currentMutate = jest.fn()
    useCurrentUserMock.mockReturnValue({ user, isLoading: false, error: undefined, mutate: currentMutate } as CurrentUserHookResult)
    const { rerender } = render(<ProfileClient userId={1} />)
    editNickname()
    await waitFor(() => expect(getMeMock).toHaveBeenCalledTimes(1))
    expect(currentMutate).toHaveBeenCalledTimes(1)
    useCurrentUserMock.mockReturnValue({ user: { ...user, id: 2 }, isLoading: false, error: undefined, mutate: currentMutate } as CurrentUserHookResult)
    rerender(<ProfileClient userId={1} />)
    await act(async () => pending.resolve(response(200, { ...user, username: "oldrequest" })))
    expect(currentMutate).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("keeps the owner guard usable through StrictMode effect cleanup and rejects later unmounted responses", async () => {
    const pending = deferredResponse()
    const currentMutate = jest.fn()
    updateUserMock.mockResolvedValueOnce(response(200, { ...user, username: "firstsave" })).mockReturnValueOnce(pending.promise)
    useCurrentUserMock.mockReturnValue({ user, isLoading: false, error: undefined, mutate: currentMutate } as CurrentUserHookResult)
    const { unmount } = render(<StrictMode><ProfileClient userId={1} /></StrictMode>)
    editNickname("firstsave")
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Profile updated."))
    expect(currentMutate).toHaveBeenCalledTimes(2)
    fireEvent.change(screen.getByRole("textbox", { name: "Nickname" }), { target: { value: "latechange" } })
    fireEvent.submit(screen.getByRole("form", { name: "Edit profile" }))
    expect(updateUserMock).toHaveBeenCalledTimes(2)
    unmount()
    await act(async () => pending.resolve(response(200, { ...user, username: "latechange" })))
    expect(currentMutate).toHaveBeenCalledTimes(2)
  })

  it("rejects refreshed identity mismatches and preserves another account's current cache", async () => {
    const another = { ...user, id: 2, username: "another" }
    const currentMutate = jest.fn(async (updater: (cached: UserResponse) => UserResponse) => {
      expect(updater(another)).toBe(another)
    })
    getMeMock.mockResolvedValue(response(200, another))
    useCurrentUserMock.mockReturnValue({ user, isLoading: false, error: undefined, mutate: currentMutate } as CurrentUserHookResult)
    render(<ProfileClient userId={1} />)
    editNickname()
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Profile updated."))
    expect(currentMutate).toHaveBeenCalledTimes(1)
  })

  it("translates profile detail copy into Russian", async () => {
    window.localStorage.setItem("debetter-locale", "ru")
    render(
      <LocaleProvider>
        <ProfileClient userId={1} />
      </LocaleProvider>,
    )

    await waitFor(() => expect(screen.getByRole("heading", { name: "Социальные сети" })).toBeInTheDocument())
    expect(screen.getByRole("button", { name: "Удалить аккаунт" })).toBeDisabled()
  })
})
