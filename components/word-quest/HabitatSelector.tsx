'use client';

import { useState } from 'react';
import type { HabitatType, PetType } from '@/lib/types';
import { HABITAT_TYPES, PET_DEFAULT_HABITATS } from '@/lib/types';

interface HabitatSelectorProps {
  currentHabitat: HabitatType;
  petType: PetType;
  onSelect: (habitat: HabitatType) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const HABITAT_EMOJIS: Record<HabitatType, string> = {
  default: '🏠',
  forest: '🌲',
  ocean: '🌊',
  sky: '☁️',
  meadow: '🌻',
  cave: '💎',
};

export function HabitatSelector({
  currentHabitat,
  petType,
  onSelect,
  onClose,
  isLoading = false,
}: HabitatSelectorProps) {
  const [selectedHabitat, setSelectedHabitat] = useState<HabitatType>(currentHabitat);
  const defaultHabitat = PET_DEFAULT_HABITATS[petType];

  const handleConfirm = () => {
    if (selectedHabitat !== currentHabitat) {
      onSelect(selectedHabitat);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
          Choose a Habitat
        </h2>
        <p className="text-sm text-gray-500 text-center mb-4">
          Pick a cozy home for your pet
        </p>

        {/* Habitat Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(Object.keys(HABITAT_TYPES) as HabitatType[]).map((habitat) => {
            const { label, gradient } = HABITAT_TYPES[habitat];
            const isSelected = selectedHabitat === habitat;
            const isDefault = defaultHabitat === habitat;

            return (
              <button
                key={habitat}
                onClick={() => setSelectedHabitat(habitat)}
                disabled={isLoading}
                className={`
                  relative rounded-xl p-4 transition-all duration-200
                  bg-gradient-to-b ${gradient}
                  ${isSelected ? 'ring-4 ring-primary-500 scale-105' : 'hover:scale-102'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Default badge */}
                {isDefault && (
                  <span className="absolute top-1 right-1 text-xs bg-white/80 px-1.5 py-0.5 rounded-full text-gray-600">
                    Default
                  </span>
                )}

                {/* Emoji */}
                <div className="text-3xl mb-2">{HABITAT_EMOJIS[habitat]}</div>

                {/* Label */}
                <div className="text-sm font-medium text-gray-700">{label}</div>

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute bottom-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
