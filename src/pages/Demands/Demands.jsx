import React, { useState, useEffect } from 'react'
import ActiveDemand from './ActiveDemand'
import CreateDemand from './CreateDemand'
import { demandService } from '../../services/api'
import { DemandDetailSkeleton } from '../../components/common/Skeleton'

export default function Demands() {
  const [demandView, setDemandView] = useState('active') // 'active' | 'create'
  const [activeDemand, setActiveDemand] = useState(null)
  const [allDemands, setAllDemands] = useState([])
  const [selectedDemand, setSelectedDemand] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch active demand and full demands history from MongoDB
  const loadDemandsData = async () => {
    try {
      setLoading(true)
      const [activeRes, allRes] = await Promise.all([
        demandService.getActiveDemand().catch(() => null),
        demandService.getDemands().catch(() => [])
      ])

      const demandsList = Array.isArray(allRes) ? allRes : allRes?.data || []
      setAllDemands(demandsList)
      setActiveDemand(activeRes || null)

      // If an active demand exists, default to it
      if (activeRes) {
        setSelectedDemand(activeRes)
      } else if (demandsList.length > 0) {
        // Otherwise default to the latest created demand
        setSelectedDemand(demandsList[0])
      } else {
        setSelectedDemand(null)
      }
    } catch (err) {
      console.error('Failed to load demands:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDemandsData()
  }, [])

  // When admin creates a new demand
  const handleDemandCreated = (newDemand) => {
    setActiveDemand(newDemand)
    setSelectedDemand(newDemand)
    setAllDemands((prev) => [newDemand, ...prev])
    setDemandView('active')
  }

  // Switch which demand is viewed
  const handleSelectDemand = (demandId) => {
    const found = allDemands.find((d) => d._id === demandId)
    if (found) {
      setSelectedDemand(found)
    }
  }

  return (
    <div className="space-y-4">
      {/* Sub-view switcher pill */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setDemandView('active')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              demandView === 'active'
                ? 'bg-white text-[#0e743d] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {activeDemand && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
            <span className="truncate">
              {activeDemand
                ? `Live Active Demand (${activeDemand.demandCode})`
                : selectedDemand
                ? `Demand (${selectedDemand.demandCode})`
                : 'Active Demand'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDemandView('create')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              demandView === 'create'
                ? 'bg-white text-[#0e743d] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>Create New Demand</span>
          </button>
        </div>

        {allDemands.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span>Total Demands:</span>
            <span className="font-bold text-slate-800">{allDemands.length}</span>
          </div>
        )}
      </div>

      {loading ? (
        <DemandDetailSkeleton />
      ) : demandView === 'active' ? (
        <ActiveDemand
          demand={selectedDemand}
          allDemands={allDemands}
          onSelectDemand={handleSelectDemand}
          onSwitchToCreate={() => setDemandView('create')}
          onRefreshDemand={loadDemandsData}
        />
      ) : (
        <CreateDemand
          onBack={() => setDemandView('active')}
          onDemandCreated={handleDemandCreated}
        />
      )}
    </div>
  )
}
