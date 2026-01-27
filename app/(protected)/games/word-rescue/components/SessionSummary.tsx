'use client'

import { Button, Card } from '@/components/ui'
import type { Pet, WordRescueStats } from '@/lib/types'

interface SessionSummaryProps {
  stats: WordRescueStats
  buddyPet: Pet
  onPlayAgain: () => void
  onExit: () => void
}

export function SessionSummary({
  stats,
  buddyPet,
  onPlayAgain,
  onExit,
}: SessionSummaryProps) {
  const accuracy =
    stats.wordsRescued > 0
      ? Math.round((stats.wordsRescued / (stats.wordsRescued + (stats.totalCoins > 0 ? 0 : 1))) * 100)
      : 0

  // Determine celebration level
  const celebrationLevel =
    stats.wordsMastered >= 3
      ? 'amazing'
      : stats.wordsRescued >= 5
      ? 'great'
      : stats.wordsRescued >= 1
      ? 'good'
      : 'try'

  const celebrationMessages = {
    amazing: "WOW! You're a Word Rescue Hero!",
    great: 'Great job rescuing words!',
    good: 'Nice work! Keep practicing!',
    try: "Don't give up! Practice makes perfect!",
  }

  const petMessages = {
    amazing: "That was AMAZING! I'm so proud of you!",
    great: 'You did great! I had so much fun!',
    good: 'Good effort! Let\s try again soon!',
    try: "It's okay! We'll do better next time!",
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      {/* Celebration header */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">
          {celebrationLevel === 'amazing'
            ? '🏆'
            : celebrationLevel === 'great'
            ? '🎉'
            : celebrationLevel === 'good'
            ? '⭐'
            : '💪'}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h1>
        <p className="text-lg text-purple-600 font-medium">
          {celebrationMessages[celebrationLevel]}
        </p>
      </div>

      {/* Pet buddy message */}
      <div className="flex items-start gap-3 mb-6">
        {buddyPet.image_url ? (
          <img
            src={buddyPet.image_url}
            alt={buddyPet.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow-md"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-2xl border-2 border-purple-200 shadow-md">
            🐾
          </div>
        )}
        <div className="flex-1 bg-purple-50 rounded-xl p-3 relative">
          <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-purple-50 border-b-8 border-b-transparent" />
          <p className="font-medium text-purple-900">{buddyPet.name}</p>
          <p className="text-purple-700">&quot;{petMessages[celebrationLevel]}&quot;</p>
        </div>
      </div>

      {/* Stats */}
      <Card className="p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 text-center">Session Results</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.wordsRescued}</div>
            <div className="text-sm text-gray-600">Words Rescued</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.wordsMastered}</div>
            <div className="text-sm text-gray-600">Words Mastered</div>
          </div>
        </div>

        {/* Rewards */}
        <div className="mt-4 pt-4 border-t">
          <h3 className="font-medium text-gray-700 mb-2 text-center">Rewards Earned</h3>
          <div className="flex justify-center items-center gap-6">
            <div className="text-center">
              <span className="text-2xl">🪙</span>
              <span className="ml-1 font-semibold">{stats.totalCoins}</span>
            </div>
            {stats.totalGems > 0 && (
              <div className="text-center">
                <span className="text-2xl">💎</span>
                <span className="ml-1 font-semibold">{stats.totalGems}</span>
              </div>
            )}
            {stats.cashEarned > 0 && (
              <div className="text-center">
                <span className="text-2xl">💵</span>
                <span className="ml-1 font-semibold text-green-600">
                  ${stats.cashEarned.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={onExit}>
          Done
        </Button>
        <Button onClick={onPlayAgain} className="px-8">
          Play Again!
        </Button>
      </div>
    </div>
  )
}
