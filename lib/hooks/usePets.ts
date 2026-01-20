'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  Pet,
  InteractionType,
  PetType,
  PetCustomization,
  ImageGenerationStatus,
  Accessory,
  ChildAccessory,
  PetEquippedAccessory,
  AccessoryType,
  PetMood,
  ReadingReactionType,
  PetReadingReaction,
} from '@/lib/types';

interface UsePetsOptions {
  childId: string;
}

interface InteractionResult {
  pet: Pet;
  response: string;
  effects: {
    happiness: number;
    energy: number;
    xp: number;
  };
  leveledUp: boolean;
  newBehaviors: string[];
}

interface ImageGenerationStatusResult {
  status: ImageGenerationStatus;
  imageUrl: string | null;
}

interface ReadingReaction {
  type: ReadingReactionType;
  mood: PetMood;
  message: string;
  xpBonus: number;
}

interface ReadingReactionResult {
  reactions: ReadingReaction[];
  totalXpBonus: number;
  newStreak: number;
  currentMood: PetMood;
  newHappiness: number;
}

interface AccessoriesData {
  accessories: Accessory[];
  unlockedAccessories: ChildAccessory[];
  stats: {
    sessions: number;
    wordsMastered: number;
    streakDays: number;
    level: number;
  };
}

interface PetReactionData {
  pet: Pet & {
    current_mood: PetMood;
    effective_happiness: number;
    days_since_last_practice: number;
  };
  reactions: PetReadingReaction[];
}

interface UsePetsReturn {
  pets: Pet[];
  isLoading: boolean;
  error: string | null;
  fetchPets: () => Promise<void>;
  createPet: (petType?: PetType, name?: string) => Promise<Pet | null>;
  createPetWithCustomization: (
    petType: PetType,
    name: string,
    customization: PetCustomization
  ) => Promise<Pet | null>;
  interactWithPet: (
    petId: string,
    interaction: InteractionType
  ) => Promise<InteractionResult | null>;
  updatePet: (petId: string, updates: Partial<Pet>) => Promise<Pet | null>;
  generatePetImage: (
    petId: string,
    customization?: PetCustomization
  ) => Promise<{ success: boolean; imageUrl?: string }>;
  pollImageStatus: (
    petId: string,
    onComplete?: (imageUrl: string) => void
  ) => () => void;
  favoritePet: Pet | null;
  // Phase 4: Accessories
  fetchAccessories: () => Promise<AccessoriesData | null>;
  unlockAccessory: (accessoryId: string, source?: string) => Promise<ChildAccessory | null>;
  equipAccessory: (petId: string, accessoryId: string, slot: AccessoryType) => Promise<PetEquippedAccessory | null>;
  unequipAccessory: (petId: string, slot: AccessoryType) => Promise<boolean>;
  fetchEquippedAccessories: (petId: string) => Promise<PetEquippedAccessory[]>;
  // Phase 5: Reading Reactions
  logReadingSession: (
    petId: string,
    sessionData: {
      practiceSessionId?: string;
      wordsPracticed: number;
      wordsCorrect: number;
      wordsMastered?: number;
      petLeveledUp?: boolean;
      newLevel?: number;
    }
  ) => Promise<ReadingReactionResult | null>;
  fetchPetMood: (petId: string) => Promise<PetReactionData | null>;
}

export function usePets({ childId }: UsePetsOptions): UsePetsReturn {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingIntervalsRef.current.forEach((interval) => clearInterval(interval));
      pollingIntervalsRef.current.clear();
    };
  }, []);

  const fetchPets = useCallback(async () => {
    if (!childId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/word-quest/pets?childId=${childId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pets');
      }

      const { pets: fetchedPets } = await response.json();
      setPets(fetchedPets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pets');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  const createPet = useCallback(
    async (petType?: PetType, name?: string): Promise<Pet | null> => {
      if (!childId) return null;

      try {
        const response = await fetch('/api/word-quest/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childId, petType, name, generateImage: false }),
        });

        if (!response.ok) {
          throw new Error('Failed to create pet');
        }

        const { pet } = await response.json();
        setPets((prev) => [...prev, pet]);
        return pet;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create pet');
        return null;
      }
    },
    [childId]
  );

  const createPetWithCustomization = useCallback(
    async (
      petType: PetType,
      name: string,
      customization: PetCustomization
    ): Promise<Pet | null> => {
      if (!childId) return null;

      try {
        const response = await fetch('/api/word-quest/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId,
            petType,
            name,
            customization,
            generateImage: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create pet');
        }

        const { pet } = await response.json();
        setPets((prev) => [...prev, pet]);
        return pet;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create pet');
        return null;
      }
    },
    [childId]
  );

  const interactWithPet = useCallback(
    async (
      petId: string,
      interaction: InteractionType
    ): Promise<InteractionResult | null> => {
      try {
        const response = await fetch(`/api/word-quest/pets/${petId}/interact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interactionType: interaction }),
        });

        if (!response.ok) {
          throw new Error('Failed to interact with pet');
        }

        const result: InteractionResult = await response.json();

        // Update local state with the updated pet
        setPets((prev) => prev.map((p) => (p.id === petId ? result.pet : p)));

        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to interact with pet'
        );
        return null;
      }
    },
    []
  );

  const updatePet = useCallback(
    async (petId: string, updates: Partial<Pet>): Promise<Pet | null> => {
      try {
        const response = await fetch(`/api/word-quest/pets/${petId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to update pet');
        }

        const { pet } = await response.json();
        setPets((prev) => prev.map((p) => (p.id === petId ? pet : p)));
        return pet;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update pet');
        return null;
      }
    },
    []
  );

  const generatePetImage = useCallback(
    async (
      petId: string,
      customization?: PetCustomization
    ): Promise<{ success: boolean; imageUrl?: string }> => {
      try {
        const response = await fetch(
          `/api/word-quest/pets/${petId}/generate-image`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customization }),
          }
        );

        const result = await response.json();

        if (result.success && result.pet) {
          setPets((prev) =>
            prev.map((p) => (p.id === petId ? result.pet : p))
          );
        }

        return {
          success: result.success,
          imageUrl: result.imageUrl,
        };
      } catch (err) {
        console.error('Error generating pet image:', err);
        return { success: false };
      }
    },
    []
  );

  const pollImageStatus = useCallback(
    (petId: string, onComplete?: (imageUrl: string) => void): (() => void) => {
      // Clear any existing polling for this pet
      const existingInterval = pollingIntervalsRef.current.get(petId);
      if (existingInterval) {
        clearInterval(existingInterval);
      }

      let pollCount = 0;
      const maxPolls = 30; // ~60 seconds with 2s interval
      const pollInterval = 2000; // 2 seconds

      const poll = async () => {
        pollCount++;

        try {
          const response = await fetch(
            `/api/word-quest/pets/${petId}/generate-image`
          );
          const result: ImageGenerationStatusResult = await response.json();

          if (result.status === 'completed' && result.imageUrl) {
            // Stop polling
            const interval = pollingIntervalsRef.current.get(petId);
            if (interval) {
              clearInterval(interval);
              pollingIntervalsRef.current.delete(petId);
            }

            // Update local state
            setPets((prev) =>
              prev.map((p) =>
                p.id === petId
                  ? {
                      ...p,
                      image_url: result.imageUrl,
                      image_generation_status: 'completed' as ImageGenerationStatus,
                    }
                  : p
              )
            );

            // Call completion callback
            if (onComplete) {
              onComplete(result.imageUrl);
            }
          } else if (result.status === 'failed' || pollCount >= maxPolls) {
            // Stop polling on failure or timeout
            const interval = pollingIntervalsRef.current.get(petId);
            if (interval) {
              clearInterval(interval);
              pollingIntervalsRef.current.delete(petId);
            }

            // Update status to failed if we timed out
            if (pollCount >= maxPolls) {
              setPets((prev) =>
                prev.map((p) =>
                  p.id === petId
                    ? { ...p, image_generation_status: 'failed' as ImageGenerationStatus }
                    : p
                )
              );
            }
          }
        } catch (err) {
          console.error('Error polling image status:', err);
        }
      };

      // Start polling
      const intervalId = setInterval(poll, pollInterval);
      pollingIntervalsRef.current.set(petId, intervalId);

      // Poll immediately
      poll();

      // Return cleanup function
      return () => {
        clearInterval(intervalId);
        pollingIntervalsRef.current.delete(petId);
      };
    },
    []
  );

  // ==========================================
  // Phase 4: Accessory Functions
  // ==========================================

  const fetchAccessories = useCallback(async (): Promise<AccessoriesData | null> => {
    if (!childId) return null;

    try {
      const response = await fetch(`/api/word-quest/accessories?childId=${childId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch accessories');
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching accessories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accessories');
      return null;
    }
  }, [childId]);

  const unlockAccessory = useCallback(
    async (accessoryId: string, source: string = 'achievement'): Promise<ChildAccessory | null> => {
      if (!childId) return null;

      try {
        const response = await fetch('/api/word-quest/accessories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childId, accessoryId, source }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to unlock accessory');
        }

        const data = await response.json();
        return data.unlockedAccessory || null;
      } catch (err) {
        console.error('Error unlocking accessory:', err);
        setError(err instanceof Error ? err.message : 'Failed to unlock accessory');
        return null;
      }
    },
    [childId]
  );

  const equipAccessory = useCallback(
    async (
      petId: string,
      accessoryId: string,
      slot: AccessoryType
    ): Promise<PetEquippedAccessory | null> => {
      try {
        const response = await fetch(`/api/word-quest/pets/${petId}/accessories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessoryId, slot }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to equip accessory');
        }

        const data = await response.json();
        return data.equippedAccessory || null;
      } catch (err) {
        console.error('Error equipping accessory:', err);
        setError(err instanceof Error ? err.message : 'Failed to equip accessory');
        return null;
      }
    },
    []
  );

  const unequipAccessory = useCallback(
    async (petId: string, slot: AccessoryType): Promise<boolean> => {
      try {
        const response = await fetch(`/api/word-quest/pets/${petId}/accessories`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot }),
        });

        return response.ok;
      } catch (err) {
        console.error('Error unequipping accessory:', err);
        setError(err instanceof Error ? err.message : 'Failed to unequip accessory');
        return false;
      }
    },
    []
  );

  const fetchEquippedAccessories = useCallback(
    async (petId: string): Promise<PetEquippedAccessory[]> => {
      try {
        const response = await fetch(`/api/word-quest/pets/${petId}/accessories`);
        if (!response.ok) {
          throw new Error('Failed to fetch equipped accessories');
        }
        const data = await response.json();
        return data.equippedAccessories || [];
      } catch (err) {
        console.error('Error fetching equipped accessories:', err);
        return [];
      }
    },
    []
  );

  // ==========================================
  // Phase 5: Reading Reaction Functions
  // ==========================================

  const logReadingSession = useCallback(
    async (
      petId: string,
      sessionData: {
        practiceSessionId?: string;
        wordsPracticed: number;
        wordsCorrect: number;
        wordsMastered?: number;
        petLeveledUp?: boolean;
        newLevel?: number;
      }
    ): Promise<ReadingReactionResult | null> => {
      try {
        const response = await fetch(`/api/word-quest/pets/${petId}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to log reading session');
        }

        const result: ReadingReactionResult = await response.json();

        // Update the pet's mood in local state
        setPets((prev) =>
          prev.map((p) =>
            p.id === petId
              ? {
                  ...p,
                  happiness: result.newHappiness,
                  // Note: current_mood would need to be added to Pet type
                }
              : p
          )
        );

        return result;
      } catch (err) {
        console.error('Error logging reading session:', err);
        setError(err instanceof Error ? err.message : 'Failed to log reading session');
        return null;
      }
    },
    []
  );

  const fetchPetMood = useCallback(
    async (petId: string): Promise<PetReactionData | null> => {
      try {
        const response = await fetch(`/api/word-quest/pets/${petId}/reactions`);
        if (!response.ok) {
          throw new Error('Failed to fetch pet mood');
        }
        return await response.json();
      } catch (err) {
        console.error('Error fetching pet mood:', err);
        return null;
      }
    },
    []
  );

  // Auto-fetch pets when childId changes
  useEffect(() => {
    if (childId) {
      fetchPets();
    }
  }, [childId, fetchPets]);

  const favoritePet = pets.find((p) => p.is_favorite) || pets[0] || null;

  return {
    pets,
    isLoading,
    error,
    fetchPets,
    createPet,
    createPetWithCustomization,
    interactWithPet,
    updatePet,
    generatePetImage,
    pollImageStatus,
    favoritePet,
    // Phase 4: Accessories
    fetchAccessories,
    unlockAccessory,
    equipAccessory,
    unequipAccessory,
    fetchEquippedAccessories,
    // Phase 5: Reading Reactions
    logReadingSession,
    fetchPetMood,
  };
}
