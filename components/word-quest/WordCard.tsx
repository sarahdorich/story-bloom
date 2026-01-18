'use client'

import type { SpeechRecognitionStatus } from '@/lib/types'

interface WordCardProps {
  word: string
  status: SpeechRecognitionStatus
  lastResult?: 'correct' | 'incorrect' | null
}

export function WordCard({ word, status, lastResult }: WordCardProps) {
  const getBackgroundClass = () => {
    if (lastResult === 'correct') return 'bg-green-50 border-green-400'
    if (lastResult === 'incorrect') return 'bg-red-50 border-red-400'
    if (status === 'listening') return 'bg-primary-50 border-primary-400'
    return 'bg-white border-gray-200'
  }

  const getTextClass = () => {
    if (lastResult === 'correct') return 'text-green-600'
    if (lastResult === 'incorrect') return 'text-red-600'
    return 'text-gray-800'
  }

  return (
    <div
      className={`
        relative rounded-3xl border-4 p-8 md:p-12 transition-all duration-300
        shadow-lg
        ${getBackgroundClass()}
        ${status === 'listening' ? 'animate-pulse' : ''}
      `}
    >
      <div
        className={`
          text-5xl md:text-7xl lg:text-8xl font-bold text-center
          transition-colors duration-300 select-none
          ${getTextClass()}
        `}
      >
        {word}
      </div>

      {lastResult === 'correct' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-6xl md:text-8xl animate-bounce">⭐</div>
        </div>
      )}

      {lastResult === 'incorrect' && (
        <div className="absolute top-4 right-4 text-3xl">🔄</div>
      )}
    </div>
  )
}
