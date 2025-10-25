"use client"

import { useState, FormEvent, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Role } from '@/types/user/user'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
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
    const mode = searchParams.get('mode')
    if (mode === 'login') {
      setIsSignUp(false)
    } else if (mode === 'register') {
      setIsSignUp(true)
    }
  }, [searchParams])

  const handleSignUpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errors: { name?: string; email?: string; password?: string } = {}
    if (!signUpUsername.trim()) errors.name = 'Name is required'
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
        const data = await res.json();
        setSignUpErrorMsg(data.message || 'Registration failed')
      } else {
        setSignUpSuccess('Account created successfully! Redirecting...')
        setTimeout(() => {
          if (role === Role.ORGANIZER) router.push('/organizer')
          else router.push('/dashboard')
        }, 2000)
        return                      // prevent setState in finally
      }
    } catch (error) {
      setSignUpErrorMsg('An unexpected error occurred')
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
        const data = await res.json()
        setSignInError(data.message || 'Login failed')
      }
      else {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      setSignInError('An unexpected error occurred')
    } finally { setSignInLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F1F1] font-hikasami">
      <div className="brand-logo absolute top-4 left-6 text-2xl font-bold text-[#0D1321] z-50">
        DeBetter
      </div>
      
      <div className={`container relative overflow-hidden bg-white rounded-xl shadow-2xl w-[980px] max-w-full min-h-[640px] ${isSignUp ? 'right-panel-active' : ''}`}>
        
        {/* Sign Up Form */}
        <div className={`form-container sign-up-container absolute top-0 h-full w-1/2 left-0 transition-all duration-500 ease-in-out ${
          isSignUp ? 'translate-x-full opacity-100 z-10' : 'opacity-0 z-0'
        }`}>
          <form onSubmit={handleSignUpSubmit} className="bg-white flex items-center justify-center flex-col px-12 h-full text-center">
            <h2 className="text-3xl font-bold mb-6 text-[#2D3748]">Create Account</h2>
            
            <label htmlFor="auth-signup-name" className="sr-only">Full Name</label>
            <input
              id="auth-signup-name"
              name="username"
              type="text"
              placeholder="Username"
              required
              value={signUpUsername}
              onChange={(e) => setSignUpUsername(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />
            {signUpErrors.name && <p className="text-red-500 text-xs">{signUpErrors.name}</p>}
            <label htmlFor="auth-signup-email" className="sr-only">Email</label>
            <input
              id="auth-signup-email"
              name="email"
              type="email"
              placeholder="Email"
              required
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />
            {signUpErrors.email && <p className="text-red-500 text-xs">{signUpErrors.email}</p>}
            <label htmlFor="auth-signup-password" className="sr-only">Password</label>
            <input
              id="auth-signup-password"
              name="password"
              type="password"
              placeholder="Password"
              required
              minLength={8}
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />
            {signUpErrors.password && <p className="text-red-500 text-xs">{signUpErrors.password}</p>}

            <label htmlFor="auth-signup-firstname" className="sr-only">First Name</label>
            <input
              id="auth-signup-firstname"
              type="text"
              placeholder="First Name"
              required
              value={signUpFirstName}
              onChange={(e) => setSignUpFirstName(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />

            <label htmlFor="auth-signup-lastname" className="sr-only">Last Name</label>
            <input
              id="auth-signup-lastname"
              type="text"
              placeholder="Last Name"
              required
              value={signUpLastName}
              onChange={(e) => setSignUpLastName(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />
            
            <div className="w-full mt-4 mb-2">
              <div className="flex items-center justify-center gap-8">
                <div className="flex items-center">
                  <input
                    id="debater-radio"
                    type="radio"
                    name="role"
                    value="debater"
                    checked={role === Role.PARTICIPANT}
                    onChange={() => setRole(Role.PARTICIPANT)}
                    className="mr-2 w-4 h-4 text-[#3E5C76] bg-gray-100 border-gray-300 focus:ring-[#3E5C76] focus:ring-2"
                  />
                  <label htmlFor="debater-radio" className="text-sm text-gray-700 font-hikasami">
                    Debater
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="organizer-radio"
                    type="radio"
                    name="role"
                    value="organizer"
                    checked={role === Role.ORGANIZER}
                    onChange={() => setRole(Role.ORGANIZER)}
                    className="mr-2 w-4 h-4 text-[#3E5C76] bg-gray-100 border-gray-300 focus:ring-[#3E5C76] focus:ring-2"
                  />
                  <label htmlFor="organizer-radio" className="text-sm text-gray-700 font-hikasami">
                    Organizer
                  </label>
                </div>
              </div>
            </div>

            {role === Role.PARTICIPANT && (
              <>
                <label htmlFor="auth-signup-city" className="sr-only">City</label>
                <input
                  id="auth-signup-city"
                  type="text"
                  placeholder="City"
                  required={role === Role.PARTICIPANT}
                  value={signUpCity}
                  onChange={(e) => setSignUpCity(e.target.value)}
                  className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
                />

                <label htmlFor="auth-signup-institution" className="sr-only">Institution</label>
                <input
                  id="auth-signup-institution"
                  type="text"
                  placeholder="Institution"
                  required={role === Role.PARTICIPANT}
                  value={signUpInstitution}
                  onChange={(e) => setSignUpInstitution(e.target.value)}
                  className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
                />
              </>
            )}

            {signUpErrorMsg && <p className="text-red-500 text-xs">{signUpErrorMsg}</p>}
            {signUpSuccess && <p className="text-green-500 text-xs">{signUpSuccess}</p>}
            
            <button type="submit" disabled={signUpLoading} className="rounded-full border border-[#3E5C76] bg-[#3E5C76] text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-transform active:scale-95 hover:bg-[#2D3748] mt-4 disabled:opacity-50">
              {signUpLoading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className={`form-container sign-in-container absolute top-0 h-full w-1/2 left-0 transition-all duration-500 ease-in-out ${
          isSignUp ? 'translate-x-full z-0' : 'z-20'
        }`}>
          <form onSubmit={handleSignInSubmit} className="bg-white flex items-center justify-center flex-col px-12 h-full text-center">
            <h2 className="text-3xl font-bold mb-6 text-[#2D3748]">Sign in to DeBetter</h2>
            
            <label htmlFor="auth-signin-email" className="sr-only">Username</label>
            <input
              id="auth-signin-email"
              name="username"
              type="text"
              placeholder="Username"
              value={signInUsername}
              onChange={(e) => setSignInUsername(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />
            <label htmlFor="auth-signin-password" className="sr-only">Password</label>
            <input
              id="auth-signin-password"
              name="password"
              type="password"
              placeholder="Password"
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />
            <div className="flex items-center w-full justify-start my-3 px-1">
                <input
                    id="remember-me-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#3E5C76] bg-gray-100 border-gray-300 rounded focus:ring-[#3E5C76] focus:ring-2"
                />
                <label htmlFor="remember-me-checkbox" className="ml-2 text-sm font-medium text-gray-700">
                    Remember me
                </label>
            </div>
            {signInError && <p className="text-red-500 text-xs">{signInError}</p>}
            
            <a href="#" className="text-gray-700 text-sm no-underline my-4 hover:underline">Forgot your password?</a>
            
            <button type="submit" disabled={signInLoading} className="rounded-full border border-[#3E5C76] bg-[#3E5C76] text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-transform active:scale-95 hover:bg-[#2D3748] disabled:opacity-50">
              {signInLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Overlay Container */}
        <div className={`overlay-container absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-500 ease-in-out z-[100] ${
          isSignUp ? '-translate-x-full' : ''
        }`}>
          <div className={`overlay bg-[#3E5C76] bg-no-repeat bg-cover bg-center text-white relative -left-full h-full w-[200%] transition-transform duration-500 ease-in-out ${
            isSignUp ? 'translate-x-1/2' : 'translate-x-0'
          }`} style={{
            backgroundImage: 'url(/images/log_reg.png)'
          }}>
            
            {/* Left Panel */}
            <div className={`overlay-panel overlay-left absolute flex items-center justify-center flex-col px-10 text-center top-0 h-full w-1/2 transition-transform duration-500 ease-in-out ${
              isSignUp ? 'translate-x-0' : '-translate-x-[20%]'
            }`}>
              <h1 className="font-bold text-4xl mb-4">Welcome Back!</h1>
              <p className="text-sm mb-6 leading-relaxed">To keep connected with us please login with your personal info</p>
              <button 
                onClick={() => setIsSignUp(false)}
                className="rounded-full border-2 border-white bg-transparent text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-all hover:bg-white hover:bg-opacity-10"
              >
                Sign In
              </button>
            </div>

            {/* Right Panel */}
            <div className={`overlay-panel overlay-right absolute flex items-center justify-center flex-col px-10 text-center top-0 h-full w-1/2 right-0 transition-transform duration-500 ease-in-out ${
              isSignUp ? 'translate-x-[20%]' : 'translate-x-0'
            }`}>
              <h1 className="font-bold text-4xl mb-4">Hello, Friend!</h1>
              <p className="text-sm mb-6 leading-relaxed">Enter your personal details and start your journey with us</p>
              <button 
                onClick={() => setIsSignUp(true)}
                className="rounded-full border-2 border-white bg-transparent text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-all hover:bg-white hover:bg-opacity-10"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 