'use client'

import { useState, useEffect, useCallback, type KeyboardEvent } from 'react'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Number of decimal places to display */
  decimals?: number
  /** Prefix to show before the number (e.g., "$") */
  prefix?: string
  /** Suffix to show after the number (e.g., "per week") */
  suffix?: string
  className?: string
  disabled?: boolean
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  decimals = 0,
  prefix,
  suffix,
  className = '',
  disabled = false,
}: NumberInputProps) {
  // Local state for the display value while editing
  const [localValue, setLocalValue] = useState(value.toFixed(decimals))
  const [isFocused, setIsFocused] = useState(false)

  // Sync local value when external value changes (and not focused)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value.toFixed(decimals))
    }
  }, [value, decimals, isFocused])

  const clampValue = useCallback(
    (val: number): number => {
      let clamped = val
      if (min !== undefined) clamped = Math.max(min, clamped)
      if (max !== undefined) clamped = Math.min(max, clamped)
      return clamped
    },
    [min, max]
  )

  const commitValue = useCallback(() => {
    const parsed = parseFloat(localValue)
    if (isNaN(parsed)) {
      // Reset to current value if invalid
      setLocalValue(value.toFixed(decimals))
    } else {
      const clamped = clampValue(parsed)
      setLocalValue(clamped.toFixed(decimals))
      if (clamped !== value) {
        onChange(clamped)
      }
    }
  }, [localValue, value, decimals, clampValue, onChange])

  const handleBlur = () => {
    setIsFocused(false)
    commitValue()
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    // Select all text on focus for easy replacement
    e.target.select()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setLocalValue(value.toFixed(decimals))
      e.currentTarget.blur()
    }
  }

  const increment = () => {
    const newValue = clampValue(value + step)
    onChange(newValue)
    setLocalValue(newValue.toFixed(decimals))
  }

  const decrement = () => {
    const newValue = clampValue(value - step)
    onChange(newValue)
    setLocalValue(newValue.toFixed(decimals))
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {prefix && <span className="text-gray-500 text-sm">{prefix}</span>}
      <div className="flex items-center">
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || (min !== undefined && value <= min)}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-l-xl border-2 border-r-0 border-gray-200 text-gray-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-100"
          aria-label="Decrease value"
        >
          −
        </button>
        <input
          type="text"
          inputMode="decimal"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-16 px-2 py-2 text-center border-2 border-gray-200 bg-white text-gray-800 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
        />
        <button
          type="button"
          onClick={increment}
          disabled={disabled || (max !== undefined && value >= max)}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-r-xl border-2 border-l-0 border-gray-200 text-gray-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-100"
          aria-label="Increase value"
        >
          +
        </button>
      </div>
      {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
    </div>
  )
}
