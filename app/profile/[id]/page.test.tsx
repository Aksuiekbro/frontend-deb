/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import ProfileClient from "./ProfileClient"
import { useCurrentUser, useUser } from "@/hooks/use-api"
import { Role } from "@/types/user/user"
import { LocaleProvider } from "@/lib/i18n"

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

jest.mock("@/hooks/use-api", () => ({
  useCurrentUser: jest.fn(),
  useUser: jest.fn(),
}))

const useCurrentUserMock = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>
const useUserMock = useUser as jest.MockedFunction<typeof useUser>
type CurrentUserHookResult = ReturnType<typeof useCurrentUser>
type UserHookResult = ReturnType<typeof useUser>

const user = {
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

describe("ProfilePage actions", () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  beforeEach(() => {
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
