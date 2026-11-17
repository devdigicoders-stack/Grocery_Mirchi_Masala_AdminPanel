import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { vendorService, getFileUrl } from '../../services/api'
import { TableSkeleton } from '../../components/common/Skeleton'
import { confirmDelete, confirmStatusToggle } from '../../utils/swal'

// ==========================================
// Sharp, Professional SVG Icons (Zero Emojis)
// ==========================================

function IconClose({ className = 'w-5 h-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconCamera({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function IconUser({ className = 'w-6 h-6' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconBolt({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconLock({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconKey({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1-1-1.5 1.5-1-1-4.5 4.5a5 5 0 1 0 7.07 7.07l4.5-4.5-1-1 1.5-1.5-1-1 1.5-1.5 1.5 1.5 3.5-3.5z" />
      <circle cx="7.5" cy="16.5" r="1.5" />
    </svg>
  )
}

function IconEye({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

function IconCopy({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function IconCheck({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconPhone({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function IconSmartphone({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
}

function IconMail({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function IconTrash({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function IconInfo({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function IconSend({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function IconEdit({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}

function IconAlertTriangle({ className = 'w-5 h-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

// ==========================================
// Vendors Component
// ==========================================

export default function Vendors() {
  // Real dynamic vendor list from MongoDB (No dummy data)
  const [vendors, setVendors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isApkModalOpen, setIsApkModalOpen] = useState(false)
  const [viewingVendor, setViewingVendor] = useState(null)
  
  // Feedback states
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  
  // Add / Edit form states
  const [editingVendor, setEditingVendor] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    address: '',
    status: 'Active'
  })
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [showFormPassword, setShowFormPassword] = useState(false)
  const [showDetailPassword, setShowDetailPassword] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const fileInputRef = useRef(null)

  // Show temporary toast notification
  const triggerToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  // Fetch real vendors from MongoDB API
  const fetchVendorsList = useCallback(async (query = '', status = 'All') => {
    try {
      setIsLoading(true)
      setApiError('')
      const data = await vendorService.getVendors(query, status)
      setVendors(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Vendors fetch error:', err.message)
      setApiError(err.message || 'Failed to load vendors from server.')
      setVendors([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial and reactive load
  useEffect(() => {
    fetchVendorsList(searchQuery, statusFilter)
  }, [fetchVendorsList, searchQuery, statusFilter])

  // Open Add Vendor Modal
  const handleOpenAddModal = () => {
    setEditingVendor(null)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    setFormData({
      name: '',
      phone: '',
      password: `Mirch@${randomSuffix}`,
      address: '',
      status: 'Active'
    })
    setSelectedImageFile(null)
    setImagePreview(null)
    setShowFormPassword(false)
    setFormError('')
    setIsModalOpen(true)
  }

  // Open Edit Vendor Modal
  const handleOpenEditModal = (vendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name || '',
      phone: vendor.phone || '',
      password: vendor.password || '',
      address: vendor.address || '',
      status: vendor.status || 'Active'
    })
    setSelectedImageFile(null)
    setImagePreview(vendor.profileImage ? getFileUrl(vendor.profileImage) : null)
    setShowFormPassword(false)
    setFormError('')
    setIsModalOpen(true)
  }

  // Handle local profile image selection
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Please select a valid image file (PNG, JPG, JPEG, WEBP)')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image size exceeds 5MB limit. Please choose a smaller image.')
        return
      }
      setSelectedImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setFormError('')
    }
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Quick generate a readable secure password
  const handleGeneratePassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const prefixes = ['Mirch', 'Vendor', 'Masala', 'Pass', 'B2B']
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    setFormData((prev) => ({ ...prev, password: `${randomPrefix}@${randomDigits}` }))
  }

  // Delete vendor with SweetAlert confirmation
  const handleDeleteVendor = async (id, vendorName) => {
    const isConfirmed = await confirmDelete({
      title: `Delete Vendor "${vendorName}"?`,
      text: 'This vendor and their bid records will be deleted. This action cannot be undone.'
    })
    if (!isConfirmed) return
    try {
      await vendorService.deleteVendor(id)
      triggerToast(`Vendor "${vendorName}" deleted successfully!`)
      if (viewingVendor && viewingVendor._id === id) {
        setViewingVendor(null)
      }
      fetchVendorsList(searchQuery, statusFilter)
    } catch (err) {
      alert(err.message || 'Failed to delete vendor')
    }
  }

  // Toggle Vendor Status (Active <-> Inactive) with SweetAlert confirmation
  const handleToggleStatus = async (vendor) => {
    const newStatus = vendor.status === 'Active' ? 'Inactive' : 'Active'
    const isConfirmed = await confirmStatusToggle({
      itemName: vendor.name,
      newStatus
    })
    if (!isConfirmed) return

    try {
      const payload = new FormData()
      payload.append('name', vendor.name)
      payload.append('phone', vendor.phone || '')
      payload.append('status', newStatus)
      await vendorService.updateVendor(vendor._id, payload)
      triggerToast(`Vendor "${vendor.name}" marked as ${newStatus}`)
      fetchVendorsList(searchQuery, statusFilter)
    } catch (err) {
      alert(err.message || 'Failed to update vendor status')
    }
  }

  // Submit Add / Edit Form (FormData with image file upload)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError('Vendor Name and Mobile Number are required.')
      return
    }

    if (!formData.password.trim()) {
      setFormError('Vendor Password is required.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = new FormData()
      payload.append('name', formData.name.trim())
      payload.append('phone', formData.phone.trim())
      payload.append('password', formData.password.trim())
      payload.append('address', formData.address.trim())
      payload.append('status', formData.status)

      if (selectedImageFile) {
        payload.append('profileImage', selectedImageFile)
      } else if (!imagePreview && editingVendor && editingVendor.profileImage) {
        // Image was cleared by user
        payload.append('profileImage', '')
      }

      if (editingVendor) {
        // Update vendor in MongoDB
        const updated = await vendorService.updateVendor(editingVendor._id, payload)
        triggerToast(`Vendor "${formData.name}" updated successfully!`)
        if (viewingVendor && viewingVendor._id === editingVendor._id) {
          setViewingVendor(updated)
        }
      } else {
        // Create new vendor in MongoDB
        await vendorService.createVendor(payload)
        triggerToast(`Vendor "${formData.name}" registered successfully with password: ${formData.password}`)
      }

      setIsModalOpen(false)
      fetchVendorsList(searchQuery, statusFilter)
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Copy helper
  const copyToClipboard = (text, type = 'pass') => {
    navigator.clipboard?.writeText(text)
    if (type === 'pass') {
      setCopiedPass(true)
      setTimeout(() => setCopiedPass(false), 2000)
    } else if (type === 'phone') {
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    } else if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  // Send APK & Credentials directly via WhatsApp to vendor
  const handleSendApkToVendor = (vendor) => {
    try {
      const rawPhone = String(vendor.phone || '').trim().replace(/\D/g, '')
      if (!rawPhone || rawPhone.length < 10) {
        alert(`Vendor "${vendor.name}" ke paas valid 10-digit mobile number nahi hai. Kripya pehle mobile number add karein.`)
        return
      }

      // If 10 digits, prepend 91 for India; otherwise use the cleaned number
      const phoneWithCountry = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone
      const apkUrl = 'https://grocery-mirchi-masala-backend.onrender.com/downloads/vendor-app.apk'

      const message =
        `Namaste *${vendor.name}* ji,\n\n` +
        `Aapka *Mirch Masala Grocery Shop* B2B Vendor App login details taiyar hai:\n\n` +
        `📱 *Login Mobile Number:* ${vendor.phone}\n` +
        `🔑 *Password:* ${vendor.password || 'vendor123'}\n\n` +
        `📲 *Download Vendor App (.apk):*\n${apkUrl}\n\n` +
        `Kripya app install karein aur apne mobile number aur password se login karke daily demands par apne quotations submit karein.\n\n` +
        `Dhanyawad,\n*Mirch Masala Grocery Shop*`

      const waUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`

      // Non-blocking sync with backend to log lastInviteSentAt
      vendorService.sendApkInvite(vendor._id).catch(() => {})

      // Open WhatsApp directly in new tab / desktop app
      window.open(waUrl, '_blank')
      triggerToast(`Opening WhatsApp for ${vendor.name} (${vendor.phone})...`)
    } catch (err) {
      alert(err.message || 'WhatsApp open karne me samasya aayi')
    }
  }

  // Bulk APK invite
  const handleSendBulkApk = async () => {
    try {
      const res = await vendorService.sendBulkApkInvite()
      setIsApkModalOpen(false)
      triggerToast(res.message || 'Bulk APK invite prepared for all active vendors!')
    } catch (err) {
      alert(err.message || 'Failed to send bulk invites')
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-[#0e743d] text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-400/30 animate-in slide-in-from-top-3 duration-200">
          <IconSmartphone className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-white/80 hover:text-white font-bold ml-2 cursor-pointer p-0.5 rounded"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Backend API Connection Warning */}
      {apiError && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <IconAlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Backend Connection Notice</p>
              <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">{apiError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchVendorsList(searchQuery, statusFilter)}
            className="px-3 py-1 bg-white border border-amber-300 hover:bg-amber-100 rounded-lg text-xs font-bold text-amber-900 shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Controls: Search Input, Status Filter, Share APK & Add Vendor Button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-xl">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor by name or mobile number..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>

        {/* Action Buttons: Share APK & Add Vendor */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* Share Vendor App (.apk) Button */}
          <button
            type="button"
            onClick={() => setIsApkModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-[#0e743d] border border-emerald-300 font-semibold text-sm rounded-xl shadow-xs transition-all duration-150 cursor-pointer"
            title="Distribute private vendor Android .apk"
          >
            <IconSmartphone className="w-4 h-4 text-[#0e743d]" />
            <span>Share Vendor App (.apk)</span>
          </button>

          {/* Add Vendor Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0e743d] hover:bg-[#0a6032] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 cursor-pointer"
          >
            <span className="text-lg leading-none font-bold">+</span>
            <span>Add Vendor</span>
          </button>
        </div>

      </div>

      {/* Vendors Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-800 text-[13.5px] font-bold bg-slate-50/50">
                <th className="py-4 px-6 w-14">#</th>
                <th className="py-4 px-6">Vendor & Profile</th>
                <th className="py-4 px-6">Mobile Number (Login ID)</th>
                <th className="py-4 px-6">Password</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-0">
                    <TableSkeleton rows={5} cols={6} />
                  </td>
                </tr>
              ) : vendors.length > 0 ? (
                vendors.map((vendor, index) => (
                  <tr
                    key={vendor._id || index}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-4 px-6 font-medium text-slate-500 text-xs">
                      {index + 1}
                    </td>

                    {/* Vendor Name + Profile Image Avatar + Phone */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {/* Profile Image Avatar */}
                        <div className="w-10 h-10 rounded-full bg-emerald-100/80 text-[#0e743d] flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-emerald-200">
                          {vendor.profileImage ? (
                            <img
                              src={getFileUrl(vendor.profileImage)}
                              alt={vendor.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <span>{vendor.name ? vendor.name.charAt(0).toUpperCase() : 'V'}</span>
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-[#0e743d] transition-colors">
                            {vendor.name}
                          </p>
                          {vendor.phone ? (
                            <p className="text-xs text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                              <IconPhone className="w-3 h-3 text-slate-400" />
                              <span>{vendor.phone}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">No phone added</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Mobile Number (Login ID) */}
                    <td className="py-4 px-6 text-slate-800 font-mono text-xs sm:text-sm font-semibold">
                      {vendor.phone || '—'}
                    </td>

                    {/* Password (Visible plain-text as requested) */}
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-2 bg-amber-50/80 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                        <span className="font-mono text-xs font-semibold text-amber-950 select-all">
                          {vendor.password || 'vendor123'}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(vendor.password || 'vendor123', 'pass')}
                          title="Copy Password"
                          className="text-amber-800 hover:text-amber-950 text-xs cursor-pointer p-0.5 rounded hover:bg-amber-100"
                        >
                          <IconCopy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Status Badge with SweetAlert Toggle */}
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(vendor)}
                        title={`Click to switch status to ${vendor.status === 'Active' ? 'Inactive' : 'Active'}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105 ${
                          vendor.status === 'Active'
                            ? 'bg-[#eaf8f0] text-[#1bb062] hover:bg-rose-50 hover:text-rose-700 border border-emerald-200'
                            : 'bg-[#fee2e2] text-[#ef4444] hover:bg-emerald-50 hover:text-[#0e743d] border border-rose-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${vendor.status === 'Active' ? 'bg-[#1bb062]' : 'bg-[#ef4444]'}`} />
                        <span>{vendor.status || 'Active'}</span>
                      </button>
                    </td>

                    {/* Action Buttons: View Details, Send APK, Edit, Delete */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* 1. View Details Modal (Eye icon) */}
                        <button
                          type="button"
                          onClick={() => setViewingVendor(vendor)}
                          className="text-slate-600 hover:text-[#0e743d] p-1.5 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="View Vendor Details & Password"
                        >
                          <IconEye className="w-4 h-4" />
                        </button>

                        {/* 2. Send APK & Login Credentials on WhatsApp */}
                        <button
                          type="button"
                          onClick={() => handleSendApkToVendor(vendor)}
                          className="text-emerald-600 hover:text-emerald-800 p-1.5 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title={`Send APK & Login Credentials to ${vendor.name} via WhatsApp`}
                        >
                          <IconSend className="w-4 h-4" />
                        </button>

                        {/* 3. Edit Icon Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(vendor)}
                          className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Vendor"
                        >
                          <IconEdit className="w-4 h-4" />
                        </button>

                        {/* 4. Delete Icon Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteVendor(vendor._id, vendor.name)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Vendor"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Clean Empty State when MongoDB has no records */
                <tr>
                  <td colSpan="6" className="py-14 px-6 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0e743d] flex items-center justify-center">
                        <IconUser className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">
                        {searchQuery ? `No vendors found matching "${searchQuery}"` : 'No Vendors Registered Yet'}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {searchQuery
                          ? 'Try searching with a different name or mobile number.'
                          : 'Register your authorized grocery vendors. Only registered mobile numbers and passwords will be authorized to log in to the Vendor Mobile App.'}
                      </p>
                      {!searchQuery && (
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="mt-2 px-5 py-2.5 bg-[#0e743d] hover:bg-[#0a6032] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          + Register First Vendor
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VENDOR DETAIL MODAL (Fixed Header, Scrollable Body, Fixed Footer - No Cut) */}
      {/* ========================================================================= */}
      {viewingVendor && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingVendor(null)
          }}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header (Fixed at top) */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 overflow-hidden flex items-center justify-center text-xl font-bold text-[#0e743d] shrink-0">
                  {viewingVendor.profileImage ? (
                    <img
                      src={getFileUrl(viewingVendor.profileImage)}
                      alt={viewingVendor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{viewingVendor.name ? viewingVendor.name.charAt(0).toUpperCase() : 'V'}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{viewingVendor.name}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        viewingVendor.status === 'Active'
                          ? 'bg-[#eaf8f0] text-[#1bb062]'
                          : 'bg-[#fee2e2] text-[#ef4444]'
                      }`}
                    >
                      {viewingVendor.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Authorized B2B Grocery Vendor</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingVendor(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable inside, never gets cut off) */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Credentials Card (Plain Password & Email for Vendor App Login) */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    <IconKey className="w-4 h-4 text-emerald-700" />
                    <span>Vendor App Login Credentials</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-semibold">
                    Plain Text (Not Hashed)
                  </span>
                </div>

                {/* Login Mobile Number */}
                <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Registered Mobile Number (Login ID)
                    </span>
                    <span className="font-mono text-sm font-semibold text-slate-800 select-all">
                      {viewingVendor.phone || '—'}
                    </span>
                  </div>
                  {viewingVendor.phone && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(viewingVendor.phone, 'phone')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedPhone ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> : <IconCopy className="w-3.5 h-3.5" />}
                      <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>

                {/* Login Password */}
                <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      App Login Password
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-base font-bold text-emerald-800 select-all">
                        {showDetailPassword ? viewingVendor.password || 'vendor123' : '••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDetailPassword(!showDetailPassword)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title={showDetailPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showDetailPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(viewingVendor.password || 'vendor123', 'pass')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#0e743d] hover:bg-[#0a6032] text-white rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    {copiedPass ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy className="w-3.5 h-3.5" />}
                    <span>{copiedPass ? 'Copied' : 'Copy Password'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-emerald-800/90 leading-relaxed">
                  <IconInfo className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Vendors directly sign into the mobile app using this mobile number and password.</span>
                </div>
              </div>

              {/* Other Profile Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Contact Number
                  </span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <IconPhone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewingVendor.phone || 'Not specified'}</span>
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Shop / Business Address
                  </span>
                  <span className="font-semibold text-slate-800">
                    {viewingVendor.address || 'Not specified'}
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Footer (Fixed at bottom) */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/60">
              <button
                type="button"
                onClick={() => {
                  const target = viewingVendor
                  setViewingVendor(null)
                  handleOpenEditModal(target)
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
              >
                <IconEdit className="w-3.5 h-3.5" />
                <span>Edit Vendor</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendApkToVendor(viewingVendor)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors cursor-pointer"
                  title="Share credentials and app download link directly via WhatsApp"
                >
                  <IconSend className="w-3.5 h-3.5" />
                  <span>Send on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingVendor(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* SHARE VENDOR APP (.APK) MODAL (Fixed Header, Scrollable Body, Fixed Footer)*/}
      {/* ========================================================================= */}
      {isApkModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsApkModalOpen(false)
          }}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header (Fixed) */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#0e743d] flex items-center justify-center font-bold">
                  <IconSmartphone className="w-5 h-5 text-[#0e743d]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Vendor Android App (.apk) Distribution
                  </h3>
                  <p className="text-xs text-slate-500">Private B2B Bidding System for 10–50 Trusted Vendors</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-600">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">File Name:</span>
                  <span className="font-mono text-emerald-800 font-semibold">MirchMasala-Vendor-v1.0.apk</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Package Size:</span>
                  <span className="text-slate-600">18.4 MB (Flutter Release Build)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Login Authentication:</span>
                  <span className="text-emerald-700 font-bold">Mobile Number + Plain Password</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Private Download URL:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://grocery-mirchi-masala-backend.onrender.com/downloads/vendor-app.apk"
                    className="flex-1 px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://grocery-mirchi-masala-backend.onrender.com/downloads/vendor-app.apk', 'link')}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0e743d] hover:bg-[#0a6032] text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer"
                  >
                    {copiedLink ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <IconLock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Security Rule:</strong> Vendors cannot sign up publicly. Only mobile number and password credentials registered by the Shop Owner in this portal can log into the vendor app.
                </div>
              </div>
            </div>

            {/* Modal Footer (Fixed) */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/60">
              <button
                type="button"
                onClick={handleSendBulkApk}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors cursor-pointer"
              >
                <IconSmartphone className="w-3.5 h-3.5 text-emerald-700" />
                <span>Send APK Link to All Active Vendors</span>
              </button>
              <button
                type="button"
                onClick={() => setIsApkModalOpen(false)}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0e743d] hover:bg-[#0a6032] rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT VENDOR MODAL (Fixed Header, Scrollable Form, Fixed Footer)      */}
      {/* ========================================================================= */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false)
          }}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header (Fixed at top - Never cut off) */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingVendor ? 'Edit Vendor Details' : 'Register New Vendor'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Form (Scrollable body, fixed footer) */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    <IconAlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Profile Image Upload Section */}
                <div className="flex items-center gap-4 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <div className="relative w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Vendor preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <IconUser className="w-7 h-7 text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Vendor Profile Image
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileChange}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        className="hidden"
                        id="vendor-image-input"
                      />
                      <label
                        htmlFor="vendor-image-input"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0e743d] hover:bg-[#0a6032] text-white rounded-lg cursor-pointer transition-colors"
                      >
                        <IconCamera className="w-3.5 h-3.5" />
                        <span>{imagePreview ? 'Change Photo' : 'Upload Photo'}</span>
                      </label>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <IconTrash className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Saved in backend/uploads folder (PNG, JPG, max 5MB)
                    </span>
                  </div>
                </div>

                {/* Vendor Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Vendor Name / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Shyam Sundar Kirana"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>

                {/* Mobile Number (App Login ID) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Vendor Mobile Number (App Login ID) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Vendor will use this 10-digit mobile number to log in to the Mobile App.
                  </span>
                </div>

                {/* Vendor Password (Plain text set & view) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Vendor Password (For App Login) *
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      <IconBolt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Generate Password</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter login password for vendor"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showFormPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showFormPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-medium mt-1">
                    <IconLock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Readable in the Admin details modal to share directly with the vendor.</span>
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Active">Active (Permitted to Bid)</option>
                    <option value="Inactive">Inactive (Suspended)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Business / Shop Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Shop #12, Grain Market, Lucknow"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>
              </div>

              {/* Modal Footer (Fixed at bottom - Never cut off) */}
              <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0e743d] hover:bg-[#0a6032] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
