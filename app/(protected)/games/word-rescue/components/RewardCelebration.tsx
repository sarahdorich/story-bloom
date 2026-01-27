'use client'

import { useEffect, useState } from 'react'
import type { CelebrationData } from '@/lib/types'

interface RewardCelebrationProps {
  data: CelebrationData
  onComplete: () => void
}

export function RewardCelebration({ data, onComplete }: RewardCelebrationProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Auto-dismiss after animation
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onComplete, 300)
    }, data.isMastered ? 2500 : 1500)

    return () => clearTimeout(timer)
  }, [data.isMastered, onComplete])

  if (!visible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Overlay with confetti effect for mastery */}
      {data.isMastered && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random()}s`,
              }}
            >
              {['🎉', '⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Celebration card */}
      <div
        className={`bg-white rounded-2xl shadow-2xl p-6 text-center transform transition-all duration-300 ${
          visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        {data.isMastered ? (
          <>
            <div className="text-6xl mb-4 animate-bounce">⭐</div>
            <h3 className="text-2xl font-bold text-yellow-600 mb-2">Word Mastered!</h3>
            <p className="text-lg text-gray-700 mb-4">&quot;{data.word}&quot;</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-3 animate-pulse">✓</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">Correct!</h3>
          </>
        )}

        {/* Rewards earned */}
        <div className="flex justify-center items-center gap-4 text-lg">
          {data.coinsEarned > 0 && (
            <span className="flex items-center gap-1 text-yellow-600 font-semibold animate-pop">
              +{data.coinsEarned} 🪙
            </span>
          )}
          {data.isMastered && (
            <span className="flex items-center gap-1 text-purple-600 font-semibold animate-pop">
              +1 💎
            </span>
          )}
          {data.cashEarned > 0 && (
            <span className="flex items-center gap-1 text-green-600 font-semibold animate-pop">
              +${data.cashEarned.toFixed(2)} 💵
            </span>
          )}
        </div>

        {/* Stage advancement */}
        {data.newStage && !data.isMastered && (
          <p className="mt-3 text-sm text-purple-600">
            Your word is growing! 🌱 → 🌿
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
          font-size: 24px;
        }
        @keyframes pop {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-pop {
          animation: pop 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
