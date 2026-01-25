'use client'

import { useState } from 'react'
import type { Pet, PetType, InteractionType } from '@/lib/types'
import { XP_PER_LEVEL } from '@/lib/types'

interface PetDisplayProps {
  pet: Pet
  onInteract?: (interaction: InteractionType) => Promise<void>
  petResponse?: string | null
  isInteracting?: boolean
}

const PET_EMOJIS: Record<PetType, string> = {
  cat: '🐱',
  dog: '🐕',
  dinosaur: '🦖',
  unicorn: '🦄',
  dragon: '🐉',
  bunny: '🐰',
  bear: '🐻',
  bird: '🐦',
  fish: '🐠',
  butterfly: '🦋',
  axolotl: '🦎',
}

const INTERACTION_ICONS: Record<InteractionType, { icon: string; label: string }> = {
  feed: { icon: '🍎', label: 'Feed' },
  play: { icon: '🎾', label: 'Play' },
  pet: { icon: '💕', label: 'Pet' },
  talk: { icon: '💬', label: 'Talk' },
}

export function PetDisplay({ pet, onInteract, petResponse, isInteracting }: PetDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const emoji = PET_EMOJIS[pet.pet_type as PetType] || '🐾'

  // Calculate XP progress to next level
  const currentLevelXP = XP_PER_LEVEL[pet.level - 1] || 0
  const nextLevelXP = XP_PER_LEVEL[pet.level] || XP_PER_LEVEL[XP_PER_LEVEL.length - 1]
  const xpProgress = ((pet.experience_points - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100

  const handleInteract = async (interaction: InteractionType) => {
    if (isInteracting || !onInteract) return
    setIsAnimating(true)
    await onInteract(interaction)
    setTimeout(() => setIsAnimating(false), 500)
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Pet Image */}
      <div className="relative mb-4">
        {pet.image_url ? (
          <img
            src={pet.image_url}
            alt={pet.name}
            className={`w-48 h-48 mx-auto rounded-2xl object-cover shadow-lg transition-transform duration-300 ${
              isAnimating ? 'scale-110' : ''
            }`}
          />
        ) : (
          <div
            className={`w-48 h-48 mx-auto rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center shadow-lg transition-transform duration-300 ${
              isAnimating ? 'scale-110 rotate-3' : ''
            }`}
          >
            <span className="text-8xl">{emoji}</span>
          </div>
        )}
      </div>

      {/* Pet Name and Info */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{pet.name}</h2>
        <p className="text-sm text-gray-500 capitalize">
          Level {pet.level} {pet.pet_type}
        </p>
        <p className="text-xs text-gray-400 italic">&quot;{pet.personality}&quot;</p>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        {/* Happiness */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-lg">😊</span>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Happiness</span>
              <span>{pet.happiness}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-500"
                style={{ width: `${pet.happiness}%` }}
              />
            </div>
          </div>
        </div>

        {/* Energy */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-lg">⚡</span>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Energy</span>
              <span>{pet.energy}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
                style={{ width: `${pet.energy}%` }}
              />
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="flex items-center gap-3">
          <span className="text-lg">✨</span>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Experience</span>
              <span>
                {pet.experience_points} / {nextLevelXP} XP
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-500 transition-all duration-500"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pet Response Speech Bubble */}
      {petResponse && (
        <div className="relative bg-white rounded-2xl shadow-md p-4 mb-4 animate-fade-in">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
          <p className="text-gray-700 text-center italic">&quot;{petResponse}&quot;</p>
          <p className="text-xs text-gray-400 text-right mt-1">- {pet.name}</p>
        </div>
      )}

      {/* Interaction Buttons */}
      {onInteract && (
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(INTERACTION_ICONS) as [InteractionType, { icon: string; label: string }][]).map(
            ([type, { icon, label }]) => (
              <button
                key={type}
                onClick={() => handleInteract(type)}
                disabled={isInteracting}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200
                  ${isInteracting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 active:scale-95'}
                  bg-white shadow-sm
                `}
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-xs text-gray-600">{label}</span>
              </button>
            )
          )}
        </div>
      )}

      {/* Unlocked Behaviors */}
      {pet.unlocked_behaviors && pet.unlocked_behaviors.length > 0 && (
        <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Unlocked Tricks</h3>
          <div className="flex flex-wrap gap-2">
            {pet.unlocked_behaviors.map((behavior) => (
              <span
                key={behavior}
                className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs capitalize"
              >
                {behavior.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
