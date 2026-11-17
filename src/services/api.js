/**
 * Centralized API Client Service
 * Uses environment variable VITE_API_BASE_URL (never hardcoded)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Helper to get static file URL (for uploads) from backend
export const getFileUrl = (filePath) => {
  if (!filePath) return ''
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath
  const backendBase = API_BASE_URL.replace(/\/api\/?$/, '')
  return `${backendBase}${filePath.startsWith('/') ? filePath : `/${filePath}`}`
}

// Auth Storage Helpers
export const getStoredToken = () => localStorage.getItem('mirch_masala_admin_token')
export const setStoredToken = (token) => localStorage.setItem('mirch_masala_admin_token', token)
export const removeStoredToken = () => localStorage.removeItem('mirch_masala_admin_token')

export const getStoredAdmin = () => {
  try {
    const admin = localStorage.getItem('mirch_masala_admin_user')
    return admin ? JSON.parse(admin) : null
  } catch (err) {
    return null
  }
}
export const setStoredAdmin = (admin) =>
  localStorage.setItem('mirch_masala_admin_user', JSON.stringify(admin))
export const removeStoredAdmin = () => localStorage.removeItem('mirch_masala_admin_user')

/**
 * Universal fetch wrapper with automatic JWT Bearer header injection
 * Supports JSON and multipart/form-data (FormData)
 */
export async function fetchApi(endpoint, options = {}) {
  const token = getStoredToken()
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  let response
  try {
    response = await fetch(url, {
      ...options,
      headers
    })
  } catch (networkError) {
    throw new Error(
      `Cannot connect to backend server at ${API_BASE_URL}. Please ensure backend is running on port 5000.`
    )
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    // If unauthorized, clear stale credentials
    if (response.status === 401) {
      removeStoredToken()
      removeStoredAdmin()
    }
    const error = new Error(data.message || `Request failed with status ${response.status}`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

/**
 * Authentication & Profile API Calls
 */
export const authService = {
  // Login admin
  login: async (email, password) => {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    if (res.token) {
      setStoredToken(res.token)
    }
    if (res.data) {
      setStoredAdmin(res.data)
    }
    return res
  },

  // Register a new admin account
  register: async (adminData) => {
    return await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(adminData)
    })
  },

  // Get current admin profile
  getProfile: async () => {
    const res = await fetchApi('/auth/profile', {
      method: 'GET'
    })
    if (res.data) {
      setStoredAdmin(res.data)
    }
    return res.data
  },

  // Update profile
  updateProfile: async (profileData) => {
    const res = await fetchApi('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
    if (res.data) {
      setStoredAdmin(res.data)
    }
    return res
  },

  // Update system and email configuration settings in MongoDB
  updateSettings: async (settingsData) => {
    return await fetchApi('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    })
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return await fetchApi('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    })
  },

  // Logout admin
  logout: () => {
    removeStoredToken()
    removeStoredAdmin()
  }
}

/**
 * Vendor Management API Calls
 */
export const vendorService = {
  // Get all vendors (with optional search and status filter)
  getVendors: async (search = '', status = '') => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (status && status !== 'All') params.append('status', status)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res = await fetchApi(`/vendors${queryString}`, { method: 'GET' })
    return res.data || []
  },

  // Get single vendor
  getVendorById: async (id) => {
    const res = await fetchApi(`/vendors/${id}`, { method: 'GET' })
    return res.data
  },

  // Create new vendor (Accepts FormData or regular object)
  createVendor: async (vendorData) => {
    const isFormData = typeof FormData !== 'undefined' && vendorData instanceof FormData
    const res = await fetchApi('/vendors', {
      method: 'POST',
      body: isFormData ? vendorData : JSON.stringify(vendorData)
    })
    return res.data
  },

  // Update existing vendor (Accepts FormData or regular object)
  updateVendor: async (id, vendorData) => {
    const isFormData = typeof FormData !== 'undefined' && vendorData instanceof FormData
    const res = await fetchApi(`/vendors/${id}`, {
      method: 'PUT',
      body: isFormData ? vendorData : JSON.stringify(vendorData)
    })
    return res.data
  },

  // Delete vendor
  deleteVendor: async (id) => {
    return await fetchApi(`/vendors/${id}`, {
      method: 'DELETE'
    })
  },

  // Send single APK invite
  sendApkInvite: async (id) => {
    return await fetchApi(`/vendors/${id}/send-invite`, {
      method: 'POST'
    })
  },

  // Send bulk APK invite
  sendBulkApkInvite: async () => {
    return await fetchApi('/vendors/send-bulk-invite', {
      method: 'POST'
    })
  }
}

/**
 * Item Master (Grocery Items) API Calls
 */
export const itemService = {
  // Get grocery items with optional search, category, status, pagination
  getItems: async ({ search = '', category = '', status = '', page = 1, limit = 10, all = false } = {}) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (category && category !== 'All') params.append('category', category)
    if (status && status !== 'All') params.append('status', status)
    if (page) params.append('page', page)
    if (limit) params.append('limit', limit)
    if (all) params.append('all', 'true')

    const queryString = params.toString() ? `?${params.toString()}` : ''
    return await fetchApi(`/items${queryString}`, { method: 'GET' })
  },

  // Get single item by ID
  getItemById: async (id) => {
    const res = await fetchApi(`/items/${id}`, { method: 'GET' })
    return res.data
  },

  // Create new grocery item
  createItem: async (itemData) => {
    const res = await fetchApi('/items', {
      method: 'POST',
      body: JSON.stringify(itemData)
    })
    return res.data
  },

  // Update existing grocery item
  updateItem: async (id, itemData) => {
    const res = await fetchApi(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    })
    return res.data
  },

  // Delete grocery item
  deleteItem: async (id) => {
    return await fetchApi(`/items/${id}`, {
      method: 'DELETE'
    })
  },

  // Bulk import items from Excel / CSV parsed rows
  bulkImport: async (itemsArray) => {
    return await fetchApi('/items/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ items: itemsArray })
    })
  },

  // Seed default master items list
  seedDefaultItems: async () => {
    return await fetchApi('/items/seed', {
      method: 'POST'
    })
  }
}

/**
 * Demand & Bidding Management API Calls
 */
export const demandService = {
  // Get currently active demand
  getActiveDemand: async () => {
    const res = await fetchApi('/demands/active', { method: 'GET' })
    return res.data
  },

  // Get all demands
  getDemands: async () => {
    const res = await fetchApi('/demands', { method: 'GET' })
    return res.data || []
  },

  // Get single demand by ID
  getDemandById: async (id) => {
    const res = await fetchApi(`/demands/${id}`, { method: 'GET' })
    return res.data
  },

  // Create new demand with items and duration (default 48h)
  createDemand: async (demandData) => {
    return await fetchApi('/demands', {
      method: 'POST',
      body: JSON.stringify(demandData)
    })
  },

  // Get submissions and pending vendors for a demand
  getSubmissions: async (demandId) => {
    return await fetchApi(`/demands/${demandId}/submissions`, { method: 'GET' })
  },

  // Send bidding reminder to single vendor
  sendReminder: async (demandId, vendorId) => {
    return await fetchApi(`/demands/${demandId}/remind/${vendorId}`, {
      method: 'POST'
    })
  },

  // Send bidding reminder to all pending vendors
  sendBulkReminder: async (demandId) => {
    return await fetchApi(`/demands/${demandId}/remind-all`, {
      method: 'POST'
    })
  },

  // Manually close demand bidding
  closeBidding: async (demandId) => {
    return await fetchApi(`/demands/${demandId}/close`, {
      method: 'PUT'
    })
  },

  // Delete demand
  deleteDemand: async (demandId) => {
    return await fetchApi(`/demands/${demandId}`, {
      method: 'DELETE'
    })
  }
}

/**
 * Quotation & Bidding Matrix API Calls
 */
export const quotationService = {
  // Get all quotations
  getQuotations: async () => {
    const res = await fetchApi('/quotations', { method: 'GET' })
    return res.data || []
  },

  // Get quotations for a specific demand
  getQuotationsByDemand: async (demandId) => {
    const res = await fetchApi(`/quotations/demand/${demandId}`, { method: 'GET' })
    return res.data || []
  },

  // Get side-by-side comparison matrix with L1/L2 ranks & savings
  getComparisonMatrix: async (demandId) => {
    return await fetchApi(`/quotations/compare/${demandId}`, { method: 'GET' })
  },

  // Submit or update quotation
  submitQuotation: async (quotationData) => {
    return await fetchApi('/quotations/submit', {
      method: 'POST',
      body: JSON.stringify(quotationData)
    })
  },

  // Delete a quotation
  deleteQuotation: async (id) => {
    return await fetchApi(`/quotations/${id}`, {
      method: 'DELETE'
    })
  }
}

/**
 * Order Allocation & Purchase Orders API Calls
 */
export const allocationService = {
  // Get allocation preview with auto L1 calculation
  getAllocationPreview: async (demandId) => {
    return await fetchApi(`/allocations/preview/${demandId}`, { method: 'GET' })
  },

  // Confirm allocations and create official Orders
  confirmAllocations: async (demandId, allocations = null) => {
    return await fetchApi(`/allocations/confirm/${demandId}`, {
      method: 'POST',
      body: JSON.stringify({ allocations })
    })
  },

  // Dispatch Purchase Orders via Email
  dispatchPurchaseOrders: async (demandId) => {
    return await fetchApi(`/allocations/dispatch/${demandId}`, {
      method: 'POST'
    })
  },

  // Get orders for a demand
  getOrdersByDemand: async (demandId) => {
    const res = await fetchApi(`/allocations/${demandId}`, { method: 'GET' })
    return res.data || []
  }
}

/**
 * Analytics & Reports API Calls
 */
export const reportService = {
  // Get Real-time Dashboard Overview Data
  getDashboardOverview: async () => {
    return await fetchApi('/reports/dashboard-overview', { method: 'GET' })
  },

  // Get Demand Summary Report
  getDemandSummary: async (range = 'all') => {
    return await fetchApi(`/reports/demand-summary?range=${range}`, { method: 'GET' })
  },

  // Get Vendor Performance Report
  getVendorPerformance: async (range = 'all') => {
    return await fetchApi(`/reports/vendor-performance?range=${range}`, { method: 'GET' })
  },

  // Get Item-wise Rates Report
  getItemRates: async (range = 'all') => {
    return await fetchApi(`/reports/item-rates?range=${range}`, { method: 'GET' })
  }
}

/**
 * Email & Notification Logs API Calls
 */
export const emailLogService = {
  // Get all email logs with optional search and type filter
  getEmailLogs: async ({ search = '', emailType = '', status = '' } = {}) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (emailType && emailType !== 'All') params.append('emailType', emailType)
    if (status && status !== 'All') params.append('status', status)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res = await fetchApi(`/email-logs${queryString}`, { method: 'GET' })
    return res.data || []
  },

  // Get single email log details
  getEmailLogById: async (id) => {
    const res = await fetchApi(`/email-logs/${id}`, { method: 'GET' })
    return res.data
  },

  // Resend email
  resendEmail: async (id) => {
    return await fetchApi(`/email-logs/${id}/resend`, { method: 'POST' })
  },

  // Delete email log
  deleteEmailLog: async (id) => {
    return await fetchApi(`/email-logs/${id}`, { method: 'DELETE' })
  }
}

/**
 * Push Notification System API Calls
 */
export const notificationService = {
  getNotifications: async (page = 1, limit = 20) => {
    return await fetchApi(`/notifications?page=${page}&limit=${limit}`, { method: 'GET' })
  },
  getStatus: async () => {
    return await fetchApi('/notifications/status', { method: 'GET' })
  },
  broadcastNotification: async (payload) => {
    return await fetchApi('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }
}

export default {
  authService,
  vendorService,
  itemService,
  demandService,
  quotationService,
  allocationService,
  reportService,
  emailLogService,
  notificationService,
  getFileUrl
}
