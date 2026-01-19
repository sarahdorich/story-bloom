'use client';

import { useEffect, useState, useMemo, type ReactNode } from 'react';
import type { Pet, PetType, HabitatType } from '@/lib/types';
import { HABITAT_TYPES, PET_DEFAULT_HABITATS } from '@/lib/types';

interface PetHabitatProps {
  pet: Pet;
  children?: ReactNode;
  showStats?: boolean;
}

const PET_EMOJIS: Record<PetType, string> = {
  cat: '🐱',
  dog: '🐕',
  dinosaur: '🦖',
  unicorn: '🦄',
  dragon: '🐉',
  bunny: '🐰',
  bear: '🐻',
  bird: '🐦',
  fish: '🐠',
  butterfly: '🦋',
};

// Pets that should use floating animation
const FLOATING_PETS: PetType[] = ['fish', 'butterfly', 'bird'];

// Pets that should use bouncing animation
const BOUNCING_PETS: PetType[] = ['bunny', 'dog'];

// Decorative elements for each habitat type
function HabitatDecorations({ habitatType }: { habitatType: HabitatType }) {
  const decorations: Record<HabitatType, ReactNode> = {
    default: (
      <>
        <div className="absolute bottom-0 left-4 text-4xl opacity-80">🪴</div>
        <div className="absolute top-4 right-4 text-2xl opacity-60">☁️</div>
        <div className="absolute bottom-4 right-8 text-3xl opacity-70">🧸</div>
      </>
    ),
    forest: (
      <>
        <div className="absolute bottom-0 left-0 text-4xl opacity-80">🌲</div>
        <div className="absolute bottom-0 right-0 text-4xl opacity-80">🌳</div>
        <div className="absolute top-4 left-4 text-xl opacity-60 animate-pet-float-slow">
          🍃
        </div>
        <div className="absolute bottom-4 left-1/4 text-2xl opacity-70">🍄</div>
        <div className="absolute top-8 right-8 text-xl opacity-50">🌿</div>
      </>
    ),
    ocean: (
      <>
        <div className="absolute bottom-0 left-4 text-3xl opacity-80">🪸</div>
        <div className="absolute bottom-0 right-4 text-3xl opacity-80">🐚</div>
        <div
          className="absolute top-8 right-8 text-xl opacity-60 animate-pet-float-slow"
          style={{ animationDelay: '0.5s' }}
        >
          🫧
        </div>
        <div
          className="absolute top-16 left-8 text-xl opacity-50 animate-pet-float-slow"
          style={{ animationDelay: '1s' }}
        >
          🫧
        </div>
        <div className="absolute bottom-2 left-1/3 text-2xl opacity-60">🌊</div>
      </>
    ),
    sky: (
      <>
        <div className="absolute top-4 left-8 text-3xl opacity-70 animate-pet-float-slow">
          ☁️
        </div>
        <div
          className="absolute top-12 right-12 text-2xl opacity-60 animate-pet-float-slow"
          style={{ animationDelay: '0.5s' }}
        >
          ☁️
        </div>
        <div className="absolute bottom-8 left-4 text-xl opacity-80">🌈</div>
        <div className="absolute top-20 left-1/4 text-lg opacity-50">✨</div>
      </>
    ),
    meadow: (
      <>
        <div className="absolute bottom-0 left-0 text-3xl opacity-80">🌻</div>
        <div className="absolute bottom-0 right-0 text-3xl opacity-80">🌷</div>
        <div className="absolute bottom-2 left-1/3 text-2xl opacity-70">🌸</div>
        <div className="absolute top-4 right-4 text-2xl opacity-60 animate-pet-float-slow">
          🦋
        </div>
        <div className="absolute bottom-4 right-1/4 text-xl opacity-60">🌼</div>
      </>
    ),
    cave: (
      <>
        <div className="absolute bottom-0 left-4 text-3xl opacity-80">💎</div>
        <div className="absolute top-4 right-4 text-2xl animate-pulse opacity-70">
          ✨
        </div>
        <div className="absolute bottom-4 right-8 text-2xl opacity-70">💜</div>
        <div className="absolute top-12 left-8 text-xl opacity-50">🔮</div>
        <div className="absolute bottom-8 left-1/4 text-lg opacity-60 animate-pulse">
          💫
        </div>
      </>
    ),
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {decorations[habitatType]}
    </div>
  );
}

export function PetHabitat({
  pet,
  children,
  showStats = true,
}: PetHabitatProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  const petType = pet.pet_type as PetType;
  const habitatType =
    (pet.habitat_type as HabitatType) || PET_DEFAULT_HABITATS[petType];
  const habitat = HABITAT_TYPES[habitatType];
  const emoji = PET_EMOJIS[petType] || '🐾';

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Random blinking animation
  useEffect(() => {
    if (prefersReducedMotion) return;

    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };

    const scheduleNextBlink = () => {
      const delay = 2000 + Math.random() * 4000; // 2-6 seconds
      const timeoutId = setTimeout(() => {
        blink();
        scheduleNextBlink();
      }, delay);
      return timeoutId;
    };

    const timeoutId = scheduleNextBlink();
    return () => clearTimeout(timeoutId);
  }, [prefersReducedMotion]);

  // Determine animation class based on pet type
  const animationClass = useMemo(() => {
    if (prefersReducedMotion) return '';

    if (FLOATING_PETS.includes(petType)) {
      return 'animate-pet-float';
    } else if (BOUNCING_PETS.includes(petType)) {
      return 'animate-pet-bounce-gentle';
    } else {
      return 'animate-pet-breathe';
    }
  }, [petType, prefersReducedMotion]);

  return (
    <div
      className={`relative rounded-3xl overflow-hidden bg-gradient-to-b ${habitat.gradient} p-6 min-h-[400px]`}
    >
      {/* Habitat Decorations */}
      <HabitatDecorations habitatType={habitatType} />

      {/* Floating Stats Overlay */}
      {showStats && (
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm z-10">
          <div className="flex items-center gap-2 text-sm">
            <span>😊</span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-400 transition-all duration-500"
                style={{ width: `${pet.happiness}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <span>⚡</span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all duration-500"
                style={{ width: `${pet.energy}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Level Badge */}
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm z-10">
        <span className="text-sm font-bold text-primary-600">
          Lv. {pet.level}
        </span>
      </div>

      {/* Pet Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px]">
        {/* Pet Image/Emoji with animations */}
        <div className={`relative ${animationClass}`}>
          {pet.image_url ? (
            <img
              src={pet.image_url}
              alt={pet.name}
              className={`w-48 h-48 rounded-2xl object-cover shadow-lg transition-opacity duration-150 ${
                isBlinking ? 'opacity-90' : 'opacity-100'
              }`}
            />
          ) : (
            <div
              className={`w-48 h-48 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-lg transition-opacity duration-150 ${
                isBlinking ? 'opacity-80' : 'opacity-100'
              }`}
            >
              <span className="text-8xl">{emoji}</span>
            </div>
          )}

          {/* Image Generation Status Badge */}
          {pet.image_generation_status === 'generating' && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md text-xs text-gray-500 flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-3 h-3 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              Creating image...
            </div>
          )}
          {pet.image_generation_status === 'failed' && !pet.image_url && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 px-3 py-1 rounded-full shadow-md text-xs text-red-600 whitespace-nowrap">
              Image unavailable
            </div>
          )}
        </div>

        {/* Pet Name */}
        <h2 className="mt-6 text-2xl font-bold text-gray-800">{pet.name}</h2>
        <p className="text-sm text-gray-600 capitalize">
          {pet.personality} {petType}
        </p>
      </div>

      {/* Children slot (interaction buttons, speech bubble, etc.) */}
      {children}
    </div>
  );
}
