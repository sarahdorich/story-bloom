'use client'

import { useState, useCallback, useRef } from 'react'
import type { PracticeWord, PracticeSession, PracticeAttemptResult } from '@/lib/types'

interface UseWordQuestOptions {
  childId: string
  readingLevel: string
  wordsPerSession?: number
}

interface UseWordQuestReturn {
  words: PracticeWord[]
  currentWordIndex: number
  currentWord: PracticeWord | null
  sessionId: string | null
  isLoading: boolean
  error: string | null
  wordsCorrect: number
  totalAttempts: number
  isSessionComplete: boolean
  attempts: PracticeAttemptResult[]
  startSession: () => Promise<void>
  checkAnswer: (spokenText: string) => Promise<boolean>
  skipWord: () => void
  endSession: () => Promise<PracticeSession | null>
}

const DEFAULT_WORDS_PER_SESSION = 10

export function useWordQuest(options: UseWordQuestOptions): UseWordQuestReturn {
  const {
    childId,
    readingLevel,
    wordsPerSession = DEFAULT_WORDS_PER_SESSION,
  } = options

  const [words, setWords] = useState<PracticeWord[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wordsCorrect, setWordsCorrect] = useState(0)
  const [attempts, setAttempts] = useState<PracticeAttemptResult[]>([])

  const sessionStartTime = useRef<Date | null>(null)

  const currentWord = words[currentWordIndex] || null
  const isSessionComplete = currentWordIndex >= words.length && words.length > 0

  const startSession = useCallback(async () => {
    if (!childId || !readingLevel) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/word-quest/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          readingLevel,
          count: wordsPerSession,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch words')
      }

      const { words: fetchedWords, sessionId: newSessionId } = await response.json()

      setWords(fetchedWords)
      setSessionId(newSessionId)
      setCurrentWordIndex(0)
      setWordsCorrect(0)
      setAttempts([])
      sessionStartTime.current = new Date()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
    } finally {
      setIsLoading(false)
    }
  }, [childId, readingLevel, wordsPerSession])

  const checkAnswer = useCallback(
    async (spokenText: string): Promise<boolean> => {
      if (!currentWord || !sessionId) return false

      const isCorrect = isWordMatch(spokenText, currentWord.word)

      const attempt: PracticeAttemptResult = {
        word: currentWord.word,
        spoken: spokenText,
        correct: isCorrect,
        timestamp: new Date(),
      }
      setAttempts((prev) => [...prev, attempt])

      if (isCorrect) {
        setWordsCorrect((prev) => prev + 1)
      }

      // Record progress via API (fire and forget)
      fetch('/api/word-quest/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          wordListId: currentWord.word_list_id,
          correct: isCorrect,
          sessionId,
        }),
      }).catch(console.error)

      // Advance to next word after recording progress
      setCurrentWordIndex((prev) => prev + 1)

      return isCorrect
    },
    [currentWord, childId, sessionId]
  )

  const skipWord = useCallback(() => {
    if (currentWord) {
      const attempt: PracticeAttemptResult = {
        word: currentWord.word,
        spoken: '',
        correct: false,
        timestamp: new Date(),
      }
      setAttempts((prev) => [...prev, attempt])
    }
    setCurrentWordIndex((prev) => prev + 1)
  }, [currentWord])

  const endSession = useCallback(async (): Promise<PracticeSession | null> => {
    if (!sessionId || !sessionStartTime.current) return null

    const duration = Math.round(
      (new Date().getTime() - sessionStartTime.current.getTime()) / 1000
    )

    try {
      const response = await fetch('/api/word-quest/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          wordsPracticed: attempts.length,
          wordsCorrect,
          durationSeconds: duration,
        }),
      })

      if (!response.ok) return null
      return response.json()
    } catch {
      return null
    }
  }, [sessionId, attempts.length, wordsCorrect])

  return {
    words,
    currentWordIndex,
    currentWord,
    sessionId,
    isLoading,
    error,
    wordsCorrect,
    totalAttempts: attempts.length,
    isSessionComplete,
    attempts,
    startSession,
    checkAnswer,
    skipWord,
    endSession,
  }
}

/**
 * Fuzzy word matching for young readers
 * Tolerates common speech recognition errors and pronunciation variations
 */
function isWordMatch(spoken: string, target: string): boolean {
  const cleanSpoken = spoken.toLowerCase().trim()
  const cleanTarget = target.toLowerCase().trim()

  // Exact match
  if (cleanSpoken === cleanTarget) return true

  // Check if the word is contained in a phrase (e.g., "the word is cat")
  const words = cleanSpoken.split(/\s+/)
  if (words.includes(cleanTarget)) return true

  // Levenshtein distance for fuzzy matching
  const maxDistance = cleanTarget.length <= 3 ? 1 : 2
  if (levenshteinDistance(cleanSpoken, cleanTarget) <= maxDistance) return true

  // Check against each word in the spoken phrase
  for (const word of words) {
    if (levenshteinDistance(word, cleanTarget) <= maxDistance) return true
  }

  // Common phonetic substitutions
  if (arePhoneticallySimilar(cleanSpoken, cleanTarget)) return true

  return false
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

function arePhoneticallySimilar(spoken: string, target: string): boolean {
  // Common speech recognition substitutions for young readers
  const substitutions: [RegExp, string][] = [
    [/th/g, 'f'], // "the" -> "fe"
    [/th/g, 'd'], // "the" -> "de"
    [/wh/g, 'w'], // "what" -> "wat"
    [/ph/g, 'f'], // "phone" -> "fone"
    [/ck/g, 'k'], // "back" -> "bak"
    [/ght/g, 't'], // "night" -> "nit"
    [/tion/g, 'shun'], // "action" -> "akshun"
  ]

  let normalizedSpoken = spoken
  let normalizedTarget = target

  for (const [pattern, replacement] of substitutions) {
    normalizedSpoken = normalizedSpoken.replace(pattern, replacement)
    normalizedTarget = normalizedTarget.replace(pattern, replacement)
  }

  return normalizedSpoken === normalizedTarget
}

export { isWordMatch }
