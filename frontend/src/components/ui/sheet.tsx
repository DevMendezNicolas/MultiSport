import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  side?: 'right' | 'bottom'
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  children,
  className,
  side = 'right',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed inset-0 z-50 flex',
        side === 'right' ? 'justify-end items-stretch' : 'justify-center items-end'
      )}
    >
      {/* Backdrop sutil que preserva el contexto de fondo */}
      <div
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content Container */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative z-50 flex flex-col bg-white shadow-2xl transition-all duration-300 ease-out',
          // Desktop y mobile adaptivo para side right
          side === 'right' &&
            'w-full max-sm:max-h-[92vh] max-sm:rounded-t-2xl max-sm:border-t sm:h-full sm:max-w-md md:max-w-lg lg:max-w-xl sm:border-l border-neutral-300 animate-in max-sm:slide-in-from-bottom sm:slide-in-from-right',
          // Side bottom explícito
          side === 'bottom' &&
            'w-full max-h-[92vh] border-t border-neutral-300 rounded-t-2xl self-end animate-in slide-in-from-bottom',
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export const SheetHeader: React.FC<{
  children: React.ReactNode
  className?: string
  onClose?: () => void
}> = ({ children, className, onClose }) => (
  <div
    className={cn(
      'flex items-center justify-between border-b border-neutral-200 px-5 sm:px-6 py-4 bg-white sticky top-0 z-10',
      className
    )}
  >
    <div className="flex-1 min-w-0">{children}</div>
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="min-h-[44px] min-w-[44px] -mr-2 p-2 flex items-center justify-center text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
        aria-label="Cerrar panel"
      >
        <X className="h-5 w-5" strokeWidth={2} />
      </button>
    )}
  </div>
)

export const SheetBody: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('flex-1 overflow-y-auto px-5 sm:px-6 py-5', className)}>
    {children}
  </div>
)

export const SheetFooter: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div
    className={cn(
      'border-t border-neutral-200 px-5 sm:px-6 py-4 bg-[#FAF8F5] sticky bottom-0 z-10 flex items-center justify-end gap-3',
      className
    )}
  >
    {children}
  </div>
)
