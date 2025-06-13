"use client"

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(true)
  const router = useRouter()
  // Sign Up state and validation
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpErrors, setSignUpErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  // Sign In state and validation
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInError, setSignInError] = useState<string | null>(null)
  // Loading and error states
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpErrorMsg, setSignUpErrorMsg] = useState<string | null>(null)
  const [signInLoading, setSignInLoading] = useState(false)

  const handleSignUpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errors: { name?: string; email?: string; password?: string } = {}
    if (!signUpName.trim()) errors.name = 'Name is required'
    if (!/^\S+@\S+\.\S+$/.test(signUpEmail)) errors.email = 'Invalid email format'
    if (signUpPassword.length < 8) errors.password = 'Password must be at least 8 characters'
    setSignUpErrors(errors)
    if (Object.keys(errors).length > 0) return
    setSignUpErrorMsg(null)
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
        router.push('/dashboard')
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
    <div className="min-h-screen flex items-center justify-center bg-[#F1F1F1]">
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
            
            <div className="social-container mb-4">
              <a href="#" className="social-icon border border-gray-300 rounded-full inline-flex justify-center items-center mx-1 w-10 h-10 text-gray-600 hover:bg-[#3E5C76] hover:text-white hover:border-[#3E5C76] transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 12 2.04Z"/></svg>
              </a>
              <a href="#" className="social-icon border border-gray-300 rounded-full inline-flex justify-center items-center mx-1 w-10 h-10 text-gray-600 hover:bg-[#3E5C76] hover:text-white hover:border-[#3E5C76] transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z"/></svg>
              </a>
              <a href="#" className="social-icon border border-gray-300 rounded-full inline-flex justify-center items-center mx-1 w-10 h-10 text-gray-600 hover:bg-[#3E5C76] hover:text-white hover:border-[#3E5C76] transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17A1.4 1.4 0 0 1 15.71 13.57V18.5H18.5Z"/></svg>
              </a>
            </div>
            
            <span className="text-xs mb-4 text-gray-600">or use your email for registration</span>
            
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
            {signUpErrorMsg && <p className="text-red-500 text-xs">{signUpErrorMsg}</p>}
            
            <button type="submit" disabled={signUpLoading} className="rounded-full border border-[#3E5C76] bg-[#3E5C76] text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-transform active:scale-95 hover:bg-[#2D3748] mt-4 disabled:opacity-50">
              {signUpLoading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className={`form-container sign-in-container absolute top-0 h-full w-1/2 left-0 z-20 transition-all duration-500 ease-in-out ${
          isSignUp ? 'translate-x-full' : ''
        }`}>
          <form onSubmit={handleSignInSubmit} className="bg-white flex items-center justify-center flex-col px-12 h-full text-center">
            <h2 className="text-3xl font-bold mb-6 text-[#2D3748]">Sign in to DeBetter</h2>
            
            <div className="social-container mb-4">
              <a href="#" className="social-icon border border-gray-300 rounded-full inline-flex justify-center items-center mx-1 w-10 h-10 text-gray-600 hover:bg-[#3E5C76] hover:text-white hover:border-[#3E5C76] transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 12 2.04Z"/></svg>
              </a>
              <a href="#" className="social-icon border border-gray-300 rounded-full inline-flex justify-center items-center mx-1 w-10 h-10 text-gray-600 hover:bg-[#3E5C76] hover:text-white hover:border-[#3E5C76] transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z"/></svg>
              </a>
              <a href="#" className="social-icon border border-gray-300 rounded-full inline-flex justify-center items-center mx-1 w-10 h-10 text-gray-600 hover:bg-[#3E5C76] hover:text-white hover:border-[#3E5C76] transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17A1.4 1.4 0 0 1 15.71 13.57V18.5H18.5Z"/></svg>
              </a>
            </div>
            
            <span className="text-xs mb-4 text-gray-600">or use your email account</span>
            
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