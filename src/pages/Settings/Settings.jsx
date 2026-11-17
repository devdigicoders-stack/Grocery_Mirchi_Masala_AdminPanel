import React, { useState, useEffect } from 'react'
import { authService, getStoredAdmin } from '../../services/api'
import { FormSkeleton } from '../../components/common/Skeleton'

export default function Settings() {
  const [activeSubTab, setActiveSubTab] = useState('shop-details') // 'shop-details' | 'email-settings' | 'system-settings' | 'security'
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Shop Details State
  const [shopName, setShopName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [address, setAddress] = useState('')
  const [gstin, setGstin] = useState('')

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordFeedback, setPasswordFeedback] = useState({ text: '', isError: false })

  // Email Settings State (MongoDB-backed)
  const [smtpHost, setSmtpHost] = useState('smtp.mailgun.org')
  const [smtpPort, setSmtpPort] = useState('587')
  const [senderEmail, setSenderEmail] = useState('notifications@mirchmasala.com')
  const [emailEncryption, setEmailEncryption] = useState('TLS')

  // System Settings State (MongoDB-backed)
  const [defaultBiddingHours, setDefaultBiddingHours] = useState('48')
  const [autoAllocationRule, setAutoAllocationRule] = useState('Lowest Rate First')
  const [currency, setCurrency] = useState('INR (₹)')
  const [autoCloseOnDeadline, setAutoCloseOnDeadline] = useState(true)
  const [notifyVendorsOnPublish, setNotifyVendorsOnPublish] = useState(true)

  // Toast Notification State
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success') // 'success' | 'error'
  const [isSaving, setIsSaving] = useState(false)

  const triggerToast = (msg, type = 'success') => {
    setToastMessage(msg)
    setToastType(type)
    setShowSavedToast(true)
    setTimeout(() => setShowSavedToast(false), 3500)
  }

  // Load real profile & settings from MongoDB API on mount
  useEffect(() => {
    let isMounted = true

    // Check localStorage cached admin first for instant rendering
    const stored = getStoredAdmin()
    if (stored) {
      if (stored.shopName) setShopName(stored.shopName)
      if (stored.name) setOwnerName(stored.name)
      if (stored.email) setEmail(stored.email)
      if (stored.phone) setContactNumber(stored.phone)
      if (stored.address) setAddress(stored.address)
      if (stored.gstin) setGstin(stored.gstin)
      if (stored.settings?.emailSettings) {
        const es = stored.settings.emailSettings
        if (es.smtpHost) setSmtpHost(es.smtpHost)
        if (es.smtpPort) setSmtpPort(String(es.smtpPort))
        if (es.senderEmail) setSenderEmail(es.senderEmail)
        if (es.encryption) setEmailEncryption(es.encryption)
      }
      if (stored.settings?.systemSettings) {
        const ss = stored.settings.systemSettings
        if (ss.defaultBiddingHours) setDefaultBiddingHours(String(ss.defaultBiddingHours))
        if (ss.autoAllocationRule) setAutoAllocationRule(ss.autoAllocationRule)
        if (ss.currency) setCurrency(ss.currency)
        if (ss.autoCloseOnDeadline !== undefined) setAutoCloseOnDeadline(ss.autoCloseOnDeadline)
        if (ss.notifyVendorsOnPublish !== undefined) setNotifyVendorsOnPublish(ss.notifyVendorsOnPublish)
      }
    }

    // Fetch fresh profile from MongoDB API
    authService
      .getProfile()
      .then((profile) => {
        if (!isMounted || !profile) return
        setShopName(profile.shopName || '')
        setOwnerName(profile.name || '')
        setEmail(profile.email || '')
        setContactNumber(profile.phone || '')
        setAddress(profile.address || '')
        setGstin(profile.gstin || '')

        if (profile.settings?.emailSettings) {
          const es = profile.settings.emailSettings
          if (es.smtpHost) setSmtpHost(es.smtpHost)
          if (es.smtpPort) setSmtpPort(String(es.smtpPort))
          if (es.senderEmail) setSenderEmail(es.senderEmail)
          if (es.encryption) setEmailEncryption(es.encryption)
        }
        if (profile.settings?.systemSettings) {
          const ss = profile.settings.systemSettings
          if (ss.defaultBiddingHours) setDefaultBiddingHours(String(ss.defaultBiddingHours))
          if (ss.autoAllocationRule) setAutoAllocationRule(ss.autoAllocationRule)
          if (ss.currency) setCurrency(ss.currency)
          if (ss.autoCloseOnDeadline !== undefined) setAutoCloseOnDeadline(ss.autoCloseOnDeadline)
          if (ss.notifyVendorsOnPublish !== undefined) setNotifyVendorsOnPublish(ss.notifyVendorsOnPublish)
        }
      })
      .catch((err) => {
        console.warn('Profile fetch note:', err.message)
      })
      .finally(() => {
        if (isMounted) setIsLoadingProfile(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // 1. Save Shop Profile to MongoDB
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await authService.updateProfile({
        name: ownerName,
        email,
        phone: contactNumber,
        shopName,
        address,
        gstin
      })
      triggerToast(res?.message || 'Shop details updated successfully in MongoDB!', 'success')
    } catch (error) {
      triggerToast(error.message || 'Failed to update shop details.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // 2. Save Email Settings to MongoDB
  const handleSaveEmailSettings = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await authService.updateSettings({
        emailSettings: {
          smtpHost: smtpHost.trim(),
          smtpPort: parseInt(smtpPort, 10) || 587,
          encryption: emailEncryption,
          senderEmail: senderEmail.trim()
        }
      })
      triggerToast(res?.message || 'Email settings saved successfully in MongoDB!', 'success')
    } catch (error) {
      triggerToast(error.message || 'Failed to save email settings.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // 3. Save System Settings to MongoDB
  const handleSaveSystemSettings = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await authService.updateSettings({
        systemSettings: {
          defaultBiddingHours: parseInt(defaultBiddingHours, 10) || 48,
          autoAllocationRule,
          currency: currency.trim(),
          autoCloseOnDeadline,
          notifyVendorsOnPublish
        }
      })
      triggerToast(res?.message || 'System settings saved successfully in MongoDB!', 'success')
    } catch (error) {
      triggerToast(error.message || 'Failed to save system settings.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // 4. Change Password via MongoDB Auth API
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordFeedback({ text: '', isError: false })

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ text: 'New passwords do not match!', isError: true })
      return
    }

    if (newPassword.length < 6) {
      setPasswordFeedback({ text: 'New password must be at least 6 characters long.', isError: true })
      return
    }

    setIsSaving(true)
    try {
      await authService.changePassword(currentPassword, newPassword)
      setPasswordFeedback({ text: 'Password changed successfully! You can now log in with your new credentials.', isError: false })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      triggerToast('Password updated successfully!', 'success')
    } catch (error) {
      setPasswordFeedback({ text: error.message || 'Failed to update password. Please check your current password.', isError: true })
      triggerToast(error.message || 'Password update failed', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showSavedToast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-in slide-in-from-top-3 duration-200 ${
            toastType === 'error'
              ? 'bg-rose-700 text-white border-rose-500/40'
              : 'bg-[#0e743d] text-white border-emerald-400/40'
          }`}
        >
          {toastType === 'error' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-rose-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          
          {/* Left Sub-Navigation Tabs (Horizontal scroll on mobile, vertical sticky-style on desktop) */}
          <div className="w-full lg:w-64 shrink-0 flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-2 lg:pb-0 lg:border-r lg:border-slate-200/80 lg:pr-8">
            
            {/* Shop Details Tab */}
            <button
              type="button"
              onClick={() => setActiveSubTab('shop-details')}
              className={`flex items-center gap-2.5 sm:gap-3.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-[14.5px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 lg:w-full lg:whitespace-normal text-left ${
                activeSubTab === 'shop-details'
                  ? 'bg-[#eaf8f0] text-[#0e743d]'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={activeSubTab === 'shop-details' ? 'text-[#0e743d]' : 'text-slate-500'}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 sm:w-5 h-4 sm:h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </span>
              <span>Shop Details</span>
            </button>

            {/* System Settings Tab */}
            <button
              type="button"
              onClick={() => setActiveSubTab('system-settings')}
              className={`flex items-center gap-2.5 sm:gap-3.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-[14.5px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 lg:w-full lg:whitespace-normal text-left ${
                activeSubTab === 'system-settings'
                  ? 'bg-[#eaf8f0] text-[#0e743d]'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={activeSubTab === 'system-settings' ? 'text-[#0e743d]' : 'text-slate-500'}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 sm:w-5 h-4 sm:h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
              <span>System Settings</span>
            </button>

            {/* Change Password / Security Tab */}
            <button
              type="button"
              onClick={() => setActiveSubTab('security')}
              className={`flex items-center gap-2.5 sm:gap-3.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-[14.5px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 lg:w-full lg:whitespace-normal text-left ${
                activeSubTab === 'security'
                  ? 'bg-[#eaf8f0] text-[#0e743d]'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={activeSubTab === 'security' ? 'text-[#0e743d]' : 'text-slate-500'}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 sm:w-5 h-4 sm:h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <span>Change Password</span>
            </button>

          </div>

          {/* Right Content Form Section */}
          <div className="flex-1 min-w-0">
            {isLoadingProfile ? (
              <FormSkeleton />
            ) : (
              <>
                {/* Tab 1: Shop Details (Profile Edit API) */}
                {activeSubTab === 'shop-details' && (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Shop Details & Profile
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Update store branding, contact info, and legal registration stored in MongoDB.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Shop Name Field */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          Shop / Store Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          placeholder="e.g. Mirch Masala Grocery Shop"
                          className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm"
                        />
                      </div>

                      {/* Owner Name Field */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          Owner / Manager Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="e.g. Rajesh Kumar"
                          className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Primary Contact Number (Admin Login ID) */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          Primary Mobile Number (Admin Login ID) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm"
                        />
                      </div>

                      {/* GSTIN Field */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          GSTIN / Business Registration
                        </label>
                        <input
                          type="text"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value)}
                          placeholder="e.g. 09AAAAA0000A1Z5"
                          className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm font-mono uppercase"
                        />
                      </div>
                    </div>

                    {/* GSTIN Field */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        GSTIN / Tax Registration Number
                      </label>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        placeholder="e.g. 07AAAAA0000A1Z5"
                        className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm font-mono"
                      />
                    </div>

                    {/* Shop Address Field */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Shop Address / Billing Location
                      </label>
                      <textarea
                        rows="3"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter full physical address of the store / warehouse"
                        className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm resize-none"
                      />
                    </div>

                    {/* Save Changes Button */}
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-7 py-3 bg-[#0e743d] hover:bg-[#0a6032] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving to Database...</span>
                          </>
                        ) : (
                          <span>Save Shop Details</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Tab 2: System Settings (MongoDB Settings API) */}
                {activeSubTab === 'system-settings' && (
                  <form onSubmit={handleSaveSystemSettings} className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        System & Bidding Parameters
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Set standard bidding deadlines, auto-allocation criteria, and system automation behavior.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          Default Bidding Window (Hours)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="168"
                          required
                          value={defaultBiddingHours}
                          onChange={(e) => setDefaultBiddingHours(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm"
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">Default duration when publishing a new demand (e.g. 48 hrs)</span>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          Currency Symbol / Display
                        </label>
                        <input
                          type="text"
                          required
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          placeholder="INR (₹)"
                          className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm"
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">Standard currency used across quotations & purchase orders</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Auto-Allocation Rule
                      </label>
                      <select
                        value={autoAllocationRule}
                        onChange={(e) => setAutoAllocationRule(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm"
                      >
                        <option value="Lowest Rate First">Lowest Rate First (L1 / LEB - Lowest Evaluated Bidder)</option>
                        <option value="Highest Rated Vendor">Highest Rated Vendor</option>
                        <option value="Manual Confirmation">Manual Confirmation Always</option>
                      </select>
                      <span className="text-[11px] text-slate-400 mt-1 block">Governs the recommendation algorithm on the Allocations page</span>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Automation Toggles</h3>
                      
                      <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/70 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoCloseOnDeadline}
                          onChange={(e) => setAutoCloseOnDeadline(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-slate-800">Auto-close demand submissions when deadline expires</p>
                          <p className="text-slate-500">Prevents late bids once the 48-hour countdown hits zero.</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/70 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifyVendorsOnPublish}
                          onChange={(e) => setNotifyVendorsOnPublish(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-slate-800">Notify active vendors when a new demand is published</p>
                          <p className="text-slate-500">Automatically broadcasts push notifications and live alerts to the vendor mobile app.</p>
                        </div>
                      </label>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-7 py-3 bg-[#0e743d] hover:bg-[#0a6032] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving Settings...</span>
                          </>
                        ) : (
                          <span>Save System Settings</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Tab 4: Change Password (Security) */}
                {activeSubTab === 'security' && (
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Change Admin Password
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ensure your account is protected with a secure password. Verified directly with MongoDB bcrypt hashing.
                      </p>
                    </div>

                    {passwordFeedback.text && (
                      <div
                        className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                          passwordFeedback.isError
                            ? 'bg-rose-50 border border-rose-200 text-rose-700'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        }`}
                      >
                        {passwordFeedback.isError ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        <span>{passwordFeedback.text}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Current Password <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        New Password <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 6 characters)"
                        className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Confirm New Password <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm"
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-7 py-3 bg-[#0e743d] hover:bg-[#0a6032] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Updating Password...</span>
                          </>
                        ) : (
                          <span>Update Password</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
