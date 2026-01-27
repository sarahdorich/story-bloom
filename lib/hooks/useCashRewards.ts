'use client'

import { useState, useCallback, useEffect } from 'react'
import type { CashReward } from '@/lib/types'

interface UseCashRewardsOptions {
  childId: string
  includeHistory?: boolean
  autoFetch?: boolean
}

interface NextMilestone {
  wordsNeeded: number
  bonus: number
}

interface UseCashRewardsReturn {
  currentWeek: CashReward | null
  history: CashReward[]
  childName: string | null
  nextMilestone: NextMilestone | null
  cashRewardEnabled: boolean
  isLoading: boolean
  error: string | null
  fetchRewards: () => Promise<void>
  markAsPaid: (rewardId: string, paidAmount?: number) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useCashRewards(
  options: UseCashRewardsOptions
): UseCashRewardsReturn {
  const { childId, includeHistory = false, autoFetch = true } = options

  const [currentWeek, setCurrentWeek] = useState<CashReward | null>(null)
  const [history, setHistory] = useState<CashReward[]>([])
  const [childName, setChildName] = useState<string | null>(null)
  const [nextMilestone, setNextMilestone] = useState<NextMilestone | null>(null)
  const [cashRewardEnabled, setCashRewardEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRewards = useCallback(async () => {
    if (!childId) return

    setIsLoading(true)
    setError(null)

    try {
      let url = `/api/cash-rewards?childId=${childId}`
      if (includeHistory) {
        url += '&history=true'
      }

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch cash rewards')
      }

      const data = await response.json()
      setCurrentWeek(data.currentWeek)
      setHistory(data.history || [])
      setChildName(data.childName)
      setNextMilestone(data.nextMilestone)
      setCashRewardEnabled(data.cashRewardEnabled)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cash rewards')
    } finally {
      setIsLoading(false)
    }
  }, [childId, includeHistory])

  const markAsPaid = useCallback(
    async (rewardId: string, paidAmount?: number): Promise<boolean> => {
      try {
        const response = await fetch('/api/cash-rewards', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rewardId, paidAmount }),
        })

        if (!response.ok) {
          throw new Error('Failed to mark as paid')
        }

        const { reward } = await response.json()

        // Update local state
        if (reward.id === currentWeek?.id) {
          setCurrentWeek(reward)
        } else {
          setHistory((prev) =>
            prev.map((r) => (r.id === reward.id ? reward : r))
          )
        }

        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to mark as paid')
        return false
      }
    },
    [currentWeek?.id]
  )

  const refetch = useCallback(() => fetchRewards(), [fetchRewards])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && childId) {
      fetchRewards()
    }
  }, [autoFetch, childId, fetchRewards])

  return {
    currentWeek,
    history,
    childName,
    nextMilestone,
    cashRewardEnabled,
    isLoading,
    error,
    fetchRewards,
    markAsPaid,
    refetch,
  }
}
