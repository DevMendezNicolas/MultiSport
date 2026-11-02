import React from 'react'
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react'

interface TimelineCommandBarProps {
  startDateStr: string
  onPrevWeek: () => void
  onNextWeek: () => void
  onGoToToday: () => void
  onOpenNewBooking: () => void
}

export const TimelineCommandBar: React.FC<TimelineCommandBarProps> = ({
  startDateStr,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
  onOpenNewBooking,
}) => {
  // Calcular rango legible de 7 días (ej. 26 Oct - 01 Nov)
  const rangeLabel = React.useMemo(() => {
    const [y, m, d] = startDateStr.split('-').map(Number)
    const start = new Date(y, m - 1, d)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    const formatShort = (date: Date) =>
      `${date.getDate()} ${date.toLocaleDateString('es-AR', { month: 'short' })}`

    return `${formatShort(start)} - ${formatShort(end)}`
  }, [startDateStr])

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#22242B] p-3.5 rounded-xl border border-[#31343E]">
      {/* Navegación de Fechas */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-[#17181C] rounded-lg p-1 border border-[#31343E]/60">
          <button
            type="button"
            onClick={onPrevWeek}
            className="p-1.5 rounded text-[#9497A1] hover:text-white hover:bg-[#22242B] transition-colors"
            title="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>

          <div className="px-3 py-1 text-[#F2F3F5] flex items-center gap-2 text-xs font-bold font-headline">
            <Calendar className="h-3.5 w-3.5 text-[#D46211]" strokeWidth={2} />
            <span>Semana {rangeLabel}</span>
          </div>

          <button
            type="button"
            onClick={onNextWeek}
            className="p-1.5 rounded text-[#9497A1] hover:text-white hover:bg-[#22242B] transition-colors"
            title="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <button
          type="button"
          onClick={onGoToToday}
          className="bg-[#292A2E] hover:bg-[#31343E] text-[#F2F3F5] px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-[#31343E]"
        >
          <Calendar className="h-3.5 w-3.5 text-[#D46211]" strokeWidth={2} />
          <span>Ir a Hoy</span>
        </button>
      </div>

      {/* Leyenda de Estados Cromáticos */}
      <div className="flex flex-wrap items-center gap-3 bg-[#17181C] px-3.5 py-2 rounded-lg border border-[#31343E]/60 text-xs text-[#9497A1]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#327357]" />
          <span>Pagado Total</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#D46211]" />
          <span>Seña / Saldo</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-[#D46211] bg-[#22242B]" />
          <span>Sin Seña</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded border border-[#31343E]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, #17181C, #17181C 2px, #31343E 2px, #31343E 4px)',
            }}
          />
          <span>Mantenimiento</span>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenNewBooking}
          className="bg-[#D46211] hover:bg-[#E37A24] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg transition-transform active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          <span>Nuevo Turno</span>
        </button>
      </div>
    </div>
  )
}
