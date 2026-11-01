import React, { useState, useEffect } from 'react'

interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number
  onChange: (value: number) => void
  allowZero?: boolean
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  allowZero = false,
  placeholder,
  className,
  onBlur,
  ...rest
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (!allowZero && value === 0) return ''
    return String(value)
  })

  useEffect(() => {
    if (displayValue === '' && value === 0) {
      return
    }
    const parsedDisplay = Number(displayValue)
    if (Number.isNaN(parsedDisplay) || parsedDisplay !== value) {
      setDisplayValue(!allowZero && value === 0 ? '' : String(value))
    }
  }, [value, allowZero, displayValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') {
      setDisplayValue('')
      onChange(0)
      return
    }

    // Permitir únicamente dígitos enteros positivos
    if (!/^\d+$/.test(raw)) {
      return
    }

    const normalized = raw.replace(/^0+(?=\d)/, '')
    setDisplayValue(normalized)
    onChange(Number(normalized))
  }

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={className}
    />
  )
}

