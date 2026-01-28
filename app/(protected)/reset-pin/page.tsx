'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Button } from '@/components/ui'

function ResetPinContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState('')

  const [pin, setPin] = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [step, setStep] = useState<'new' | 'confirm'>('new')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setTokenValid(false)
        setTokenError('No reset token provided')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/parent-pin/reset?token=${encodeURIComponent(token)}`)
        const data = await res.json()

        if (data.valid) {
          setTokenValid(true)
        } else {
          setTokenValid(false)
          setTokenError(data.error || 'Invalid or expired reset link')
        }
      } catch {
        setTokenValid(false)
        setTokenError('Failed to validate reset link')
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [token])

  // Focus first input when step changes
  useEffect(() => {
    if (!loading && tokenValid) {
      const refs = step === 'confirm' ? confirmInputRefs : inputRefs
      refs.current[0]?.focus()
    }
  }, [loading, tokenValid, step])

  const handleInputChange = (
    index: number,
    value: string,
    pinState: string[],
    setPinState: (pin: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (value && !/^\d$/.test(value)) return

    const newPin = [...pinState]
    newPin[index] = value
    setPinState(newPin)
    setError('')

    if (value && index < 3) {
      refs.current[index + 1]?.focus()
    }

    if (value && index === 3 && newPin.every(d => d !== '')) {
      handlePinComplete(newPin)
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    pinState: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === 'Backspace' && !pinState[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePinComplete = async (completedPin: string[]) => {
    if (step === 'new') {
      setStep('confirm')
      setConfirmPin(['', '', '', ''])
      setTimeout(() => confirmInputRefs.current[0]?.focus(), 50)
    } else {
      const newPinString = pin.join('')
      const confirmPinString = completedPin.join('')

      if (newPinString !== confirmPinString) {
        setError('PINs do not match')
        setConfirmPin(['', '', '', ''])
        setTimeout(() => confirmInputRefs.current[0]?.focus(), 50)
        return
      }

      await submitNewPin(newPinString)
    }
  }

  const submitNewPin = async (newPin: string) => {
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/parent-pin/reset', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPin }),
      })

      if (res.ok) {
        setSuccess(true)
        // Clear any existing verification
        sessionStorage.removeItem('storybloom-parent-verified')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to reset PIN')
        if (data.error?.includes('expired') || data.error?.includes('Invalid')) {
          setTokenValid(false)
          setTokenError(data.error)
        }
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
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
          onKeyDown={e => handleKeyDown(index, e, pinState, refs)}
          disabled={submitting}
          className={`
            w-14 h-16 text-center text-2xl font-bold
            border-2 rounded-xl
            focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-all
            ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}
          `}
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  )

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-sm w-full p-6 text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validating reset link...</p>
        </Card>
      </div>
    )
  }

  // Invalid token
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-sm w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600 text-sm">{tokenError}</p>
          </div>
          <Button onClick={() => router.push('/parent')} className="w-full">
            Go to Parent Settings
          </Button>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-sm w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">PIN Reset Complete</h2>
            <p className="text-gray-600 text-sm">Your new PIN has been set successfully.</p>
          </div>
          <Button onClick={() => router.push('/parent')} className="w-full">
            Go to Parent Settings
          </Button>
        </Card>
      </div>
    )
  }

  // PIN entry form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-sm w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {step === 'new' ? 'Create New PIN' : 'Confirm Your PIN'}
          </h2>
          <p className="text-gray-600 text-sm">
            {step === 'new'
              ? 'Enter a new 4-digit PIN'
              : 'Enter the same PIN again to confirm'}
          </p>
        </div>

        {step === 'new'
          ? renderPinInputs(pin, setPin, inputRefs)
          : renderPinInputs(confirmPin, setConfirmPin, confirmInputRefs)}

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}

        {step === 'confirm' && (
          <button
            type="button"
            onClick={() => {
              setStep('new')
              setPin(['', '', '', ''])
              setConfirmPin(['', '', '', ''])
              setError('')
            }}
            className="w-full mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Start Over
          </button>
        )}

        {submitting && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Card>
    </div>
  )
}

export default function ResetPinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </Card>
        </div>
      }
    >
      <ResetPinContent />
    </Suspense>
  )
}
