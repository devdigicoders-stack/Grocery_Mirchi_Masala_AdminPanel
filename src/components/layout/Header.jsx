import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { authService, getStoredAdmin } from '../../services/api'
import { confirmLogout } from '../../utils/swal'

export default function Header({ onLogout, title, onToggleSidebar }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [adminUser, setAdminUser] = useState(getStoredAdmin() || { name: 'Admin', email: 'admin@mirchmasala.com' })

  // Password modal form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false })
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

  // Fetch latest profile on mount
  useEffect(() => {
    let isMounted = true
    authService
      .getProfile()
      .then((profile) => {
        if (isMounted && profile) {
          setAdminUser(profile)
        }
      })
      .catch(() => {
        // Fallback to stored local admin
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Dynamic Page Title resolution based on current URL path
  const getComputedTitle = () => {
    if (title) return title
    const p = location.pathname
    if (p === '/vendors') return 'Vendors'
    if (p === '/item-master') return 'Item Master'
    if (p.startsWith('/demands')) return 'Active Demand'
    if (p === '/quotations') return 'Quotations & Bidding Matrix'
    if (p.startsWith('/allocations')) return 'Final Order Allocations'
    if (p === '/reports') return 'Reports'
    if (p === '/email-logs') return 'Email Logs'
    if (p === '/settings') return 'Settings'
    return 'Dashboard'
  }

  const handleLogout = async () => {
    const isConfirmed = await confirmLogout()
    if (!isConfirmed) return
    setShowProfileMenu(false)
    authService.logout()
    if (onLogout) onLogout()
    navigate('/login')
  }

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordMsg({ text: '', isError: false })

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match!', isError: true })
      return
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters long.', isError: true })
      return
    }

    setIsSubmittingPassword(true)
    try {
      await authService.changePassword(currentPassword, newPassword)
      setPasswordMsg({ text: 'Password changed successfully! ✓', isError: false })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setIsPasswordModalOpen(false)
        setPasswordMsg({ text: '', isError: false })
      }, 1500)
    } catch (err) {
      setPasswordMsg({ text: err.message || 'Failed to change password.', isError: true })
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  return (
    <>
      <header className="h-16 sm:h-20 bg-white border-b border-slate-200/80 px-3.5 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
        {/* Left Side: Mobile Hamburger Button & Dynamic Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="Toggle navigation drawer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-slate-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <h1 className="text-base sm:text-[22px] font-bold text-slate-900 tracking-tight truncate">
            {getComputedTitle()}
          </h1>
        </div>

        {/* Right Actions: Notifications & User Profile */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          {/* Notification Bell */}
          <button
            type="button"
            className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Notifications"
          >
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
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </button>

          {/* User Profile Badge */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              {/* Avatar Circle */}
              <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-[#1e293b] text-white flex items-center justify-center shadow-sm shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 sm:w-5 h-4 sm:h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              {/* Name & Role (Hidden on very small screens, visible on sm+) */}
              <div className="leading-tight hidden sm:block">
                <div className="text-[14px] font-bold text-slate-800">
                  {adminUser.name || 'Admin'}
                </div>
                <div className="text-[11.5px] font-normal text-slate-400">
                  Shop Owner
                </div>
              </div>

              {/* Down Chevron */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-600 transition-transform duration-200 ${
                  showProfileMenu ? 'rotate-180' : ''
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{adminUser.name || 'Admin'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{adminUser.email || 'admin@mirchmasala.com'}</p>
                </div>

                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>⚙️</span>
                  <span>Store Profile & Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false)
                    setIsPasswordModalOpen(true)
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>🔑</span>
                  <span>Change Password</span>
                </button>

                <div className="border-t border-slate-100 mt-1" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {isPasswordModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPasswordModalOpen(false)
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0e743d] flex items-center justify-center font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#0e743d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1-1-1.5 1.5-1-1-4.5 4.5a5 5 0 1 0 7.07 7.07l4.5-4.5-1-1 1.5-1.5-1-1 1.5-1.5 1.5 1.5 3.5-3.5z" />
                    <circle cx="7.5" cy="16.5" r="1.5" />
                  </svg>
                </span>
                <h3 className="text-base font-bold text-slate-900">Change Admin Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {passwordMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  passwordMsg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0e743d] hover:bg-[#0a6032] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
