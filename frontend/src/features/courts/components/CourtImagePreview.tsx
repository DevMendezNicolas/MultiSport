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
    <aside className="bg-white border border-neutral-300 p-5 flex flex-col justify-between shadow-sm sticky top-24 space-y-5">
      <div>
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-950">
            Vista Previa de Cancha
          </h3>
          <span className="text-xs font-mono font-bold text-neutral-700">
            {firstSportName ? firstSportName : 'Sin deporte'}
          </span>
        </div>

        {/* Marco de Imagen Vertical Limpio */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] bg-neutral-100 overflow-hidden border border-neutral-300">
          <img
            src={resolution.imageUrl}
            alt={resolution.caption}
            className="w-full h-full object-cover transition-all duration-500"
          />
        </div>
      </div>

      {/* Ficha Técnica de la Configuración en Tiempo Real */}
      <div className="pt-2 border-t border-neutral-200 space-y-2.5">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-800">
          Parámetros Asignados
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#FAF8F5] border border-neutral-300 p-2.5">
            <span className="text-xs font-mono font-bold text-neutral-700 uppercase block">Tarifa Base</span>
            <span className="font-bold font-mono text-neutral-950 text-base">{formattedPrice}</span>
          </div>

          <div className="bg-[#FAF8F5] border border-neutral-300 p-2.5">
            <span className="text-xs font-mono font-bold text-neutral-700 uppercase block">Duración Turno</span>
            <span className="font-bold font-mono text-neutral-950 text-base">{durationMinutes || 60} min</span>
          </div>

          <div className="bg-[#FAF8F5] border border-neutral-300 p-2.5">
            <span className="text-xs font-mono font-bold text-neutral-700 uppercase block">Estructura</span>
            <span className="font-bold text-neutral-950 text-sm">{isCovered ? 'Techada' : 'Al aire libre'}</span>
          </div>

          <div className="bg-[#FAF8F5] border border-neutral-300 p-2.5">
            <span className="text-xs font-mono font-bold text-neutral-700 uppercase block">Iluminación</span>
            <span className="font-bold text-neutral-950 text-sm">{hasLighting ? 'Con reflectores' : 'Sin luz'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
