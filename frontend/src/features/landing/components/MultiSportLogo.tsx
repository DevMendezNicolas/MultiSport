import React from 'react'

interface MultiSportLogoProps {
  className?: string
  showText?: boolean
  variant?: 'light' | 'dark'
  accent?: 'sport' | 'neutral' | 'red'
}

export const MultiSportLogo: React.FC<MultiSportLogoProps> = ({
  className = '',
  showText = true,
  variant = 'light',
  accent = 'sport',
}) => {
  const isDark = variant === 'dark'
  const isSport = accent === 'sport' || accent === 'red'

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Isotipo geométrico de red deportiva / canchas entrelazadas */}
      <div
        className={`relative h-9 w-9 rounded-xl flex items-center justify-center p-1.5 shadow-sm overflow-hidden flex-shrink-0 transition-colors ${
          isSport ? 'bg-brand-sport text-white' : 'bg-neutral-800 text-white'
        }`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Trama diagonal deportiva entrelazada */}
          <path
            d="M6 6L26 26M26 6L6 26"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M16 4V28M4 16H28"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="2 4"
            opacity="0.8"
          />
          <circle cx="16" cy="16" r="3" fill="currentColor" />
        </svg>
      </div>

      {showText && (
        <span className="flex items-baseline gap-0.5">
          <span
            className={`font-black text-xl tracking-tight lowercase ${
              isDark ? 'text-neutral-950' : 'text-white'
            }`}
          >
            multisport
          </span>
          <span
            className={`text-[10px] font-bold ${
              isSport ? 'text-brand-sport' : 'text-neutral-400'
            }`}
          >
            ®
          </span>
        </span>
      )}
    </div>
  )
}
