"use client"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Welcome Back */}
      <div className="flex-1 bg-[#3E4A5B] flex flex-col justify-center items-center text-white relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/images/log_reg.png" 
            alt="Background design"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
       
        <div className="z-10 text-center">
          <h1 className="text-5xl font-bold mb-8">Welcome Back!</h1>
          <button className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-[#3E4A5B] transition-colors text-lg font-medium">
            Sign In
          </button>
        </div>
      </div>

      {/* Right Side - Create Account Form */}
      <div className="flex-1 bg-[#F5F5F5] flex flex-col justify-center items-center px-12 relative overflow-hidden">
        <div className="w-full max-w-md">
          <h2 className="text-4xl font-bold text-[#2D3748] mb-8">Create Account</h2>
          
          <form className="space-y-6">
            {/* Name Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Full Name"
                className="w-full pl-12 pr-4 py-4 bg-[#E2E8F0] rounded-lg border-0 text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-[#3E4A5B] focus:outline-none"
              />
            </div>

            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="Email"
                className="w-full pl-12 pr-4 py-4 bg-[#E2E8F0] rounded-lg border-0 text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-[#3E4A5B] focus:outline-none"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-12 pr-4 py-4 bg-[#E2E8F0] rounded-lg border-0 text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-[#3E4A5B] focus:outline-none"
              />
            </div>

            {/* Create Account Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-[#2D3748] text-white px-12 py-3 rounded-lg hover:bg-[#1A202C] transition-colors text-lg font-medium"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 