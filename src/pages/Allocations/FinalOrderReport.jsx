import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { allocationService } from '../../services/api'
import { confirmGenericAction } from '../../utils/swal'

export default function FinalOrderReport({
  demand,
  stats,
  vendorAllocations = [],
  allocatedItems = [],
  isFinalized = false,
  onBackToResult,
  onRefresh
}) {
  const [activeViewMode, setActiveViewMode] = useState('vendor') // 'vendor' | 'items'
  const [selectedVendorForQuotation, setSelectedVendorForQuotation] = useState(null)
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false)
  const [dispatchStatus, setDispatchStatus] = useState('')
  const [confirmToast, setConfirmToast] = useState(null)
  const [confirmingOrder, setConfirmingOrder] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleDownloadPDF = () => {
    window.print()
  }

  // Confirm & Approve Orders in MongoDB with SweetAlert
  const handleConfirmOrderWithSwal = async () => {
    if (!demand?._id) return
    const isConfirmed = await confirmGenericAction({
      title: `Confirm & Approve Purchase Order (${demand?.demandCode || ''})?`,
      text: `Are you sure you want to finalize allocations for ₹${grandTotal.toLocaleString('en-IN')} across ${winningVendors.length} winning vendor(s)? This will lock the orders and prepare them for dispatch to vendor mobile app.`,
      confirmButtonText: 'Yes, Confirm & Approve',
      cancelButtonText: 'Review More'
    })
    if (!isConfirmed) return
    handleConfirmApprove()
  }

  // Confirm & Approve Orders in MongoDB
  const handleConfirmApprove = async () => {
    if (!demand?._id) return
    try {
      setConfirmingOrder(true)
      await allocationService.confirmAllocations(demand._id)
      setShowConfirmModal(false)
      showToast('Order Confirmed! Purchase Orders generated and winning vendors marked "Approved" in MongoDB.')
      if (onRefresh) onRefresh()
    } catch (err) {
      showToast(`Error confirming order: ${err.message}`)
    } finally {
      setConfirmingOrder(false)
    }
  }

  // Dispatch Purchase Orders to Vendors
  const handleDispatchOrders = async (e) => {
    e.preventDefault()
    if (!demand?._id) return
    try {
      setDispatchStatus('sending')
      await allocationService.dispatchPurchaseOrders(demand._id)
      setDispatchStatus('sent')
      setTimeout(() => {
        setIsDispatchModalOpen(false)
        setDispatchStatus('')
        showToast('Official Purchase Orders dispatched to all winning vendors!')
        if (onRefresh) onRefresh()
      }, 700)
    } catch (err) {
      setDispatchStatus('')
      showToast(`Error dispatching orders: ${err.message}`)
    }
  }

  const showToast = (msg) => {
    setConfirmToast(msg)
    setTimeout(() => setConfirmToast(null), 3500)
  }

  // Winning vendors who won at least 1 item
  const winningVendors = vendorAllocations.filter((v) => v.isWinner && v.itemsAllocatedCount > 0)
  const nonWinningVendors = vendorAllocations.filter((v) => !v.isWinner || v.itemsAllocatedCount === 0)

  const grandTotal = allocatedItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0)

  // Get itemized list for a specific vendor
  const getVendorItems = (v) => {
    if (!v) return []
    if (v.items && v.items.length > 0) {
      return v.items.map((it, idx) => ({
        id: it._id || it.id || idx,
        name: it.name,
        unit: it.unit || 'KG',
        quantity: it.quantity,
        rate: Number(it.rate || it.allocatedRate || 0),
        subtotal: Number(it.subtotal || it.itemTotal || ((it.quantity || 1) * (it.rate || 0)))
      }))
    }
    // Fallback: match from allocatedItems array
    return allocatedItems
      .filter(
        (it) =>
          it.vendor === v.name ||
          (it.vendorId && String(it.vendorId) === String(v.id || v.vendorId))
      )
      .map((it, idx) => ({
        id: it.id || idx,
        name: it.name,
        unit: it.unit,
        quantity: it.quantity,
        rate: Number(it.rate || 0),
        subtotal: Number(it.total || 0)
      }))
  }

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {confirmToast && (
        <div className="fixed top-6 right-6 z-[10000] flex items-center gap-3 bg-[#0e743d] text-white px-5 py-3 rounded-xl shadow-lg border border-emerald-400/30 animate-in slide-in-from-top-3 duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-sm font-semibold">{confirmToast}</span>
        </div>
      )}

      {/* Top Actions: Back Link, Status Badge & Action Buttons */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Left Sub-Header / Back Option & Status Badge */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            {onBackToResult && (
              <button
                type="button"
                onClick={onBackToResult}
                className="text-xs font-semibold text-[#0e743d] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <span>‹ Back to Allocation Result</span>
              </button>
            )}
            <span
              className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold ${
                isFinalized
                  ? 'bg-emerald-100 text-[#0e743d]'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isFinalized ? 'Confirmed & Locked' : 'Review & Pending Approval'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Confirmed Purchase Orders ready for dispatch and vendor app synchronization ({demand?.demandCode || 'Demand'})
          </p>
        </div>

        {/* Right Buttons: Download PDF, Confirm Order, Send Email */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          
          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-sm rounded-xl shadow-xs transition-all duration-150 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download PDF</span>
          </button>

          {/* Confirm & Approve Order Button */}
          <button
            type="button"
            disabled={isFinalized || winningVendors.length === 0}
            onClick={handleConfirmOrderWithSwal}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 cursor-pointer ${
              isFinalized
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <span>{isFinalized ? '✓ Order Confirmed' : 'Confirm & Approve Order'}</span>
          </button>

          {/* Dispatch Orders Button */}
          <button
            type="button"
            onClick={() => setIsDispatchModalOpen(true)}
            disabled={winningVendors.length === 0}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0e743d] hover:bg-[#0a6032] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 cursor-pointer ${
              winningVendors.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
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
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <span>Dispatch Orders</span>
          </button>
        </div>
      </div>

      {/* Main Table Card with View Switcher (Vendor Summary vs All Items) */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        
        {/* Card Header Toolbar with View Mode Switcher */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Allocated Purchase Orders
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {winningVendors.length} vendor{winningVendors.length === 1 ? '' : 's'} allocated across {allocatedItems.length} items • Total PO Value: <strong className="text-[#0e743d]">₹{grandTotal.toLocaleString('en-IN')}</strong>
            </p>
          </div>

          {/* View Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveViewMode('vendor')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeViewMode === 'vendor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏢 By Vendor</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeViewMode === 'vendor' ? 'bg-emerald-100 text-[#0e743d]' : 'bg-slate-200 text-slate-600'
              }`}>
                {winningVendors.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('items')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeViewMode === 'items'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📦 All Items</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeViewMode === 'items' ? 'bg-emerald-100 text-[#0e743d]' : 'bg-slate-200 text-slate-600'
              }`}>
                {allocatedItems.length}
              </span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Vendor Summary (ONE ROW PER VENDOR with "View Quotation" Button) */}
        {activeViewMode === 'vendor' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-800 text-[13.5px] font-bold bg-slate-50/50">
                  <th className="py-4 px-6 w-14">#</th>
                  <th className="py-4 px-6">Vendor Name & Contact</th>
                  <th className="py-4 px-6 text-center">Allocated Items</th>
                  <th className="py-4 px-6 text-right">Total Purchase Order</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {winningVendors.length > 0 ? (
                  winningVendors.map((v, idx) => {
                    const initials = v.name
                      ? v.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'VN'
                    const totalVal = Number(v.totalAmount || 0)

                    return (
                      <tr key={v.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        {/* Serial Number */}
                        <td className="py-4 px-6 font-medium text-slate-500">
                          {idx + 1}
                        </td>

                        {/* Vendor Profile & Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0e743d] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{v.name}</p>
                              <p className="text-xs text-slate-500 font-mono">{v.phone || 'Approved Vendor'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Items Won Badge */}
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-[#0e743d] border border-emerald-200">
                            Won {v.itemsAllocatedCount} Item{v.itemsAllocatedCount === 1 ? '' : 's'}
                          </span>
                        </td>

                        {/* Total PO Value */}
                        <td className="py-4 px-6 text-right font-black text-base text-[#0e743d]">
                          ₹{totalVal.toLocaleString('en-IN')}
                        </td>

                        {/* Order Status */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              v.status === 'PO_Dispatched'
                                ? 'bg-blue-100 text-blue-700'
                                : isFinalized
                                ? 'bg-[#eaf8f0] text-[#1bb062]'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {v.status === 'PO_Dispatched'
                              ? 'PO Dispatched 🚀'
                              : isFinalized
                              ? 'Approved ✓'
                              : 'Pending Approval'}
                          </span>
                        </td>

                        {/* Action: View Quotation Button */}
                        <td className="py-4 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedVendorForQuotation(v)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#eaf8f0] hover:bg-[#d8f4e4] active:scale-[0.98] text-[#0e743d] border border-emerald-300 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span>View Quotation</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400 text-xs">
                      No winning vendors allocated for this demand yet.
                    </td>
                  </tr>
                )}
              </tbody>
              {winningVendors.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-900">
                    <td colSpan="3" className="py-4 px-6 text-xs text-slate-500 uppercase tracking-wider">
                      Total Allocated Purchase Orders ({winningVendors.length} Vendor{winningVendors.length === 1 ? '' : 's'})
                    </td>
                    <td className="py-4 px-6 text-right text-lg text-[#0e743d]">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td colSpan="2" className="py-4 px-6"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          /* View Mode 2: Flat Itemized Table (All Items) */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-800 text-[13.5px] font-bold bg-slate-50/50">
                  <th className="py-4 px-6 w-14">#</th>
                  <th className="py-4 px-6">Item Name</th>
                  <th className="py-4 px-6">Unit</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Allocated Vendor</th>
                  <th className="py-4 px-6 text-right">Allocated Rate</th>
                  <th className="py-4 px-6 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {allocatedItems.length > 0 ? (
                  allocatedItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {item.name}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                          {item.unit}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {item.vendorId ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#0e743d] border border-emerald-200">
                            {item.vendor}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            No Bids Received
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-slate-800">
                        {item.rate > 0 ? `₹${Number(item.rate).toFixed(2)}` : '-'}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-900">
                        {item.total > 0 ? `₹${Number(item.total).toLocaleString('en-IN')}` : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                      No items allocated yet.
                    </td>
                  </tr>
                )}
              </tbody>
              {allocatedItems.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-900">
                    <td colSpan="4" className="py-4 px-6 text-xs text-slate-500 uppercase tracking-wider">
                      Total Order Value ({allocatedItems.length} Items)
                    </td>
                    <td colSpan="3" className="py-4 px-6 text-right text-lg text-[#0e743d]">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Non-winning Vendors List (if any) */}
      {nonWinningVendors.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Participating Vendors With Higher Quotes (Not Allocated)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {nonWinningVendors.map((v) => (
              <div
                key={v.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-800 text-xs">{v.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{v.phone || 'Vendor'}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                  0 Items Won
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: View Vendor Quotation & PO Items Breakdown */}
      {selectedVendorForQuotation &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-3xl w-full p-6 space-y-5 animate-in fade-in duration-150 my-6">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0e743d] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {selectedVendorForQuotation.name
                      ? selectedVendorForQuotation.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'VN'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {selectedVendorForQuotation.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-[#0e743d]">
                        Won {selectedVendorForQuotation.itemsAllocatedCount} Item{selectedVendorForQuotation.itemsAllocatedCount === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedVendorForQuotation.phone ? `Phone: ${selectedVendorForQuotation.phone}` : 'Registered Vendor'} • Demand: <strong>{demand?.demandCode || 'Demand'}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedVendorForQuotation(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Total Order Amount Banner in Modal */}
              <div className="p-4 bg-[#eaf8f0] rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-800">
                    Total Purchase Order Value
                  </p>
                  <p className="text-2xl font-black text-[#0e743d]">
                    ₹{Number(selectedVendorForQuotation.totalAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Status:</span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      selectedVendorForQuotation.status === 'PO_Dispatched'
                        ? 'bg-blue-100 text-blue-700'
                        : isFinalized
                        ? 'bg-[#eaf8f0] text-[#1bb062] border border-emerald-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedVendorForQuotation.status === 'PO_Dispatched'
                      ? 'PO Dispatched 🚀'
                      : isFinalized
                      ? 'Approved ✓'
                      : 'Pending Approval'}
                  </span>
                </div>
              </div>

              {/* Itemized Table for this specific vendor */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                    <tr className="text-slate-700 font-bold">
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4 text-right">Allocated Rate</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getVendorItems(selectedVendorForQuotation).length > 0 ? (
                      getVendorItems(selectedVendorForQuotation).map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{item.name}</td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[11px]">
                              {item.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">
                            ₹{Number(item.rate).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-[#0e743d]">
                            ₹{Number(item.subtotal).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-400">
                          No items found for this vendor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Print PO Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedVendorForQuotation(null)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0e743d] hover:bg-[#0a6032] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>,
          document.body
        )}

      {/* Confirm & Approve Order Modal */}
      {showConfirmModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0e743d] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Confirm & Approve Purchase Orders?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This will generate official Purchase Orders for <strong>{winningVendors.length} winning vendors</strong> with total value of <strong className="text-[#0e743d]">₹{grandTotal.toLocaleString('en-IN')}</strong>. In the vendor mobile app, winning vendors will be marked <em>Approved</em> and non-winning vendors marked <em>Rejected</em>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={confirmingOrder}
                  onClick={handleConfirmApprove}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0e743d] hover:bg-[#0a6032] rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {confirmingOrder && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Yes, Confirm Orders</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Dispatch Orders Modal */}
      {isDispatchModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800">
                  Dispatch Purchase Orders to Winning Vendors
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>The following winning vendors will receive their respective Purchase Orders in their app:</p>
                
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 max-h-52 overflow-y-auto">
                  {winningVendors.map((v) => (
                    <div key={v.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 block">{v.name}</span>
                        <span className="text-slate-400 text-[11px] font-mono">{v.phone || 'Vendor'}</span>
                      </div>
                      <span className="text-[#0e743d] font-bold">
                        {v.itemsAllocatedCount} Items (₹{Number(v.totalAmount || 0).toLocaleString('en-IN')})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDispatchOrders}
                  disabled={dispatchStatus === 'sending'}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0e743d] hover:bg-[#0a6032] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {dispatchStatus === 'sending' && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{dispatchStatus === 'sending' ? 'Dispatching Orders...' : 'Dispatch Purchase Orders'}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

    </div>
  )
}
