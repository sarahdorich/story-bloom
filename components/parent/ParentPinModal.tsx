'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button, Card } from '@/components/ui'

type Mode = 'verify' | 'setup' | 'change'

interface ParentPinModalProps {
  mode: Mode
  onSuccess: () => void
  onCancel?: () => void
  onForgotPin?: () => void
}

export function ParentPinModal({ mode, onSuccess, onCancel, onForgotPin }: ParentPinModalProps) {
  const [pin, setPin] = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [currentPin, setCurrentPin] = useState(['', '', '', ''])
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>(() => {
    if (mode === 'change') return 'current'
    if (mode === 'setup') return 'new'
    return 'new' // verify mode
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const currentInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus first input on mount
  useEffect(() => {
    const refs = step === 'current' ? currentInputRefs : step === 'confirm' ? confirmInputRefs : inputRefs
    refs.current[0]?.focus()
  }, [step])

  const triggerShake = useCallback(() => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }, [])

  const handleInputChange = (
    index: number,
    value: string,
    pinState: string[],
    setPinState: (pin: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newPin = [...pinState]
    newPin[index] = value
    setPinState(newPin)
    setError('')

    // Auto-advance to next input
    if (value && index < 3) {
      refs.current[index + 1]?.focus()
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3 && newPin.every(d => d !== '')) {
      handlePinComplete(newPin)
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    pinState: string[],
    setPinState: (pin: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === 'Backspace' && !pinState[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (
    e: React.ClipboardEvent,
    setPinState: (pin: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pastedData.length === 4) {
      const newPin = pastedData.split('')
      setPinState(newPin)
      refs.current[3]?.focus()
      handlePinComplete(newPin)
    }
  }

  const handlePinComplete = async (completedPin: string[]) => {
    const pinString = completedPin.join('')

    if (mode === 'verify') {
      await verifyPin(pinString)
    } else if (mode === 'setup') {
      if (step === 'new') {
        setStep('confirm')
        setConfirmPin(['', '', '', ''])
        setTimeout(() => confirmInputRefs.current[0]?.focus(), 50)
      } else if (step === 'confirm') {
        const originalPin = pin.join('')
        if (pinString !== originalPin) {
          setError('PINs do not match')
          triggerShake()
          setConfirmPin(['', '', '', ''])
          setTimeout(() => confirmInputRefs.current[0]?.focus(), 50)
        } else {
          await setNewPin(pinString)
        }
      }
    } else if (mode === 'change') {
      if (step === 'current') {
        await verifyCurrentPin(pinString)
      } else if (step === 'new') {
        setStep('confirm')
        setConfirmPin(['', '', '', ''])
        setTimeout(() => confirmInputRefs.current[0]?.focus(), 50)
      } else if (step === 'confirm') {
        const newPinString = pin.join('')
        if (pinString !== newPinString) {
          setError('PINs do not match')
          triggerShake()
          setConfirmPin(['', '', '', ''])
          setTimeout(() => confirmInputRefs.current[0]?.focus(), 50)
        } else {
          await changePin(currentPin.join(''), newPinString)
        }
      }
    }
  }

  const verifyPin = async (pinString: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/parent-pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinString }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        setError('Incorrect PIN')
        triggerShake()
        setPin(['', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const verifyCurrentPin = async (pinString: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/parent-pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinString }),
      })

      if (res.ok) {
        setStep('new')
        setPin(['', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
      } else {
        setError('Incorrect PIN')
        triggerShake()
        setCurrentPin(['', '', '', ''])
        setTimeout(() => currentInputRefs.current[0]?.focus(), 50)
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const setNewPin = async (pinString: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/parent-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinString }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to set PIN')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const changePin = async (oldPin: string, newPin: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/parent-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin, currentPin: oldPin }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to change PIN')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const renderPinInputs = (
    pinState: string[],
    setPinState: (pin: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => (
    <div className="flex gap-3 justify-center">
      {pinState.map((digit, index) => (
        <input
          key={index}
          ref={el => { refs.current[index] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleInputChange(index, e.target.value, pinState, setPinState, refs)}
          onKeyDown={e => handleKeyDown(index, e, pinState, setPinState, refs)}
          onPaste={e => handlePaste(e, setPinState, refs)}
          disabled={loading}
          className={`
            w-14 h-16 text-center text-2xl font-bold
            border-2 rounded-xl
            focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-all
            ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}
            ${shake ? 'animate-shake' : ''}
          `}
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  )

  const getTitle = () => {
    if (mode === 'verify') return 'Enter Parent PIN'
    if (mode === 'setup') return step === 'confirm' ? 'Confirm Your PIN' : 'Create Parent PIN'
    if (mode === 'change') {
      if (step === 'current') return 'Enter Current PIN'
      if (step === 'new') return 'Enter New PIN'
      return 'Confirm New PIN'
    }
    return 'Enter PIN'
  }

  const getDescription = () => {
    if (mode === 'verify') return 'Enter your 4-digit PIN to access parent settings'
    if (mode === 'setup') {
      if (step === 'new') return 'Create a 4-digit PIN to protect parent-only features'
      return 'Enter the same PIN again to confirm'
    }
    if (mode === 'change') {
      if (step === 'current') return 'Enter your current PIN to continue'
      if (step === 'new') return 'Enter your new 4-digit PIN'
      return 'Enter the same PIN again to confirm'
    }
    return ''
  }

  const getCurrentRefs = () => {
    if (step === 'current') return { state: currentPin, setState: setCurrentPin, refs: currentInputRefs }
    if (step === 'confirm') return { state: confirmPin, setState: setConfirmPin, refs: confirmInputRefs }
    return { state: pin, setState: setPin, refs: inputRefs }
  }

  const { state, setState, refs } = getCurrentRefs()

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="max-w-sm w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{getTitle()}</h2>
          <p className="text-gray-600 text-sm">{getDescription()}</p>
        </div>

        {renderPinInputs(state, setState, refs)}

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}

        <div className="mt-6 space-y-3">
          {mode === 'verify' && onForgotPin && (
            <button
              type="button"
              onClick={onForgotPin}
              className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Forgot PIN?
            </button>
          )}

          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Card>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
