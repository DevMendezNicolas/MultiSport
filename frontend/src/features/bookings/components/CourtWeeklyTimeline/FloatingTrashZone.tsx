import React from 'react'
import { ArrowDown, Trash2 } from 'lucide-react'

interface FloatingTrashZoneProps {
  isDragging: boolean
  isOverTrash: boolean
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export const FloatingTrashZone: React.FC<FloatingTrashZoneProps> = ({
  isDragging,
  isOverTrash,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}) => {
  if (!isDragging) return null

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-8 py-3.5 rounded-full shadow-2xl flex items-center gap-4 transition-all duration-200 select-none backdrop-blur-md cursor-pointer border ${
        isOverTrash
          ? 'scale-110 bg-[#DC2626] border-white text-white ring-4 ring-red-500/50'
          : 'bg-[#93000a]/90 border-red-500/40 text-red-100 hover:scale-105'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          isOverTrash ? 'bg-white text-[#DC2626]' : 'bg-[#DC2626] text-white animate-bounce'
        }`}
      >
        <Trash2 className="h-5 w-5" strokeWidth={2} />
      </div>

      <div className="flex flex-col">
        <span className="font-headline text-xs uppercase tracking-wider font-extrabold text-white">
          Zona de Descarte & Anulación
        </span>
        <span className="text-[11px] opacity-90">
          Arrastre el turno aquí para solicitar cancelación y liberar horario
        </span>
      </div>

      <ArrowDown className="h-4 w-4 opacity-80 animate-pulse" strokeWidth={2} />
    </div>
  )
}
