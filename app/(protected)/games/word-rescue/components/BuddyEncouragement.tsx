'use client'

import { useState, useEffect } from 'react'
import type { Pet, SpeechRecognitionStatus } from '@/lib/types'
import { getBuddyPhrase, BUDDY_PHRASES } from '@/lib/types'

interface BuddyEncouragementProps {
  pet: Pet
  status: SpeechRecognitionStatus
  lastResult?: 'correct' | 'incorrect' | 'mastered' | 'stageUp' | null
}

export function BuddyEncouragement({ pet, status, lastResult }: BuddyEncouragementProps) {
  const [phrase, setPhrase] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    let newPhrase = ''

    if (lastResult === 'mastered') {
      newPhrase = getBuddyPhrase('mastered')
    } else if (lastResult === 'stageUp') {
      newPhrase = getBuddyPhrase('stageUp')
    } else if (lastResult === 'correct') {
      newPhrase = getBuddyPhrase('correct')
    } else if (lastResult === 'incorrect') {
      newPhrase = getBuddyPhrase('incorrect')
    } else if (status === 'listening') {
      newPhrase = "I'm listening..."
    } else {
      newPhrase = getBuddyPhrase('encouragement')
    }

    if (newPhrase !== phrase) {
      setPhrase(newPhrase)
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [status, lastResult, phrase])

  return (
    <div className="flex items-start gap-3">
      <div className={`relative ${status === 'listening' ? 'animate-bounce' : ''}`}>
        {pet.image_url ? (
          <img
            src={pet.image_url}
            alt={pet.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow-md"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-2xl border-2 border-purple-200 shadow-md">
            🐾
          </div>
        )}
        {status === 'listening' && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">🎤</span>
          </div>
        )}
      </div>
      <div
        className={`flex-1 bg-purple-50 rounded-xl p-3 relative transition-all duration-200 ${
          isAnimating ? 'scale-105' : 'scale-100'
        }`}
      >
        {/* Speech bubble arrow */}
        <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-purple-50 border-b-8 border-b-transparent" />
        <p className="font-medium text-purple-900 text-sm">{pet.name}</p>
        <p className="text-purple-700">&quot;{phrase}&quot;</p>
      </div>
    </div>
  )
}
