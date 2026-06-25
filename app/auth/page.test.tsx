/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AuthPage from './page'
import { api } from '../../lib/api'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => 'register' }),
}))

jest.mock('../../lib/api', () => ({
  api: { register: jest.fn(), login: jest.fn() },
}))

const mockRegister = api.register as jest.Mock
const mockLogin = api.login as jest.Mock

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

// Both auth forms render simultaneously (sliding-panel UI); target the sign-in one by its fields.
function fillAndSubmitSignIn(container: HTMLElement, username: string, password: string) {
  fireEvent.change(container.querySelector('#auth-signin-email')!, { target: { value: username } })
  fireEvent.change(container.querySelector('#auth-signin-password')!, { target: { value: password } })
  fireEvent.submit(container.querySelector('#auth-signin-email')!.closest('form')!)
}

afterEach(() => jest.clearAllMocks())

describe('AuthPage sign-up', () => {
  it('rejects a non-alphanumeric username client-side and does not call the API', () => {
    const { container } = render(<AuthPage />)
    fillSignUp(container, 'bad user!')
    submitSignUp(container)

    expect(screen.getByText(/letters and numbers only/i)).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('rejects a too-short username client-side and does not call the API', () => {
    const { container } = render(<AuthPage />)
    fillSignUp(container, 'ab')
    submitSignUp(container)

    expect(screen.getByText(/3–20 characters/i)).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('shows a meaningful message (not the generic catch-all) when the server returns an empty 403 body', async () => {
    mockRegister.mockResolvedValue({ ok: false, status: 403, text: async () => '' } as Response)
    const { container } = render(<AuthPage />)
    fillSignUp(container, 'nurassyl')
    submitSignUp(container)

    expect(await screen.findByText(/please check your details/i)).toBeInTheDocument()
    expect(screen.queryByText(/an unexpected error occurred/i)).not.toBeInTheDocument()
    expect(mockRegister).toHaveBeenCalledTimes(1)
  })

  it('falls back to the already-taken message when the server returns an empty 409 body', async () => {
    mockRegister.mockResolvedValue({ ok: false, status: 409, text: async () => '' } as Response)
    const { container } = render(<AuthPage />)
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
    const { container } = render(<AuthPage />)
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
    const { container } = render(<AuthPage />)
    fillSignUp(container, 'nurassyl')
    submitSignUp(container)

    expect(await screen.findByText(/please check your details/i)).toBeInTheDocument()
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument()
  })

  it('uses the registration fallback when the error body is not JSON', async () => {
    mockRegister.mockResolvedValue({ ok: false, status: 422, text: async () => '<html>no json</html>' } as Response)
    const { container } = render(<AuthPage />)
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
    } as Response)
    const { container } = render(<AuthPage />)
    fillSignUp(container, 'nurassyl')
    submitSignUp(container)

    expect(await screen.findByText(/server error/i)).toBeInTheDocument()
  })

  it('caps the username input length at 20 characters', () => {
    const { container } = render(<AuthPage />)
    expect(container.querySelector('#auth-signup-name')).toHaveAttribute('maxlength', '20')
  })

  it('shows the network-error message (not a handled HTTP message) when api.register rejects', async () => {
    mockRegister.mockRejectedValue(new TypeError('Failed to fetch'))
    const { container } = render(<AuthPage />)
    fillSignUp(container, 'nurassyl')
    submitSignUp(container)

    expect(await screen.findByText(/network error — please check your connection/i)).toBeInTheDocument()
  })
})

describe('AuthPage sign-in', () => {
  it('shows a status-aware message (not the generic catch-all) on an empty-body 401', async () => {
    mockLogin.mockResolvedValue({ ok: false, status: 401, text: async () => '' } as Response)
    const { container } = render(<AuthPage />)
    fillAndSubmitSignIn(container, 'nurassyl', 'Test12345!')

    expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument()
    expect(screen.queryByText(/an unexpected error occurred/i)).not.toBeInTheDocument()
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })

  it('shows the network-error message when api.login rejects', async () => {
    mockLogin.mockRejectedValue(new TypeError('Failed to fetch'))
    const { container } = render(<AuthPage />)
    fillAndSubmitSignIn(container, 'nurassyl', 'Test12345!')

    expect(await screen.findByText(/network error — please check your connection/i)).toBeInTheDocument()
  })
})
