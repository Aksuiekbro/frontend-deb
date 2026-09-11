'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'
import { api } from '@/lib/api'
import { Role, type UserResponse } from '@/types/user/user'
import { readResponseError } from '@/lib/http-error'
import Footer from '@/components/Footer'

// Backend rule (mirrors UserRegistrationDto validation): alphanumeric, 3–20 chars.
const USERNAME_PATTERN = /^[a-zA-Z0-9]{3,20}$/
const CURRENT_USER_KEY = ['current-user'] as const

function isUserResponse(value: unknown): value is UserResponse {
  if (!value || typeof value !== 'object') return false

  const user = value as Partial<UserResponse>
  return typeof user.id === 'number' && typeof user.username === 'string'
}

async function readUserResponse(response: Response): Promise<UserResponse | null> {
  try {
    const data = await response.json()
    return isUserResponse(data) ? data : null
  } catch {
    return null
  }
}

async function readAuthenticatedUser(response: Response): Promise<UserResponse | null> {
  const authUser = await readUserResponse(response)
  if (authUser) return authUser

  const currentUserResponse = await api.getMe()
  if (!currentUserResponse.ok) return null

  return readUserResponse(currentUserResponse)
}

export type AuthMode = 'login' | 'register'

export type AuthPageClientProps = {
  initialMode: AuthMode
  requestedMode: AuthMode | null
}

export default function AuthPageClient({ initialMode, requestedMode }: AuthPageClientProps) {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(() => initialMode !== 'login')
  const [isClientReady, setIsClientReady] = useState(false)
  const { mutate } = useSWRConfig()
  // Sign Up state and validation
  const [signUpUsername, setSignUpUsername] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [role, setRole] = useState<Role>(Role.PARTICIPANT)

  const [signUpFirstName, setSignUpFirstName] = useState('')
  const [signUpLastName, setSignUpLastName] = useState('')
  const [signUpCity, setSignUpCity] = useState('')
  const [signUpInstitution, setSignUpInstitution] = useState('')

  const [signUpErrors, setSignUpErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  // Sign In state and validation
  const [signInUsername, setSignInUsername] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  // Loading and error states
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpErrorMsg, setSignUpErrorMsg] = useState<string | null>(null)
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null)
  const [signInLoading, setSignInLoading] = useState(false)

  useEffect(() => {
    setIsClientReady(true)
  }, [])

  useEffect(() => {
    if (requestedMode === 'login') {
      setIsSignUp(false)
    } else if (requestedMode === 'register') {
      setIsSignUp(true)
    }
  }, [requestedMode])

  const handleSignUpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errors: { name?: string; email?: string; password?: string } = {}
    if (!USERNAME_PATTERN.test(signUpUsername)) errors.name = 'Username must be 3–20 characters, letters and numbers only'
    if (!/^\S+@\S+\.\S+$/.test(signUpEmail)) errors.email = 'Invalid email format'
    if (signUpPassword.length < 8) errors.password = 'Password must be at least 8 characters'
    setSignUpErrors(errors)
    if (Object.keys(errors).length > 0) return
    setSignUpErrorMsg(null)
    setSignUpSuccess(null)
    setSignUpLoading(true)
    try {
      const res = await api.register({
        username: signUpUsername,
        password: signUpPassword,
        email: signUpEmail,
        firstName: signUpFirstName,
        lastName: signUpLastName,
        role: role,
        ...(role === Role.PARTICIPANT && {
          city: { name: signUpCity },
          institution: { name: signUpInstitution },
        }),
      });
      if (!res.ok) {
        setSignUpErrorMsg(await readResponseError(res, {
          fallback: 'Registration failed. Please try again.',
          unauthorized: 'Please check your details and try again.',
          badRequest: 'Please check your details and try again.',
          conflict: 'That username or email is already taken.',
          serverError: 'Server error — please try again later.',
        }))
      } else {
        const user = await readAuthenticatedUser(res)
        setSignUpSuccess('Account created successfully! Redirecting...')
        if (user) {
          await mutate(CURRENT_USER_KEY, user, { revalidate: false })
        } else {
          await mutate(CURRENT_USER_KEY)
        }
        setTimeout(() => {
          if (role === Role.ORGANIZER) router.push('/organizer')
          else router.push('/dashboard')
        }, 2000)
        return                      // prevent setState in finally
      }
    } catch {
      setSignUpErrorMsg('Network error — please check your connection and try again.')
    } finally { setSignUpLoading(false) }
  }

  const handleSignInSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationErrors: string[] = []
    if (!/^[a-zA-Z0-9]{3,20}$/.test(signInUsername)) validationErrors.push('Invalid username format')
    if (!signInPassword) validationErrors.push('Password is required')
    if (validationErrors.length) return setSignInError(validationErrors.join(', '))
    setSignInError(null)
    setSignInLoading(true)
    try {
      const res = await api.login({
        username: signInUsername,
        password: signInPassword,
        rememberMe: rememberMe
      });
      if (!res.ok) {
        setSignInError(await readResponseError(res, {
          fallback: 'Login failed. Please try again.',
          unauthorized: 'Invalid username or password.',
          serverError: 'Server error — please try again later.',
        }))
      }
      else {
        const user = await readAuthenticatedUser(res)
        if (user) {
          await mutate(CURRENT_USER_KEY, user, { revalidate: false })
        } else {
          await mutate(CURRENT_USER_KEY)
        }
        router.push('/dashboard')
        return
      }
    } catch {
      setSignInError('Network error — please check your connection and try again.')
    } finally { setSignInLoading(false) }
  }

  return (
    <>
      <div className="db-page-backdrop" aria-hidden="true" style={{ ['--db-backdrop-focal' as string]: '50% 58%' }}>
        <img src="/images/senate/river-council.png" alt="" />
        <div className="db-page-backdrop__scrim" />
      </div>
      <a className="db-skip-link" href="#main">Skip to content</a>

      <main id="main">
        <section className="db-hero min-h-[320px]">
          <div className="db-hero__content db-container pb-24">
            <p className="db-hero__eyebrow">Welcome back</p>
            <h1 className="db-hero__title" style={{ fontSize: 'clamp(28px,4vw,40px)' }}>Your seat at the table is waiting</h1>
          </div>
        </section>

        <div className="max-w-[480px] mx-auto -mt-[72px] mb-16 relative z-[3] px-5">
          <div
            className="db-panel p-8"
            data-auth-mode={isSignUp ? 'register' : 'login'}
            data-auth-client-ready={isClientReady ? 'true' : 'false'}
          >
            <div className="flex bg-[var(--db-surface)] rounded-[var(--db-radius-pill)] p-1 mb-[26px]" role="tablist" aria-label="Choose login or register">
              <button
                type="button"
                role="tab"
                id="tab-login"
                aria-selected={!isSignUp}
                aria-controls="panel-login"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 text-center py-2.5 min-h-[var(--db-touch)] rounded-[var(--db-radius-pill)] font-semibold text-sm border-none cursor-pointer transition-opacity ${
                  !isSignUp ? 'bg-[var(--db-accent)] text-[var(--db-accent-fg)] opacity-100' : 'bg-transparent text-[var(--db-surface-fg)] opacity-65'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                role="tab"
                id="tab-register"
                aria-selected={isSignUp}
                aria-controls="panel-register"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 text-center py-2.5 min-h-[var(--db-touch)] rounded-[var(--db-radius-pill)] font-semibold text-sm border-none cursor-pointer transition-opacity ${
                  isSignUp ? 'bg-[var(--db-accent)] text-[var(--db-accent-fg)] opacity-100' : 'bg-transparent text-[var(--db-surface-fg)] opacity-65'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Log In */}
            <div id="panel-login" role="tabpanel" aria-labelledby="tab-login" hidden={isSignUp}>
              <p className="font-[var(--db-font-display)] text-[26px] mb-1 text-center">Log in to DeBetter</p>
              <p className="text-center text-[var(--db-muted)] text-sm mb-6">Pick up your tournaments where you left off.</p>
              <form onSubmit={handleSignInSubmit}>
                <div className="db-field">
                  <label htmlFor="auth-signin-email">Username</label>
                  <input
                    id="auth-signin-email"
                    name="username"
                    type="text"
                    placeholder="Your username"
                    value={signInUsername}
                    onChange={(e) => setSignInUsername(e.target.value)}
                  />
                </div>
                <div className="db-field">
                  <label htmlFor="auth-signin-password">Password</label>
                  <input
                    id="auth-signin-password"
                    name="password"
                    type="password"
                    placeholder="Your password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                  />
                </div>
                <div className="db-checkbox-row mb-5">
                  <input
                    id="remember-me-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember-me-checkbox" className="text-sm">Remember me</label>
                </div>
                {signInError && <p className="db-field-error mb-3">{signInError}</p>}
                <a href="#" className="block text-center text-sm text-[var(--db-link)] hover:text-[var(--db-link-hover)] hover:underline mb-4">Forgot your password?</a>
                <button type="submit" disabled={signInLoading} className="db-btn db-btn-primary db-btn-block">
                  {signInLoading ? 'Signing in...' : 'Log In'}
                </button>
              </form>
            </div>

            {/* Register */}
            <div id="panel-register" role="tabpanel" aria-labelledby="tab-register" hidden={!isSignUp}>
              <p className="font-[var(--db-font-display)] text-[26px] mb-1 text-center">Create your account</p>
              <p className="text-center text-[var(--db-muted)] text-sm mb-6">Join as a debater or set up tournaments as an organizer.</p>
              <form onSubmit={handleSignUpSubmit}>
                <div className="flex gap-5 justify-center mb-[18px]">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      id="debater-radio"
                      type="radio"
                      name="role"
                      value="debater"
                      checked={role === Role.PARTICIPANT}
                      onChange={() => setRole(Role.PARTICIPANT)}
                      className="w-[18px] h-[18px] accent-[var(--db-accent)]"
                    />
                    Debater
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      id="organizer-radio"
                      type="radio"
                      name="role"
                      value="organizer"
                      checked={role === Role.ORGANIZER}
                      onChange={() => setRole(Role.ORGANIZER)}
                      className="w-[18px] h-[18px] accent-[var(--db-accent)]"
                    />
                    Organizer
                  </label>
                </div>

                <div className="db-field">
                  <label htmlFor="auth-signup-name">Username</label>
                  <input
                    id="auth-signup-name"
                    name="username"
                    type="text"
                    placeholder="3–20 characters, letters and numbers"
                    required
                    maxLength={20}
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                  />
                  {signUpErrors.name && <p className="db-field-error">{signUpErrors.name}</p>}
                </div>
                <div className="db-field">
                  <label htmlFor="auth-signup-email">Email</label>
                  <input
                    id="auth-signup-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                  />
                  {signUpErrors.email && <p className="db-field-error">{signUpErrors.email}</p>}
                </div>
                <div className="db-field">
                  <label htmlFor="auth-signup-password">Password</label>
                  <input
                    id="auth-signup-password"
                    name="password"
                    type="password"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                  />
                  {signUpErrors.password && <p className="db-field-error">{signUpErrors.password}</p>}
                </div>

                <div className="db-field-row">
                  <div className="db-field" style={{ marginBottom: 0 }}>
                    <label htmlFor="auth-signup-firstname">First Name</label>
                    <input
                      id="auth-signup-firstname"
                      type="text"
                      required
                      value={signUpFirstName}
                      onChange={(e) => setSignUpFirstName(e.target.value)}
                    />
                  </div>
                  <div className="db-field" style={{ marginBottom: 0 }}>
                    <label htmlFor="auth-signup-lastname">Last Name</label>
                    <input
                      id="auth-signup-lastname"
                      type="text"
                      required
                      value={signUpLastName}
                      onChange={(e) => setSignUpLastName(e.target.value)}
                    />
                  </div>
                </div>

                {role === Role.PARTICIPANT && (
                  <div className="db-field-row mt-[18px]">
                    <div className="db-field" style={{ marginBottom: 0 }}>
                      <label htmlFor="auth-signup-city">City</label>
                      <input
                        id="auth-signup-city"
                        type="text"
                        required={role === Role.PARTICIPANT}
                        value={signUpCity}
                        onChange={(e) => setSignUpCity(e.target.value)}
                      />
                    </div>
                    <div className="db-field" style={{ marginBottom: 0 }}>
                      <label htmlFor="auth-signup-institution">Institution</label>
                      <input
                        id="auth-signup-institution"
                        type="text"
                        required={role === Role.PARTICIPANT}
                        value={signUpInstitution}
                        onChange={(e) => setSignUpInstitution(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="h-[18px]" />
                {signUpErrorMsg && <p className="db-field-error mb-3">{signUpErrorMsg}</p>}
                {signUpSuccess && <p className="text-sm mb-3" style={{ color: 'var(--db-accent)' }}>{signUpSuccess}</p>}
                <button type="submit" disabled={signUpLoading} className="db-btn db-btn-primary db-btn-block">
                  {signUpLoading ? 'Signing up...' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
