import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService, getStoredToken } from '../../services/api'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  // Admin Login credentials (Email & Password)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // If already authenticated with a valid token, immediately redirect to dashboard
  useEffect(() => {
    if (getStoredToken()) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both Admin Email and password.')
      return
    }

    setIsLoading(true)

    try {
      // Call backend API: POST /api/auth/login with email & password
      await authService.login(email.trim(), password)
      if (onLogin) onLogin()
      navigate('/', { replace: true })
    } catch (error) {
      console.warn('Login attempt failed:', error.message)
      setErrorMessage(error.message || 'Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50/80 via-slate-100 to-green-100/60 relative overflow-hidden font-sans">
      {/* Decorative subtle background blurs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-green-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100/80 relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <img
            src="/logo.png"
            alt="Mirch Masala Grocery Shop"
            className="h-28 w-auto object-contain drop-shadow-sm select-none"
          />
        </div>

        {/* Heading & Subtitle */}
        <div className="text-center mb-7">
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight mb-1.5">
            Admin Login
          </h1>
          <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed">
            Login to manage demands, vendors and orders
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-start justify-between gap-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-rose-400 hover:text-rose-700 font-bold p-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Address Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Admin Email (e.g. admin@mirchmasala.com)"
              autoComplete="email"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/90 rounded-2xl text-[14px] text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200/90 rounded-2xl text-[14px] text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
            />
            {/* Password Toggle Visibility */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1 select-none">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-800 bg-white border-slate-300 focus:ring-emerald-700 accent-[#0e743d] cursor-pointer"
              />
              <span className="font-medium">Remember me</span>
            </label>
            <span className="text-slate-400 text-[11.5px]">
              Admin Only Access
            </span>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#0e743d] hover:bg-[#0a6032] active:scale-[0.99] text-white font-semibold rounded-2xl shadow-md shadow-emerald-900/10 hover:shadow-lg hover:shadow-emerald-900/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>

        </form>

        {/* Footer info */}
        <div className="mt-8 text-center border-t border-slate-100 pt-5">
          <p className="text-[11.5px] text-slate-400">
            Protected Admin Portal &bull; Mirch Masala B2B
          </p>
        </div>

      </div>
    </div>
  )
}
