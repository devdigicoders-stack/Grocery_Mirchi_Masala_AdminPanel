import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FinalOrderReport from './FinalOrderReport'
import { demandService, allocationService } from '../../services/api'
import { TableSkeleton } from '../../components/common/Skeleton'

export default function Allocations({ onTitleChange }) {
  const navigate = useNavigate()
  const [allocationTab, setAllocationTab] = useState('report') // 'report' | 'result'

  // Demands list & selected demand
  const [demands, setDemands] = useState([])
  const [selectedDemandId, setSelectedDemandId] = useState('')
  const [loadingDemands, setLoadingDemands] = useState(true)

  // Allocation preview data from MongoDB
  const [allocationData, setAllocationData] = useState({
    demand: null,
    stats: {
      totalItems: 0,
      vendorsParticipated: 0,
      allocatedItemsCount: 0,
      unallocatedCount: 0,
      totalAllocatedAmount: 0
    },
    vendorAllocations: [],
    allocatedItems: [],
    isFinalized: false,
    existingOrders: []
  })
  const [loadingAllocation, setLoadingAllocation] = useState(false)

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

  // 2. Load allocation preview whenever selectedDemandId changes
  useEffect(() => {
    if (selectedDemandId) {
      loadAllocationPreview(selectedDemandId)
    } else {
      setAllocationData({
        demand: null,
        stats: {
          totalItems: 0,
          vendorsParticipated: 0,
          allocatedItemsCount: 0,
          unallocatedCount: 0,
          totalAllocatedAmount: 0
        },
        vendorAllocations: [],
        allocatedItems: [],
        isFinalized: false,
        existingOrders: []
      })
    }
  }, [selectedDemandId])

  const loadAllocationPreview = async (demandId) => {
    try {
      setLoadingAllocation(true)
      const res = await allocationService.getAllocationPreview(demandId)
      if (res.success) {
        setAllocationData(res)
      }
    } catch (err) {
      console.error('Failed to load allocation preview:', err)
    } finally {
      setLoadingAllocation(false)
    }
  }

  const handleTabChange = (tab) => {
    setAllocationTab(tab)
    if (onTitleChange) {
      const code = allocationData.demand?.demandCode || 'Demand'
      onTitleChange(tab === 'report' ? `Final Order Report – ${code}` : `Allocation Result – ${code}`)
    }
  }

  // Case 1: No demands created in DB at all
  if (!loadingDemands && demands.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#0e743d] flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            No Demands or Allocations Available
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Order allocation and Purchase Order generation require an active or completed grocery demand. Create a demand first so vendors can quote prices.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/demands')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0e743d] hover:bg-[#0a6032] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <span className="text-lg leading-none font-bold">+</span>
            <span>Create First Demand</span>
          </button>
        </div>
      </div>
    )
  }

  const { stats, vendorAllocations, allocatedItems, isFinalized } = allocationData
  const selectedDemandObj = demands.find((d) => d._id === selectedDemandId) || allocationData.demand

  // Dynamic Donut Chart Segments Math
  const donutColors = ['#0e743d', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
  const totalAllocated = stats.allocatedItemsCount || 0
  const circumference = 364.42 // 2 * Math.PI * 58

  let cumulativeOffset = 0
  const chartSegments = vendorAllocations.map((v, i) => {
    const count = v.itemsAllocatedCount || 0
    const fraction = totalAllocated > 0 ? count / totalAllocated : 0
    const dashLength = fraction * circumference
    const offset = cumulativeOffset
    cumulativeOffset -= dashLength
    return {
      name: v.name,
      count,
      dashLength,
      dashOffset: offset,
      color: donutColors[i % donutColors.length]
    }
  })

  return (
    <div className="space-y-4">
      
      {/* Top Header Controls: View Switcher Pill & Demand Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        
        {/* View Switcher Pill */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleTabChange('report')}
            className={`px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              allocationTab === 'report'
                ? 'bg-white text-[#0e743d] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Final Order Report / Purchase Order
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('result')}
            className={`px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              allocationTab === 'result'
                ? 'bg-white text-[#0e743d] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Auto Allocation Result (Lowest Rate)
          </button>
        </div>

        {/* Demand Selector Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">Demand:</span>
          <select
            value={selectedDemandId}
            onChange={(e) => setSelectedDemandId(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {demands.map((d) => (
              <option key={d._id} value={d._id}>
                {d.demandCode} {d.status === 'Active' ? '• (Active 48h)' : `(${d.status})`}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Loading state indicator */}
      {loadingAllocation ? (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 overflow-hidden">
          <TableSkeleton rows={5} cols={6} />
        </div>
      ) : stats.vendorsParticipated === 0 ? (
        /* Case 2: Demand exists, but 0 vendors quoted */
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
              Automatic lowest bidder allocation requires participating vendors to submit rates. Once quotes arrive, the system will allocate items to winning vendors.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/quotations')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0e743d] hover:bg-[#0a6032] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Go to Quotations & Record Bids</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/demands')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              View Demand Details
            </button>
          </div>
        </div>
      ) : allocationTab === 'report' ? (
        <FinalOrderReport
          demand={selectedDemandObj}
          stats={stats}
          vendorAllocations={vendorAllocations}
          allocatedItems={allocatedItems}
          isFinalized={isFinalized}
          onBackToResult={() => handleTabChange('result')}
          onRefresh={() => loadAllocationPreview(selectedDemandId)}
        />
      ) : (
        /* View 2: Auto Allocation Result (Lowest Rate) */
        <div className="space-y-6">
          
          {/* Top 3 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            
            {/* Stat 1: Total Items */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#eaf8f0] text-[#0e743d]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <path d="m3.3 7 8.7 5 8.7-5" />
                  <path d="M12 22V12" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Total Demand Items</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalItems}</p>
              </div>
            </div>

            {/* Stat 2: Vendors Participated */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#edf5fe] text-[#3b82f6]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Vendors Participated</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.vendorsParticipated}</p>
              </div>
            </div>

            {/* Stat 3: Allocated Items */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#f7edfc] text-[#a855f7]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Allocated Items</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {stats.allocatedItemsCount} / {stats.totalItems}
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Card: Vendor-wise Allocation Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-bold text-slate-900">
                    Vendor-wise Allocation
                  </h2>
                  <span className="text-xs font-bold text-[#0e743d] bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Total Value: ₹{Number(stats.totalAllocatedAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-800 text-[13.5px] font-bold">
                        <th className="py-3 px-4 w-12">#</th>
                        <th className="py-3 px-4">Vendor Name</th>
                        <th className="py-3 px-4 text-center">Items Won</th>
                        <th className="py-3 px-4 text-right">Allocated Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {vendorAllocations.map((v, idx) => (
                        <tr key={v.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-4 font-medium text-slate-500">{idx + 1}</td>
                          <td className="py-4 px-4">
                            <p className="font-semibold text-slate-800">{v.name}</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">{v.details}</p>
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-slate-800">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              v.itemsAllocatedCount > 0 ? 'bg-emerald-100 text-[#0e743d]' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {v.itemsAllocated}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-slate-900">
                            {v.totalAmount > 0 ? `₹${Number(v.totalAmount).toLocaleString('en-IN')}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Algorithm: Lowest Evaluated Bidder (LEB / L1)</span>
                <button
                  type="button"
                  onClick={() => handleTabChange('report')}
                  className="font-semibold text-[#0e743d] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Generate Purchase Orders ›</span>
                </button>
              </div>
            </div>

            {/* Right Card: Dynamic Item Allocation Donut Chart */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between">
              <h2 className="text-[16px] font-bold text-slate-900 mb-2">
                Item Allocation Distribution
              </h2>

              <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="58" fill="transparent" stroke="#f1f5f9" strokeWidth="24" />
                    {totalAllocated > 0 &&
                      chartSegments.map(
                        (seg, i) =>
                          seg.count > 0 && (
                            <circle
                              key={i}
                              cx="80"
                              cy="80"
                              r="58"
                              fill="transparent"
                              stroke={seg.color}
                              strokeWidth="24"
                              strokeDasharray={`${seg.dashLength} ${circumference}`}
                              strokeDashoffset={seg.dashOffset}
                            />
                          )
                      )}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
                    <span className="text-2xl font-bold text-slate-900 leading-none">
                      {totalAllocated}
                    </span>
                    <span className="text-[12px] font-medium text-slate-400 mt-1">
                      of {stats.totalItems} Items
                    </span>
                  </div>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {chartSegments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        {seg.name} – {seg.count} {seg.count === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  ))}
                  {stats.unallocatedCount > 0 && (
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-300 shrink-0" />
                      <span className="text-xs font-medium text-slate-400">
                        Unallocated – {stats.unallocatedCount} items
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-100">
                Optimized by lowest rate submitted across all bidding vendors
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  )
}
