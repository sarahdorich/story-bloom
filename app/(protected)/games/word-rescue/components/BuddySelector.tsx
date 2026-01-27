'use client'

import { useState, useEffect } from 'react'
import { usePets } from '@/lib/hooks/usePets'
import { Button, Card } from '@/components/ui'
import type { Pet } from '@/lib/types'

interface BuddySelectorProps {
  childId: string
  onSelect: (pet: Pet) => void
  onBack?: () => void
}

export function BuddySelector({ childId, onSelect, onBack }: BuddySelectorProps) {
  const { pets, isLoading, error, fetchPets, favoritePet } = usePets({ childId })
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)

  useEffect(() => {
    fetchPets()
  }, [fetchPets])

  // Auto-select favorite pet if available
  useEffect(() => {
    if (favoritePet && !selectedPet) {
      setSelectedPet(favoritePet)
    }
  }, [favoritePet, selectedPet])

  const handleStart = () => {
    if (selectedPet) {
      onSelect(selectedPet)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your pets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchPets}>Try Again</Button>
      </div>
    )
  }

  if (pets.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🐾</div>
        <h2 className="text-xl font-semibold mb-2">No Pets Yet!</h2>
        <p className="text-gray-600 mb-4">
          Play Word Quest or Sentence Shenanigans to earn your first pet!
        </p>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Games
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Word Rescue</h1>
        <p className="text-gray-600">Choose your Word Buddy to help you practice!</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {pets.map((pet) => (
          <Card
            key={pet.id}
            className={`p-4 cursor-pointer transition-all hover:scale-105 ${
              selectedPet?.id === pet.id
                ? 'ring-2 ring-purple-500 bg-purple-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedPet(pet)}
          >
            <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
              {pet.image_url ? (
                <img
                  src={pet.image_url}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  🐾
                </div>
              )}
            </div>
            <p className="font-medium text-center truncate">{pet.name}</p>
            {pet.is_favorite && (
              <p className="text-xs text-center text-yellow-600">⭐ Favorite</p>
            )}
          </Card>
        ))}
      </div>

      {selectedPet && (
        <div className="bg-purple-50 rounded-xl p-4 mb-6 flex items-center gap-4">
          {selectedPet.image_url ? (
            <img
              src={selectedPet.image_url}
              alt={selectedPet.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center text-2xl">
              🐾
            </div>
          )}
          <div>
            <p className="font-semibold text-purple-900">{selectedPet.name} says:</p>
            <p className="text-purple-700">&quot;Let&apos;s rescue some words together!&quot;</p>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button onClick={handleStart} disabled={!selectedPet} className="px-8">
          Start Rescue!
        </Button>
      </div>
    </div>
  )
}
