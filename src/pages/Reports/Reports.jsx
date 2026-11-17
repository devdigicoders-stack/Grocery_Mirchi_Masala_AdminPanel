import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import { reportService } from '../../services/api'
import { TableSkeleton } from '../../components/common/Skeleton'

export default function Reports() {
  const [selectedRange, setSelectedRange] = useState('all') // 'all' | 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'last_90_days' | 'this_year'
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isModalDatePickerOpen, setIsModalDatePickerOpen] = useState(false)

  // Selected report modal: 'demand-summary' | 'vendor-performance' | 'item-rates' | null
  const [activeReportType, setActiveReportType] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('desc') // 'asc' | 'desc'
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)

  // Overall quick summary for the 4 overview cards
  const [overviewKpis, setOverviewKpis] = useState({
    demandsCount: 0,
    vendorsCount: 0,
    totalSpend: 0,
    itemsCount: 0
  })

  const datePresets = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Last 30 Days', value: 'last_30_days' },
    { label: 'Last 90 Days', value: 'last_90_days' },
    { label: 'This Year', value: 'this_year' }
  ]

  const currentRangeLabel = datePresets.find((p) => p.value === selectedRange)?.label || 'All Time'

  // Load overview stats on mount and whenever selectedRange changes
  useEffect(() => {
    loadOverview()
    if (activeReportType) {
      loadDetailedReport(activeReportType, selectedRange)
    }
  }, [selectedRange])

  const loadOverview = async () => {
    try {
      const [dRes, vRes, iRes] = await Promise.all([
        reportService.getDemandSummary(selectedRange).catch(() => null),
        reportService.getVendorPerformance(selectedRange).catch(() => null),
        reportService.getItemRates(selectedRange).catch(() => null)
      ])

      setOverviewKpis({
        demandsCount: dRes?.kpis?.totalDemands || 0,
        vendorsCount: vRes?.kpis?.totalVendors || 0,
        totalSpend: dRes?.kpis?.totalSpend || 0,
        itemsCount: iRes?.kpis?.uniqueItemsCount || 0
      })
    } catch (err) {
      console.error('Failed to load report overview:', err)
    }
  }

  // Load specific report data when modal opens or range/type changes
  const handleOpenReport = async (type) => {
    const normalizedType = type === 'item-wise-rate' ? 'item-rates' : type
    setActiveReportType(normalizedType)
    setSearchQuery('')
    setSortField(null)
    loadDetailedReport(normalizedType, selectedRange)
  }

  const loadDetailedReport = async (type, range) => {
    try {
      setLoadingReport(true)
      const normalizedType = type === 'item-wise-rate' ? 'item-rates' : type
      let res = null

      if (normalizedType === 'demand-summary') {
        res = await reportService.getDemandSummary(range)
      } else if (normalizedType === 'vendor-performance') {
        res = await reportService.getVendorPerformance(range)
      } else if (normalizedType === 'item-rates') {
        res = await reportService.getItemRates(range)
      }

      setReportData(res)
    } catch (err) {
      console.error('Failed to load detailed report:', err)
      setReportData(null)
    } finally {
      setLoadingReport(false)
    }
  }

  // Switch report type from inside modal
  const handleSwitchReportTab = (newType) => {
    setActiveReportType(newType)
    setSearchQuery('')
    setSortField(null)
    loadDetailedReport(newType, selectedRange)
  }

  // Handle column sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Filtered and Sorted Data for Current Report Modal
  const processedRows = useMemo(() => {
    if (!reportData) return []
    const q = searchQuery.toLowerCase().trim()

    let rows = []
    if (activeReportType === 'demand-summary') {
      rows = (reportData.demands || []).filter((d) => {
        if (!q) return true
        return (
          d.demandCode?.toLowerCase().includes(q) ||
          d.status?.toLowerCase().includes(q)
        )
      })
    } else if (activeReportType === 'vendor-performance') {
      rows = (reportData.vendors || []).filter((v) => {
        if (!q) return true
        return (
          v.name?.toLowerCase().includes(q) ||
          v.email?.toLowerCase().includes(q) ||
          v.phone?.toLowerCase().includes(q) ||
          v.status?.toLowerCase().includes(q)
        )
      })
    } else if (activeReportType === 'item-rates') {
      rows = (reportData.items || []).filter((it) => {
        if (!q) return true
        return (
          it.name?.toLowerCase().includes(q) ||
          it.unit?.toLowerCase().includes(q) ||
          it.category?.toLowerCase().includes(q)
        )
      })
    }

    // Apply sorting if sortField is set
    if (sortField) {
      rows = [...rows].sort((a, b) => {
        let valA = a[sortField] ?? ''
        let valB = b[sortField] ?? ''

        if (typeof valA === 'string') {
          valA = valA.toLowerCase()
          valB = (valB || '').toLowerCase()
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }

        const numA = Number(valA) || 0
        const numB = Number(valB) || 0
        return sortDirection === 'asc' ? numA - numB : numB - numA
      })
    }

    return rows
  }, [reportData, activeReportType, searchQuery, sortField, sortDirection])

  // Handle Export to Excel (.xlsx) or CSV
  const handleExport = (format = 'xlsx') => {
    if (!reportData) return

    let baseName = 'Report'
    let headers = []
    let wsData = []
    let colWidths = []

    const rangeSuffix = selectedRange.toUpperCase()

    if (activeReportType === 'demand-summary') {
      baseName = `Demand_Summary_Report_${rangeSuffix}`
      headers = [
        'S.No',
        'Demand Code',
        'Status',
        'Published Date',
        'Deadline Date',
        'Items Count',
        'Total Quantity',
        'Bids Submitted',
        'Allocated Value (INR)'
      ]
      wsData = [
        headers,
        ...processedRows.map((d, idx) => [
          idx + 1,
          d.demandCode,
          d.status,
          d.publishedAt ? new Date(d.publishedAt).toLocaleString('en-IN') : '-',
          d.deadlineAt ? new Date(d.deadlineAt).toLocaleString('en-IN') : '-',
          d.itemsCount || 0,
          d.totalQuantity || 0,
          d.bidsCount || 0,
          d.allocatedValue || 0
        ])
      ]
      colWidths = [
        { wch: 8 },
        { wch: 18 },
        { wch: 14 },
        { wch: 22 },
        { wch: 22 },
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 22 }
      ]
    } else if (activeReportType === 'vendor-performance') {
      baseName = `Vendor_Performance_Report_${rangeSuffix}`
      headers = [
        'S.No',
        'Vendor Name',
        'Email Address',
        'Phone Number',
        'Vendor Status',
        'Demands Quoted',
        'Items Quoted',
        'Items Won (L1)',
        'Win Rate (%)',
        'Total Orders Value (INR)'
      ]
      wsData = [
        headers,
        ...processedRows.map((v, idx) => [
          idx + 1,
          v.name,
          v.email,
          v.phone || '-',
          v.status,
          v.demandsQuotedCount || 0,
          v.itemsQuotedCount || 0,
          v.itemsWonCount || 0,
          `${v.winRate}%`,
          v.totalRevenue || 0
        ])
      ]
      colWidths = [
        { wch: 8 },
        { wch: 25 },
        { wch: 30 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 24 }
      ]
    } else if (activeReportType === 'item-rates') {
      baseName = `Item_Wise_Rate_Report_${rangeSuffix}`
      headers = [
        'S.No',
        'Item Name',
        'Category',
        'Unit',
        'Times Demanded',
        'Total Qty Demanded',
        'Min Quoted Rate (L1) (INR)',
        'Max Quoted Rate (INR)',
        'Avg Quoted Rate (INR)',
        'Avg Winning Rate (INR)',
        'Total Spend (INR)'
      ]
      wsData = [
        headers,
        ...processedRows.map((it, idx) => [
          idx + 1,
          it.name,
          it.category || 'Grocery',
          it.unit,
          it.timesDemanded || 0,
          it.totalQuantityDemanded || 0,
          it.minRate || 0,
          it.maxRate || 0,
          it.avgQuotedRate || 0,
          it.avgWinningRate || 0,
          it.totalSpend || 0
        ])
      ]
      colWidths = [
        { wch: 8 },
        { wch: 32 },
        { wch: 18 },
        { wch: 10 },
        { wch: 16 },
        { wch: 20 },
        { wch: 24 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 }
      ]
    }

    try {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws['!cols'] = colWidths
      XLSX.utils.book_append_sheet(wb, ws, 'Report Data')

      if (format === 'csv') {
        XLSX.writeFile(wb, `${baseName}.csv`, { bookType: 'csv' })
      } else {
        XLSX.writeFile(wb, `${baseName}.xlsx`)
      }
      setExportDropdownOpen(false)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const reportsList = [
    {
      id: 'demand-summary',
      title: 'Demand Summary Report',
      shortTitle: 'Demand Summary',
      description: 'View demand-wise item counts, vendor participation bids, and total allocated values',
      bgColor: 'bg-[#eaf8f0]',
      iconColor: 'text-[#1bb062]',
      statBadge: `${overviewKpis.demandsCount} Demands recorded`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      id: 'vendor-performance',
      title: 'Vendor Performance Report',
      shortTitle: 'Vendor Performance',
      description: 'Analyze bidding activity, winning L1 allocations, win rates (%), and revenue per vendor',
      bgColor: 'bg-[#fef5ea]',
      iconColor: 'text-[#f59e0b]',
      statBadge: `${overviewKpis.vendorsCount} Registered Vendors`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'item-rates',
      title: 'Item-wise Rate Report',
      shortTitle: 'Item-wise Rates',
      description: 'Historical grocery rates analysis: lowest L1 rates, highest bids, and total spend per item',
      bgColor: 'bg-[#edf5fe]',
      iconColor: 'text-[#3b82f6]',
      statBadge: `${overviewKpis.itemsCount} Items Analyzed`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    }
  ]

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls: Date Range Selector & Overview Total Spend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Procurement Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time reverse auction insights, vendor bidding performance, and grocery procurement spend
          </p>
        </div>

        {/* Date Range Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-[#0e743d]"
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

            <span>Filter: <strong>{currentRangeLabel}</strong></span>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-3.5 h-3.5 text-slate-400 ml-1 transition-transform ${
                isDatePickerOpen ? 'rotate-180' : ''
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Date Dropdown Menu */}
          {isDatePickerOpen && (
            <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 animate-in fade-in duration-150">
              <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Date Filter
              </div>
              {datePresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setSelectedRange(preset.value)
                    setIsDatePickerOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    selectedRange === preset.value
                      ? 'bg-emerald-50 text-[#0e743d] font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{preset.label}</span>
                  {selectedRange === preset.value && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#0e743d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top 4 Quick Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Demands Processed</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{overviewKpis.demandsCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Registered Vendors</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{overviewKpis.vendorsCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders Spend</p>
          <p className="text-xl font-extrabold text-[#0e743d] mt-1">
            ₹{Number(overviewKpis.totalSpend).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unique Items Analyzed</p>
          <p className="text-xl font-extrabold text-blue-600 mt-1">{overviewKpis.itemsCount}</p>
        </div>
      </div>

      {/* Reports List: 3 Cards Stacked Vertically */}
      <div className="space-y-4">
        {reportsList.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md hover:border-slate-300"
          >
            {/* Left Info: Icon + Title & Description */}
            <div className="flex items-center gap-4">
              <div
                className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 ${report.bgColor} ${report.iconColor}`}
              >
                {report.icon}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {report.title}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {report.statBadge}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5">
                  {report.description}
                </p>
              </div>
            </div>

            {/* Right Action: View Button */}
            <div className="w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => handleOpenReport(report.id)}
                className="w-full sm:w-auto px-7 py-2.5 bg-white hover:bg-[#0e743d] text-[#0e743d] hover:text-white border border-[#0e743d] font-semibold text-sm rounded-xl shadow-xs transition-all duration-150 cursor-pointer text-center"
              >
                View Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Report Modal (Mounted via Portal, z-[9999], bg-black/65, zero blur) */}
      {activeReportType &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-5xl w-full p-4 sm:p-6 space-y-4 animate-in fade-in duration-150 max-h-[94vh] flex flex-col">
              
              {/* Modal Header: Tabs + Date Range + Close */}
              <div className="border-b border-slate-100 pb-3.5 shrink-0 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {reportsList.find((r) => r.id === activeReportType)?.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Mirch Masala Grocery Reverse Auction Analytics • Range: <strong className="text-slate-600">{currentRangeLabel}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* In-Modal Date Filter Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsModalDatePickerOpen(!isModalDatePickerOpen)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <span className="text-slate-400 text-[11px]">Range:</span>
                        <span>{currentRangeLabel}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isModalDatePickerOpen ? 'rotate-180' : ''}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {isModalDatePickerOpen && (
                        <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in duration-150">
                          {datePresets.map((preset) => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => {
                                setSelectedRange(preset.value)
                                setIsModalDatePickerOpen(false)
                              }}
                              className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                                selectedRange === preset.value
                                  ? 'bg-emerald-50 text-[#0e743d] font-bold'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{preset.label}</span>
                              {selectedRange === preset.value && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#0e743d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Close Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReportType(null)
                        setReportData(null)
                        setIsModalDatePickerOpen(false)
                        setExportDropdownOpen(false)
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Quick Report Switcher Tab Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5">
                  {reportsList.map((rep) => {
                    const isSelected = activeReportType === rep.id
                    return (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => handleSwitchReportTab(rep.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#0e743d] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                        }`}
                      >
                        <span>{rep.shortTitle}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Modal Body: Loading or Report Content */}
              {loadingReport ? (
                <div className="py-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                  </div>
                  <TableSkeleton rows={5} cols={6} />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  
                  {/* Dynamic KPI Badges for Active Report */}
                  {reportData?.kpis && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      {activeReportType === 'demand-summary' && (
                        <>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Total Demands</span>
                            <span className="text-base font-extrabold text-slate-800">{reportData.kpis.totalDemands}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Active Demands</span>
                            <span className="text-base font-extrabold text-emerald-600">{reportData.kpis.activeDemands}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Total Items Demanded</span>
                            <span className="text-base font-extrabold text-slate-800">{reportData.kpis.totalItemsDemanded}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Allocated Spend</span>
                            <span className="text-base font-extrabold text-[#0e743d]">₹{Number(reportData.kpis.totalSpend || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}

                      {activeReportType === 'vendor-performance' && (
                        <>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Total Vendors</span>
                            <span className="text-base font-extrabold text-slate-800">{reportData.kpis.totalVendors}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Active Vendors</span>
                            <span className="text-base font-extrabold text-emerald-600">{reportData.kpis.activeVendors}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Participated In Bids</span>
                            <span className="text-base font-extrabold text-blue-600">{reportData.kpis.participatingVendors}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Total Revenue Awarded</span>
                            <span className="text-base font-extrabold text-[#0e743d]">₹{Number(reportData.kpis.totalAllocatedSpend || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}

                      {activeReportType === 'item-rates' && (
                        <>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Unique Items</span>
                            <span className="text-base font-extrabold text-slate-800">{reportData.kpis.uniqueItemsCount}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Total Quantity</span>
                            <span className="text-base font-extrabold text-blue-600">{reportData.kpis.totalQuantity}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[11px] text-slate-400 block font-semibold">Total Purchase Spend</span>
                            <span className="text-base font-extrabold text-[#0e743d]">₹{Number(reportData.kpis.totalSpend || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Search and Row Count Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    <div className="relative flex-1 max-w-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                          activeReportType === 'demand-summary'
                            ? 'Search by Demand Code or Status...'
                            : activeReportType === 'vendor-performance'
                            ? 'Search by Vendor Name, Email, Phone...'
                            : 'Search by Grocery Item Name or Category...'
                        }
                        className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0e743d] transition-all"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 self-center">
                      Showing <strong>{processedRows.length}</strong> record{processedRows.length !== 1 ? 's' : ''}
                      {searchQuery && <span> matching "<span className="text-slate-800">{searchQuery}</span>"</span>}
                    </div>
                  </div>

                  {/* Report Table 1: Demand Summary */}
                  {activeReportType === 'demand-summary' && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                            <tr>
                              <th className="py-3 px-4 w-12 text-slate-400">#</th>
                              <th
                                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('demandCode')}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>Demand Code</span>
                                  {sortField === 'demandCode' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                              <th
                                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('status')}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>Status</span>
                                  {sortField === 'status' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                              <th className="py-3 px-4">Published Date</th>
                              <th
                                className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('itemsCount')}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span>Items</span>
                                  {sortField === 'itemsCount' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                              <th
                                className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('bidsCount')}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span>Bids Submitted</span>
                                  {sortField === 'bidsCount' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                              <th
                                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('allocatedValue')}
                              >
                                <div className="flex items-center justify-end gap-1.5">
                                  <span>Allocated Value</span>
                                  {sortField === 'allocatedValue' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {processedRows.length > 0 ? (
                              processedRows.map((d, idx) => (
                                <tr key={d.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                                  <td className="py-3 px-4 font-bold text-slate-800">{d.demandCode}</td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      d.status === 'Active'
                                        ? 'bg-emerald-100 text-[#0e743d]'
                                        : d.status === 'Allocated'
                                        ? 'bg-blue-100 text-blue-700'
                                        : d.status === 'Completed'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {d.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-slate-600">
                                    {d.publishedAt ? new Date(d.publishedAt).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    }) : '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center font-semibold text-slate-700">{d.itemsCount}</td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                                      {d.bidsCount} bids
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-[#0e743d]">
                                    ₹{Number(d.allocatedValue || 0).toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="7" className="py-10 text-center text-slate-400 text-xs">
                                  {searchQuery
                                    ? `No demands matched "${searchQuery}".`
                                    : 'No demands recorded for the selected date range.'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Report Table 2: Vendor Performance */}
                  {activeReportType === 'vendor-performance' && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                            <tr>
                              <th className="py-3 px-4 w-12 text-slate-400">#</th>
                              <th
                                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('name')}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>Vendor Name</span>
                                  {sortField === 'name' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                              <th className="py-3 px-4">Contact</th>
                              <th
                                className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('demandsQuotedCount')}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span>Demands Quoted</span>
                                  {sortField === 'demandsQuotedCount' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                              <th
                                className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('itemsWonCount')}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span>L1 Items Won</span>
                                  {sortField === 'itemsWonCount' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                              <th
                                className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('winRate')}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span>Win Rate</span>
                                  {sortField === 'winRate' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                              <th
                                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('totalRevenue')}
                              >
                                <div className="flex items-center justify-end gap-1.5">
                                  <span>Orders Revenue</span>
                                  {sortField === 'totalRevenue' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {processedRows.length > 0 ? (
                              processedRows.map((v, idx) => (
                                <tr key={v.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                                  <td className="py-3 px-4">
                                    <p className="font-bold text-slate-800">{v.name}</p>
                                    <span className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                      v.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {v.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-slate-600">
                                    <p className="text-xs">{v.email}</p>
                                    {v.phone && <p className="text-slate-400 text-[10px]">{v.phone}</p>}
                                  </td>
                                  <td className="py-3 px-4 text-center font-semibold text-slate-700">
                                    {v.demandsQuotedCount}
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold text-[#0e743d]">
                                    {v.itemsWonCount}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                      {v.winRate}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                                    ₹{Number(v.totalRevenue || 0).toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="7" className="py-10 text-center text-slate-400 text-xs">
                                  {searchQuery
                                    ? `No vendors matched "${searchQuery}".`
                                    : 'No vendor performance records found in selected range.'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Report Table 3: Item-wise Rate Analytics */}
                  {activeReportType === 'item-rates' && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                            <tr>
                              <th className="py-3 px-4 w-12 text-slate-400">#</th>
                              <th
                                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('name')}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>Grocery Item</span>
                                  {sortField === 'name' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                              <th className="py-3 px-4">Unit</th>
                              <th
                                className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('timesDemanded')}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span>Demands Count</span>
                                  {sortField === 'timesDemanded' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                              <th
                                className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('totalQuantityDemanded')}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span>Total Qty</span>
                                  {sortField === 'totalQuantityDemanded' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                              <th
                                className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('minRate')}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span>Min Rate (L1)</span>
                                  {sortField === 'minRate' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                              <th className="py-3 px-4 text-center">Max Quoted</th>
                              <th className="py-3 px-4 text-center">Avg Winning</th>
                              <th
                                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('totalSpend')}
                              >
                                <div className="flex items-center justify-end gap-1.5">
                                  <span>Total Spend</span>
                                  {sortField === 'totalSpend' && (
                                    <span className="text-[10px] text-[#0e743d]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {processedRows.length > 0 ? (
                              processedRows.map((it, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                                  <td className="py-3 px-4 font-bold text-slate-800">
                                    {it.name}
                                    {it.category && (
                                      <span className="block text-[10px] font-normal text-slate-400">
                                        {it.category}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-slate-600 font-semibold">{it.unit}</td>
                                  <td className="py-3 px-4 text-center font-semibold text-slate-700">{it.timesDemanded}</td>
                                  <td className="py-3 px-4 text-center font-semibold text-slate-700">
                                    {it.totalQuantityDemanded} {it.unit}
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold text-[#0e743d]">
                                    {it.minRate > 0 ? `₹${it.minRate}` : '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center text-slate-500">
                                    {it.maxRate > 0 ? `₹${it.maxRate}` : '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold text-blue-700">
                                    {it.avgWinningRate > 0 ? `₹${it.avgWinningRate}` : '-'}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                                    ₹{Number(it.totalSpend || 0).toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="9" className="py-10 text-center text-slate-400 text-xs">
                                  {searchQuery
                                    ? `No items matched "${searchQuery}".`
                                    : 'No item rate analytics records found in selected range.'}
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

              {/* Modal Footer: Print & Export (Excel/CSV) & Close */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect width="12" height="8" x="6" y="14" />
                  </svg>
                  <span>Print Report</span>
                </button>

                <div className="flex items-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReportType(null)
                      setReportData(null)
                      setIsModalDatePickerOpen(false)
                      setExportDropdownOpen(false)
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-center"
                  >
                    Close
                  </button>

                  {/* Export Options Dropdown */}
                  <div className="relative flex-1 sm:flex-initial">
                    <button
                      type="button"
                      onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                      className="w-full flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#0e743d] hover:bg-[#0a6032] rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>Export Report</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {exportDropdownOpen && (
                      <div className="absolute right-0 bottom-11 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in duration-150">
                        <button
                          type="button"
                          onClick={() => handleExport('xlsx')}
                          className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#0e743d] transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span>Excel (.xlsx)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExport('csv')}
                          className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#0e743d] transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span>CSV (.csv)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>,
          document.body
        )}

    </div>
  )
}
