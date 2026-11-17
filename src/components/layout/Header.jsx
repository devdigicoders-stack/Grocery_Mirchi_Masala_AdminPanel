import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { authService, getStoredAdmin, notificationService, vendorService } from '../../services/api'
import { confirmLogout, showSuccessAlert, showErrorAlert } from '../../utils/swal'
import soundManager from '../../utils/sound'

export default function Header({ onLogout, title, onToggleSidebar }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [adminUser, setAdminUser] = useState(getStoredAdmin() || { name: 'Admin', email: 'admin@mirchmasala.com', phone: '+91 98765 43210' })

  // Password modal form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false })
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  // Push Notifications state
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifStatus, setNotifStatus] = useState(null)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [vendorsList, setVendorsList] = useState([])
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false)
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    body: '',
    type: 'custom_broadcast',
    targetType: 'all',
    targetVendorId: ''
  })

  const location = useLocation()
  const navigate = useNavigate()

  // Fetch notifications and status
  const loadNotificationsData = async () => {
    try {
      setLoadingNotifs(true)
      const [notifsRes, statusRes] = await Promise.all([
        notificationService.getNotifications(1, 10).catch(() => ({ data: [] })),
        notificationService.getStatus().catch(() => null)
      ])
      if (notifsRes?.data) setNotifications(notifsRes.data)
      if (statusRes) setNotifStatus(statusRes)
    } catch (err) {
      console.warn('Failed to load notifications:', err.message)
    } finally {
      setLoadingNotifs(false)
    }
  }

  // Fetch vendors for targeting in broadcast modal
  const loadVendors = async () => {
    try {
      const data = await vendorService.getVendors().catch(() => [])
      setVendorsList(Array.isArray(data) ? data : data?.data || [])
    } catch (_) {}
  }

  // Fetch latest profile & notifications on mount
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

    loadNotificationsData()
    loadVendors()

    return () => {
      isMounted = false
    }
  }, [])

  // Mute/Unmute state for dynamic notification sound
  const [isMuted, setIsMuted] = useState(soundManager.getMuted())

  // SSE Live stream connection for Real-Time Chime & Instant Alerts
  useEffect(() => {
    const apiBase =
      import.meta.env.VITE_API_BASE_URL ||
      'https://grocery-mirchi-masala-backend.onrender.com/api'
    const sseUrl = `${apiBase.replace(/\/api\/?$/, '')}/api/demands/live-stream`

    let eventSource = null
    try {
      eventSource = new EventSource(sseUrl)

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (
            payload.type === 'NEW_NOTIFICATION' ||
            payload.type === 'DEMAND_PUBLISHED' ||
            payload.type === 'QUOTATION_SUBMITTED' ||
            payload.type === 'DEMAND_CLOSED'
          ) {
            soundManager.playNotificationTone()
            loadNotificationsData()
          }
        } catch (_) {}
      }
    } catch (e) {
      console.warn('Header SSE connection warning:', e.message)
    }

    return () => {
      if (eventSource) eventSource.close()
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

  // Handle Manual Push Broadcast to Vendors
  const handleBroadcastSubmit = async (e) => {
    e.preventDefault()
    if (!broadcastForm.title.trim() || !broadcastForm.body.trim()) {
      showErrorAlert('Please provide both notification title and message body.')
      return
    }

    setIsSendingBroadcast(true)
    try {
      const res = await notificationService.broadcastNotification({
        title: broadcastForm.title.trim(),
        body: broadcastForm.body.trim(),
        type: broadcastForm.type,
        targetType: broadcastForm.targetType,
        targetVendorId: broadcastForm.targetType === 'single' ? broadcastForm.targetVendorId : null
      })

      setIsBroadcastModalOpen(false)
      setBroadcastForm({
        title: '',
        body: '',
        type: 'custom_broadcast',
        targetType: 'all',
        targetVendorId: ''
      })
      showSuccessAlert(res?.message || 'Push Notification dispatched to vendors!')
      loadNotificationsData()
    } catch (err) {
      showErrorAlert(err.message || 'Failed to dispatch push notification')
    } finally {
      setIsSendingBroadcast(false)
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
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {/* Notification Sound Mute/Unmute Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextMuted = soundManager.toggleMute()
              setIsMuted(nextMuted)
              if (!nextMuted) soundManager.playNotificationTone()
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Notification Tone' : 'Mute Notification Tone (Click to test chime)'}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 sm:w-5 h-4 sm:h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 sm:w-5 h-4 sm:h-5 text-[#0e743d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {/* Notification Bell & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu)
                setShowProfileMenu(false)
                if (!showNotifMenu) loadNotificationsData()
              }}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer relative"
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

              {/* Notification Indicator Dot */}
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {showNotifMenu && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Vendor Push Alerts
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        notifStatus?.firebaseReady
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                      title={
                        notifStatus?.firebaseReady
                          ? 'Firebase Cloud Messaging Active'
                          : 'Real-Time SSE Live Stream Active (Configure FCM for Mobile background push)'
                      }
                    >
                      {notifStatus?.firebaseReady ? '🔥 FCM Live' : '📡 SSE Stream'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifMenu(false)
                      setIsBroadcastModalOpen(true)
                    }}
                    className="text-[11px] font-bold text-[#0e743d] hover:text-[#0a6032] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    + New Push
                  </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {loadingNotifs ? (
                    <div className="p-4 text-center text-slate-400">Loading alerts...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-600">No push notifications yet</p>
                      <p className="text-[11px]">Published demands and reminders will appear here.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-800 leading-snug">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1 line-clamp-2 leading-relaxed text-[11.5px]">
                          {n.body}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                            {n.targetType === 'all'
                              ? '📢 All Vendors'
                              : `👤 ${n.targetVendorName || 'Single Vendor'}`}
                          </span>
                          {n.fcmSuccessCount > 0 && (
                            <span className="text-emerald-600 font-medium">
                              ✓ {n.fcmSuccessCount} delivered
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Link */}
                <div className="px-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {notifStatus?.registeredVendorsWithTokens || 0} Registered Devices
                  </span>
                  <Link
                    to="/allocations"
                    onClick={() => setShowNotifMenu(false)}
                    className="font-bold text-[#0e743d] hover:underline"
                  >
                    View Allocations →
                  </Link>
                </div>
              </div>
            )}
          </div>

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
                  <p className="text-[11px] text-slate-500 truncate">{adminUser.email || adminUser.phone || 'Store Administrator'}</p>
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

      {/* Dispatch Custom Push Notification Modal */}
      {isBroadcastModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBroadcastModalOpen(false)
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0e743d] flex items-center justify-center font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#0e743d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Broadcast Push Notification</h3>
                  <p className="text-[11px] text-slate-500">Send instant mobile alert & push notification to vendors</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              {/* Notification Target */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notification Target
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      broadcastForm.targetType === 'all'
                        ? 'border-[#0e743d] bg-emerald-50/60 text-[#0e743d]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      checked={broadcastForm.targetType === 'all'}
                      onChange={() => setBroadcastForm({ ...broadcastForm, targetType: 'all', targetVendorId: '' })}
                      className="text-[#0e743d] focus:ring-0"
                    />
                    <span>📢 All Active Vendors</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      broadcastForm.targetType === 'single'
                        ? 'border-[#0e743d] bg-emerald-50/60 text-[#0e743d]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      checked={broadcastForm.targetType === 'single'}
                      onChange={() => setBroadcastForm({ ...broadcastForm, targetType: 'single' })}
                      className="text-[#0e743d] focus:ring-0"
                    />
                    <span>👤 Single Vendor</span>
                  </label>
                </div>
              </div>

              {/* Vendor Selector (if single) */}
              {broadcastForm.targetType === 'single' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Recipient Vendor
                  </label>
                  <select
                    required
                    value={broadcastForm.targetVendorId}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, targetVendorId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 cursor-pointer"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {vendorsList.map((v) => (
                      <option key={v._id || v.id} value={v._id || v.id}>
                        {v.name} {v.phone ? `(${v.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  placeholder="e.g. Urgent Reminder: Rice Bidding Window Closing"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notification Message Body *
                </label>
                <textarea
                  required
                  rows={3}
                  value={broadcastForm.body}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                  placeholder="Type the message that will pop up on vendor devices..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 resize-none"
                />
              </div>

              {/* Alert Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alert Category
                </label>
                <select
                  value={broadcastForm.type}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 cursor-pointer"
                >
                  <option value="custom_broadcast">Announcement / Notice</option>
                  <option value="bidding_reminder">Bidding Reminder</option>
                  <option value="new_demand">Demand Alert</option>
                  <option value="system_alert">System Alert</option>
                </select>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#0e743d] hover:bg-[#0a6032] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingBroadcast ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      <span>Dispatch Push Notification</span>
                    </>
                  )}
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
