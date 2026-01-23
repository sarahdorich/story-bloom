'use client'

import type { SentenceWordResult } from '@/lib/types'

interface SentenceCardProps {
  sentence: string
  status: 'idle' | 'listening' | 'processing' | 'success' | 'error'
  lastResult: 'correct' | 'incorrect' | null
  wordResults?: SentenceWordResult[]
  accuracy?: number
}

export function SentenceCard({
  sentence,
  status,
  lastResult,
  wordResults,
  accuracy,
}: SentenceCardProps) {
  // Determine card styling based on status and result
  const getCardClasses = () => {
    const base = 'rounded-3xl p-6 md:p-8 transition-all duration-300 shadow-lg'

    if (lastResult === 'correct') {
      return `${base} bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200`
    }
    if (lastResult === 'incorrect') {
      return `${base} bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200`
    }
    if (status === 'listening') {
      return `${base} bg-gradient-to-br from-secondary-50 to-primary-50 border-2 border-secondary-200 animate-pulse`
    }
    return `${base} bg-white border-2 border-gray-100`
  }

  // Render sentence with word highlighting if we have results
  const renderSentence = () => {
    if (!wordResults || wordResults.length === 0 || !lastResult) {
      return (
        <p className="text-2xl md:text-3xl font-medium text-gray-800 leading-relaxed text-center">
          {sentence}
        </p>
      )
    }

    // Split sentence into words and highlight based on results
    const words = sentence.split(/\s+/)

    return (
      <p className="text-2xl md:text-3xl font-medium leading-relaxed text-center">
        {words.map((word, index) => {
          const result = wordResults.find((r) => r.position === index)
          const isCorrect = result?.correct ?? true

          return (
            <span
              key={index}
              className={`
                inline-block mx-1 px-1 rounded transition-colors
                ${isCorrect ? 'text-green-600' : 'text-red-500 bg-red-50'}
              `}
            >
              {word}
            </span>
          )
        })}
      </p>
    )
  }

  return (
    <div className={getCardClasses()}>
      {/* Result indicator */}
      {lastResult && (
        <div className="flex items-center justify-center mb-4">
          {lastResult === 'correct' ? (
            <div className="flex items-center gap-2 text-green-600">
              <span className="text-2xl">⭐</span>
              <span className="font-semibold">Great job!</span>
              {accuracy !== undefined && (
                <span className="text-sm">({accuracy}% accurate)</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <span className="text-2xl">🔄</span>
              <span className="font-semibold">Keep trying!</span>
              {accuracy !== undefined && (
                <span className="text-sm">({accuracy}% accurate)</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sentence text */}
      {renderSentence()}

      {/* Listening indicator */}
      {status === 'listening' && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2 text-secondary-600">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-secondary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-secondary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-secondary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm font-medium">Listening...</span>
          </div>
        </div>
      )}
    </div>
  )
}
