import React from 'react'
import { resolveCourtImage } from './CourtVisualSystem'

interface CourtImagePreviewProps {
  firstSportName?: string
  surfaceType: string
  isCovered: boolean
  hasLighting: boolean
  durationMinutes: number
  basePrice: number
}

export const CourtImagePreview: React.FC<CourtImagePreviewProps> = ({
  firstSportName,
  surfaceType,
  isCovered,
  hasLighting,
  durationMinutes,
  basePrice,
}) => {
  const resolution = React.useMemo(() => {
    return resolveCourtImage(firstSportName, surfaceType)
  }, [firstSportName, surfaceType])

  const formattedPrice = React.useMemo(() => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(basePrice || 0)
  }, [basePrice])

  return (
    <aside className="bg-[#1E2027] border border-[#31343E] rounded-2xl p-5 flex flex-col justify-between shadow-xl sticky top-24 space-y-5">
      <div>
        <div className="flex items-center justify-between border-b border-[#31343E] pb-3 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F2F3F5] font-headline">
            Vista Previa de Cancha
          </h3>
          <span className="text-xs font-mono font-bold text-[#327357] bg-[#258653]/15 px-2 py-0.5 rounded-md border border-[#327357]/30">
            {firstSportName ? firstSportName : 'Sin deporte'}
          </span>
        </div>

        {/* Marco de Imagen Vertical Limpio */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] bg-[#16181D] overflow-hidden border border-[#31343E] rounded-xl">
          <img
            src={resolution.imageUrl}
            alt={resolution.caption}
            className="w-full h-full object-cover transition-all duration-500"
          />
        </div>
      </div>

      {/* Ficha Técnica de la Configuración en Tiempo Real */}
      <div className="pt-2 border-t border-[#31343E] space-y-2.5">
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#9497A1]">
          Parámetros Asignados
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#16181D] border border-[#31343E] rounded-xl p-2.5">
            <span className="text-[10px] font-mono font-bold text-[#9497A1] uppercase block">Tarifa Base</span>
            <span className="font-bold font-mono text-[#327357] text-base">{formattedPrice}</span>
          </div>

          <div className="bg-[#16181D] border border-[#31343E] rounded-xl p-2.5">
            <span className="text-[10px] font-mono font-bold text-[#9497A1] uppercase block">Duración Turno</span>
            <span className="font-bold font-mono text-[#F2F3F5] text-base">{durationMinutes || 60} min</span>
          </div>

          <div className="bg-[#16181D] border border-[#31343E] rounded-xl p-2.5">
            <span className="text-[10px] font-mono font-bold text-[#9497A1] uppercase block">Estructura</span>
            <span className="font-bold text-[#F2F3F5] text-sm">{isCovered ? 'Techada' : 'Al aire libre'}</span>
          </div>

          <div className="bg-[#16181D] border border-[#31343E] rounded-xl p-2.5">
            <span className="text-[10px] font-mono font-bold text-[#9497A1] uppercase block">Iluminación</span>
            <span className="font-bold text-[#F2F3F5] text-sm">{hasLighting ? 'Con luz' : 'Sin luz'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
