import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { reportService, getStoredAdmin } from '../../services/api'
import { KpiCardsSkeleton, ChartSkeleton, TableSkeleton, ListSkeleton } from '../../components/common/Skeleton'

// Color palette for vendor allocation slices
const DONUT_COLORS = [
  '#22c55e', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#10b981', // Green
  '#6366f1'  // Indigo
]

export default function DashboardOverview() {
  const navigate = useNavigate()
  const storedAdmin = getStoredAdmin()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date())
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null)

  // Real Dashboard State loaded directly from MongoDB
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalVendors: 0,
      activeVendors: 0,
      activeDemands: 0,
      completedDemands: 0,
      totalDemands: 0,
      totalItems: 0,
      activeItems: 0,
      totalOrders: 0,
      totalSpend: 0
    },
    demandTrend: [],
    itemAllocation: null,
    recentActiveDemands: [],
    recentQuotations: [],
    recentOrders: []
  })

  // Fetch real MongoDB data
  const loadDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    try {
      const res = await reportService.getDashboardOverview()
      if (res && res.success) {
        setDashboardData({
          kpis: res.kpis || {},
          demandTrend: res.demandTrend || [],
          itemAllocation: res.itemAllocation || null,
          recentActiveDemands: res.recentActiveDemands || [],
          recentQuotations: res.recentQuotations || [],
          recentOrders: res.recentOrders || []
        })
        setLastRefreshedAt(new Date())
      }
    } catch (err) {
      console.error('Failed to load dashboard overview:', err)
    } finally {
      setLoading(false)
      if (isManualRefresh) setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    // Poll every 30 seconds for live bidding updates
    const interval = setInterval(() => {
      loadDashboard()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Helper for deadline countdown
  const getDeadlineBadge = (deadlineAt) => {
    if (!deadlineAt) return { text: 'No Deadline', color: 'bg-slate-100 text-slate-600' }
    const diff = new Date(deadlineAt) - new Date()
    if (diff <= 0) {
      return { text: 'Expired / Bidding Closed', color: 'bg-rose-100 text-rose-700 border-rose-200' }
    }
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    if (hours < 6) {
      return { text: `${hours}h ${minutes}m left (Closing Soon)`, color: 'bg-amber-100 text-amber-800 border-amber-300' }
    }
    return { text: `${hours}h ${minutes}m left`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  }

  const { kpis, demandTrend, itemAllocation, recentActiveDemands, recentQuotations, recentOrders } = dashboardData

  // 1. KPI Cards Definition
  const stats = [
    {
      id: 1,
      title: 'Total Vendors',
      value: kpis.totalVendors.toString(),
      subtext: `${kpis.activeVendors} Active & Bidding`,
      link: '/vendors',
      bgColor: 'bg-[#eaf8f0]',
      iconColor: 'text-[#22c55e]',
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
      id: 2,
      title: 'Active Demands',
      value: kpis.activeDemands.toString(),
      subtext: `${kpis.totalDemands} Total Published`,
      link: '/demands',
      bgColor: 'bg-[#edf5fe]',
      iconColor: 'text-[#3b82f6]',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      )
    },
    {
      id: 3,
      title: 'Completed Demands',
      value: kpis.completedDemands.toString(),
      subtext: `${kpis.totalOrders} Purchase Orders`,
      link: '/allocations',
      bgColor: 'bg-[#f7edfc]',
      iconColor: 'text-[#a855f7]',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="14" x="3" y="3" rx="2" />
          <path d="m9 10 2 2 4-4" />
          <path d="M7 21h10" />
        </svg>
      )
    },
    {
      id: 4,
      title: 'Total Items',
      value: kpis.totalItems.toLocaleString('en-IN'),
      subtext: `${kpis.activeItems} Active in Master`,
      link: '/item-master',
      bgColor: 'bg-[#fef5ea]',
      iconColor: 'text-[#f59e0b]',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m7.5 4.27 9 5.15" />
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      )
    }
  ]

  // 2. Dynamic SVG Calculations for Demand Trend Chart
  const trendMetrics = useMemo(() => {
    if (!demandTrend || demandTrend.length === 0) return null

    const N = demandTrend.length
    const values = demandTrend.map((d) => d.itemsCount || 0)
    const maxVal = Math.max(...values, 8)
    const yMax = Math.ceil(maxVal * 1.2) // 20% headroom

    const width = 460
    const height = 230
    const xStart = 55
    const xEnd = 430
    const availableWidth = xEnd - xStart
    const yBaseline = 190
    const yTop = 40
    const availableHeight = yBaseline - yTop

    const points = demandTrend.map((d, i) => {
      const x = N === 1 ? (xStart + xEnd) / 2 : xStart + i * (availableWidth / (N - 1))
      const ratio = yMax > 0 ? (d.itemsCount || 0) / yMax : 0
      const y = yBaseline - ratio * availableHeight
      return {
        ...d,
        x,
        y,
        val: d.itemsCount || 0
      }
    })

    // Construct SVG Line Path
    let linePath = ''
    points.forEach((p, i) => {
      if (i === 0) linePath += `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      else linePath += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    })

    // Construct Shaded SVG Area Path
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    const areaPath = `M ${firstPoint.x.toFixed(1)} ${yBaseline} L ${linePath.slice(2)} L ${lastPoint.x.toFixed(1)} ${yBaseline} Z`

    // Y Axis Grid lines (4 intervals)
    const gridLines = [
      { label: yMax.toString(), y: yTop },
      { label: Math.round(yMax * 0.75).toString(), y: yTop + availableHeight * 0.25 },
      { label: Math.round(yMax * 0.5).toString(), y: yTop + availableHeight * 0.5 },
      { label: Math.round(yMax * 0.25).toString(), y: yTop + availableHeight * 0.75 },
      { label: '0', y: yBaseline }
    ]

    return { points, linePath, areaPath, gridLines, yBaseline }
  }, [demandTrend])

  // 3. Dynamic SVG Calculations for Donut Chart
  const donutMetrics = useMemo(() => {
    if (!itemAllocation || !itemAllocation.allocations || itemAllocation.allocations.length === 0) {
      return null
    }

    const R = 58
    const C = 2 * Math.PI * R // ~364.42
    const totalItems = itemAllocation.totalItems || 1

    let cumulativeOffset = 0
    const slices = itemAllocation.allocations.map((alloc, idx) => {
      const color = DONUT_COLORS[idx % DONUT_COLORS.length]
      const count = alloc.itemsCount || 0
      const dashLength = (count / totalItems) * C
      const dashOffset = -cumulativeOffset
      cumulativeOffset += dashLength

      return {
        ...alloc,
        color,
        dashLength,
        dashOffset,
        percentage: Math.round((count / totalItems) * 100)
      }
    })

    return { R, C, slices, totalItems: itemAllocation.totalItems, demandCode: itemAllocation.demandCode }
  }, [itemAllocation])

  return (
    <div className="space-y-7">
      {/* Top Welcome & Real-time Live Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-[#0e743d] to-emerald-800 rounded-3xl p-4 sm:p-8 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute right-0 top-0 -translate-y-1/3 translate-x-1/4 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold mb-2 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live MongoDB Synchronization
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {storedAdmin?.shopName || 'Mirch Masala Grocery Shop'}
            </h1>
            <p className="text-sm text-emerald-100/90 mt-1 max-w-xl">
              Real-time Grocery Procurement, Vendor Bidding, Auto-Allocation & Purchase Order Tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Sync Now Button */}
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-2 border border-white/20 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh all metrics from MongoDB"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              <span>{refreshing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            {/* Quick Create Demand Button */}
            <Link
              to="/demands"
              className="px-5 py-2.5 rounded-xl bg-white text-[#0e743d] font-bold text-xs shadow-md hover:bg-emerald-50 transition-all cursor-pointer flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ Create Demand</span>
            </Link>
          </div>
        </div>

        {/* Real-time Subbar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-white/10 text-xs text-emerald-200">
          <div className="flex items-center gap-4">
            <span>
              Total Orders Spend: <strong className="text-white font-bold">₹{kpis.totalSpend.toLocaleString('en-IN')}</strong>
            </span>
            <span className="hidden sm:inline opacity-40">•</span>
            <span className="hidden sm:inline">
              Active Demands: <strong className="text-white font-bold">{kpis.activeDemands}</strong>
            </span>
          </div>
          <span className="text-[11px] text-emerald-300/80">
            Last Synced: {lastRefreshedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Top 4 Stats Cards */}
      {loading ? (
        <KpiCardsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <Link
              key={stat.id}
              to={stat.link}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:border-emerald-300 group cursor-pointer"
            >
              {/* Icon box */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${stat.bgColor} ${stat.iconColor} group-hover:scale-105 transition-transform`}
              >
                {stat.icon}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 mb-0.5 truncate">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                  {stat.subtext}
                </p>
              </div>

              <div className="text-slate-300 group-hover:text-emerald-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Charts Section: Demand Trend & Item Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Chart: Demand Trend (Last 6 Demands) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">
                Demand Trend (Last 6 Demands)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Item volume and quotation bidding activity across recent published demands
              </p>
            </div>
            <Link
              to="/demands"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              View Demands →
            </Link>
          </div>

          <div className="w-full flex-1 flex flex-col items-center justify-center pt-2 min-h-[220px]">
            {loading ? (
              <ChartSkeleton height="h-56" />
            ) : !trendMetrics || trendMetrics.points.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">No Demand Trends Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Publish demands with grocery items to visualize bidding patterns and quantity trends.
                </p>
                <Link
                  to="/demands"
                  className="px-4 py-2 bg-[#0e743d] text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  + Create Demand
                </Link>
              </div>
            ) : (
              <div className="w-full relative">
                <svg
                  viewBox="0 0 460 230"
                  className="w-full h-auto max-h-[260px] overflow-visible"
                >
                  <defs>
                    <linearGradient id="demandTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines & Y Axis Labels */}
                  {trendMetrics.gridLines.map((grid, idx) => (
                    <g key={idx}>
                      <text
                        x="35"
                        y={grid.y + 4}
                        fontSize="11"
                        fill="#94a3b8"
                        textAnchor="end"
                        fontFamily="sans-serif"
                      >
                        {grid.label}
                      </text>
                      <line
                        x1="45"
                        y1={grid.y}
                        x2="445"
                        y2={grid.y}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                    </g>
                  ))}

                  {/* Shaded Area under Curve */}
                  <path d={trendMetrics.areaPath} fill="url(#demandTrendGrad)" />

                  {/* Dynamic Green Trend Line */}
                  <path
                    d={trendMetrics.linePath}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Point Dots & X-Axis Labels */}
                  {trendMetrics.points.map((point, idx) => (
                    <g
                      key={point.id || idx}
                      onMouseEnter={() => setHoveredTrendIndex(idx)}
                      onMouseLeave={() => setHoveredTrendIndex(null)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={hoveredTrendIndex === idx ? 7 : 4.5}
                        fill="#22c55e"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        className="transition-all duration-200"
                      />
                      <text
                        x={point.x}
                        y="218"
                        fontSize="11"
                        fontWeight="600"
                        fill={hoveredTrendIndex === idx ? '#0e743d' : '#64748b'}
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        {point.label}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Point Hover Tooltip Overlay */}
                {hoveredTrendIndex !== null && trendMetrics.points[hoveredTrendIndex] && (
                  <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-150">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-400">
                        {trendMetrics.points[hoveredTrendIndex].demandCode}
                      </span>
                      <span>
                        Items: <strong>{trendMetrics.points[hoveredTrendIndex].itemsCount}</strong>
                      </span>
                      <span>
                        Total Qty: <strong>{trendMetrics.points[hoveredTrendIndex].totalQuantity} units</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-800/80 px-2 py-0.5 rounded text-[11px]">
                        {trendMetrics.points[hoveredTrendIndex].bidsCount} Quotes Received
                      </span>
                      <span className="text-slate-400 capitalize">
                        {trendMetrics.points[hoveredTrendIndex].status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Chart: Item Allocation (Last Allocated Demand) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">
                Item Allocation (Last Demand)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {donutMetrics
                  ? `Procurement share for ${donutMetrics.demandCode}`
                  : 'Allocation breakdown of awarded purchase orders'}
              </p>
            </div>
            <Link
              to="/allocations"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Allocate →
            </Link>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4">
            {loading ? (
              <ChartSkeleton height="h-56" />
            ) : !donutMetrics ? (
              <div className="text-center py-10 px-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">No Allocations Recorded Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                  Once vendors bid and you confirm allocations, vendor procurement share will render here.
                </p>
                <Link
                  to="/allocations"
                  className="px-4 py-2 bg-emerald-50 text-[#0e743d] border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  Go to Allocations Matrix
                </Link>
              </div>
            ) : (
              <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-6">
                {/* SVG Donut Chart */}
                <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    {/* Background circle track */}
                    <circle
                      cx="80"
                      cy="80"
                      r={donutMetrics.R}
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="22"
                    />

                    {/* Dynamic colored vendor allocation arcs */}
                    {donutMetrics.slices.map((slice, i) => (
                      <circle
                        key={i}
                        cx="80"
                        cy="80"
                        r={donutMetrics.R}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="22"
                        strokeDasharray={`${slice.dashLength.toFixed(2)} ${donutMetrics.C.toFixed(2)}`}
                        strokeDashoffset={slice.dashOffset.toFixed(2)}
                        strokeLinecap="butt"
                        className="transition-all duration-300"
                      />
                    ))}
                  </svg>

                  {/* Donut Center Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none text-center">
                    <span className="text-2xl font-black text-slate-900 leading-none">
                      {donutMetrics.totalItems}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      Allocated
                    </span>
                  </div>
                </div>

                {/* Vendor Legend */}
                <div className="space-y-3.5 w-full sm:w-auto">
                  {donutMetrics.slices.map((slice, i) => (
                    <div key={i} className="flex items-center justify-between sm:justify-start gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px]" title={slice.vendorName}>
                          {slice.vendorName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">
                          {slice.itemsCount} items
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1.5 font-medium">
                          ({slice.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Live Pipeline: Active Demands With Countdown Timers */}
      <div className="bg-white rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-[17px] font-bold text-slate-900">
                Live Active Demands (48-Hr Bidding Window)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Demands currently open for vendor bids with live countdowns
            </p>
          </div>
          <Link
            to="/demands"
            className="text-xs font-bold text-[#0e743d] hover:underline"
          >
            Manage All Demands ({kpis.totalDemands}) →
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={3} cols={6} />
        ) : recentActiveDemands.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-slate-700">No active demands currently open</p>
            <p className="text-xs text-slate-400 mt-1 mb-3">Create a new grocery demand to start receiving quotes from registered vendors.</p>
            <Link
              to="/demands"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0e743d] text-white text-xs font-bold rounded-xl"
            >
              + Create New Demand
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-1">Demand Code</th>
                  <th className="pb-3">Items Count</th>
                  <th className="pb-3">Published At</th>
                  <th className="pb-3">Bidding Window Deadline</th>
                  <th className="pb-3">Quotations Received</th>
                  <th className="pb-3 text-right pr-1">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActiveDemands.map((demand) => {
                  const deadlineInfo = getDeadlineBadge(demand.deadlineAt)
                  return (
                    <tr key={demand._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pl-1 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {demand.demandCode}
                      </td>
                      <td className="py-3.5 font-medium text-slate-700">
                        {demand.itemsCount} grocery items
                      </td>
                      <td className="py-3.5 text-slate-500">
                        {demand.publishedAt
                          ? new Date(demand.publishedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${deadlineInfo.color}`}>
                          {deadlineInfo.text}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-slate-800">
                          {demand.bidsCount} Quotes
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-1">
                        <button
                          type="button"
                          onClick={() => navigate('/quotations')}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0e743d] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          View Bids →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dual Activity Stream: Recent Quotations & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Recent Vendor Quotations Stream */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Vendor Quotations
                </h3>
                <p className="text-xs text-slate-400">Latest bids submitted via Vendor Mobile App</p>
              </div>
              <Link to="/quotations" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                View All →
              </Link>
            </div>

            {loading ? (
              <ListSkeleton count={3} />
            ) : recentQuotations.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No vendor quotations recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {recentQuotations.map((q) => (
                  <div
                    key={q._id}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {q.vendorName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Demand: <strong className="text-emerald-700">{q.demandCode}</strong> • {q.itemsCount} items quoted
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        Quote In
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(q.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-center">
            <Link
              to="/quotations"
              className="text-xs font-bold text-[#0e743d] hover:underline"
            >
              Open Comparison Matrix (L1 Analysis)
            </Link>
          </div>
        </div>

        {/* Right: Recent Purchase Orders Dispatched */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Purchase Orders
                </h3>
                <p className="text-xs text-slate-400">Orders finalized from LEB / L1 allocations</p>
              </div>
              <Link to="/allocations" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                View All →
              </Link>
            </div>

            {loading ? (
              <ListSkeleton count={3} />
            ) : recentOrders.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No purchase orders created yet.</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((o) => (
                  <div
                    key={o._id}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {o.vendorName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        PO for <strong className="text-emerald-700">{o.demandCode}</strong> • {o.itemsCount} items
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-slate-900">
                        ₹{(o.totalOrderAmount || 0).toLocaleString('en-IN')}
                      </p>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#0e743d] border border-emerald-100 mt-0.5">
                        {o.status === 'PO_Dispatched' ? 'PO Dispatched' : o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-center">
            <Link
              to="/email-logs"
              className="text-xs font-bold text-[#0e743d] hover:underline"
            >
              View PO Email Dispatches Audit Trail
            </Link>
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <Link
          to="/vendors"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0e743d] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-800 block">Manage Vendors</span>
          <span className="text-[11px] text-slate-400">Invite, approve & APK share</span>
        </Link>

        <Link
          to="/item-master"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-800 block">Item Master</span>
          <span className="text-[11px] text-slate-400">Grocery catalog & reference rates</span>
        </Link>

        <Link
          to="/quotations"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-800 block">Compare Quotations</span>
          <span className="text-[11px] text-slate-400">Side-by-side L1/L2 evaluation</span>
        </Link>

        <Link
          to="/reports"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-800 block">Reports & Analytics</span>
          <span className="text-[11px] text-slate-400">Rate trends & CSV exports</span>
        </Link>
      </div>

    </div>
  )
}
