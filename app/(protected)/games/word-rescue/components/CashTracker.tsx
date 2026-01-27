'use client'

import { useCashRewards } from '@/lib/hooks/useCashRewards'
import { Card } from '@/components/ui'

interface CashTrackerProps {
  childId: string
}

export function CashTracker({ childId }: CashTrackerProps) {
  const { currentWeek, nextMilestone, cashRewardEnabled, isLoading } = useCashRewards({
    childId,
    autoFetch: true,
  })

  if (!cashRewardEnabled || isLoading || !currentWeek) {
    return null
  }

  const cashEarned = parseFloat(String(currentWeek.cash_earned || 0))

  return (
    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
      <h3 className="font-semibold text-green-800 mb-2">This Week&apos;s Earnings</h3>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold text-green-600">${cashEarned.toFixed(2)}</span>
        <span className="text-sm text-green-700">earned so far!</span>
      </div>

      <div className="text-sm text-green-700 mb-2">
        {currentWeek.words_mastered_this_week} words mastered
      </div>

      {/* Next milestone */}
      {nextMilestone && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <p className="text-sm text-green-800">
            <strong>
              {nextMilestone.wordsNeeded - currentWeek.words_mastered_this_week}
            </strong>{' '}
            more words for ${nextMilestone.bonus.toFixed(2)} bonus!
          </p>
          <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{
                width: `${Math.min(100, (currentWeek.words_mastered_this_week / nextMilestone.wordsNeeded) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </Card>
  )
}
