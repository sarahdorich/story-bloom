'use client'

import type { SpeechRecognitionStatus } from '@/lib/types'

interface SpeechButtonProps {
  status: SpeechRecognitionStatus
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

export function SpeechButton({
  status,
  onStart,
  onStop,
  disabled,
}: SpeechButtonProps) {
  const isListening = status === 'listening'
  const isProcessing = status === 'processing'

  const handleClick = () => {
    if (isListening) {
      onStop()
    } else {
      onStart()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`
        relative w-20 h-20 md:w-24 md:h-24 rounded-full transition-all duration-300
        flex items-center justify-center
        ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 scale-110'
            : 'bg-primary-500 hover:bg-primary-600'
        }
        ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        shadow-lg hover:shadow-xl
        focus:outline-none focus:ring-4 focus:ring-primary-200
      `}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
    >
      {/* Microphone or Stop Icon */}
      <svg
        className="w-10 h-10 md:w-12 md:h-12 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isListening ? (
          // Stop icon
          <rect
            x="6"
            y="6"
            width="12"
            height="12"
            strokeWidth={2}
            fill="currentColor"
            rx="2"
          />
        ) : (
          // Microphone icon
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        )}
      </svg>

      {/* Listening animation rings */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25" />
          <span
            className="absolute inset-2 rounded-full bg-red-400 animate-ping opacity-25"
            style={{ animationDelay: '150ms' }}
          />
        </>
      )}
    </button>
  )
}
