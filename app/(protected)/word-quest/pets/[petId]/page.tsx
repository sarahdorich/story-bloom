'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { useChild } from '../../../ProtectedLayoutClient'
import { PetDisplay } from '@/components/word-quest'
import { Card } from '@/components/ui'
import type { Pet, InteractionType } from '@/lib/types'

interface PageProps {
  params: Promise<{ petId: string }>
}

export default function PetDetailPage({ params }: PageProps) {
  const { petId } = use(params)
  const router = useRouter()
  const { selectedChild } = useChild()
  const [pet, setPet] = useState<Pet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [petResponse, setPetResponse] = useState<string | null>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)

  const fetchPet = useCallback(async () => {
    try {
      const response = await fetch(`/api/word-quest/pets/${petId}`)
      if (!response.ok) {
        throw new Error('Pet not found')
      }
      const { pet: fetchedPet } = await response.json()
      setPet(fetchedPet)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pet')
    } finally {
      setIsLoading(false)
    }
  }, [petId])

  useEffect(() => {
    fetchPet()
  }, [fetchPet])

  const handleInteract = async (interaction: InteractionType) => {
    if (!pet || isInteracting) return

    setIsInteracting(true)
    setPetResponse(null)

    try {
      const response = await fetch(`/api/word-quest/pets/${petId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: interaction,
          childName: selectedChild?.name,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to interact with pet')
      }

      const result = await response.json()
      setPet(result.pet)
      setPetResponse(result.response)

      if (result.leveledUp) {
        setShowLevelUp(true)
        setTimeout(() => setShowLevelUp(false), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsInteracting(false)
    }
  }

  if (!selectedChild) {
    router.push('/word-quest')
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/word-quest/pets')}
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
        <div className="w-16" />
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
          <button
            onClick={() => router.push('/word-quest/pets')}
            className="text-primary-600 hover:underline"
          >
            Go Back
          </button>
        </Card>
      )}

      {/* Level Up Animation */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bounce text-center">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-xl font-bold">Level Up!</div>
            <div className="text-sm opacity-90">
              {pet?.name} is now level {pet?.level}!
            </div>
          </div>
        </div>
      )}

      {/* Pet Display */}
      {!isLoading && !error && pet && (
        <PetDisplay
          pet={pet}
          onInteract={handleInteract}
          petResponse={petResponse}
          isInteracting={isInteracting}
        />
      )}
    </div>
  )
}
