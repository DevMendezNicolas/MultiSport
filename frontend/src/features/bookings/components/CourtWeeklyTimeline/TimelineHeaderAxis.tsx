import React from 'react'
import { Clock } from 'lucide-react'
import { TIMELINE_CONFIG } from '../../types/timeline.types'

interface HourHeaderInfo {
  hour: number
  label: string
  periodTag?: string
  isPeak?: boolean
}

const HOURS_DATA: HourHeaderInfo[] = [
  { hour: 8, label: '08:00', periodTag: 'MAÑANA' },
  { hour: 9, label: '09:00' },
  { hour: 10, label: '10:00' },
  { hour: 11, label: '11:00' },
  { hour: 12, label: '12:00', periodTag: 'MEDIODÍA' },
  { hour: 13, label: '13:00' },
  { hour: 14, label: '14:00', periodTag: 'MANTO' },
  { hour: 15, label: '15:00' },
  { hour: 16, label: '16:00' },
  { hour: 17, label: '17:00', periodTag: 'PRIME' },
  { hour: 18, label: '18:00', periodTag: 'PICOS', isPeak: true },
  { hour: 19, label: '19:00', isPeak: true },
  { hour: 20, label: '20:00', periodTag: '100%', isPeak: true },
  { hour: 21, label: '21:00' },
  { hour: 22, label: '22:00', periodTag: 'NOCHE' },
  { hour: 23, label: '23:00 - 00:00' },
]

export const TimelineHeaderAxis: React.FC = () => {
  return (
    <div className="flex sticky top-0 z-30 bg-[#22242B] border-b border-[#31343E] select-none shadow-sm">
      {/* Celda fija de esquina para Día / Fecha */}
      <div
        style={{ width: `${TIMELINE_CONFIG.dayColWidthPx}px` }}
        className="shrink-0 sticky left-0 z-40 bg-[#17181C] border-r border-[#31343E] px-4 py-3 flex items-center justify-between"
      >
        <span className="font-headline text-xs uppercase tracking-wider text-[#9497A1] font-bold">
          Día / Fecha
        </span>
        <Clock className="h-4 w-4 text-[#D46211]" strokeWidth={1.75} />
      </div>

      {/* Pista horizontal de horas y cuartos de hora */}
      <div className="flex flex-1">
        {HOURS_DATA.map((h) => {
          return (
            <div
              key={h.hour}
              className="w-[144px] shrink-0 flex flex-col border-r border-[#31343E]/60 bg-[#22242B]/80"
            >
              {/* Encabezado principal de la hora */}
              <div className="px-2 py-1.5 text-xs font-bold text-[#F2F3F5] flex items-center justify-between border-b border-[#31343E]/40">
                <span className={h.isPeak ? 'text-[#D46211]' : ''}>{h.label}</span>
                {h.periodTag && (
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-mono font-semibold ${
                      h.isPeak
                        ? 'bg-[#D46211]/20 text-[#D46211]'
                        : 'bg-[#17181C] text-[#9497A1]'
                    }`}
                  >
                    {h.periodTag}
                  </span>
                )}
              </div>

              {/* Sub-celdas de 15 minutos (:15, :30, :45, :60) con mayor tamaño y contraste */}
              <div className="grid grid-cols-4 text-center text-xs font-bold text-[#E2E4EB] py-1 bg-[#17181C]/80 divide-x divide-[#31343E]/40 font-mono tracking-tight">
                <span>:15</span>
                <span>:30</span>
                <span>:45</span>
                <span>:60</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
