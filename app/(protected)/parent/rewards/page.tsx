'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useChild } from '../../ProtectedLayoutClient'
import { useCashRewards } from '@/lib/hooks/useCashRewards'
import { useAppSettings } from '@/lib/hooks/useAppSettings'
import { Button, Card, Input } from '@/components/ui'

export default function ParentRewardsPage() {
  const { children, selectedChild, selectChild } = useChild()
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  const {
    currentWeek,
    history,
    childName,
    nextMilestone,
    cashRewardEnabled,
    isLoading,
    error,
    fetchRewards,
    markAsPaid,
  } = useCashRewards({
    childId: selectedChild?.id || '',
    includeHistory: true,
    autoFetch: !!selectedChild,
  })

  const { settings, updateSettings } = useAppSettings()

  const handleMarkPaid = async (rewardId: string) => {
    setMarkingPaid(rewardId)
    await markAsPaid(rewardId)
    setMarkingPaid(null)
  }

  // Format date for display
  const formatWeekDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const endDate = new Date(date)
    endDate.setDate(date.getDate() + 6)
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  // No child selected
  if (!selectedChild) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">No Child Selected</h2>
          <p className="text-gray-600 mb-4">
            Please select a child from the dropdown in the header.
          </p>
          <Link href="/profile">
            <Button>Go to Profile</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Rewards</h1>
          <p className="text-gray-600">Track and manage {selectedChild.name}&apos;s earnings</p>
        </div>
        <Link href="/games/word-rescue">
          <Button variant="outline">Back to Word Rescue</Button>
        </Link>
      </div>

      {/* Cash Rewards Toggle */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Cash Rewards</h2>
            <p className="text-sm text-gray-600">
              Enable to let {selectedChild.name} earn real money for mastering words
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.cash_reward_enabled || false}
              onChange={(e) => updateSettings({ cash_reward_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
          </label>
        </div>

        {settings?.cash_reward_enabled && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount per mastered word
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <Input
                  type="number"
                  min="0.01"
                  max="5.00"
                  step="0.05"
                  value={settings?.cash_per_mastered_word ?? 0.10}
                  onChange={(e) =>
                    updateSettings({ cash_per_mastered_word: parseFloat(e.target.value) || 0.10 })
                  }
                  className="w-24"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="milestones"
                checked={settings?.cash_milestone_bonus_enabled ?? true}
                onChange={(e) =>
                  updateSettings({ cash_milestone_bonus_enabled: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <label htmlFor="milestones" className="text-sm text-gray-700">
                Enable milestone bonuses
              </label>
            </div>

            {settings?.cash_milestone_bonus_enabled && (
              <div className="grid grid-cols-3 gap-4 pl-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">10 words bonus</label>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="0.50"
                      value={settings?.cash_milestone_10_words ?? 1.00}
                      onChange={(e) =>
                        updateSettings({ cash_milestone_10_words: parseFloat(e.target.value) || 1.00 })
                      }
                      className="w-20 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">25 words bonus</label>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      step="0.50"
                      value={settings?.cash_milestone_25_words ?? 3.00}
                      onChange={(e) =>
                        updateSettings({ cash_milestone_25_words: parseFloat(e.target.value) || 3.00 })
                      }
                      className="w-20 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">50 words bonus</label>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      step="0.50"
                      value={settings?.cash_milestone_50_words ?? 5.00}
                      onChange={(e) =>
                        updateSettings({ cash_milestone_50_words: parseFloat(e.target.value) || 5.00 })
                      }
                      className="w-20 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekly cap
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={settings?.weekly_cash_cap ?? 20.00}
                  onChange={(e) =>
                    updateSettings({ weekly_cash_cap: parseFloat(e.target.value) || 20.00 })
                  }
                  className="w-24"
                />
                <span className="text-sm text-gray-500">per week</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Current Week */}
      {cashRewardEnabled && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">This Week</h2>

          {isLoading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-600">{error}</div>
          ) : currentWeek ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {formatWeekDate(currentWeek.week_start_date)}
                  </p>
                </div>
                {currentWeek.is_paid && (
                  <span className="text-sm text-green-600 font-medium">Paid</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {currentWeek.words_mastered_this_week}
                  </div>
                  <div className="text-sm text-purple-700">Words Mastered</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    ${parseFloat(String(currentWeek.cash_earned || 0)).toFixed(2)}
                  </div>
                  <div className="text-sm text-green-700">Earned</div>
                </div>
              </div>

              {/* Next milestone */}
              {nextMilestone && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>
                      {nextMilestone.wordsNeeded - currentWeek.words_mastered_this_week}
                    </strong>{' '}
                    more words for a <strong>${nextMilestone.bonus.toFixed(2)}</strong> bonus!
                  </p>
                  <div className="mt-2 h-2 bg-yellow-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all"
                      style={{
                        width: `${(currentWeek.words_mastered_this_week / nextMilestone.wordsNeeded) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {!currentWeek.is_paid && parseFloat(String(currentWeek.cash_earned || 0)) > 0 && (
                <Button
                  onClick={() => handleMarkPaid(currentWeek.id)}
                  disabled={markingPaid === currentWeek.id}
                  className="w-full"
                >
                  {markingPaid === currentWeek.id
                    ? 'Marking...'
                    : `Mark as Paid ($${parseFloat(String(currentWeek.cash_earned || 0)).toFixed(2)})`}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No data for this week yet</p>
          )}
        </Card>
      )}

      {/* History */}
      {cashRewardEnabled && history && history.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Payout History</h2>

          <div className="space-y-3">
            {history.map((week) => (
              <div
                key={week.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{formatWeekDate(week.week_start_date)}</p>
                  <p className="text-sm text-gray-500">
                    {week.words_mastered_this_week} words mastered
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    ${parseFloat(String(week.cash_earned || 0)).toFixed(2)}
                  </p>
                  {week.is_paid ? (
                    <p className="text-xs text-green-600">
                      Paid {new Date(week.paid_at!).toLocaleDateString()}
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkPaid(week.id)}
                      disabled={markingPaid === week.id}
                    >
                      {markingPaid === week.id ? '...' : 'Mark Paid'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Child selector for multi-child accounts */}
      {children.length > 1 && (
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Other Children</h2>
          <div className="flex flex-wrap gap-2">
            {children
              .filter((c) => c.id !== selectedChild?.id)
              .map((child) => (
                <Button
                  key={child.id}
                  variant="outline"
                  onClick={() => selectChild(child)}
                >
                  {child.name}
                </Button>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}
