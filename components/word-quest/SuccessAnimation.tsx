'use client'

import { useMemo } from 'react'

interface SuccessAnimationProps {
  show: boolean
  wordsCorrect: number
  totalWords: number
  onComplete: () => void
}

const CELEBRATIONS = [
  { emoji: '🎉', text: 'Amazing!' },
  { emoji: '⭐', text: 'Great job!' },
  { emoji: '🌟', text: 'Wonderful!' },
  { emoji: '🎊', text: 'Fantastic!' },
  { emoji: '✨', text: 'Brilliant!' },
  { emoji: '🏆', text: 'Super star!' },
  { emoji: '💫', text: 'Awesome!' },
]

export function SuccessAnimation({
  show,
  wordsCorrect,
  totalWords,
  onComplete,
}: SuccessAnimationProps) {
  const celebration = useMemo(
    () => CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)],
    []
  )

  const percentage =
    totalWords > 0 ? Math.round((wordsCorrect / totalWords) * 100) : 0

  // Determine star rating (1-3 stars based on percentage)
  const starCount = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full text-center transform animate-scaleIn shadow-2xl">
        <div className="text-6xl md:text-8xl mb-4 animate-bounce">
          {celebration.emoji}
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          {celebration.text}
        </h2>

        <p className="text-lg md:text-xl text-gray-600 mb-6">
          You got{' '}
          <span className="font-bold text-green-600">{wordsCorrect}</span> out
          of <span className="font-bold">{totalWords}</span> words correct!
        </p>

        <div className="mb-6">
          <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            {percentage}%
          </div>
        </div>

        {/* Star rating */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((star) => (
            <span
              key={star}
              className={`text-3xl md:text-4xl transition-all duration-300 ${
                star <= starCount
                  ? 'text-yellow-400 scale-110'
                  : 'text-gray-300'
              }`}
              style={{
                animationDelay: `${star * 200}ms`,
              }}
            >
              ⭐
            </span>
          ))}
        </div>

        {/* Encouraging message based on performance */}
        <p className="text-gray-500 text-sm mb-6">
          {percentage >= 90
            ? "You're a reading superstar!"
            : percentage >= 70
              ? 'Great work! Keep practicing!'
              : percentage >= 50
                ? 'Good effort! Practice makes perfect!'
                : "Keep trying! You're learning!"}
        </p>

        <button
          onClick={onComplete}
          className="w-full py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-lg font-bold rounded-xl hover:opacity-90 transition-opacity focus:outline-none focus:ring-4 focus:ring-primary-200"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
