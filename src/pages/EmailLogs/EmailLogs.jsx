import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { emailLogService } from '../../services/api'
import { TableSkeleton } from '../../components/common/Skeleton'

export default function EmailLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedLog, setSelectedLog] = useState(null)
  const [resending, setResending] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const emailTypes = [
    'All',
    'Demand Notification',
    'Purchase Order',
    'Bidding Reminder',
    'APK App Invite',
    'Bidding Outcome'
  ]

  useEffect(() => {
    loadLogs()
  }, [selectedType])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const data = await emailLogService.getEmailLogs({
        search: searchQuery,
        emailType: selectedType
      })
      setLogs(data || [])
    } catch (err) {
      console.error('Failed to load email logs:', err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  // Handle live search on Enter or debounced
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadLogs()
  }

  // Resend email action
  const handleResendEmail = async (id) => {
    try {
      setResending(true)
      const res = await emailLogService.resendEmail(id)
      if (res.success && res.data) {
        setSelectedLog(res.data)
        showToast(res.message || 'Email re-dispatched successfully!')
        loadLogs()
      }
    } catch (err) {
      showToast(`Error resending email: ${err.message}`)
    } finally {
      setResending(false)
    }
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Clean date formatter: e.g. "17 Nov 2026"
  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Clean time formatter: e.g. "12:06 PM"
  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase()
  }

  // Full timestamp for modal
  const formatFullDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${formatDateOnly(d)}, ${formatTimeOnly(d)}`
  }

  // Filter in-memory for instant responsive typing
  const filteredLogs = logs.filter((log) => {
    const term = searchQuery.toLowerCase()
    return (
      (log.demandCode && log.demandCode.toLowerCase().includes(term)) ||
      (log.vendorName && log.vendorName.toLowerCase().includes(term)) ||
      (log.vendorEmail && log.vendorEmail.toLowerCase().includes(term)) ||
      (log.emailType && log.emailType.toLowerCase().includes(term)) ||
      (log.subject && log.subject.toLowerCase().includes(term))
    )
  })

  // Badge color helper for emailType
  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'Demand Notification':
        return 'bg-emerald-50 text-[#0e743d] border border-emerald-200'
      case 'Purchase Order':
        return 'bg-blue-50 text-blue-700 border border-blue-200'
      case 'Bidding Reminder':
        return 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'APK App Invite':
        return 'bg-teal-50 text-teal-700 border border-teal-200'
      case 'Bidding Outcome':
        return 'bg-purple-50 text-purple-700 border border-purple-200'
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200'
    }
  }

  // Quick metrics counts
  const totalEmailsCount = logs.length
  const demandNotifsCount = logs.filter((l) => l.emailType === 'Demand Notification').length
  const purchaseOrdersCount = logs.filter((l) => l.emailType === 'Purchase Order').length
  const remindersCount = logs.filter((l) => l.emailType === 'Bidding Reminder').length

  return (
    <div className="space-y-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[10000] flex items-center gap-3 bg-[#0e743d] text-white px-5 py-3 rounded-xl shadow-lg border border-emerald-400/30 animate-in slide-in-from-top-3 duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Logs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Emails</div>
            <div className="text-lg font-bold text-slate-900">{totalEmailsCount}</div>
          </div>
        </div>

        {/* KPI 2: Demand Notifications */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#0e743d] flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Demand Alerts</div>
            <div className="text-lg font-bold text-[#0e743d]">{demandNotifsCount}</div>
          </div>
        </div>

        {/* KPI 3: Purchase Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Purchase Orders</div>
            <div className="text-lg font-bold text-blue-700">{purchaseOrdersCount}</div>
          </div>
        </div>

        {/* KPI 4: Bidding Reminders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Reminders Sent</div>
            <div className="text-lg font-bold text-amber-700">{remindersCount}</div>
          </div>
        </div>
      </div>

      {/* Top Bar: Search Controls & Type Filter Pills */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:max-w-md">
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
            placeholder="Search by Demand Code, Vendor, or Subject..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
          />
        </form>

        {/* Email Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {emailTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === type
                  ? 'bg-[#0e743d] text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'All' ? 'All Logs' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Loading, Empty State or Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs p-4 overflow-hidden">
          <TableSkeleton rows={6} cols={8} />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 sm:p-12 text-center max-w-xl mx-auto my-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0e743d] flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-800">
              No Email Communication Logs Found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No email records matched "${searchQuery}". Try clearing search.`
                : 'No outgoing vendor notifications or emails have been logged yet.'}
            </p>
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedType('All')
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : (
        /* Email Logs Table: Clean, Structured & Overflow-Proof */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider bg-slate-50/75">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-5 whitespace-nowrap min-w-[110px]">Demand ID</th>
                  <th className="py-3.5 px-5 whitespace-nowrap min-w-[190px]">Vendor Details</th>
                  <th className="py-3.5 px-5 whitespace-nowrap min-w-[160px]">Email Type</th>
                  <th className="py-3.5 px-5 min-w-[260px]">Subject</th>
                  <th className="py-3.5 px-5 whitespace-nowrap min-w-[140px]">Sent On</th>
                  <th className="py-3.5 px-5 text-center whitespace-nowrap min-w-[100px]">Status</th>
                  <th className="py-3.5 px-5 text-center whitespace-nowrap min-w-[110px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLogs.map((log, idx) => (
                  <tr
                    key={log._id || idx}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Demand ID: Non-wrapping clean badge */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200/80 tracking-wide">
                        {log.demandCode || 'General'}
                      </span>
                    </td>

                    {/* Vendor Name & Email: Distinct hierarchy */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-[13.5px]">
                        {log.vendorName || 'Vendor'}
                      </div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect width="20" height="16" x="2" y="4" rx="2" strokeWidth="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" strokeWidth="2" />
                        </svg>
                        <span>{log.vendorEmail}</span>
                      </div>
                    </td>

                    {/* Email Type: Clean colored pill badge */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getTypeBadgeClass(
                          log.emailType
                        )}`}
                      >
                        {log.emailType}
                      </span>
                    </td>

                    {/* Subject: Readable with ellipsis & tooltip */}
                    <td className="py-3.5 px-5">
                      <div
                        className="text-xs font-medium text-slate-700 max-w-xs xl:max-w-md truncate leading-relaxed"
                        title={log.subject}
                      >
                        {log.subject}
                      </div>
                    </td>

                    {/* Sent On: Date on top, exact Time below (Zero awkward multi-line break) */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-700">
                        {formatDateOnly(log.sentAt || log.createdAt)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <polyline points="12 6 12 12 16 14" strokeWidth="2" />
                        </svg>
                        <span>{formatTimeOnly(log.sentAt || log.createdAt)}</span>
                      </div>
                    </td>

                    {/* Status Badge: Sent / Delivered with indicator dot */}
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {log.status || 'Sent'}
                      </span>
                    </td>

                    {/* Action: View Email */}
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0e743d] hover:bg-emerald-50 border border-emerald-300 transition-all hover:shadow-xs cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>View Email</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{filteredLogs.length}</strong> of{' '}
              <strong className="text-slate-800">{logs.length}</strong> logged emails
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Mirch Masala Automated Email Dispatch Tracker
            </span>
          </div>
        </div>
      )}

      {/* Email Details Preview Modal */}
      {selectedLog &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-5 animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getTypeBadgeClass(
                      selectedLog.emailType
                    )}`}
                  >
                    {selectedLog.emailType}
                  </span>
                  <h3 className="text-base font-bold text-slate-800">
                    Email Dispatch Record
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Email Metadata Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-500 font-semibold">Recipient Vendor:</span>
                  <span className="font-bold text-slate-800">
                    {selectedLog.vendorName} &lt;{selectedLog.vendorEmail}&gt;
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-500 font-semibold">Sender:</span>
                  <span className="font-medium text-slate-700">
                    Mirch Masala Grocery Shop &lt;orders@mirchmasala.com&gt;
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-500 font-semibold">Reference Demand:</span>
                  <span className="font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedLog.demandCode || 'General'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-500 font-semibold">Dispatch Time:</span>
                  <span className="font-medium text-slate-700">
                    {formatFullDate(selectedLog.sentAt || selectedLog.createdAt)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-500 font-semibold">Delivery Status:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf8f0] text-[#1bb062]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1bb062]"></span>
                    {selectedLog.status || 'Sent'}
                  </span>
                </div>
              </div>

              {/* Subject & Body */}
              <div className="flex-1 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-4 bg-white">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Subject:</p>
                <p className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  {selectedLog.subject}
                </p>

                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider pt-2">Message Body:</p>
                <div className="p-3.5 bg-slate-50 rounded-lg text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed border border-slate-200/70">
                  {selectedLog.content}
                </div>
              </div>

              {/* Modal Footer: Resend & Close */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  disabled={resending}
                  onClick={() => handleResendEmail(selectedLog._id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0e743d] border border-emerald-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {resending ? (
                    <div className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                  )}
                  <span>{resending ? 'Resending...' : 'Resend Email to Vendor'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
