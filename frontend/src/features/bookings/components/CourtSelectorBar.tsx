import React from 'react'
import { BarChart3, DollarSign, Layers } from 'lucide-react'
import type { DailyGridCourtItem } from '../types'

interface CourtSelectorBarProps {
  courts: DailyGridCourtItem[]
  activeCourtId: string | null
  weeklyOccupancy: number
  weeklyProjectedIncome: number
  onSelectCourt: (courtId: string) => void
}

export const CourtSelectorBar: React.FC<CourtSelectorBarProps> = ({
  courts,
  activeCourtId,
  weeklyOccupancy,
  weeklyProjectedIncome,
  onSelectCourt,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-3 bg-[#22242B] px-4 rounded-xl border border-[#31343E] shadow-sm">
      {/* Pestañas de Selección de Cancha */}
      <div
        id="court-selector-bar"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0"
      >
        {courts.map((court) => {
          const isActive = court.courtId === activeCourtId
          return (
            <button
              key={court.courtId}
              type="button"
              onClick={() => onSelectCourt(court.courtId)}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#D46211] text-white shadow-sm font-bold'
                  : 'bg-[#17181C] text-[#9497A1] hover:text-[#F2F3F5] hover:bg-[#292A2E] border border-[#31343E]/60'
              }`}
            >
              <Layers className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{court.courtName}</span>
              {isActive && (
                <span className="text-[10px] bg-black/20 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                  ACTIVA
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Métricas Rápidas Semanales */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-[#17181C] px-3.5 py-1.5 rounded-lg border border-[#31343E]/60 text-xs">
          <BarChart3 className="h-4 w-4 text-[#D46211]" strokeWidth={1.75} />
          <span className="text-[#9497A1] uppercase font-semibold text-[11px]">
            Ocupación Semanal:
          </span>
          <span className="font-headline font-bold text-[#D46211]">
            {weeklyOccupancy}%
          </span>
        </div>

        <div className="flex items-center gap-2 bg-[#17181C] px-3.5 py-1.5 rounded-lg border border-[#31343E]/60 text-xs">
          <DollarSign className="h-4 w-4 text-[#327357]" strokeWidth={1.75} />
          <span className="text-[#9497A1] uppercase font-semibold text-[11px]">
            Recaudación Semanal:
          </span>
          <span className="font-headline font-bold text-[#327357]">
            ${weeklyProjectedIncome.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    </div>
  )
}
