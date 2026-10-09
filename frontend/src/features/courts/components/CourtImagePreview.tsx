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
          <span className="text-[11px] font-mono uppercase tracking-widest text-brand-red font-bold">
            PREVISUALIZACIÓN DE CANCHA
          </span>
          <span className="text-[10px] font-mono uppercase text-neutral-500">
            {firstSportName ? `1er Deporte: ${firstSportName}` : 'Sin Deporte'}
          </span>
        </div>

        {/* Marco de Imagen Vertical */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] bg-neutral-100 overflow-hidden border border-neutral-200">
          <img
            src={resolution.imageUrl}
            alt={resolution.caption}
            className="w-full h-full object-cover transition-all duration-500"
          />
          <div className="absolute bottom-0 inset-x-0 bg-neutral-950/80 backdrop-blur-sm p-3 text-white">
            <p className="text-xs font-bold leading-tight tracking-tight">
              {resolution.caption}
            </p>
            <p className="text-[10px] font-mono text-neutral-300 mt-0.5">
              Superficie activa: {surfaceType || 'Por definir'}
            </p>
          </div>
        </div>
      </div>

      {/* Ficha Técnica de la Configuración en Tiempo Real */}
      <div className="pt-2 border-t border-neutral-200 space-y-2.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
          PARÁMETROS ASIGNADOS
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#FAF8F5] border border-neutral-200 p-2.5">
            <span className="text-[10px] font-mono text-neutral-500 uppercase block">Tarifa Base</span>
            <span className="font-bold text-neutral-950 text-sm">{formattedPrice}</span>
          </div>

          <div className="bg-[#FAF8F5] border border-neutral-200 p-2.5">
            <span className="text-[10px] font-mono text-neutral-500 uppercase block">Duración Turno</span>
            <span className="font-bold text-neutral-950 text-sm">{durationMinutes || 60} min</span>
          </div>

          <div className="bg-[#FAF8F5] border border-neutral-200 p-2.5">
            <span className="text-[10px] font-mono text-neutral-500 uppercase block">Estructura</span>
            <span className="font-medium text-neutral-800">{isCovered ? 'Techada' : 'Al aire libre'}</span>
          </div>

          <div className="bg-[#FAF8F5] border border-neutral-200 p-2.5">
            <span className="text-[10px] font-mono text-neutral-500 uppercase block">Iluminación</span>
            <span className="font-medium text-neutral-800">{hasLighting ? 'Con reflectores' : 'Sin luz'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
