'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Pet, PetType, PetCustomization } from '@/lib/types';
import { Button } from '@/components/ui';
import { PetCustomizationForm } from './PetCustomizationForm';

type ModalStep = 'reveal' | 'select-type' | 'customize' | 'generating' | 'complete';

interface PetRewardModalProps {
  show: boolean;
  pet: Pet | null;
  petType: PetType;
  isFirstPet?: boolean;
  onClose: () => void;
  onVisitPet?: () => void;
  onCreatePet?: (
    customization: PetCustomization,
    name: string
  ) => Promise<Pet | null>;
  pollImageStatus?: (
    petId: string,
    onComplete?: (imageUrl: string) => void
  ) => () => void;
  onPetTypeChange?: (petType: PetType) => void;
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
  axolotl: '🦎',
};

const PET_TYPE_LABELS: Record<PetType, string> = {
  cat: 'Cat',
  dog: 'Dog',
  dinosaur: 'Dinosaur',
  unicorn: 'Unicorn',
  dragon: 'Dragon',
  bunny: 'Bunny',
  bear: 'Bear',
  bird: 'Bird',
  fish: 'Fish',
  butterfly: 'Butterfly',
  axolotl: 'Axolotl',
};

const ALL_PET_TYPES: PetType[] = [
  'cat',
  'dog',
  'dinosaur',
  'unicorn',
  'dragon',
  'bunny',
  'bear',
  'bird',
  'fish',
  'butterfly',
  'axolotl',
];

const GENERATING_MESSAGES = [
  'Creating your special pet...',
  'Adding some magic...',
  'Almost there...',
  'Making it extra special...',
];

export function PetRewardModal({
  show,
  pet,
  petType,
  isFirstPet,
  onClose,
  onVisitPet,
  onCreatePet,
  pollImageStatus,
  onPetTypeChange,
}: PetRewardModalProps) {
  const [selectedPetType, setSelectedPetType] = useState<PetType>(petType);
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [step, setStep] = useState<ModalStep>('reveal');
  const [createdPet, setCreatedPet] = useState<Pet | null>(null);
  const [generatingMessageIndex, setGeneratingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Use provided pet or created pet
  const displayPet = createdPet || pet;
  const emoji = PET_EMOJIS[selectedPetType] || '🐾';

  // Sync selectedPetType with petType prop when modal opens
  useEffect(() => {
    if (show) {
      setSelectedPetType(petType);
    }
  }, [show, petType]);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setStep('reveal');
      setCreatedPet(null);
      setError(null);
      setTimeout(() => setShowConfetti(true), 300);
    } else {
      setIsVisible(false);
      setShowConfetti(false);
    }
  }, [show]);

  // Cycle through generating messages
  useEffect(() => {
    if (step === 'generating') {
      const interval = setInterval(() => {
        setGeneratingMessageIndex(
          (prev) => (prev + 1) % GENERATING_MESSAGES.length
        );
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Poll for image generation completion
  useEffect(() => {
    if (
      createdPet &&
      pollImageStatus &&
      (createdPet.image_generation_status === 'generating' ||
        createdPet.image_generation_status === 'pending') &&
      !createdPet.image_url
    ) {
      const cleanup = pollImageStatus(createdPet.id, (imageUrl) => {
        setCreatedPet((prev) =>
          prev
            ? { ...prev, image_url: imageUrl, image_generation_status: 'completed' }
            : null
        );
      });
      return cleanup;
    }
  }, [createdPet, pollImageStatus]);

  const handleProceedToSelectType = useCallback(() => {
    setShowConfetti(false);
    setStep('select-type');
  }, []);

  const handlePetTypeSelect = useCallback((type: PetType) => {
    setSelectedPetType(type);
    if (onPetTypeChange) {
      onPetTypeChange(type);
    }
  }, [onPetTypeChange]);

  const handleProceedToCustomize = useCallback(() => {
    setStep('customize');
  }, []);

  const handleCustomizationSubmit = useCallback(
    async (customization: PetCustomization, name: string) => {
      if (!onCreatePet) {
        setError('Pet creation not available');
        return;
      }

      setStep('generating');
      setError(null);
      setGeneratingMessageIndex(0);

      try {
        const newPet = await onCreatePet(customization, name);
        if (newPet) {
          setCreatedPet(newPet);
          setStep('complete');
          setShowConfetti(true);
        } else {
          setError('Failed to create pet. Please try again.');
          setStep('customize');
        }
      } catch {
        setError('Something went wrong. Please try again.');
        setStep('customize');
      }
    },
    [onCreatePet]
  );

  const handleBackToCustomize = useCallback(() => {
    setStep('customize');
    setError(null);
  }, []);

  if (!show) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={step === 'generating' ? undefined : onClose}
      />

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <span className="text-2xl">
                {['🎉', '⭐', '✨', '🌟', '💫', '🎊'][Math.floor(Math.random() * 6)]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal Content */}
      <div
        className={`
          relative bg-white rounded-3xl shadow-2xl max-w-md w-full text-center
          transform transition-all duration-500 max-h-[90vh] overflow-y-auto
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}
        `}
      >
        {/* Step: Reveal */}
        {step === 'reveal' && (
          <div className="p-8">
            {/* Sparkle decoration */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
              ✨
            </div>

            {/* Header */}
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 mb-2">
              {isFirstPet ? 'Your First Pet!' : 'New Pet Unlocked!'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {isFirstPet
                ? "Great job reading! You've earned a special friend!"
                : 'Amazing score! You earned a new friend!'}
            </p>

            {/* Celebration Animation */}
            <div className="relative mb-6">
              <div className="w-40 h-40 mx-auto rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center shadow-lg animate-float">
                <span className="text-7xl">🎉</span>
              </div>
            </div>

            {/* Celebration message */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Congratulations!
              </h3>
              <p className="text-sm text-gray-500">
                Now pick what kind of pet you want!
              </p>
            </div>

            {/* Button */}
            <Button onClick={handleProceedToSelectType} className="w-full">
              Choose My Pet!
            </Button>
          </div>
        )}

        {/* Step: Select Pet Type */}
        {step === 'select-type' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Pick Your Pet!
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Which pet would you like?
            </p>

            {/* Pet Type Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {ALL_PET_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handlePetTypeSelect(type)}
                  className={`
                    flex flex-col items-center p-3 rounded-xl border-3 transition-all
                    ${selectedPetType === type
                      ? 'border-primary-500 bg-primary-50 scale-105 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-3xl mb-1">{PET_EMOJIS[type]}</span>
                  <span className="text-xs font-medium text-gray-700">
                    {PET_TYPE_LABELS[type]}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected pet display */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-4 mb-6 text-center">
              <span className="text-5xl">{PET_EMOJIS[selectedPetType]}</span>
              <p className="text-sm font-medium text-gray-700 mt-2">
                You chose a {PET_TYPE_LABELS[selectedPetType]}!
              </p>
            </div>

            {/* Button */}
            <Button onClick={handleProceedToCustomize} className="w-full">
              Customize My {PET_TYPE_LABELS[selectedPetType]}!
            </Button>
          </div>
        )}

        {/* Step: Customize */}
        {step === 'customize' && (
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
            <PetCustomizationForm
              petType={selectedPetType}
              onSubmit={handleCustomizationSubmit}
              onCancel={onClose}
              isLoading={false}
            />
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <div className="p-8">
            <div className="mb-6">
              <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center shadow-lg relative overflow-hidden">
                <span className="text-6xl animate-pulse">{PET_EMOJIS[selectedPetType]}</span>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {GENERATING_MESSAGES[generatingMessageIndex]}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              This may take a moment
            </p>

            {/* Loading spinner */}
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && displayPet && (
          <div className="p-8">
            {/* Sparkle decoration */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
              ✨
            </div>

            {/* Header */}
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 mb-2">
              Meet {displayPet.name}!
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Your new friend is ready to play!
            </p>

            {/* Pet Display */}
            <div className="relative mb-6">
              {displayPet.image_url ? (
                <img
                  src={displayPet.image_url}
                  alt={displayPet.name}
                  className="w-40 h-40 mx-auto rounded-2xl object-cover shadow-lg animate-float"
                />
              ) : (
                <div className="w-40 h-40 mx-auto rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center shadow-lg animate-float">
                  <span className="text-7xl">{emoji}</span>
                </div>
              )}
              {/* Generating badge if image is still pending */}
              {displayPet.image_generation_status === 'generating' && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                  Creating image...
                </div>
              )}
            </div>

            {/* Pet Info */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {displayPet.name}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                A {displayPet.personality} {displayPet.pet_type}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              {onVisitPet && (
                <Button onClick={onVisitPet} className="w-full">
                  Say Hello to {displayPet.name}!
                </Button>
              )}
              <Button variant="ghost" onClick={onClose} className="w-full">
                Continue Practicing
              </Button>
            </div>
          </div>
        )}

        {/* Error state for generating failure */}
        {step === 'generating' && error && (
          <div className="p-8">
            <div className="text-red-500 text-lg mb-4">😔</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Oops, something went wrong
            </h2>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button onClick={handleBackToCustomize} className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
