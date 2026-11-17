import React from 'react'

/**
 * Base shimmering pulse block
 */
export function SkeletonBase({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded-xl ${className}`}
    />
  )
}

/**
 * Table Skeleton Loader
 * Renders realistic shimmering rows inside any table or as a standalone table card
 */
export function TableSkeleton({ rows = 5, cols = 5, className = '' }) {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <th key={cIdx} className="py-4 px-6">
                <SkeletonBase className="h-4 w-20 sm:w-28" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/30">
              {Array.from({ length: cols }).map((_, cIdx) => (
                <td key={cIdx} className="py-4 px-6">
                  {cIdx === 0 ? (
                    <div className="flex items-center gap-3">
                      <SkeletonBase className="w-8 h-8 rounded-lg shrink-0" />
                      <SkeletonBase className="h-4 w-28" />
                    </div>
                  ) : cIdx === cols - 1 ? (
                    <div className="flex items-center justify-end gap-2">
                      <SkeletonBase className="h-8 w-16 rounded-lg" />
                    </div>
                  ) : (
                    <SkeletonBase className={`h-4 ${cIdx % 2 === 0 ? 'w-24' : 'w-32'}`} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * KPI Stat Cards Skeleton Loader (Top 4 stats)
 */
export function KpiCardsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4"
        >
          {/* Icon box placeholder */}
          <SkeletonBase className="w-14 h-14 rounded-2xl shrink-0" />

          {/* Texts placeholder */}
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBase className="h-3.5 w-20" />
            <SkeletonBase className="h-6 w-28" />
            <SkeletonBase className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Chart Skeleton Loader (for Trend & Donut charts)
 */
export function ChartSkeleton({ height = 'h-64' }) {
  return (
    <div className={`w-full ${height} flex flex-col justify-between p-4 space-y-4`}>
      <div className="flex items-center justify-between">
        <SkeletonBase className="h-4 w-36" />
        <SkeletonBase className="h-4 w-20" />
      </div>
      <div className="flex-1 flex items-end gap-3 pt-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBase
            key={i}
            className="flex-1 rounded-t-lg"
            style={{ height: `${30 + ((i * 17) % 60)}%` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBase key={i} className="h-3 w-10" />
        ))}
      </div>
    </div>
  )
}

/**
 * List Item Skeleton (for Recent Quotations & Orders)
 */
export function ListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/40 flex items-center justify-between gap-3"
        >
          <div className="space-y-2 flex-1">
            <SkeletonBase className="h-4 w-36" />
            <SkeletonBase className="h-3 w-48" />
          </div>
          <div className="space-y-2 text-right">
            <SkeletonBase className="h-5 w-16 rounded-md ml-auto" />
            <SkeletonBase className="h-3 w-12 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Form Skeleton (for Settings Page and Profile Load)
 */
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBase className="h-5 w-40" />
        <SkeletonBase className="h-3 w-64" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <SkeletonBase className="h-4 w-28" />
          <SkeletonBase className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <SkeletonBase className="h-4 w-28" />
          <SkeletonBase className="h-11 w-full rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <SkeletonBase className="h-4 w-28" />
          <SkeletonBase className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <SkeletonBase className="h-4 w-28" />
          <SkeletonBase className="h-11 w-full rounded-xl" />
        </div>
      </div>

      <div className="space-y-2">
        <SkeletonBase className="h-4 w-36" />
        <SkeletonBase className="h-11 w-full rounded-xl" />
      </div>

      <div className="pt-2">
        <SkeletonBase className="h-11 w-36 rounded-xl" />
      </div>
    </div>
  )
}

/**
 * Active Demand Details & Countdown Skeleton
 */
export function DemandDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SkeletonBase className="h-7 w-48 rounded-lg" />
          <SkeletonBase className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBase className="h-9 w-32 rounded-xl" />
          <SkeletonBase className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-[#f0fbf5] rounded-2xl p-6 sm:p-7 flex items-center justify-center gap-6">
          <SkeletonBase className="w-14 h-14 rounded-full shrink-0" />
          <div className="space-y-2">
            <SkeletonBase className="h-4 w-28" />
            <SkeletonBase className="h-8 w-48" />
          </div>
        </div>
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-center gap-4">
          <SkeletonBase className="h-10 w-full rounded-xl" />
          <SkeletonBase className="h-10 w-full rounded-xl" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4">
        <SkeletonBase className="h-6 w-32" />
        <TableSkeleton rows={4} cols={5} />
      </div>
    </div>
  )
}
