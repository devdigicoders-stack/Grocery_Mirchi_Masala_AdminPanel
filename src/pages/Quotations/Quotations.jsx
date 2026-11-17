import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { demandService, quotationService, vendorService } from '../../services/api'
import { TableSkeleton } from '../../components/common/Skeleton'

export default function Quotations({ onNavigateToAllocations }) {
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState('item-wise') // 'item-wise' | 'vendor-wise'
  const [highlightMode, setHighlightMode] = useState('top2') // 'l1-only' | 'top2' | 'top3'
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)
  const [isRecordBidModalOpen, setIsRecordBidModalOpen] = useState(false)
  const [compareSearch, setCompareSearch] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [collapsedVendors, setCollapsedVendors] = useState({})

  // Demands list & selected demand
  const [demands, setDemands] = useState([])
  const [selectedDemandId, setSelectedDemandId] = useState('')
  const [loadingDemands, setLoadingDemands] = useState(true)

  // Comparison matrix data from MongoDB
  const [matrixData, setMatrixData] = useState({
    demand: null,
    vendors: [],
    items: [],
    vendorSummary: [],
    totalSavings: 0,
    savingsPercent: 0,
    totalL1Cost: 0,
    totalHighestCost: 0
  })
  const [loadingMatrix, setLoadingMatrix] = useState(false)

  // Registered vendors for the "Record Vendor Bid" modal
  const [allVendors, setAllVendors] = useState([])
  const [recordBidForm, setRecordBidForm] = useState({
    vendorId: '',
    rates: {} // itemId -> rate
  })
  const [submittingBid, setSubmittingBid] = useState(false)
  const [bidToast, setBidToast] = useState(null)

  // 1. Load demands on mount
  useEffect(() => {
    loadDemands()
  }, [])

  const loadDemands = async () => {
    try {
      setLoadingDemands(true)
      const [activeDem, allDem] = await Promise.all([
        demandService.getActiveDemand().catch(() => null),
        demandService.getDemands().catch(() => [])
      ])

      const demandsList = Array.isArray(allDem) ? allDem : allDem?.data || []
      setDemands(demandsList)

      // Default to active demand, or latest demand
      if (activeDem?._id) {
        setSelectedDemandId(activeDem._id)
      } else if (demandsList.length > 0) {
        setSelectedDemandId(demandsList[0]._id)
      } else {
        setSelectedDemandId('')
      }
    } catch (err) {
      console.error('Failed to load demands:', err)
    } finally {
      setLoadingDemands(false)
    }
  }

  // 2. Load comparison matrix whenever selected demand changes
  useEffect(() => {
    if (selectedDemandId) {
      loadMatrix(selectedDemandId)
    } else {
      setMatrixData({
        demand: null,
        vendors: [],
        items: [],
        vendorSummary: [],
        totalSavings: 0,
        savingsPercent: 0,
        totalL1Cost: 0,
        totalHighestCost: 0
      })
    }
  }, [selectedDemandId])

  const loadMatrix = async (demandId) => {
    try {
      setLoadingMatrix(true)
      const res = await quotationService.getComparisonMatrix(demandId)
      if (res.success) {
        setMatrixData(res)
      }
    } catch (err) {
      console.error('Failed to load quotation matrix:', err)
    } finally {
      setLoadingMatrix(false)
    }
  }

  // 3. Load registered vendors when opening record bid modal
  const handleOpenRecordBidModal = async () => {
    try {
      const vList = await vendorService.getVendors()
      setAllVendors(vList || [])
      setRecordBidForm({
        vendorId: vList?.[0]?._id || '',
        rates: {}
      })
      setIsRecordBidModalOpen(true)
    } catch (err) {
      showToast(`Failed to load vendors: ${err.message}`)
    }
  }

  // Handle rate input change in record bid modal
  const handleRateInputChange = (itemId, val) => {
    setRecordBidForm((prev) => ({
      ...prev,
      rates: {
        ...prev.rates,
        [itemId]: val
      }
    }))
  }

  // Submit quotation on behalf of vendor
  const handleSubmitVendorBid = async (e) => {
    e.preventDefault()
    if (!selectedDemandId || !recordBidForm.vendorId) {
      showToast('Please select a vendor')
      return
    }

    const demandItems = matrixData.demand?.items || matrixData.items || []
    const quotedItems = demandItems
      .filter((it) => recordBidForm.rates[it.id] && Number(recordBidForm.rates[it.id]) > 0)
      .map((it) => ({
        itemId: it.id?.startsWith('item-') ? null : it.id,
        name: it.name,
        unit: it.unit,
        quantity: it.quantity || 1,
        rate: Number(recordBidForm.rates[it.id])
      }))

    if (quotedItems.length === 0) {
      showToast('Please enter a quoted rate (> 0) for at least one item.')
      return
    }

    try {
      setSubmittingBid(true)
      const payload = {
        demandId: selectedDemandId,
        vendorId: recordBidForm.vendorId,
        quotedItems
      }

      await quotationService.submitQuotation(payload)
      setIsRecordBidModalOpen(false)
      showToast('Vendor bid recorded successfully!')
      loadMatrix(selectedDemandId)
    } catch (err) {
      showToast(`Error submitting quote: ${err.message}`)
    } finally {
      setSubmittingBid(false)
    }
  }

  const showToast = (msg) => {
    setBidToast(msg)
    setTimeout(() => setBidToast(null), 3500)
  }

  // Helper to format cell based on ranking and highlight mode
  const renderRateBadge = (rateObj, rowQuantity = 1, unit = 'KG') => {
    if (!rateObj || !rateObj.rate) {
      return (
        <div className="flex flex-col items-center justify-center py-1">
          <span className="text-slate-300 font-medium text-sm">—</span>
          <span className="text-[10px] text-slate-400 font-medium">Not Quoted</span>
        </div>
      )
    }

    const rank = rateObj.rank
    const subtotal = rateObj.rate * Number(rowQuantity || 1)

    // L1: Lowest Rate
    if (rank === 1) {
      return (
        <div className="flex flex-col items-center gap-1 py-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-[#eaf8f0] text-[#0e743d] border border-[#1bb062]/30 shadow-2xs">
            <span>{rateObj.formatted}</span>
            <span className="text-[10px] font-normal text-emerald-800">/{unit}</span>
            <span className="text-[9px] bg-[#0e743d] text-white px-1.5 py-0.5 rounded-full font-black tracking-wide">
              L1
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-600">
            Total: ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )
    }

    // L2: 2nd Best
    if (rank === 2 && (highlightMode === 'top2' || highlightMode === 'top3')) {
      return (
        <div className="flex flex-col items-center gap-1 py-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <span>{rateObj.formatted}</span>
            <span className="text-[10px] font-normal text-blue-600">/{unit}</span>
            <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-black tracking-wide">
              L2
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Total: ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )
    }

    // L3: 3rd Best
    if (rank === 3 && highlightMode === 'top3') {
      return (
        <div className="flex flex-col items-center gap-1 py-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <span>{rateObj.formatted}</span>
            <span className="text-[10px] font-normal text-amber-700">/{unit}</span>
            <span className="text-[9px] bg-amber-600 text-white px-1.5 py-0.5 rounded-full font-black tracking-wide">
              L3
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Total: ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )
    }

    // Default rate
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        <span className="text-slate-800 font-bold text-xs sm:text-sm">
          {rateObj.formatted} <span className="text-[10px] font-normal text-slate-400">/{unit}</span>
        </span>
        <span className="text-[11px] text-slate-400 font-medium">
          Total: ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    )
  }

  // Calculate live total in Record Bid modal
  const modalDemandItems = matrixData.items || []
  const liveTotalQuotedAmount = modalDemandItems.reduce((acc, it) => {
    const rate = Number(recordBidForm.rates[it.id]) || 0
    const qty = Number(it.quantity) || 1
    return acc + rate * qty
  }, 0)

  // Group items by L1 winner for the compare modal
  const l1AllocationsByVendor = {}
  if (matrixData.items) {
    matrixData.items.forEach((it) => {
      if (it.lowestVendorId && it.lowestRate) {
        if (!l1AllocationsByVendor[it.lowestVendorId]) {
          l1AllocationsByVendor[it.lowestVendorId] = {
            vendorName: it.lowestVendor,
            items: [],
            totalAmount: 0
          }
        }
        const cost = it.lowestRate * Number(it.quantity || 1)
        l1AllocationsByVendor[it.lowestVendorId].items.push({
          id: it.id,
          name: it.name,
          rate: it.lowestRate,
          unit: it.unit,
          qty: it.quantity,
          formattedQty: it.qty || `${it.quantity} ${it.unit}`,
          subtotal: cost
        })
        l1AllocationsByVendor[it.lowestVendorId].totalAmount += cost
      }
    })
  }

  // Filtered items in Item-wise View
  const displayedItems = useMemo(() => {
    if (!matrixData.items) return []
    if (!itemSearch.trim()) return matrixData.items
    const q = itemSearch.toLowerCase().trim()
    return matrixData.items.filter((it) => it.name?.toLowerCase().includes(q))
  }, [matrixData.items, itemSearch])

  // Total quantity across items
  const totalDemandQuantity = useMemo(() => {
    if (!matrixData.items) return 0
    return matrixData.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)
  }, [matrixData.items])

  // Render Case 1: No Demands at all in database
  if (!loadingDemands && demands.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#0e743d] flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
            <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4" />
            <circle cx="8" cy="12" r="2" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            No Demands or Quotations Available
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Quotation comparison, L1/L2 reverse auction rankings, and allocation strategies require an active or past grocery demand. Create a demand first to allow registered vendors to bid.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/demands')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0e743d] hover:bg-[#0a6032] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <span className="text-lg leading-none font-bold">+</span>
            <span>Create First Demand Now</span>
          </button>
        </div>
      </div>
    )
  }

  const selectedDemandObj = demands.find((d) => d._id === selectedDemandId) || matrixData.demand

  return (
    <div className="space-y-5">
      
      {/* Toast Alert */}
      {bidToast && (
        <div className="fixed top-6 right-6 z-[10000] flex items-center gap-3 bg-[#0e743d] text-white px-5 py-3 rounded-xl shadow-lg border border-emerald-400/30 animate-in slide-in-from-top-3 duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-sm font-semibold">{bidToast}</span>
        </div>
      )}

      {/* Top Bar: Demand Selector + View Tabs + Highlight Mode Filter + Compare Button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 pb-2 border-b border-slate-100">
        
        {/* Left Side: Demand Selector & View Tabs */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Demand Selector Dropdown */}
          <div className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/70 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#0e743d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-xs font-semibold text-slate-500">Demand:</span>
            <select
              value={selectedDemandId}
              onChange={(e) => setSelectedDemandId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {demands.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.demandCode} {d.status === 'Active' ? '• (Active 48h)' : `(${d.status})`}
                </option>
              ))}
            </select>
          </div>

          {/* Tabs: Item-wise View | Vendor-wise View */}
          <div className="flex items-center gap-5 border-l border-slate-200 pl-4">
            <button
              type="button"
              onClick={() => setActiveView('item-wise')}
              className={`pb-1 text-sm font-bold transition-all relative cursor-pointer ${
                activeView === 'item-wise'
                  ? 'text-[#0e743d]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Item-wise View
              {activeView === 'item-wise' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0e743d] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('vendor-wise')}
              className={`pb-1 text-sm font-bold transition-all relative cursor-pointer ${
                activeView === 'vendor-wise'
                  ? 'text-[#0e743d]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Vendor-wise View ({matrixData.vendors?.length || 0})
              {activeView === 'vendor-wise' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0e743d] rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Right Controls: Highlight Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Top 2 / Top 3 Rates Highlighting Filter */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setHighlightMode('l1-only')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                highlightMode === 'l1-only'
                  ? 'bg-white text-[#0e743d] font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Lowest Only (L1)
            </button>
            <button
              type="button"
              onClick={() => setHighlightMode('top2')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                highlightMode === 'top2'
                  ? 'bg-white text-[#0e743d] font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Top 2 (L1+L2)
            </button>
            <button
              type="button"
              onClick={() => setHighlightMode('top3')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                highlightMode === 'top3'
                  ? 'bg-white text-[#0e743d] font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Top 3 (L1+L2+L3)
            </button>
          </div>

          {/* Record / Enter Bid Button */}
          <button
            type="button"
            onClick={handleOpenRecordBidModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Record vendor quote received over phone or WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Record Vendor Bid</span>
          </button>

          {/* Compare & Allocate Button */}
          <button
            type="button"
            onClick={() => setIsCompareModalOpen(true)}
            disabled={matrixData.vendors.length === 0}
            className={`flex items-center justify-center gap-2 px-5 py-2 bg-[#0e743d] hover:bg-[#0a6032] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all duration-150 cursor-pointer ${
              matrixData.vendors.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
            <span>Compare & Allocate</span>
          </button>
        </div>

      </div>

      {/* Loading state indicator */}
      {loadingMatrix ? (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 overflow-hidden">
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : matrixData.vendors.length === 0 ? (
        /* Case 2: Demand exists, but 0 vendors have submitted quotes */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-12 text-center max-w-xl mx-auto my-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-800">
              No Quotations Submitted Yet for {selectedDemandObj?.demandCode || 'Demand'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Vendors have not submitted bids for this demand yet. As soon as vendors submit quotes via the Mobile App, they will automatically appear here with live L1 price rankings.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleOpenRecordBidModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0e743d] hover:bg-[#0a6032] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>+ Record First Vendor Bid</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/demands')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              View Demand & Send Reminders
            </button>
          </div>
        </div>
      ) : (
        /* Case 3: Quotations exist - Show Full Dynamic Comparison Matrix */
        <div className="space-y-4">
          
          {/* Top Demand Info & Search Strip */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0e743d] flex items-center justify-center font-extrabold text-sm border border-emerald-100 shrink-0">
                {selectedDemandObj?.demandCode?.replace('DM-', '#') || 'DM'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                    {selectedDemandObj?.demandCode || 'Demand'} Procurement Matrix
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedDemandObj?.status === 'Active'
                      ? 'bg-emerald-100 text-[#0e743d]'
                      : selectedDemandObj?.status === 'Allocated'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedDemandObj?.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong>{matrixData.items?.length || 0}</strong> Items Required ({totalDemandQuantity} Total Units) • <strong>{matrixData.vendors?.length || 0}</strong> Vendor{matrixData.vendors?.length !== 1 ? 's' : ''} Quoting
                </p>
              </div>
            </div>

            {/* Quick Search for Grocery Items */}
            {activeView === 'item-wise' && (
              <div className="relative w-full md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Filter grocery items in demand..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0e743d] transition-all"
                />
                {itemSearch && (
                  <button
                    type="button"
                    onClick={() => setItemSearch('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Savings Highlight Banner (if multiple bids and savings exist) */}
          {matrixData.totalSavings > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-[#0e743d] font-bold shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    Estimated Savings: ₹{matrixData.totalSavings.toLocaleString('en-IN')} ({matrixData.savingsPercent}%)
                  </span>
                  <span className="text-slate-500">
                    Allocating items to respective L1 winners costs ₹{matrixData.totalL1Cost.toLocaleString('en-IN')} vs ₹{matrixData.totalHighestCost.toLocaleString('en-IN')} at highest bids.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#0e743d] hover:bg-[#0a6032] text-white font-semibold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
              >
                View Strategy Breakdown
              </button>
            </div>
          )}

          {/* View 1: Item-wise Comparison Table */}
          {activeView === 'item-wise' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/90 text-slate-700 text-xs font-bold uppercase tracking-wider bg-slate-50/80 select-none">
                      <th className="py-3.5 px-3 w-12 text-center text-slate-400">#</th>
                      <th className="py-3.5 px-4 min-w-[260px] text-left">Grocery Item</th>
                      <th className="py-3.5 px-3 w-28 text-center">Req. Qty</th>
                      
                      {/* Dynamic Columns for EACH vendor who submitted */}
                      {matrixData.vendors.map((v) => (
                        <th key={v.id} className="py-3.5 px-4 w-52 min-w-[190px] text-center border-l border-slate-100 bg-slate-50/50">
                          <div className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                            {v.name}
                          </div>
                          <div className="text-[11px] font-bold text-[#0e743d] mt-0.5">
                            Total: ₹{Number(v.totalQuote || 0).toLocaleString('en-IN')}
                          </div>
                        </th>
                      ))}

                      {/* Lowest Rate (L1) Optimal Allocation Column */}
                      <th className="py-3.5 px-4 w-56 min-w-[210px] text-center border-l border-slate-200/80 bg-emerald-50/40 text-emerald-950">
                        <div className="font-extrabold text-xs">Lowest Rate (L1)</div>
                        <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">Optimal B2B Winner</div>
                      </th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {displayedItems.length > 0 ? (
                      displayedItems.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          {/* Index */}
                          <td className="py-3.5 px-3 text-center font-semibold text-slate-400 text-xs">
                            {idx + 1}
                          </td>

                          {/* Item Name */}
                          <td className="py-3.5 px-4 min-w-[260px]">
                            <div className="font-bold text-slate-800 text-xs sm:text-sm leading-snug">
                              {row.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                              Unit: {row.unit || 'KG'}
                            </div>
                          </td>

                          {/* Qty Badge */}
                          <td className="py-3.5 px-3 text-center w-28 shrink-0">
                            <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200/80">
                              {row.qty}
                            </span>
                          </td>

                          {/* Rates for each vendor */}
                          {matrixData.vendors.map((v) => {
                            const rateObj = row.rates?.[v.id]
                            return (
                              <td key={v.id} className="py-3.5 px-4 text-center w-52 min-w-[190px] border-l border-slate-100">
                                {renderRateBadge(rateObj, row.quantity, row.unit)}
                              </td>
                            )
                          })}

                          {/* Lowest Rate (L1) Column */}
                          <td className="py-3.5 px-4 text-center w-56 min-w-[210px] border-l border-slate-200/80 bg-emerald-50/20">
                            {row.lowestRate ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold bg-[#eaf8f0] text-[#0e743d] border border-emerald-300 shadow-2xs">
                                  ₹{Number(row.lowestRate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {row.unit}
                                </span>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                                  <span className="text-slate-400 font-normal">Won by:</span>
                                  <span className="text-[#0e743d]">{row.lowestVendor}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Line Cost: ₹{(row.lowestRate * (Number(row.quantity) || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">No Bids</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3 + matrixData.vendors.length + 1}
                          className="py-10 text-center text-slate-400 text-xs"
                        >
                          {itemSearch
                            ? `No grocery items match "${itemSearch}".`
                            : 'No items recorded for this demand.'}
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {/* Summary Footer Row */}
                  {displayedItems.length > 0 && (
                    <tfoot className="border-t-2 border-slate-200 bg-slate-50/90 font-bold text-xs text-slate-800">
                      <tr>
                        <td colSpan={2} className="py-3.5 px-4 text-left font-extrabold text-slate-900">
                          Total Demand Valuation ({displayedItems.length} items)
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-600 font-bold">
                          {displayedItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)} Units
                        </td>
                        {matrixData.vendors.map((v) => (
                          <td key={v.id} className="py-3.5 px-4 text-center border-l border-slate-200/70">
                            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              Total Bid
                            </div>
                            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                              ₹{Number(v.totalQuote || 0).toLocaleString('en-IN')}
                            </div>
                          </td>
                        ))}
                        <td className="py-3.5 px-4 text-center border-l border-slate-200 bg-emerald-50/60">
                          <div className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                            L1 Optimal Spend
                          </div>
                          <div className="text-base font-extrabold text-[#0e743d] mt-0.5">
                            ₹{Number(matrixData.totalL1Cost || 0).toLocaleString('en-IN')}
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* View 2: Vendor-wise Summary Cards */}
          {activeView === 'vendor-wise' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matrixData.vendorSummary.map((v) => (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-slate-900">{v.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0e743d] font-bold">
                          {v.bestItemsCount} L1 Won
                        </span>
                        {v.secondBestCount > 0 && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                            {v.secondBestCount} L2
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">{v.email}</p>
                    <p className="text-xs text-slate-500 mt-2 font-medium">
                      Items quoted: <strong className="text-slate-700">{v.totalItemsQuoted}</strong> of {matrixData.items.length}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Total Quoted Bid
                      </p>
                      <p className="text-xl font-extrabold text-slate-900">
                        ₹{Number(v.totalQuote || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCompareModalOpen(true)}
                      className="px-4 py-2 bg-[#0e743d] hover:bg-[#0a6032] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Compare
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compare & Allocate Strategy Modal (Mounted via Portal, z-[9999], bg-black/65, zero blur) */}
      {isCompareModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-4xl w-full p-4 sm:p-6 space-y-4 animate-in fade-in duration-150 max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0e743d] flex items-center justify-center border border-emerald-100 shadow-2xs shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800">
                        Optimal Rate Allocation Strategy
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {selectedDemandObj?.demandCode || 'Demand'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lowest Bid (L1) Distribution & Projected Purchase Orders
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCompareModalOpen(false)
                    setCompareSearch('')
                  }}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Summary KPIs Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Demand</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {selectedDemandObj?.demandCode || 'N/A'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{matrixData.items?.length || 0} Total Items</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Winning Vendors</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {Object.keys(l1AllocationsByVendor).length} Vendor{Object.keys(l1AllocationsByVendor).length !== 1 ? 's' : ''} (L1)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {Object.values(l1AllocationsByVendor).reduce((s, a) => s + a.items.length, 0)} Items Won
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Projected Spend</p>
                  <p className="text-base font-extrabold text-[#0e743d] mt-0.5">
                    ₹{Number(matrixData.totalL1Cost || Object.values(l1AllocationsByVendor).reduce((s, a) => s + a.totalAmount, 0)).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">At Lowest (L1) Rates</p>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Estimated Savings</p>
                  <p className="text-base font-extrabold text-[#0e743d] mt-0.5">
                    ₹{Number(matrixData.totalSavings || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {matrixData.savingsPercent ? `${matrixData.savingsPercent}% savings vs Max` : 'Optimal Bidding'}
                  </p>
                </div>
              </div>

              {/* Search & Distribution Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 pt-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Projected L1 Vendor Distribution & Itemized Breakdown
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Review allocated grocery items, quantities, and lowest rates per vendor
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Filter allocated items..."
                    value={compareSearch}
                    onChange={(e) => setCompareSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                  />
                  {compareSearch && (
                    <button
                      type="button"
                      onClick={() => setCompareSearch('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Vendor Cards List (Scrollable Area) */}
              <div className="overflow-y-auto flex-1 space-y-3.5 pr-1">
                {Object.keys(l1AllocationsByVendor).length > 0 ? (
                  Object.entries(l1AllocationsByVendor).map(([vId, alloc]) => {
                    const filteredItems = compareSearch
                      ? alloc.items.filter((it) => it.name.toLowerCase().includes(compareSearch.toLowerCase()))
                      : alloc.items
                    const isCollapsed = collapsedVendors[vId]

                    return (
                      <div
                        key={vId}
                        className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                      >
                        {/* Vendor Card Header */}
                        <div className="bg-emerald-50/60 p-3 sm:px-4 sm:py-3 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#0e743d] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {alloc.vendorName ? alloc.vendorName.substring(0, 2).toUpperCase() : 'VN'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-sm">
                                  {alloc.vendorName}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  L1 Winner • {alloc.items.length} Items Won
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500">
                                Lowest quoted rates across {alloc.items.length} items
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                Projected PO Value
                              </span>
                              <span className="font-extrabold text-[#0e743d] text-base">
                                ₹{alloc.totalAmount.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setCollapsedVendors((prev) => ({
                                  ...prev,
                                  [vId]: !prev[vId]
                                }))
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-emerald-100/50 rounded-lg transition-colors cursor-pointer"
                              title={isCollapsed ? 'Expand items' : 'Collapse items'}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Itemized Table */}
                        {!isCollapsed && (
                          <div className="overflow-x-auto max-h-64 sm:max-h-72 overflow-y-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider backdrop-blur-2xs">
                                <tr>
                                  <th className="py-2.5 px-3.5 w-12 text-center">#</th>
                                  <th className="py-2.5 px-3.5">Grocery Item</th>
                                  <th className="py-2.5 px-3.5 text-center">Quantity</th>
                                  <th className="py-2.5 px-3.5 text-center">Quoted L1 Rate</th>
                                  <th className="py-2.5 px-3.5 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredItems.length > 0 ? (
                                  filteredItems.map((it, idx) => (
                                    <tr
                                      key={it.id || idx}
                                      className="hover:bg-emerald-50/20 transition-colors"
                                    >
                                      <td className="py-2.5 px-3.5 text-center font-medium text-slate-400">
                                        {idx + 1}
                                      </td>
                                      <td className="py-2.5 px-3.5 font-semibold text-slate-800">
                                        {it.name}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-center">
                                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                                          {it.formattedQty || `${it.qty || it.quantity || 1} ${it.unit || 'KG'}`}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3.5 text-center">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-[#eaf8f0] text-[#0e743d] border border-[#1bb062]/20">
                                          <span>₹{Number(it.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {it.unit || 'Unit'}</span>
                                          <span className="text-[9px] bg-[#1bb062] text-white px-1 rounded-full font-extrabold">L1</span>
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900">
                                        ₹{Number(it.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                                      No items match "{compareSearch}" for this vendor.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Vendor Card Footer */}
                        <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            Showing {filteredItems.length} of {alloc.items.length} items won by {alloc.vendorName}
                          </span>
                          <span className="font-semibold text-slate-700">
                            Subtotal: <strong className="text-[#0e743d]">₹{alloc.totalAmount.toLocaleString('en-IN')}</strong>
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500">No L1 winners calculated yet for this demand.</p>
                  </div>
                )}
              </div>

              {/* Bottom Actions Footer */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Ready to confirm & generate purchase orders in Allocations</span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCompareModalOpen(false)
                      setCompareSearch('')
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCompareModalOpen(false)
                      setCompareSearch('')
                      if (onNavigateToAllocations) onNavigateToAllocations()
                      navigate('/allocations')
                    }}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0e743d] hover:bg-[#0a6032] active:scale-[0.99] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Proceed to Order Allocations</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Record Vendor Bid Modal (Admin input for telephone/WhatsApp quotes) */}
      {isRecordBidModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 space-y-4 animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Record Vendor Quotation
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    For Demand: <strong>{selectedDemandObj?.demandCode}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecordBidModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitVendorBid} className="space-y-4 flex-1 flex flex-col overflow-hidden">
                {/* Select Vendor */}
                <div className="shrink-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Quoting Vendor *
                  </label>
                  {allVendors.length > 0 ? (
                    <select
                      value={recordBidForm.vendorId}
                      onChange={(e) => setRecordBidForm({ ...recordBidForm, vendorId: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      {allVendors.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.name} ({v.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-xs">
                      No vendors registered yet. Please register vendors first from the Vendor Management page.
                    </div>
                  )}
                </div>

                {/* Items Rates Inputs */}
                <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-xs font-bold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-4">Item Name</th>
                        <th className="py-2.5 px-4">Quantity</th>
                        <th className="py-2.5 px-4 w-36">Rate (₹ / unit)</th>
                        <th className="py-2.5 px-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {modalDemandItems.map((it) => {
                        const rate = Number(recordBidForm.rates[it.id]) || 0
                        const qty = Number(it.quantity) || 1
                        const subtotal = rate * qty
                        return (
                          <tr key={it.id}>
                            <td className="py-2.5 px-4 font-semibold text-slate-800">
                              {it.name}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="py-2 px-4">
                              <div className="relative">
                                <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={recordBidForm.rates[it.id] || ''}
                                  onChange={(e) => handleRateInputChange(it.id, e.target.value)}
                                  className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-600"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                              ₹{subtotal.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Total & Submit */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
                  <div>
                    <span className="text-xs text-slate-500 block">Total Bid Amount:</span>
                    <span className="text-xl font-extrabold text-[#0e743d]">
                      ₹{liveTotalQuotedAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRecordBidModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingBid || allVendors.length === 0}
                      className="px-5 py-2 text-xs font-semibold text-white bg-[#0e743d] hover:bg-[#0a6032] rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {submittingBid && (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      <span>Submit Quotation</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

    </div>
  )
}
