'use client';

import { useState, useEffect } from 'react';
import type { Pet, PetMood, ReadingReactionType } from '@/lib/types';
import { MOOD_EMOJIS, MOOD_COLORS } from '@/lib/types';

interface Reaction {
  type: ReadingReactionType;
  mood: PetMood;
  message: string;
  xpBonus: number;
}

interface ReadingReactionDisplayProps {
  pet: Pet;
  reactions: Reaction[];
  onComplete?: () => void;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

// Floating hearts/stars animation using CSS
function FloatingParticles({ mood }: { mood: PetMood }) {
  const particles = mood === 'excited' || mood === 'happy' || mood === 'proud'
    ? ['heart', 'star', 'sparkle']
    : mood === 'sad' || mood === 'lonely'
    ? ['tear']
    : ['sparkle'];

  const emojis: Record<string, string> = {
    heart: '❤️',
    star: '⭐',
    sparkle: '✨',
    tear: '💙',
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl animate-float-up"
          style={{
            left: `${20 + Math.random() * 60}%`,
            bottom: '20%',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random()}s`,
          }}
        >
          {emojis[particles[Math.floor(Math.random() * particles.length)]]}
        </div>
      ))}
    </div>
  );
}

// XP bonus popup
function XpBonusPopup({ xp }: { xp: number }) {
  return (
    <div className="animate-bounce-in bg-gradient-to-r from-purple-500 to-primary-500 text-white px-4 py-2 rounded-full shadow-lg font-bold">
      +{xp} Bonus XP!
    </div>
  );
}

// Speech bubble for pet message
function PetSpeechBubble({ message, mood }: { message: string; mood: PetMood }) {
  return (
    <div className="relative bg-white rounded-2xl shadow-lg p-4 mx-4 max-w-sm animate-fade-in-up">
      {/* Speech bubble tail */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-white" />

      {/* Mood indicator */}
      <div className={`text-3xl text-center mb-2 ${MOOD_COLORS[mood]}`}>
        {MOOD_EMOJIS[mood]}
      </div>

      {/* Message */}
      <p className="text-gray-700 text-center text-lg font-medium">{message}</p>
    </div>
  );
}

const PET_EMOJIS: Record<string, string> = {
  cat: '🐱',
  dog: '🐶',
  dinosaur: '🦕',
  unicorn: '🦄',
  dragon: '🐉',
  bunny: '🐰',
  bear: '🐻',
  bird: '🐦',
  fish: '🐠',
  butterfly: '🦋',
};

export function ReadingReactionDisplay({
  pet,
  reactions,
  onComplete,
  autoAdvance = true,
  autoAdvanceDelay = 4000,
}: ReadingReactionDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const currentReaction = reactions[currentIndex];
  const hasMore = currentIndex < reactions.length - 1;

  // Auto-advance through reactions
  useEffect(() => {
    if (!autoAdvance || !isVisible) return;

    const timer = setTimeout(() => {
      if (hasMore) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsVisible(false);
        onComplete?.();
      }
    }, autoAdvanceDelay);

    return () => clearTimeout(timer);
  }, [currentIndex, hasMore, autoAdvance, autoAdvanceDelay, isVisible, onComplete]);

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsVisible(false);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible || !currentReaction) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="relative w-full max-w-md mx-4 animate-scale-in">
        {/* Background card */}
        <div className="bg-gradient-to-b from-primary-100 to-purple-100 rounded-3xl p-6 shadow-2xl">
          {/* Floating particles */}
          <FloatingParticles mood={currentReaction.mood} />

          {/* Pet display area */}
          <div className="relative flex flex-col items-center py-6">
            {/* Pet image or emoji */}
            <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden mb-4 animate-bounce-slow">
              {pet.image_url ? (
                <img
                  src={pet.image_url}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl">
                  {PET_EMOJIS[pet.pet_type] || '🐾'}
                </span>
              )}
            </div>

            {/* Pet name */}
            <h2 className="text-xl font-bold text-gray-800 mb-4">{pet.name}</h2>

            {/* Speech bubble */}
            <PetSpeechBubble
              key={currentIndex}
              message={currentReaction.message}
              mood={currentReaction.mood}
            />

            {/* XP Bonus */}
            {currentReaction.xpBonus > 0 && (
              <div className="mt-4">
                <XpBonusPopup xp={currentReaction.xpBonus} />
              </div>
            )}
          </div>

          {/* Progress indicators */}
          {reactions.length > 1 && (
            <div className="flex justify-center gap-2 mt-2">
              {reactions.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-primary-500' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary-500 text-white rounded-full font-medium shadow-md hover:bg-primary-600 transition-colors"
            >
              {hasMore ? 'Next' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified inline version for embedding in other components
export function MiniReactionBubble({
  mood,
  message,
  petName,
}: {
  mood: PetMood;
  message: string;
  petName: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-3 flex items-start gap-3 animate-fade-in-up">
      <div className={`text-2xl ${MOOD_COLORS[mood]}`}>
        {MOOD_EMOJIS[mood]}
      </div>
      <div>
        <div className="text-sm font-medium text-gray-800">{petName}</div>
        <div className="text-sm text-gray-600">{message}</div>
      </div>
    </div>
  );
}

// Pet mood indicator component
export function PetMoodIndicator({
  mood,
  happiness,
  streakDays,
  size = 'md',
}: {
  mood: PetMood;
  happiness: number;
  streakDays?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const moodDescriptions: Record<PetMood, string> = {
    excited: 'Super excited!',
    happy: 'Feeling happy',
    proud: 'Very proud',
    content: 'Content',
    sleepy: 'Sleepy...',
    sad: 'Feeling sad',
    lonely: 'Missing you',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`${sizeClasses[size]} ${MOOD_COLORS[mood]}`}>
        {MOOD_EMOJIS[mood]}
      </span>
      <div className="text-sm">
        <div className="font-medium text-gray-700">{moodDescriptions[mood]}</div>
        {streakDays !== undefined && streakDays > 0 && (
          <div className="text-xs text-orange-500">
            {streakDays} day streak! 🔥
          </div>
        )}
      </div>
    </div>
  );
}
