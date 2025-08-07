"use client"

import { useState, FormEvent, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  // Sign Up state and validation
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [isDebater, setIsDebater] = useState(false)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [signUpErrors, setSignUpErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  // Sign In state and validation
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
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
    if (!signUpName.trim()) errors.name = 'Name is required'
    if (!/^\S+@\S+\.\S+$/.test(signUpEmail)) errors.email = 'Invalid email format'
    if (signUpPassword.length < 8) errors.password = 'Password must be at least 8 characters'
    setSignUpErrors(errors)
    if (Object.keys(errors).length > 0) return
    setSignUpErrorMsg(null)
    setSignUpSuccess(null)
    setSignUpLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name: signUpName, email: signUpEmail, password: signUpPassword })
      })
      const data = await res.json()
      if (!res.ok) {
        setSignUpErrorMsg(data.message || 'Registration failed')
      } else {
        setSignUpSuccess('Account created successfully! Redirecting...')
        setTimeout(() => {
          router.push('/dashboard')
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
    if (!/^\S+@\S+\.\S+$/.test(signInEmail)) validationErrors.push('Invalid email format')
    if (!signInPassword) validationErrors.push('Password is required')
    if (validationErrors.length) return setSignInError(validationErrors.join(', '))
    setSignInError(null)
    setSignInLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email: signInEmail, password: signInPassword })
      })
      const data = await res.json()
      if (!res.ok) setSignInError(data.message || 'Login failed')
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
      <div className="brand-logo absolute top-4 left-6 text-2xl font-bold text-[#3E5C76] z-50">
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
              name="name"
              type="text"
              placeholder="Name"
              required
              value={signUpName}
              onChange={(e) => setSignUpName(e.target.value)}
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
            
            {/* Role Selection Checkboxes */}
            <div className="w-full mt-4 mb-2">
              <div className="flex items-center justify-center gap-8">
                <div className="flex items-center">
                  <input
                    id="debater-checkbox"
                    type="checkbox"
                    checked={isDebater}
                    onChange={(e) => setIsDebater(e.target.checked)}
                    className="mr-2 w-4 h-4 text-[#3E5C76] bg-gray-100 border-gray-300 rounded focus:ring-[#3E5C76] focus:ring-2"
                  />
                  <label htmlFor="debater-checkbox" className="text-sm text-gray-700 font-hikasami">
                    Debater
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="organizer-checkbox"
                    type="checkbox"
                    checked={isOrganizer}
                    onChange={(e) => setIsOrganizer(e.target.checked)}
                    className="mr-2 w-4 h-4 text-[#3E5C76] bg-gray-100 border-gray-300 rounded focus:ring-[#3E5C76] focus:ring-2"
                  />
                  <label htmlFor="organizer-checkbox" className="text-sm text-gray-700 font-hikasami">
                    Organizer
                  </label>
                </div>
              </div>
            </div>
            
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
            
            <label htmlFor="auth-signin-email" className="sr-only">Email address</label>
            <input
              id="auth-signin-email"
              name="email"
              type="email"
              placeholder="Email"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
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