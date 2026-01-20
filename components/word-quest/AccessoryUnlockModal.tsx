'use client';

import { useState, useEffect } from 'react';
import type { Accessory, AccessoryRarity } from '@/lib/types';
import { ACCESSORY_TYPE_EMOJIS, RARITY_COLORS } from '@/lib/types';

interface AccessoryUnlockModalProps {
  accessory: Accessory;
  isOpen: boolean;
  onClose: () => void;
  onEquipNow?: () => void;
}

// Confetti using CSS animations
function ConfettiEffect({ colors }: { colors: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {colors.flatMap((color, ci) =>
        [...Array(8)].map((_, i) => (
          <div
            key={`${ci}-${i}`}
            className="absolute w-3 h-3 rounded-sm animate-confetti"
            style={{
              backgroundColor: color,
              left: `${Math.random() * 100}%`,
              top: '50%',
              animationDelay: `${ci * 0.1 + i * 0.05}s`,
              animationDuration: '2s',
            }}
          />
        ))
      )}
    </div>
  );
}

// Sparkle effect for rare+ accessories
function SparkleEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-yellow-400 animate-sparkle"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1.5 + Math.random()}s`,
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
}

export function AccessoryUnlockModal({
  accessory,
  isOpen,
  onClose,
  onEquipNow,
}: AccessoryUnlockModalProps) {
  const [showContent, setShowContent] = useState(false);
  const colors = RARITY_COLORS[accessory.rarity];

  const confettiColors =
    accessory.rarity === 'legendary'
      ? ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#9B59B6']
      : accessory.rarity === 'epic'
      ? ['#9B59B6', '#8E44AD', '#E91E63', '#00BCD4']
      : accessory.rarity === 'rare'
      ? ['#3498DB', '#2980B9', '#00BCD4', '#4FC3F7']
      : ['#95A5A6', '#BDC3C7', '#ECF0F1'];

  useEffect(() => {
    if (isOpen) {
      // Delay showing content for dramatic effect
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      {showContent && (
        <div className="relative w-full max-w-sm mx-4 animate-scale-in">
          {/* Confetti */}
          <ConfettiEffect colors={confettiColors} />

          {/* Card */}
          <div
            className={`relative bg-gradient-to-b from-white to-gray-50 rounded-3xl shadow-2xl overflow-hidden border-4 ${colors.border}`}
          >
            {/* Sparkle effect for rare+ */}
            {accessory.rarity !== 'common' && <SparkleEffect />}

            {/* Header */}
            <div className={`relative py-4 text-center ${colors.bg}`}>
              <div className="text-lg font-bold text-gray-800 animate-fade-in-down">
                New Accessory Unlocked!
              </div>
              <div
                className={`inline-block px-3 py-1 mt-2 rounded-full text-sm font-semibold capitalize ${colors.bg} ${colors.text} animate-scale-in`}
                style={{ animationDelay: '0.3s' }}
              >
                {accessory.rarity}
              </div>
            </div>

            {/* Accessory display */}
            <div className="relative flex justify-center py-8">
              <div className="relative w-32 h-32 flex items-center justify-center animate-spin-in">
                {/* Glow effect */}
                <div
                  className={`absolute inset-0 rounded-full opacity-50 animate-pulse ${
                    accessory.rarity === 'legendary'
                      ? 'bg-gradient-radial from-yellow-300 to-yellow-100'
                      : accessory.rarity === 'epic'
                      ? 'bg-gradient-radial from-purple-300 to-purple-100'
                      : accessory.rarity === 'rare'
                      ? 'bg-gradient-radial from-blue-300 to-blue-100'
                      : 'bg-gradient-radial from-gray-200 to-gray-100'
                  }`}
                />

                {/* Accessory icon */}
                <div className="relative z-10 text-7xl">
                  {ACCESSORY_TYPE_EMOJIS[accessory.type]}
                </div>
              </div>
            </div>

            {/* Accessory info */}
            <div className="px-6 pb-6 text-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {accessory.display_name}
              </h2>
              {accessory.description && (
                <p className="text-gray-600 mb-4">{accessory.description}</p>
              )}

              {/* Type badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 mb-6">
                <span>{ACCESSORY_TYPE_EMOJIS[accessory.type]}</span>
                <span className="capitalize">{accessory.type} Slot</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Save for Later
                </button>
                {onEquipNow && (
                  <button
                    onClick={() => {
                      onEquipNow();
                      onClose();
                    }}
                    className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-md"
                  >
                    Equip Now!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Batch unlock modal for multiple accessories
interface BatchUnlockModalProps {
  accessories: Accessory[];
  isOpen: boolean;
  onClose: () => void;
}

export function BatchUnlockModal({
  accessories,
  isOpen,
  onClose,
}: BatchUnlockModalProps) {
  if (!isOpen || accessories.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800">
              {accessories.length} New Accessories!
            </h2>
            <p className="text-gray-600">
              Great job! You&apos;ve unlocked new items for your pets!
            </p>
          </div>

          {/* Accessories grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {accessories.map((accessory, index) => {
              const colors = RARITY_COLORS[accessory.rarity];
              return (
                <div
                  key={accessory.id}
                  className={`p-3 rounded-xl border-2 ${colors.border} ${colors.bg} text-center animate-scale-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-3xl mb-1">
                    {ACCESSORY_TYPE_EMOJIS[accessory.type]}
                  </div>
                  <div className="text-xs font-medium text-gray-700 truncate">
                    {accessory.display_name}
                  </div>
                  <div className={`text-xs capitalize ${colors.text}`}>
                    {accessory.rarity}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}
