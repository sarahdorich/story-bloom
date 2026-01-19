'use client';

import { useState } from 'react';
import type {
  PetType,
  PetColor,
  PetPattern,
  PetAccessory,
  PetCustomization,
} from '@/lib/types';
import { PET_COLORS, PET_PATTERNS, PET_ACCESSORIES } from '@/lib/types';
import { PET_TYPE_OPTIONS } from '@/lib/pet-customization-options';

interface PetCustomizationFormProps {
  petType: PetType;
  initialValues?: Partial<PetCustomization>;
  onSubmit: (customization: PetCustomization, name: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

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
};

export function PetCustomizationForm({
  petType,
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
}: PetCustomizationFormProps) {
  const options = PET_TYPE_OPTIONS[petType];

  const [name, setName] = useState('');
  const [colorPrimary, setColorPrimary] = useState<PetColor | null>(
    initialValues?.colorPrimary ?? options.allowedColors[0] ?? null
  );
  const [colorSecondary, setColorSecondary] = useState<PetColor | null>(
    initialValues?.colorSecondary ?? null
  );
  const [pattern, setPattern] = useState<PetPattern | null>(
    initialValues?.pattern ?? options.allowedPatterns[0] ?? null
  );
  const [accessory, setAccessory] = useState<PetAccessory | null>(
    initialValues?.accessory ?? 'none'
  );
  const [customDescription, setCustomDescription] = useState(
    initialValues?.customDescription ?? ''
  );

  const handleSubmit = () => {
    onSubmit(
      {
        colorPrimary,
        colorSecondary,
        pattern,
        accessory,
        customDescription: customDescription.trim() || null,
      },
      name.trim()
    );
  };

  // Find color info by ID
  const getColorInfo = (colorId: PetColor) => {
    return PET_COLORS.find((c) => c.id === colorId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Customize Your {PET_TYPE_LABELS[petType]}!
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Make your pet unique and special
        </p>
      </div>

      {/* Name Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          What would you like to name your pet?
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name..."
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none text-lg"
          maxLength={20}
          autoFocus
        />
      </div>

      {/* Primary Color */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Main Color
        </label>
        <div className="flex flex-wrap gap-2">
          {options.allowedColors.map((colorId) => {
            const colorInfo = getColorInfo(colorId);
            if (!colorInfo) return null;

            const isRainbow = colorId === 'rainbow';

            return (
              <button
                key={colorId}
                type="button"
                onClick={() => setColorPrimary(colorId)}
                className={`w-10 h-10 rounded-full border-4 transition-all ${
                  colorPrimary === colorId
                    ? 'border-primary-500 scale-110 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  background: isRainbow
                    ? 'linear-gradient(90deg, #ef4444, #f97316, #fbbf24, #22c55e, #3b82f6, #a855f7)'
                    : colorInfo.hex,
                  boxShadow:
                    colorId === 'white'
                      ? 'inset 0 0 0 1px #e5e7eb'
                      : undefined,
                }}
                title={colorInfo.label}
                aria-label={`Select ${colorInfo.label} as main color`}
              />
            );
          })}
        </div>
      </div>

      {/* Secondary Color */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Accent Color <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setColorSecondary(null)}
            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
              colorSecondary === null
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            None
          </button>
          {options.allowedColors.map((colorId) => {
            const colorInfo = getColorInfo(colorId);
            if (!colorInfo) return null;

            const isRainbow = colorId === 'rainbow';

            return (
              <button
                key={colorId}
                type="button"
                onClick={() => setColorSecondary(colorId)}
                className={`w-10 h-10 rounded-full border-4 transition-all ${
                  colorSecondary === colorId
                    ? 'border-primary-500 scale-110 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  background: isRainbow
                    ? 'linear-gradient(90deg, #ef4444, #f97316, #fbbf24, #22c55e, #3b82f6, #a855f7)'
                    : colorInfo.hex,
                  boxShadow:
                    colorId === 'white'
                      ? 'inset 0 0 0 1px #e5e7eb'
                      : undefined,
                }}
                title={colorInfo.label}
                aria-label={`Select ${colorInfo.label} as accent color`}
              />
            );
          })}
        </div>
      </div>

      {/* Pattern */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Pattern
        </label>
        <div className="flex flex-wrap gap-2">
          {options.allowedPatterns.map((patternId) => {
            const patternInfo = PET_PATTERNS.find((p) => p.id === patternId);
            if (!patternInfo) return null;

            return (
              <button
                key={patternId}
                type="button"
                onClick={() => setPattern(patternId)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  pattern === patternId
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {patternInfo.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accessory */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Accessory
        </label>
        <div className="flex flex-wrap gap-2">
          {['none' as PetAccessory, ...options.suggestedAccessories].map(
            (accessoryId) => {
              const accessoryInfo = PET_ACCESSORIES.find(
                (a) => a.id === accessoryId
              );
              if (!accessoryInfo) return null;

              // Add emoji to accessory labels
              const accessoryEmojis: Partial<Record<PetAccessory, string>> = {
                bow: '🎀',
                collar: '📿',
                crown: '👑',
                hat: '🎩',
                glasses: '👓',
                scarf: '🧣',
                bandana: '🏴',
                flower: '🌸',
                star: '⭐',
              };

              return (
                <button
                  key={accessoryId}
                  type="button"
                  onClick={() => setAccessory(accessoryId)}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    accessory === accessoryId
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {accessoryEmojis[accessoryId] && (
                    <span className="mr-1">{accessoryEmojis[accessoryId]}</span>
                  )}
                  {accessoryInfo.label}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Custom Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Anything special about your pet?{' '}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={customDescription}
          onChange={(e) => setCustomDescription(e.target.value)}
          placeholder="e.g., has a fluffy tail, loves to smile, has a heart-shaped spot..."
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none text-sm resize-none"
          rows={2}
          maxLength={100}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {customDescription.length}/100
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !name.trim()}
          className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </span>
          ) : (
            'Create My Pet!'
          )}
        </button>
      </div>
    </div>
  );
}
