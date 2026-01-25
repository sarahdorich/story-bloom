'use client'

import type { Pet, PetType } from '@/lib/types'

interface PetCardProps {
  pet: Pet
  onClick?: () => void
  showStats?: boolean
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

export function PetCard({ pet, onClick, showStats = true }: PetCardProps) {
  const emoji = PET_EMOJIS[pet.pet_type as PetType] || '🐾'

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-md p-4 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105 active:scale-95' : ''}
        ${pet.is_favorite ? 'ring-2 ring-yellow-400' : ''}
      `}
    >
      {/* Pet Image/Emoji */}
      <div className="relative">
        {pet.image_url ? (
          <img
            src={pet.image_url}
            alt={pet.name}
            className="w-full aspect-square rounded-xl object-cover"
          />
        ) : (
          <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
            <span className="text-6xl">{emoji}</span>
          </div>
        )}

        {/* Favorite badge */}
        {pet.is_favorite && (
          <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
            <span className="text-sm">⭐</span>
          </div>
        )}

        {/* Level badge */}
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-bold text-primary-600">
          Lv. {pet.level}
        </div>
      </div>

      {/* Pet Info */}
      <div className="mt-3 text-center">
        <h3 className="font-bold text-gray-800">{pet.name}</h3>
        <p className="text-xs text-gray-500 capitalize">{pet.personality}</p>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="mt-3 space-y-2">
          {/* Happiness */}
          <div className="flex items-center gap-2">
            <span className="text-xs">😊</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-300"
                style={{ width: `${pet.happiness}%` }}
              />
            </div>
          </div>

          {/* Energy */}
          <div className="flex items-center gap-2">
            <span className="text-xs">⚡</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-300"
                style={{ width: `${pet.energy}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
