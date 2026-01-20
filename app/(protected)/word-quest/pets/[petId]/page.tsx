'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useChild } from '../../../ProtectedLayoutClient';
import { PetHabitat, HabitatSelector, TrickPerformer } from '@/components/word-quest';
import { Card } from '@/components/ui';
import { useSpeechSynthesis } from '@/lib/hooks/useSpeechSynthesis';
import type { Pet, InteractionType, HabitatType, PetType, ImageGenerationStatus } from '@/lib/types';
import { XP_PER_LEVEL, PET_DEFAULT_HABITATS } from '@/lib/types';

interface PageProps {
  params: Promise<{ petId: string }>;
}

const INTERACTION_ICONS: Record<
  InteractionType,
  { icon: string; label: string }
> = {
  feed: { icon: '🍎', label: 'Feed' },
  play: { icon: '🎾', label: 'Play' },
  pet: { icon: '💕', label: 'Pet' },
  talk: { icon: '💬', label: 'Talk' },
};

export default function PetDetailPage({ params }: PageProps) {
  const { petId } = use(params);
  const router = useRouter();
  const { selectedChild } = useChild();
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [petResponse, setPetResponse] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showHabitatSelector, setShowHabitatSelector] = useState(false);
  const [isChangingHabitat, setIsChangingHabitat] = useState(false);
  const [trickAnimationClass, setTrickAnimationClass] = useState<string | null>(null);
  const [newBehaviorsUnlocked, setNewBehaviorsUnlocked] = useState<string[]>([]);
  const imagePollingRef = useRef<NodeJS.Timeout | null>(null);

  // Speech synthesis for reading pet responses aloud
  const { speak, stop, isSpeaking, isSupported: isTTSSupported } = useSpeechSynthesis({
    petType: pet?.pet_type as PetType | undefined,
  });

  const fetchPet = useCallback(async () => {
    try {
      const response = await fetch(`/api/word-quest/pets/${petId}`);
      if (!response.ok) {
        throw new Error('Pet not found');
      }
      const { pet: fetchedPet } = await response.json();
      setPet(fetchedPet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pet');
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  // Poll for image generation completion
  useEffect(() => {
    if (
      pet &&
      (pet.image_generation_status === 'generating' ||
        pet.image_generation_status === 'pending') &&
      !pet.image_url
    ) {
      let pollCount = 0;
      const maxPolls = 30; // ~60 seconds with 2s interval

      const poll = async () => {
        pollCount++;
        try {
          const response = await fetch(
            `/api/word-quest/pets/${petId}/generate-image`
          );
          const result: { status: ImageGenerationStatus; imageUrl: string | null } =
            await response.json();

          if (result.status === 'completed' && result.imageUrl) {
            // Update pet with new image
            setPet((prev) =>
              prev
                ? {
                    ...prev,
                    image_url: result.imageUrl,
                    image_generation_status: 'completed',
                  }
                : null
            );
            // Stop polling
            if (imagePollingRef.current) {
              clearInterval(imagePollingRef.current);
              imagePollingRef.current = null;
            }
          } else if (result.status === 'failed' || pollCount >= maxPolls) {
            // Stop polling on failure or timeout
            if (imagePollingRef.current) {
              clearInterval(imagePollingRef.current);
              imagePollingRef.current = null;
            }
            if (result.status === 'failed') {
              setPet((prev) =>
                prev
                  ? { ...prev, image_generation_status: 'failed' }
                  : null
              );
            }
          }
        } catch (err) {
          console.error('Error polling image status:', err);
        }
      };

      // Start polling
      imagePollingRef.current = setInterval(poll, 2000);
      poll(); // Poll immediately

      return () => {
        if (imagePollingRef.current) {
          clearInterval(imagePollingRef.current);
          imagePollingRef.current = null;
        }
      };
    }
  }, [pet?.id, pet?.image_generation_status, pet?.image_url, petId]);

  // Auto-speak pet responses when they come in
  useEffect(() => {
    if (petResponse && isTTSSupported) {
      speak(petResponse);
    }
    // Cleanup: stop speaking when response changes or component unmounts
    return () => {
      stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petResponse]);

  const handleInteract = async (interaction: InteractionType) => {
    if (!pet || isInteracting) return;

    setIsInteracting(true);
    setPetResponse(null);

    try {
      const response = await fetch(`/api/word-quest/pets/${petId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: interaction,
          childName: selectedChild?.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to interact with pet');
      }

      const result = await response.json();
      setPet(result.pet);
      setPetResponse(result.response);

      if (result.leveledUp) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsInteracting(false);
    }
  };

  const handleHabitatChange = async (habitat: HabitatType) => {
    if (!pet) return;

    setIsChangingHabitat(true);
    try {
      const response = await fetch(`/api/word-quest/pets/${petId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitat_type: habitat }),
      });

      if (!response.ok) {
        throw new Error('Failed to update habitat');
      }

      const { pet: updatedPet } = await response.json();
      setPet(updatedPet);
      setShowHabitatSelector(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change habitat');
    } finally {
      setIsChangingHabitat(false);
    }
  };

  const handleTrickStart = (trickName: string, animationClass: string) => {
    setTrickAnimationClass(animationClass);
    setPetResponse(null); // Clear any existing response
  };

  const handleTrickEnd = () => {
    setTrickAnimationClass(null);
  };

  const handleTrickLevelUp = (newLevel: number, newBehaviors: string[]) => {
    setShowLevelUp(true);
    setNewBehaviorsUnlocked(newBehaviors);
    setTimeout(() => {
      setShowLevelUp(false);
      setNewBehaviorsUnlocked([]);
    }, 3000);
  };

  if (!selectedChild) {
    router.push('/word-quest');
    return null;
  }

  // Calculate XP progress for display
  const currentLevelXP = pet ? XP_PER_LEVEL[pet.level - 1] || 0 : 0;
  const nextLevelXP = pet
    ? XP_PER_LEVEL[pet.level] || XP_PER_LEVEL[XP_PER_LEVEL.length - 1]
    : 100;
  const xpProgress = pet
    ? ((pet.experience_points - currentLevelXP) /
        (nextLevelXP - currentLevelXP)) *
      100
    : 0;

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
        {pet && (
          <button
            onClick={() => setShowHabitatSelector(true)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Change habitat"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-sm font-medium hidden sm:inline">Habitat</span>
          </button>
        )}
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
            {newBehaviorsUnlocked.length > 0 && (
              <div className="mt-2 text-sm opacity-90">
                New tricks: {newBehaviorsUnlocked.map(b => b.replace(/_/g, ' ')).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pet Habitat with Interactive Elements */}
      {!isLoading && !error && pet && (
        <div className="max-w-md mx-auto space-y-4">
          {/* Habitat Container */}
          <PetHabitat pet={pet} showStats={true} trickAnimationClass={trickAnimationClass || undefined}>
            {/* Pet Response Speech Bubble (inside habitat) */}
            {petResponse && (
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 animate-fade-in">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45" />
                  <p className="text-gray-700 text-center italic">
                    &quot;{petResponse}&quot;
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      - {pet.name}
                    </p>
                    {isTTSSupported && (
                      <button
                        onClick={() => isSpeaking ? stop() : speak(petResponse)}
                        className={`
                          p-2 rounded-full transition-all duration-200
                          ${isSpeaking
                            ? 'bg-primary-100 text-primary-600 animate-pulse'
                            : 'bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-500'
                          }
                        `}
                        title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                        aria-label={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                      >
                        {isSpeaking ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </PetHabitat>

          {/* XP Progress Bar (below habitat) */}
          <div className="bg-white rounded-xl shadow-sm p-4">
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

          {/* Interaction Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {(
              Object.entries(INTERACTION_ICONS) as [
                InteractionType,
                { icon: string; label: string },
              ][]
            ).map(([type, { icon, label }]) => (
              <button
                key={type}
                onClick={() => handleInteract(type)}
                disabled={isInteracting}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200
                  ${
                    isInteracting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-100 active:scale-95'
                  }
                  bg-white shadow-sm
                `}
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-xs text-gray-600">{label}</span>
              </button>
            ))}
          </div>

          {/* Trick Performer */}
          <TrickPerformer
            pet={pet}
            onTrickStart={handleTrickStart}
            onTrickEnd={handleTrickEnd}
            onPetUpdate={setPet}
            onLevelUp={handleTrickLevelUp}
          />
        </div>
      )}

      {/* Habitat Selector Modal */}
      {showHabitatSelector && pet && (
        <HabitatSelector
          currentHabitat={pet.habitat_type || PET_DEFAULT_HABITATS[pet.pet_type as PetType]}
          petType={pet.pet_type as PetType}
          onSelect={handleHabitatChange}
          onClose={() => setShowHabitatSelector(false)}
          isLoading={isChangingHabitat}
        />
      )}
    </div>
  );
}
