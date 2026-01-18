'use client'

import { useState, useEffect } from 'react'
import type { Pet, PetType } from '@/lib/types'
import { Button } from '@/components/ui'

interface PetRewardModalProps {
  show: boolean
  pet: Pet | null
  isFirstPet?: boolean
  onClose: () => void
  onVisitPet?: () => void
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
}

export function PetRewardModal({ show, pet, isFirstPet, onClose, onVisitPet }: PetRewardModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setTimeout(() => setShowConfetti(true), 300)
    } else {
      setIsVisible(false)
      setShowConfetti(false)
    }
  }, [show])

  if (!show || !pet) return null

  const emoji = PET_EMOJIS[pet.pet_type as PetType] || '🐾'

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <span className="text-2xl">
                {['🎉', '⭐', '✨', '🌟', '💫', '🎊'][Math.floor(Math.random() * 6)]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal Content */}
      <div
        className={`
          relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center
          transform transition-all duration-500
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}
        `}
      >
        {/* Sparkle decoration */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
          ✨
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 mb-2">
          {isFirstPet ? 'Your First Pet!' : 'New Pet Unlocked!'}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {isFirstPet
            ? 'Great job reading! Here\'s a special friend just for you!'
            : 'Keep practicing to unlock more pets!'}
        </p>

        {/* Pet Display */}
        <div className="relative mb-6">
          {pet.image_url ? (
            <img
              src={pet.image_url}
              alt={pet.name}
              className="w-40 h-40 mx-auto rounded-2xl object-cover shadow-lg animate-float"
            />
          ) : (
            <div className="w-40 h-40 mx-auto rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center shadow-lg animate-float">
              <span className="text-7xl">{emoji}</span>
            </div>
          )}
        </div>

        {/* Pet Info */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
          <p className="text-sm text-gray-500 capitalize">
            A {pet.personality} {pet.pet_type}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {onVisitPet && (
            <Button onClick={onVisitPet} className="w-full">
              Say Hello to {pet.name}!
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="w-full">
            Continue Practicing
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
