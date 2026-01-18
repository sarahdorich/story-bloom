'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Pet, InteractionType, PetType } from '@/lib/types'

interface UsePetsOptions {
  childId: string
}

interface InteractionResult {
  pet: Pet
  response: string
  effects: {
    happiness: number
    energy: number
    xp: number
  }
  leveledUp: boolean
  newBehaviors: string[]
}

interface UsePetsReturn {
  pets: Pet[]
  isLoading: boolean
  error: string | null
  fetchPets: () => Promise<void>
  createPet: (petType?: PetType, name?: string) => Promise<Pet | null>
  interactWithPet: (petId: string, interaction: InteractionType) => Promise<InteractionResult | null>
  updatePet: (petId: string, updates: Partial<Pet>) => Promise<Pet | null>
  favoritePet: Pet | null
}

export function usePets({ childId }: UsePetsOptions): UsePetsReturn {
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPets = useCallback(async () => {
    if (!childId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/word-quest/pets?childId=${childId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch pets')
      }

      const { pets: fetchedPets } = await response.json()
      setPets(fetchedPets || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pets')
    } finally {
      setIsLoading(false)
    }
  }, [childId])

  const createPet = useCallback(
    async (petType?: PetType, name?: string): Promise<Pet | null> => {
      if (!childId) return null

      try {
        const response = await fetch('/api/word-quest/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childId, petType, name }),
        })

        if (!response.ok) {
          throw new Error('Failed to create pet')
        }

        const { pet } = await response.json()
        setPets((prev) => [...prev, pet])
        return pet
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create pet')
        return null
      }
    },
    [childId]
  )

  const interactWithPet = useCallback(
    async (petId: string, interaction: InteractionType): Promise<InteractionResult | null> => {
      try {
        const response = await fetch(`/api/word-quest/pets/${petId}/interact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interactionType: interaction }),
        })

        if (!response.ok) {
          throw new Error('Failed to interact with pet')
        }

        const result: InteractionResult = await response.json()

        // Update local state with the updated pet
        setPets((prev) =>
          prev.map((p) => (p.id === petId ? result.pet : p))
        )

        return result
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to interact with pet')
        return null
      }
    },
    []
  )

  const updatePet = useCallback(
    async (petId: string, updates: Partial<Pet>): Promise<Pet | null> => {
      try {
        const response = await fetch(`/api/word-quest/pets/${petId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          throw new Error('Failed to update pet')
        }

        const { pet } = await response.json()
        setPets((prev) => prev.map((p) => (p.id === petId ? pet : p)))
        return pet
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update pet')
        return null
      }
    },
    []
  )

  // Auto-fetch pets when childId changes
  useEffect(() => {
    if (childId) {
      fetchPets()
    }
  }, [childId, fetchPets])

  const favoritePet = pets.find((p) => p.is_favorite) || pets[0] || null

  return {
    pets,
    isLoading,
    error,
    fetchPets,
    createPet,
    interactWithPet,
    updatePet,
    favoritePet,
  }
}
