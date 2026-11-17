import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { demandService } from '../../services/api'
import { TableSkeleton } from '../../components/common/Skeleton'
import { confirmGenericAction } from '../../utils/swal'

export default function ActiveDemand({
  demand,
  onSwitchToCreate,
  onRefreshDemand,
  allDemands = [],
  onSelectDemand
}) {
  const [activeSubTab, setActiveSubTab] = useState('items') // 'items' | 'submissions'
  const [submissionFilter, setSubmissionFilter] = useState('submitted') // 'submitted' | 'pending'
  const [reminderToast, setReminderToast] = useState(null)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  // Submissions and pending vendors data
  const [submissionsData, setSubmissionsData] = useState({
    submissions: [],
    pendingVendors: [],
    counts: { totalVendors: 0, submittedCount: 0, pendingCount: 0 }
  })

  // Quotation detail modal
  const [selectedQuote, setSelectedQuote] = useState(null)

  // Early close confirm modal
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closingBidding, setClosingBidding] = useState(false)

  // Real-time Countdown timer
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  })

  // Update countdown timer based on actual demand deadlineAt
  useEffect(() => {
    if (!demand?.deadlineAt) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true })
      return
    }

    const calculateTimeLeft = () => {
      const deadline = new Date(demand.deadlineAt).getTime()
      const now = Date.now()
      const diff = deadline - now

      if (diff <= 0 || demand.status !== 'Active') {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true })
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds, isExpired: false })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [demand])

  // Fetch submissions and pending vendors whenever demand changes
  useEffect(() => {
    if (demand?._id) {
      loadSubmissions(demand._id)
    }
  }, [demand?._id])

  const loadSubmissions = async (demandId) => {
    try {
      setLoadingSubmissions(true)
      const res = await demandService.getSubmissions(demandId)
      if (res.success) {
        setSubmissionsData({
          submissions: res.submissions || [],
          pendingVendors: res.pendingVendors || [],
          counts: res.counts || { totalVendors: 0, submittedCount: 0, pendingCount: 0 }
        })
      }
    } catch (err) {
      console.error('Failed to load submissions:', err)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  // Handle single vendor reminder
  const handleSendReminder = async (vendorId, vendorName) => {
    if (!demand?._id) return
    try {
      await demandService.sendReminder(demand._id, vendorId)
      setSubmissionsData((prev) => ({
        ...prev,
        pendingVendors: prev.pendingVendors.map((v) =>
          v.id === vendorId ? { ...v, reminded: true } : v
        )
      }))
      showToast(`48h Bidding reminder sent to ${vendorName}!`)
    } catch (err) {
      showToast(`Failed to send reminder: ${err.message}`)
    }
  }

  // Handle bulk reminder
  const handleSendBulkReminder = async () => {
    if (!demand?._id) return
    try {
      await demandService.sendBulkReminder(demand._id)
      setSubmissionsData((prev) => ({
        ...prev,
        pendingVendors: prev.pendingVendors.map((v) => ({ ...v, reminded: true }))
      }))
      showToast(`48-Hour Bidding reminder dispatched to all ${submissionsData.pendingVendors.length} pending vendors!`)
    } catch (err) {
      showToast(`Failed to send bulk reminder: ${err.message}`)
    }
  }

  // Handle close bidding early with SweetAlert confirmation
  const handleCloseBiddingClick = async () => {
    if (!demand?._id) return
    const isConfirmed = await confirmGenericAction({
      title: `Close Bidding for ${demand.demandCode}?`,
      text: 'Are you sure you want to close the 48-hour bidding window early? No further vendor quotes will be accepted for this demand.',
      confirmButtonText: 'Yes, Close Bidding',
      cancelButtonText: 'Keep Open',
      isDanger: true
    })
    if (!isConfirmed) return

    try {
      setClosingBidding(true)
      await demandService.closeBidding(demand._id)
      showToast(`Bidding for ${demand.demandCode} has been closed early.`)
      if (onRefreshDemand) {
        onRefreshDemand()
      }
    } catch (err) {
      showToast(`Error closing bidding: ${err.message}`)
    } finally {
      setClosingBidding(false)
    }
  }

  // Handle close bidding early
  const handleConfirmCloseBidding = async () => {
    if (!demand?._id) return
    try {
      setClosingBidding(true)
      await demandService.closeBidding(demand._id)
      setShowCloseModal(false)
      showToast(`Bidding for ${demand.demandCode} has been closed early.`)
      if (onRefreshDemand) {
        onRefreshDemand()
      }
    } catch (err) {
      showToast(`Error closing bidding: ${err.message}`)
    } finally {
      setClosingBidding(false)
    }
  }

  const showToast = (msg) => {
    setReminderToast(msg)
    setTimeout(() => setReminderToast(null), 3500)
  }

  const formatNumber = (num) => String(num).padStart(2, '0')

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // If no demand is loaded or DB has zero demands:
  if (!demand) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#0e743d] flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            No Active Demand Currently Running
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            There is currently no active grocery demand with open bidding. Create a new demand to broadcast required items to your registered vendors and initiate the 48-hour live countdown.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onSwitchToCreate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0e743d] hover:bg-[#0a6032] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <span className="text-lg leading-none font-bold">+</span>
            <span>Create First Demand</span>
          </button>
        </div>

        {allDemands && allDemands.length > 0 && (
          <div className="pt-6 border-t border-slate-100 text-left">
            <p className="text-xs font-semibold text-slate-500 mb-2">Or view past demand history:</p>
            <div className="flex flex-wrap gap-2">
              {allDemands.map((d) => (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => onSelectDemand && onSelectDemand(d._id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-[#0e743d] transition-all bg-slate-50/50 cursor-pointer"
                >
                  {d.demandCode} ({d.status})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const items = demand.items || []
  const submissions = submissionsData.submissions || []
  const pendingVendors = submissionsData.pendingVendors || []
  const totalVendors = submissionsData.counts?.totalVendors || (submissions.length + pendingVendors.length)

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {reminderToast && (
        <div className="fixed top-6 right-6 z-[10000] flex items-center gap-3 bg-[#0e743d] text-white px-5 py-3 rounded-xl shadow-lg border border-emerald-400/30 animate-in slide-in-from-top-3 duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="text-sm font-semibold">{reminderToast}</span>
        </div>
      )}

      {/* Top Demand Header Info & Switchers */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Demand Details: {demand.demandCode}
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              demand.status === 'Active'
                ? 'bg-[#eaf8f0] text-[#1bb062]'
                : demand.status === 'Bidding_Closed'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {demand.status === 'Active' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
            {demand.status === 'Active' ? 'Active' : demand.status.replace('_', ' ')}
          </span>
        </div>

        {/* Action Buttons: History Switcher + Close Bidding + Create New */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {allDemands && allDemands.length > 1 && (
            <select
              value={demand._id}
              onChange={(e) => onSelectDemand && onSelectDemand(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              {allDemands.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.demandCode} - {d.status} ({d.items?.length || 0} items)
                </option>
              ))}
            </select>
          )}

          {demand.status === 'Active' && (
            <button
              type="button"
              onClick={handleCloseBiddingClick}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 shadow-xs transition-all cursor-pointer"
            >
              Close Bidding Early
            </button>
          )}

          {onSwitchToCreate && (
            <button
              type="button"
              onClick={onSwitchToCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#0e743d] hover:bg-[#0a6032] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <span>+ Create New Demand</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 2 Cards: Countdown Timer & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Card: Countdown Timer */}
        <div className={`lg:col-span-7 rounded-2xl p-6 sm:p-7 flex items-center justify-center gap-6 sm:gap-8 shadow-sm border ${
          timeLeft.isExpired
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-[#f0fbf5] border-emerald-200/70'
        }`}>
          {/* Clock Icon */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
            timeLeft.isExpired
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-[#0e743d]'
          }`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          {/* Time digits & labels */}
          <div className="text-center sm:text-left">
            <p className={`text-xs sm:text-sm font-semibold mb-1 ${
              timeLeft.isExpired ? 'text-amber-800' : 'text-[#0e743d]'
            }`}>
              {timeLeft.isExpired ? 'Bidding Window Status' : 'Time Remaining'}
            </p>

            {timeLeft.isExpired ? (
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Bidding Closed
              </div>
            ) : (
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-wider font-mono">
                {formatNumber(timeLeft.hours)} : {formatNumber(timeLeft.minutes)} : {formatNumber(timeLeft.seconds)}
              </div>
            )}

            {!timeLeft.isExpired && (
              <div className="flex items-center justify-between sm:justify-start gap-6 sm:gap-8 text-[11px] font-medium text-slate-500 mt-1 pl-1">
                <span>Hours</span>
                <span>Minutes</span>
                <span>Seconds</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Metadata (Published On & Deadline) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-center gap-4 shadow-sm">
          
          {/* Published On */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
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
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Published On</p>
              <p className="text-sm font-bold text-slate-800">
                {formatDate(demand.publishedAt)}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Deadline */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Deadline</p>
              <p className="text-sm font-bold text-slate-800">
                {formatDate(demand.deadlineAt)}
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Tabs Row: Items (count) | Vendor Submissions (submitted/total) */}
      <div className="border-b border-slate-200 flex items-center gap-6 pt-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('items')}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeSubTab === 'items'
              ? 'text-[#0e743d]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Items ({items.length})
          {activeSubTab === 'items' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0e743d] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('submissions')}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeSubTab === 'submissions'
              ? 'text-[#0e743d]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Vendor Submissions ({submissions.length}/{totalVendors})
          {activeSubTab === 'submissions' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0e743d] rounded-full" />
          )}
        </button>
      </div>

      {/* SubTab 1: Items Table View */}
      {activeSubTab === 'items' && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-800 text-[13.5px] font-bold">
                  <th className="py-4 px-6 w-16">#</th>
                  <th className="py-4 px-6">Item Name</th>
                  <th className="py-4 px-6 w-36">Unit</th>
                  <th className="py-4 px-6 w-48">Demand Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.length > 0 ? (
                  items.map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* Index */}
                      <td className="py-4 px-6 font-medium text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Item Name */}
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {item.name}
                      </td>

                      {/* Unit */}
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                          {item.unit}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {item.quantity} {item.unit}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 text-sm">
                      No items attached to this demand.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 2: Vendor Submissions & Pending Reminders */}
      {activeSubTab === 'submissions' && (
        <div className="space-y-4">
          
          {/* Sub-Filter Switcher & Bulk Reminder */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setSubmissionFilter('submitted')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  submissionFilter === 'submitted'
                    ? 'bg-white text-[#0e743d] font-bold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Submitted Quotes ({submissions.length})
              </button>
              <button
                type="button"
                onClick={() => setSubmissionFilter('pending')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  submissionFilter === 'pending'
                    ? 'bg-white text-rose-700 font-bold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Pending Quotes ({pendingVendors.length} Vendors)
              </button>
            </div>

            {submissionFilter === 'pending' && pendingVendors.length > 0 && (
              <button
                type="button"
                onClick={handleSendBulkReminder}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 11 18-5-5 18-3-7-10-6Z" />
                </svg>
                <span>Send 48h Reminder to All Pending Vendors</span>
              </button>
            )}
          </div>

          {/* Submitted Quotes View */}
          {submissionFilter === 'submitted' && (
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-800 text-[13.5px] font-bold">
                      <th className="py-4 px-6 w-16">#</th>
                      <th className="py-4 px-6">Vendor Name</th>
                      <th className="py-4 px-6">Submitted Time</th>
                      <th className="py-4 px-6">Total Quote</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-center w-32">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loadingSubmissions ? (
                      <tr>
                        <td colSpan="6" className="p-0">
                          <TableSkeleton rows={4} cols={6} />
                        </td>
                      </tr>
                    ) : submissions.length > 0 ? (
                      submissions.map((sub, idx) => (
                        <tr key={sub.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6 font-medium text-slate-500">{idx + 1}</td>
                          <td className="py-4 px-6">
                            <p className="font-semibold text-slate-800">{sub.vendor}</p>
                            <p className="text-xs text-slate-400">{sub.email}</p>
                          </td>
                          <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                            {formatDate(sub.time)}
                          </td>
                          <td className="py-4 px-6 font-bold text-emerald-700">
                            ₹{Number(sub.totalQuote || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-[#0e743d]">
                              {sub.status || 'Submitted'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedQuote(sub)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0e743d] hover:bg-emerald-50 border border-emerald-300 transition-colors cursor-pointer"
                            >
                              View Rates
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                            </div>
                            <p className="text-sm font-bold text-slate-700">No quotes submitted yet</p>
                            <p className="text-xs text-slate-400">
                              Waiting for vendors to submit rates via the Mobile App during this 48-hour bidding window.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Quotes View */}
          {submissionFilter === 'pending' && (
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-800 text-[13.5px] font-bold">
                      <th className="py-4 px-6 w-16">#</th>
                      <th className="py-4 px-6">Vendor Name</th>
                      <th className="py-4 px-6">Contact Email & Phone</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-center w-36">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loadingSubmissions ? (
                      <tr>
                        <td colSpan="5" className="p-0">
                          <TableSkeleton rows={4} cols={5} />
                        </td>
                      </tr>
                    ) : pendingVendors.length > 0 ? (
                      pendingVendors.map((vendor, idx) => (
                        <tr key={vendor.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6 font-medium text-slate-500">{idx + 1}</td>
                          <td className="py-4 px-6 font-semibold text-slate-800">
                            {vendor.vendor}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-600">
                            <p className="font-medium text-slate-800">{vendor.email}</p>
                            <p className="text-slate-400">{vendor.phone || 'No phone set'}</p>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Awaiting Bid
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              type="button"
                              onClick={() => handleSendReminder(vendor.id, vendor.vendor)}
                              disabled={vendor.reminded}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                vendor.reminded
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-emerald-50 text-[#0e743d] hover:bg-emerald-100 border border-emerald-300'
                              }`}
                            >
                              {vendor.reminded ? 'Reminded ✓' : 'Send Reminder'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0e743d] flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <p className="text-sm font-bold text-slate-800">All vendors have responded!</p>
                            <p className="text-xs text-slate-400">
                              There are no pending registered vendors waiting to bid on this demand.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Quote Rates Detail Modal (Mounted via Portal, z-[9999], bg-black/65, zero blur) */}
      {selectedQuote &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-5 animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Quotation Rates: {selectedQuote.vendor}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Submitted: {formatDate(selectedQuote.time)} • {selectedQuote.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuote(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Quoted Items Table */}
              <div className="overflow-y-auto flex-1 border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-xs font-bold text-slate-700">
                    <tr>
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Required Qty</th>
                      <th className="py-3 px-4">Quoted Rate</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedQuote.quotedItems && selectedQuote.quotedItems.length > 0 ? (
                      selectedQuote.quotedItems.map((item, idx) => {
                        const subtotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0)
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                            <td className="py-3 px-4 text-slate-600">{item.unit}</td>
                            <td className="py-3 px-4 font-medium text-slate-800">{item.quantity}</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">₹{item.rate}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              ₹{subtotal.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-400 text-xs">
                          No item breakdowns available for this quotation.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Summary Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
                <div className="text-xs text-slate-500">
                  Total Items Quoted: <strong>{selectedQuote.quotedItems?.length || 0}</strong>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">Total Quote Amount:</span>
                  <span className="text-xl font-extrabold text-[#0e743d]">
                    ₹{Number(selectedQuote.totalQuote || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Close Bidding Confirmation Modal */}
      {showCloseModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Close Bidding Window Early?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to end bidding for <strong>{demand.demandCode}</strong>? Vendors will no longer be able to submit rates, and the status will change to <em>Bidding Closed</em>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={closingBidding}
                  onClick={handleConfirmCloseBidding}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {closingBidding && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Yes, Close Bidding</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

    </div>
  )
}
