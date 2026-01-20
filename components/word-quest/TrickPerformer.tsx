'use client';

import { useState, useEffect } from 'react';
import type { Pet, PetTrick } from '@/lib/types';
import { getTrickAnimation, getTrickAnimationDuration, TRICK_XP_REWARDS } from '@/lib/types';

interface TrickPerformerProps {
  pet: Pet;
  onTrickStart?: (trickName: string, animationClass: string) => void;
  onTrickEnd?: () => void;
  onPetUpdate?: (pet: Pet) => void;
  onLevelUp?: (newLevel: number, newBehaviors: string[]) => void;
}

interface TrickResult {
  success: boolean;
  trick: PetTrick;
  xpEarned: number;
  masteryBonus: number;
  animationClass: string;
  animationDuration: number;
  leveledUp: boolean;
  newLevel?: number;
  newBehaviors?: string[];
  pet: Pet;
}

// Mastery level display
function MasteryStars({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`text-xs ${i < level ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function TrickPerformer({
  pet,
  onTrickStart,
  onTrickEnd,
  onPetUpdate,
  onLevelUp,
}: TrickPerformerProps) {
  const [tricks, setTricks] = useState<Record<string, PetTrick>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [performingTrick, setPerformingTrick] = useState<string | null>(null);
  const [showXpPopup, setShowXpPopup] = useState<{ xp: number; x: number; y: number } | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [showStreakBonus, setShowStreakBonus] = useState(false);

  const unlockedBehaviors = pet.unlocked_behaviors || [];

  // Fetch existing trick records
  useEffect(() => {
    const fetchTricks = async () => {
      try {
        const response = await fetch(`/api/word-quest/pets/${pet.id}/tricks`);
        if (response.ok) {
          const { tricks: trickList } = await response.json();
          const trickMap: Record<string, PetTrick> = {};
          for (const trick of trickList) {
            trickMap[trick.trick_name] = trick;
          }
          setTricks(trickMap);
        }
      } catch (error) {
        console.error('Failed to fetch tricks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTricks();
  }, [pet.id]);

  const handlePerformTrick = async (trickName: string, event: React.MouseEvent) => {
    if (performingTrick) return;

    setPerformingTrick(trickName);

    // Get animation info before API call for immediate feedback
    const animationClass = getTrickAnimation(trickName);
    const animationDuration = getTrickAnimationDuration(trickName);

    // Notify parent to start animation
    onTrickStart?.(trickName, animationClass);

    try {
      const response = await fetch(`/api/word-quest/pets/${pet.id}/tricks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trickName }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform trick');
      }

      const result: TrickResult = await response.json();

      // Update local trick state
      setTricks((prev) => ({
        ...prev,
        [trickName]: result.trick,
      }));

      // Update streak
      const newStreak = streakCount + 1;
      setStreakCount(newStreak);

      // Show XP popup near the clicked button
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setShowXpPopup({
        xp: result.xpEarned,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });

      // Check for streak bonus
      if (newStreak === 3) {
        setShowStreakBonus(true);
        setTimeout(() => {
          setShowStreakBonus(false);
          setStreakCount(0); // Reset streak after bonus
        }, 2000);
      }

      // Hide XP popup after a moment
      setTimeout(() => setShowXpPopup(null), 1500);

      // Update pet in parent
      onPetUpdate?.(result.pet);

      // Notify about level up
      if (result.leveledUp && result.newLevel && result.newBehaviors) {
        onLevelUp?.(result.newLevel, result.newBehaviors);
      }

      // Wait for animation to complete before allowing next trick
      setTimeout(() => {
        setPerformingTrick(null);
        onTrickEnd?.();
      }, animationDuration);
    } catch (error) {
      console.error('Error performing trick:', error);
      setPerformingTrick(null);
      onTrickEnd?.();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (unlockedBehaviors.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Tricks</h3>
        <p className="text-sm text-gray-500 text-center py-2">
          Level up to unlock tricks!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Perform Tricks</h3>

        {/* Streak Indicator */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Streak:</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < streakCount
                    ? 'bg-gradient-to-r from-orange-400 to-yellow-400 scale-110'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          {streakCount === 3 && (
            <span className="text-xs text-orange-500 font-semibold ml-1">+{TRICK_XP_REWARDS.streak3Bonus} XP!</span>
          )}
        </div>
      </div>

      {/* Trick Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {unlockedBehaviors.map((behavior) => {
          const trick = tricks[behavior];
          const isPerforming = performingTrick === behavior;
          const isDisabled = performingTrick !== null && !isPerforming;

          return (
            <button
              key={behavior}
              onClick={(e) => handlePerformTrick(behavior, e)}
              disabled={isDisabled}
              className={`
                relative p-3 rounded-xl text-left transition-all duration-200
                ${isPerforming ? 'bg-primary-100 ring-2 ring-primary-400 scale-105' : 'bg-gray-50 hover:bg-gray-100'}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              `}
            >
              {/* Trick Name */}
              <div className="text-sm font-medium text-gray-700 capitalize mb-1">
                {behavior.replace(/_/g, ' ')}
              </div>

              {/* Mastery & Times Performed */}
              <div className="flex items-center justify-between">
                <MasteryStars level={trick?.mastery_level || 0} />
                <span className="text-xs text-gray-400">
                  {trick?.times_performed || 0}x
                </span>
              </div>

              {/* Performing indicator */}
              {isPerforming && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary-100/80 rounded-xl">
                  <span className="text-2xl animate-bounce">✨</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* XP Popup */}
      {showXpPopup && (
        <div
          className="fixed z-50 pointer-events-none animate-bounce"
          style={{
            left: showXpPopup.x,
            top: showXpPopup.y - 40,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-gradient-to-r from-purple-500 to-primary-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            +{showXpPopup.xp} XP
          </div>
        </div>
      )}

      {/* Streak Bonus Popup */}
      {showStreakBonus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white px-6 py-3 rounded-2xl shadow-2xl animate-bounce text-center">
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-lg font-bold">Streak Bonus!</div>
            <div className="text-sm opacity-90">+{TRICK_XP_REWARDS.streak3Bonus} XP</div>
          </div>
        </div>
      )}

      {/* Tip text */}
      <p className="text-xs text-gray-400 text-center mt-3">
        Perform 3 tricks in a row for bonus XP! Master tricks by performing them 5 times.
      </p>
    </div>
  );
}
