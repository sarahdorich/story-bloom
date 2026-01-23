'use client'

import { useRouter } from 'next/navigation'
import { useChild } from '../../../ProtectedLayoutClient'
import { usePets } from '@/lib/hooks/usePets'
import { PetCard } from '@/components/word-quest'
import { Button, Card } from '@/components/ui'

export default function PetsPage() {
  const router = useRouter()
  const { selectedChild } = useChild()
  const { pets, isLoading, error } = usePets({
    childId: selectedChild?.id || '',
  })

  if (!selectedChild) {
    router.push('/games/word-quest')
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/games/word-quest')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-xl font-bold text-gray-800">My Pets</h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/games/word-quest')}>Go Back</Button>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && pets.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🐾</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Pets Yet!</h2>
          <p className="text-gray-600 mb-6">
            Practice reading words to earn your first pet friend!
          </p>
          <Button onClick={() => router.push('/games/word-quest/practice')}>
            Start Practice
          </Button>
        </Card>
      )}

      {/* Pet Grid */}
      {!isLoading && !error && pets.length > 0 && (
        <>
          <p className="text-center text-gray-500 mb-6">
            You have {pets.length} pet{pets.length !== 1 ? 's' : ''}! Tap to visit them.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onClick={() => router.push(`/word-quest/pets/${pet.id}`)}
              />
            ))}

            {/* Locked Pet Slots */}
            {pets.length < 5 && (
              <div className="bg-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center aspect-square opacity-60">
                <span className="text-4xl mb-2">🔒</span>
                <span className="text-sm text-gray-500 text-center">
                  Keep practicing!
                </span>
              </div>
            )}
          </div>

          {/* Tip */}
          <div className="mt-8 bg-primary-50 rounded-xl p-4 text-center">
            <p className="text-sm text-primary-700">
              <span className="font-semibold">Tip:</span> Feed and play with your pets to make them happy and help them level up!
            </p>
          </div>
        </>
      )}
    </div>
  )
}
