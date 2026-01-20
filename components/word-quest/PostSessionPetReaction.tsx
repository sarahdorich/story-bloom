'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReadingReactionDisplay } from './ReadingReactionDisplay';
import { AccessoryUnlockModal, BatchUnlockModal } from './AccessoryUnlockModal';
import type { Pet, Accessory, PetMood, ReadingReactionType } from '@/lib/types';
import { isAccessoryUnlocked } from '@/lib/types';

interface ReadingReaction {
  type: ReadingReactionType;
  mood: PetMood;
  message: string;
  xpBonus: number;
}

interface PostSessionPetReactionProps {
  pet: Pet;
  childId: string;
  sessionData: {
    practiceSessionId?: string;
    wordsPracticed: number;
    wordsCorrect: number;
    wordsMastered?: number;
    petLeveledUp?: boolean;
    newLevel?: number;
  };
  onComplete: () => void;
  show: boolean;
}

interface ReactionResult {
  reactions: ReadingReaction[];
  totalXpBonus: number;
  newStreak: number;
  currentMood: PetMood;
  newHappiness: number;
}

export function PostSessionPetReaction({
  pet,
  childId,
  sessionData,
  onComplete,
  show,
}: PostSessionPetReactionProps) {
  const [reactions, setReactions] = useState<ReadingReaction[]>([]);
  const [newlyUnlockedAccessories, setNewlyUnlockedAccessories] = useState<Accessory[]>([]);
  const [showReactions, setShowReactions] = useState(false);
  const [showAccessoryUnlock, setShowAccessoryUnlock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reactions when session completes
  const fetchReactions = useCallback(async () => {
    if (!pet || !show) return;

    setIsLoading(true);
    setError(null);

    try {
      // Log the reading session and get reactions
      const response = await fetch(`/api/word-quest/pets/${pet.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Failed to get pet reactions');
      }

      const result: ReactionResult = await response.json();
      setReactions(result.reactions);

      // Check for newly unlocked accessories
      const accessoriesResponse = await fetch(
        `/api/word-quest/accessories?childId=${childId}`
      );

      if (accessoriesResponse.ok) {
        const accessoriesData = await accessoriesResponse.json();
        const { accessories, unlockedAccessories, stats } = accessoriesData;

        // Find accessories that should now be unlocked but aren't yet
        const unlockedIds = new Set(
          unlockedAccessories.map((ua: { accessory_id: string }) => ua.accessory_id)
        );

        const newlyAvailable: Accessory[] = [];

        for (const accessory of accessories) {
          if (unlockedIds.has(accessory.id)) continue;

          const unlocked = isAccessoryUnlocked(accessory.unlock_requirement, stats);
          if (unlocked) {
            // Unlock this accessory
            const unlockResponse = await fetch('/api/word-quest/accessories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                childId,
                accessoryId: accessory.id,
                source: 'practice_session',
              }),
            });

            if (unlockResponse.ok) {
              newlyAvailable.push(accessory);
            }
          }
        }

        setNewlyUnlockedAccessories(newlyAvailable);
      }

      setShowReactions(true);
    } catch (err) {
      console.error('Error fetching reactions:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      // Still complete on error so user isn't stuck
      setTimeout(onComplete, 2000);
    } finally {
      setIsLoading(false);
    }
  }, [pet, show, sessionData, childId, onComplete]);

  useEffect(() => {
    if (show && pet) {
      fetchReactions();
    }
  }, [show, pet, fetchReactions]);

  const handleReactionComplete = () => {
    setShowReactions(false);

    // Show accessory unlock if any
    if (newlyUnlockedAccessories.length > 0) {
      setShowAccessoryUnlock(true);
    } else {
      onComplete();
    }
  };

  const handleAccessoryUnlockClose = () => {
    setShowAccessoryUnlock(false);
    onComplete();
  };

  if (!show) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-gray-600">Loading pet reaction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onComplete}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Pet Reaction Display */}
      {showReactions && reactions.length > 0 && (
        <ReadingReactionDisplay
          pet={pet}
          reactions={reactions}
          onComplete={handleReactionComplete}
          autoAdvance={true}
          autoAdvanceDelay={4000}
        />
      )}

      {/* Accessory Unlock */}
      {newlyUnlockedAccessories.length === 1 && (
        <AccessoryUnlockModal
          accessory={newlyUnlockedAccessories[0]}
          isOpen={showAccessoryUnlock}
          onClose={handleAccessoryUnlockClose}
        />
      )}

      {newlyUnlockedAccessories.length > 1 && (
        <BatchUnlockModal
          accessories={newlyUnlockedAccessories}
          isOpen={showAccessoryUnlock}
          onClose={handleAccessoryUnlockClose}
        />
      )}
    </>
  );
}

// Compact version for embedding in summary screens
interface MiniPetReactionProps {
  pet: Pet;
  mood: PetMood;
  message: string;
  streakDays?: number;
  xpBonus?: number;
}

export function MiniPetReaction({
  pet,
  mood,
  message,
  streakDays,
  xpBonus,
}: MiniPetReactionProps) {
  const MOOD_EMOJIS: Record<PetMood, string> = {
    excited: '🤩',
    happy: '😊',
    proud: '🥳',
    content: '😌',
    sleepy: '😴',
    sad: '😢',
    lonely: '🥺',
  };

  return (
    <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4 border border-primary-100">
      <div className="flex items-start gap-4">
        {/* Pet avatar */}
        <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center overflow-hidden flex-shrink-0">
          {pet.image_url ? (
            <img
              src={pet.image_url}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl">
              {pet.pet_type === 'cat' ? '🐱' :
               pet.pet_type === 'dog' ? '🐶' :
               pet.pet_type === 'dinosaur' ? '🦕' :
               pet.pet_type === 'unicorn' ? '🦄' :
               pet.pet_type === 'dragon' ? '🐉' :
               pet.pet_type === 'bunny' ? '🐰' :
               pet.pet_type === 'bear' ? '🐻' :
               pet.pet_type === 'bird' ? '🐦' :
               pet.pet_type === 'fish' ? '🐠' :
               '🦋'}
            </span>
          )}
        </div>

        {/* Reaction content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800">{pet.name}</span>
            <span className="text-xl">{MOOD_EMOJIS[mood]}</span>
          </div>
          <p className="text-gray-700">{message}</p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-2">
            {streakDays && streakDays > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                🔥 {streakDays} day streak
              </span>
            )}
            {xpBonus && xpBonus > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                +{xpBonus} XP
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
