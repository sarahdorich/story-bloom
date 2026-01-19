'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useChild } from '../../../ProtectedLayoutClient';
import { PetHabitat } from '@/components/word-quest';
import { Card } from '@/components/ui';
import type { Pet, InteractionType } from '@/lib/types';
import { XP_PER_LEVEL } from '@/lib/types';

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

      {/* Pet Habitat with Interactive Elements */}
      {!isLoading && !error && pet && (
        <div className="max-w-md mx-auto space-y-4">
          {/* Habitat Container */}
          <PetHabitat pet={pet} showStats={true}>
            {/* Pet Response Speech Bubble (inside habitat) */}
            {petResponse && (
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 animate-fade-in">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45" />
                  <p className="text-gray-700 text-center italic">
                    &quot;{petResponse}&quot;
                  </p>
                  <p className="text-xs text-gray-400 text-right mt-1">
                    - {pet.name}
                  </p>
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

          {/* Unlocked Behaviors */}
          {pet.unlocked_behaviors && pet.unlocked_behaviors.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Unlocked Tricks
              </h3>
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
      )}
    </div>
  );
}
