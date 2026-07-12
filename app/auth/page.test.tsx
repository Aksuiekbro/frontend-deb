/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { ReactElement } from 'react'
import AuthRoutePage from './page'
import AuthPageClient, { type AuthMode, type AuthPageClientProps } from './AuthPageClient'
import { api } from '../../lib/api'
import { Role, type UserResponse } from '../../types/user/user'

const mockPush = jest.fn()
const mockMutate = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('swr', () => ({
  useSWRConfig: () => ({ mutate: mockMutate }),
}))

jest.mock('../../lib/api', () => ({
  api: { register: jest.fn(), login: jest.fn(), getMe: jest.fn() },
}))

const mockRegister = api.register as jest.Mock
const mockLogin = api.login as jest.Mock
const mockGetMe = api.getMe as jest.Mock

const signedInUser: UserResponse = {
  id: 7,
  username: 'nurassyl',
  firstName: 'Nurassyl',
  lastName: 'Tursymbayev',
  email: 'nurassyl@example.com',
  role: Role.PARTICIPANT,
  profileId: 12,
  socialProfiles: [],
  createdAt: '2026-06-28T00:00:00.000Z',
}

function fillSignUp(container: HTMLElement, username: string) {
  const set = (id: string, value: string) =>
    fireEvent.change(container.querySelector(`#${id}`)!, { target: { value } })
  set('auth-signup-name', username)
  set('auth-signup-email', 'nurassyl@example.com')
  set('auth-signup-password', 'Test12345!')
  set('auth-signup-firstname', 'Nurassyl')
  set('auth-signup-lastname', 'Tursymbayev')
  set('auth-signup-city', 'Almaty')
  set('auth-signup-institution', 'NIS')
}

function submitSignUp(container: HTMLElement) {
  // The sign-up form is the one holding the username field.
  fireEvent.submit(container.querySelector('#auth-signup-name')!.closest('form')!)
}

function renderAuthPage(initialMode: AuthMode = 'register', requestedMode: AuthMode | null = null) {
  return render(<AuthPageClient initialMode={initialMode} requestedMode={requestedMode} />)
}

// Both auth forms render simultaneously (sliding-panel UI); target the sign-in one by its fields.
function fillAndSubmitSignIn(container: HTMLElement, username: string, password: string) {
  fireEvent.change(container.querySelector('#auth-signin-email')!, { target: { value: username } })
  fireEvent.change(container.querySelector('#auth-signin-password')!, { target: { value: password } })
  fireEvent.submit(container.querySelector('#auth-signin-email')!.closest('form')!)
}

afterEach(() => jest.clearAllMocks())

describe('AuthPage server wrapper', () => {
  it.each([
    ['login', { initialMode: 'login', requestedMode: 'login' }],
    ['register', { initialMode: 'register', requestedMode: 'register' }],
    [undefined, { initialMode: 'register', requestedMode: null }],
    ['forgotten', { initialMode: 'register', requestedMode: null }],
  ])('normalizes %s mode before rendering the client form', async (mode, expected) => {
    const page = await AuthRoutePage({ searchParams: Promise.resolve({ mode }) })
    const props = (page as ReactElement<AuthPageClientProps>).props

    expect(props).toEqual(expected)
  })

})

describe('AuthPageClient query mode', () => {
  it('renders direct login mode without a signup flash', async () => {
    const { container } = renderAuthPage('login', 'login')

    expect(container.querySelector('[data-auth-mode="login"]')).toBeInTheDocument()
    await waitFor(() => expect(container.querySelector('[data-auth-client-ready="true"][data-auth-mode="login"]')).toBeInTheDocument())
    expect(container.querySelector('.sign-in-container')).toHaveClass('z-20')
    expect(container.querySelector('.sign-in-container')).not.toHaveClass('translate-x-full')
  })

  it('renders direct register mode and keeps the signup panel active', async () => {
    const { container } = renderAuthPage('register', 'register')

    await waitFor(() => expect(container.querySelector('[data-auth-client-ready="true"][data-auth-mode="register"]')).toBeInTheDocument())
    expect(container.querySelector('.sign-up-container')).toHaveClass('z-10')
    expect(container.querySelector('.sign-in-container')).toHaveClass('translate-x-full')
  })

  it('defaults absent mode to register and preserves a manual mode toggle', async () => {
    const { container, rerender } = renderAuthPage('register', null)

    await waitFor(() => expect(container.querySelector('[data-auth-client-ready="true"][data-auth-mode="register"]')).toBeInTheDocument())
    fireEvent.click(container.querySelector('.overlay-left button')!)

    rerender(<AuthPageClient initialMode="register" requestedMode={null} />)

    expect(container.querySelector('[data-auth-client-ready="true"][data-auth-mode="login"]')).toBeInTheDocument()
    expect(container.querySelector('.sign-in-container')).toHaveClass('z-20')
  })

  it('synchronizes client mode changes when the requested mode is explicit', async () => {
    const { container, rerender } = renderAuthPage('register', 'register')

    rerender(<AuthPageClient initialMode="login" requestedMode="login" />)

    await waitFor(() => expect(container.querySelector('[data-auth-client-ready="true"][data-auth-mode="login"]')).toBeInTheDocument())
    rerender(<AuthPageClient initialMode="register" requestedMode="register" />)

    await waitFor(() => expect(container.querySelector('[data-auth-client-ready="true"][data-auth-mode="register"]')).toBeInTheDocument())
  })

  it('preserves the 500ms sliding-panel transition classes', () => {
    const { container } = renderAuthPage()

    expect(container.querySelector('.sign-up-container')).toHaveClass('duration-500')
    expect(container.querySelector('.sign-in-container')).toHaveClass('duration-500')
    expect(container.querySelector('.overlay-container')).toHaveClass('duration-500')
  })
})

describe('AuthPage sign-up', () => {
  it('rejects a non-alphanumeric username client-side and does not call the API', () => {
    const { container } = renderAuthPage()
    fillSignUp(container, 'bad user!')
    submitSignUp(container)

    expect(screen.getByText(/letters and numbers only/i)).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('rejects a too-short username client-side and does not call the API', () => {
    const { container } = renderAuthPage()
    fillSignUp(container, 'ab')
    submitSignUp(container)

    expect(screen.getByText(/3–20 characters/i)).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('shows a meaningful message (not the generic catch-all) when the server returns an empty 403 body', async () => {
    mockRegister.mockResolvedValue({ ok: false, status: 403, text: async () => '' } as Response)
    const { container } = renderAuthPage()
    fillSignUp(container, 'nurassyl')
    submitSignUp(container)

    expect(await screen.findByText(/please check your details/i)).toBeInTheDocument()
    expect(screen.queryByText(/an unexpected error occurred/i)).not.toBeInTheDocument()
    expect(mockRegister).toHaveBeenCalledTimes(1)
  })

  it('falls back to the already-taken message when the server returns an empty 409 body', async () => {
    mockRegister.mockResolvedValue({ ok: false, status: 409, text: async () => '' } as Response)
    const { container } = renderAuthPage()
    fillSignUp(container, 'nurassyl')
    submitSignUp(container)

    expect(await screen.findByText(/username or email is already taken/i)).toBeInTheDocument()
  })

  it('surfaces the backend message verbatim when the error body is JSON', async () => {
    mockRegister.mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => JSON.stringify({ message: 'Username already exists' }),
    } as Response)
    const { container } = renderAuthPage()
    fillSignUp(container, 'nurassyl')
    submitSignUp(container)

    expect(await screen.findByText('Username already exists')).toBeInTheDocument()
  })

  it('falls back instead of rendering a non-string JSON message', async () => {
    mockRegister.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: { text: 'Invalid username' } }),
    } as Response)
    const { container } = renderAuthPage()
    fillSignUp(container, 'nurassyl')
    submitSignUp(container)

    expect(await screen.findByText(/please check your details/i)).toBeInTheDocument()
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument()
  })

  it('uses the registration fallback when the error body is not JSON', async () => {
    mockRegister.mockResolvedValue({ ok: false, status: 422, text: async () => '<html>no json</html>' } as Response)
    const { container } = renderAuthPage()
    fillSignUp(container, 'nurassyl')
    submitSignUp(container)

    expect(await screen.findByText(/registration failed\. please try again\./i)).toBeInTheDocument()
    expect(screen.queryByText(/an unexpected error occurred/i)).not.toBeInTheDocument()
  })

  it('uses the server-error fallback when the error body cannot be read', async () => {
    mockRegister.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => { throw new Error('body already consumed') },
    } as unknown as Response)
    const { container } = renderAuthPage()
    fillSignUp(container, 'nurassyl')
    submitSignUp(container)

    expect(await screen.findByText(/server error/i)).toBeInTheDocument()
  })

  it('caps the username input length at 20 characters', () => {
    const { container } = renderAuthPage()
    expect(container.querySelector('#auth-signup-name')).toHaveAttribute('maxlength', '20')
  })

  it('shows the network-error message (not a handled HTTP message) when api.register rejects', async () => {
    mockRegister.mockRejectedValue(new TypeError('Failed to fetch'))
    const { container } = renderAuthPage()
    fillSignUp(container, 'nurassyl')
    submitSignUp(container)

    expect(await screen.findByText(/network error — please check your connection/i)).toBeInTheDocument()
  })
})

describe('AuthPage sign-in', () => {
  it('propagates keyboard-style input events into the controlled sign-in fields', async () => {
    mockLogin.mockResolvedValue({ ok: true, status: 200, json: async () => signedInUser } as Response)
    const { container } = renderAuthPage()
    const username = container.querySelector('#auth-signin-email')!
    const password = container.querySelector('#auth-signin-password')!
    fireEvent.focus(username)
    fireEvent.input(username, { target: { value: 'nurassyl' } })
    fireEvent.focus(password)
    fireEvent.input(password, { target: { value: 'Test12345!' } })
    fireEvent.submit(username.closest('form')!)

    await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/Invalid username format|Password is required/i)).not.toBeInTheDocument()
  })

  it('stores the successful login response in the current-user cache before navigating', async () => {
    mockLogin.mockResolvedValue({ ok: true, status: 200, json: async () => signedInUser } as Response)
    const { container } = renderAuthPage()
    fillAndSubmitSignIn(container, 'nurassyl', 'Test12345!')

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(['current-user'], signedInUser, { revalidate: false })
    })
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('loads the current user when login succeeds with an empty response body', async () => {
    mockLogin.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected end of JSON input') },
    } as unknown as Response)
    mockGetMe.mockResolvedValue({ ok: true, status: 200, json: async () => signedInUser } as Response)

    const { container } = renderAuthPage()
    fillAndSubmitSignIn(container, 'nurassyl', 'Test12345!')

    await waitFor(() => {
      expect(mockGetMe).toHaveBeenCalledTimes(1)
      expect(mockMutate).toHaveBeenCalledWith(['current-user'], signedInUser, { revalidate: false })
    })
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('shows a status-aware message (not the generic catch-all) on an empty-body 401', async () => {
    mockLogin.mockResolvedValue({ ok: false, status: 401, text: async () => '' } as Response)
    const { container } = renderAuthPage()
    fillAndSubmitSignIn(container, 'nurassyl', 'Test12345!')

    expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument()
    expect(screen.queryByText(/an unexpected error occurred/i)).not.toBeInTheDocument()
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })

  it('shows the network-error message when api.login rejects', async () => {
    mockLogin.mockRejectedValue(new TypeError('Failed to fetch'))
    const { container } = renderAuthPage()
    fillAndSubmitSignIn(container, 'nurassyl', 'Test12345!')

    expect(await screen.findByText(/network error — please check your connection/i)).toBeInTheDocument()
  })
})
