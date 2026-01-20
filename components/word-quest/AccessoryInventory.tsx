'use client';

import { useState, useEffect } from 'react';
import type {
  Accessory,
  ChildAccessory,
  PetEquippedAccessory,
  AccessoryType,
  AccessoryRarity,
} from '@/lib/types';
import {
  ACCESSORY_TYPE_EMOJIS,
  RARITY_COLORS,
  formatUnlockRequirement,
  getUnlockProgress,
} from '@/lib/types';

interface AccessoryInventoryProps {
  childId: string;
  petId: string;
  onEquip?: (accessory: Accessory) => void;
  onUnequip?: (slot: AccessoryType) => void;
}

interface Stats {
  sessions: number;
  wordsMastered: number;
  streakDays: number;
  level: number;
}

export function AccessoryInventory({
  childId,
  petId,
  onEquip,
  onUnequip,
}: AccessoryInventoryProps) {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [equippedBySlot, setEquippedBySlot] = useState<Record<string, PetEquippedAccessory>>({});
  const [stats, setStats] = useState<Stats>({ sessions: 0, wordsMastered: 0, streakDays: 0, level: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<AccessoryType | 'all'>('all');
  const [isEquipping, setIsEquipping] = useState(false);

  // Fetch accessories and unlocked status
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all accessories and child's unlocked ones
        const [accessoriesRes, equippedRes] = await Promise.all([
          fetch(`/api/word-quest/accessories?childId=${childId}`),
          fetch(`/api/word-quest/pets/${petId}/accessories`),
        ]);

        if (accessoriesRes.ok) {
          const data = await accessoriesRes.json();
          setAccessories(data.accessories || []);
          setStats(data.stats || { sessions: 0, wordsMastered: 0, streakDays: 0, level: 1 });

          const unlocked = new Set<string>();
          for (const ua of data.unlockedAccessories || []) {
            unlocked.add(ua.accessory_id);
          }
          setUnlockedIds(unlocked);
        }

        if (equippedRes.ok) {
          const data = await equippedRes.json();
          const bySlot: Record<string, PetEquippedAccessory> = {};
          for (const eq of data.equippedAccessories || []) {
            bySlot[eq.slot] = eq;
          }
          setEquippedBySlot(bySlot);
        }
      } catch (error) {
        console.error('Failed to fetch accessories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [childId, petId]);

  const handleEquip = async (accessory: Accessory) => {
    if (isEquipping || !unlockedIds.has(accessory.id)) return;

    setIsEquipping(true);
    try {
      const response = await fetch(`/api/word-quest/pets/${petId}/accessories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessoryId: accessory.id, slot: accessory.type }),
      });

      if (response.ok) {
        const data = await response.json();
        setEquippedBySlot((prev) => ({
          ...prev,
          [accessory.type]: data.equippedAccessory,
        }));
        onEquip?.(accessory);
      }
    } catch (error) {
      console.error('Failed to equip accessory:', error);
    } finally {
      setIsEquipping(false);
    }
  };

  const handleUnequip = async (slot: AccessoryType) => {
    if (isEquipping) return;

    setIsEquipping(true);
    try {
      const response = await fetch(`/api/word-quest/pets/${petId}/accessories`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot }),
      });

      if (response.ok) {
        setEquippedBySlot((prev) => {
          const newEquipped = { ...prev };
          delete newEquipped[slot];
          return newEquipped;
        });
        onUnequip?.(slot);
      }
    } catch (error) {
      console.error('Failed to unequip accessory:', error);
    } finally {
      setIsEquipping(false);
    }
  };

  const filteredAccessories =
    selectedType === 'all'
      ? accessories
      : accessories.filter((a) => a.type === selectedType);

  // Group by rarity for display
  const groupedByRarity = filteredAccessories.reduce(
    (acc, accessory) => {
      if (!acc[accessory.rarity]) {
        acc[accessory.rarity] = [];
      }
      acc[accessory.rarity].push(accessory);
      return acc;
    },
    {} as Record<AccessoryRarity, Accessory[]>
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Accessories</h3>

      {/* Currently Equipped Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Currently Equipped</h4>
        <div className="flex flex-wrap gap-2">
          {(['hat', 'collar', 'body', 'background', 'effect'] as AccessoryType[]).map((slot) => {
            const equipped = equippedBySlot[slot];
            return (
              <div
                key={slot}
                className={`
                  relative flex items-center gap-2 px-3 py-2 rounded-lg border-2
                  ${equipped ? 'bg-primary-50 border-primary-300' : 'bg-gray-50 border-dashed border-gray-300'}
                `}
              >
                <span className="text-lg">{ACCESSORY_TYPE_EMOJIS[slot]}</span>
                <div className="text-sm">
                  {equipped ? (
                    <div>
                      <div className="font-medium text-gray-700">
                        {(equipped.accessory as Accessory)?.display_name || 'Unknown'}
                      </div>
                      <button
                        onClick={() => handleUnequip(slot)}
                        disabled={isEquipping}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 capitalize">{slot}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedType === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {(['hat', 'collar', 'body', 'background', 'effect'] as AccessoryType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedType === type
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {ACCESSORY_TYPE_EMOJIS[type]} <span className="capitalize">{type}</span>
          </button>
        ))}
      </div>

      {/* Accessories Grid by Rarity */}
      {(['legendary', 'epic', 'rare', 'common'] as AccessoryRarity[]).map((rarity) => {
        const items = groupedByRarity[rarity];
        if (!items || items.length === 0) return null;

        const colors = RARITY_COLORS[rarity];

        return (
          <div key={rarity} className="mb-4">
            <h4 className={`text-sm font-semibold capitalize mb-2 ${colors.text}`}>
              {rarity}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {items.map((accessory) => {
                const isUnlocked = unlockedIds.has(accessory.id);
                const isEquipped = equippedBySlot[accessory.type]?.accessory_id === accessory.id;
                const progress = getUnlockProgress(accessory.unlock_requirement, stats);

                return (
                  <div
                    key={accessory.id}
                    className={`
                      relative p-3 rounded-xl border-2 transition-all
                      ${isUnlocked ? `${colors.bg} ${colors.border}` : 'bg-gray-100 border-gray-200'}
                      ${isEquipped ? 'ring-2 ring-primary-400 ring-offset-2' : ''}
                      ${!isUnlocked ? 'opacity-60' : ''}
                    `}
                  >
                    {/* Accessory Icon */}
                    <div className="text-2xl text-center mb-2">
                      {ACCESSORY_TYPE_EMOJIS[accessory.type]}
                    </div>

                    {/* Name */}
                    <div className="text-sm font-medium text-center text-gray-700 mb-1">
                      {accessory.display_name}
                    </div>

                    {/* Description */}
                    {accessory.description && (
                      <div className="text-xs text-gray-500 text-center mb-2">
                        {accessory.description}
                      </div>
                    )}

                    {/* Equip/Lock Status */}
                    {isUnlocked ? (
                      <button
                        onClick={() => handleEquip(accessory)}
                        disabled={isEquipping || isEquipped}
                        className={`
                          w-full py-1.5 rounded-lg text-xs font-medium transition-colors
                          ${isEquipped
                            ? 'bg-primary-500 text-white cursor-default'
                            : 'bg-white hover:bg-primary-100 text-primary-600 border border-primary-300'
                          }
                        `}
                      >
                        {isEquipped ? 'Equipped' : 'Equip'}
                      </button>
                    ) : (
                      <div>
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                          <div
                            className="h-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {formatUnlockRequirement(accessory.unlock_requirement)}
                        </div>
                      </div>
                    )}

                    {/* Locked Overlay */}
                    {!isUnlocked && (
                      <div className="absolute top-2 right-2">
                        <span className="text-lg">🔒</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {filteredAccessories.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          No accessories found in this category.
        </p>
      )}
    </div>
  );
}
