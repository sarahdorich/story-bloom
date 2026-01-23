'use client'

import { useState, useCallback, useRef } from 'react'
import { isWordMatch } from './useWordQuest'
import type {
  ReadingMaterial,
  MaterialSentence,
  SentencePracticeSession,
  SentenceAttemptResult,
  SentenceWordResult,
} from '@/lib/types'
import { SENTENCE_ACCURACY_THRESHOLD } from '@/lib/types'

interface UseSentenceShenanigansOptions {
  childId: string
}

interface UseSentenceShenanigansReturn {
  // Material management
  materials: ReadingMaterial[]
  isLoadingMaterials: boolean
  materialsError: string | null
  fetchMaterials: () => Promise<void>
  createMaterial: (
    name: string,
    sentences: { text: string; order: number; confidence?: number }[],
    description?: string,
    imageData?: string
  ) => Promise<ReadingMaterial | null>
  deleteMaterial: (materialId: string) => Promise<boolean>

  // Session state
  sentences: MaterialSentence[]
  currentSentenceIndex: number
  currentSentence: MaterialSentence | null
  sessionId: string | null
  isLoading: boolean
  error: string | null
  sentencesCorrect: number
  totalAttempts: number
  isSessionComplete: boolean
  attempts: SentenceAttemptResult[]
  currentMaterial: ReadingMaterial | null

  // Actions
  startSession: (materialId: string) => Promise<void>
  checkSentence: (spokenText: string) => Promise<SentenceAttemptResult | null>
  skipSentence: () => void
  endSession: () => Promise<SentencePracticeSession | null>
}

/**
 * Calculate the accuracy of a spoken sentence compared to the target sentence.
 * Uses word-level comparison with fuzzy matching from useWordQuest.
 */
export function calculateSentenceAccuracy(
  spoken: string,
  target: string
): { accuracy: number; wordResults: SentenceWordResult[] } {
  // Normalize both strings
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s']/g, '') // Keep apostrophes for contractions
      .replace(/\s+/g, ' ')
      .trim()
  }

  const spokenWords = normalizeText(spoken).split(/\s+/).filter(w => w.length > 0)
  const targetWords = normalizeText(target).split(/\s+/).filter(w => w.length > 0)

  if (targetWords.length === 0) {
    return { accuracy: 0, wordResults: [] }
  }

  const wordResults: SentenceWordResult[] = []
  let correctCount = 0

  // Use alignment to handle insertions/deletions/substitutions
  const alignment = alignWords(targetWords, spokenWords)

  for (let i = 0; i < targetWords.length; i++) {
    const targetWord = targetWords[i]
    const spokenWord = alignment[i]
    const correct = spokenWord !== null && isWordMatch(spokenWord, targetWord)

    if (correct) {
      correctCount++
    }

    wordResults.push({
      word: targetWord,
      spoken: spokenWord,
      correct,
      position: i,
    })
  }

  const accuracy = Math.round((correctCount / targetWords.length) * 100)

  return { accuracy, wordResults }
}

/**
 * Align spoken words to target words, handling insertions and deletions.
 * Returns an array of spoken words aligned to target word positions.
 */
function alignWords(target: string[], spoken: string[]): (string | null)[] {
  const result: (string | null)[] = new Array(target.length).fill(null)

  let spokenIndex = 0

  for (let i = 0; i < target.length && spokenIndex < spoken.length; i++) {
    // Look ahead for a match within next 2 spoken words
    let foundMatch = false
    for (let j = 0; j <= 2 && spokenIndex + j < spoken.length; j++) {
      if (isWordMatch(spoken[spokenIndex + j], target[i])) {
        result[i] = spoken[spokenIndex + j]
        spokenIndex = spokenIndex + j + 1
        foundMatch = true
        break
      }
    }

    // If no match found in lookahead, assign current spoken word anyway
    if (!foundMatch && spokenIndex < spoken.length) {
      result[i] = spoken[spokenIndex]
      spokenIndex++
    }
  }

  return result
}

export function useSentenceShenanigans(
  options: UseSentenceShenanigansOptions
): UseSentenceShenanigansReturn {
  const { childId } = options

  // Material management state
  const [materials, setMaterials] = useState<ReadingMaterial[]>([])
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false)
  const [materialsError, setMaterialsError] = useState<string | null>(null)

  // Session state
  const [sentences, setSentences] = useState<MaterialSentence[]>([])
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentencesCorrect, setSentencesCorrect] = useState(0)
  const [attempts, setAttempts] = useState<SentenceAttemptResult[]>([])
  const [currentMaterial, setCurrentMaterial] = useState<ReadingMaterial | null>(null)

  const sessionStartTime = useRef<Date | null>(null)

  const currentSentence = sentences[currentSentenceIndex] || null
  const isSessionComplete =
    currentSentenceIndex >= sentences.length && sentences.length > 0

  // Fetch all materials for the child
  const fetchMaterials = useCallback(async () => {
    if (!childId) return

    setIsLoadingMaterials(true)
    setMaterialsError(null)

    try {
      const response = await fetch(
        `/api/sentence-shenanigans/materials?childId=${childId}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch materials')
      }

      const { materials: fetchedMaterials } = await response.json()
      setMaterials(fetchedMaterials || [])
    } catch (err) {
      setMaterialsError(err instanceof Error ? err.message : 'Failed to load materials')
    } finally {
      setIsLoadingMaterials(false)
    }
  }, [childId])

  // Create a new material with sentences
  const createMaterial = useCallback(
    async (
      name: string,
      sentencesData: { text: string; order: number; confidence?: number }[],
      description?: string,
      imageData?: string
    ): Promise<ReadingMaterial | null> => {
      if (!childId) return null

      try {
        const response = await fetch('/api/sentence-shenanigans/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId,
            name,
            description,
            sentences: sentencesData,
            imageData,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to create material')
        }

        const { material } = await response.json()

        // Add to local state
        setMaterials((prev) => [material, ...prev])

        return material
      } catch (err) {
        setMaterialsError(err instanceof Error ? err.message : 'Failed to create material')
        return null
      }
    },
    [childId]
  )

  // Delete a material
  const deleteMaterial = useCallback(
    async (materialId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/sentence-shenanigans/materials/${materialId}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          throw new Error('Failed to delete material')
        }

        // Remove from local state
        setMaterials((prev) => prev.filter((m) => m.id !== materialId))
        return true
      } catch (err) {
        setMaterialsError(err instanceof Error ? err.message : 'Failed to delete material')
        return false
      }
    },
    []
  )

  // Start a practice session for a specific material
  const startSession = useCallback(
    async (materialId: string) => {
      if (!childId) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/sentence-shenanigans/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childId, materialId }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to start session')
        }

        const { session, sentences: fetchedSentences, material } = await response.json()

        setSentences(fetchedSentences)
        setSessionId(session.id)
        setCurrentSentenceIndex(0)
        setSentencesCorrect(0)
        setAttempts([])
        setCurrentMaterial(material)
        sessionStartTime.current = new Date()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start session')
      } finally {
        setIsLoading(false)
      }
    },
    [childId]
  )

  // Check a spoken sentence against the current sentence
  const checkSentence = useCallback(
    async (spokenText: string): Promise<SentenceAttemptResult | null> => {
      if (!currentSentence || !sessionId) return null

      const { accuracy, wordResults } = calculateSentenceAccuracy(
        spokenText,
        currentSentence.sentence_text
      )

      const isCorrect = accuracy >= SENTENCE_ACCURACY_THRESHOLD

      const attempt: SentenceAttemptResult = {
        sentence: currentSentence.sentence_text,
        spoken: spokenText,
        accuracy,
        wordResults,
        correct: isCorrect,
        timestamp: new Date(),
      }

      setAttempts((prev) => [...prev, attempt])

      if (isCorrect) {
        setSentencesCorrect((prev) => prev + 1)
      }

      // Record attempt via API (fire and forget)
      fetch(`/api/sentence-shenanigans/sessions/${sessionId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentenceId: currentSentence.id,
          spokenText,
          accuracy,
          wordResults,
          isCorrect,
        }),
      }).catch(console.error)

      // Advance to next sentence after recording
      setCurrentSentenceIndex((prev) => prev + 1)

      return attempt
    },
    [currentSentence, sessionId]
  )

  // Skip the current sentence
  const skipSentence = useCallback(() => {
    if (currentSentence) {
      const attempt: SentenceAttemptResult = {
        sentence: currentSentence.sentence_text,
        spoken: '',
        accuracy: 0,
        wordResults: [],
        correct: false,
        timestamp: new Date(),
      }
      setAttempts((prev) => [...prev, attempt])
    }
    setCurrentSentenceIndex((prev) => prev + 1)
  }, [currentSentence])

  // End the practice session
  const endSession = useCallback(async (): Promise<SentencePracticeSession | null> => {
    if (!sessionId || !sessionStartTime.current) return null

    const duration = Math.round(
      (new Date().getTime() - sessionStartTime.current.getTime()) / 1000
    )

    try {
      const response = await fetch(
        `/api/sentence-shenanigans/sessions/${sessionId}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sentencesPracticed: attempts.length,
            sentencesCorrect,
            durationSeconds: duration,
          }),
        }
      )

      if (!response.ok) return null
      return response.json()
    } catch {
      return null
    }
  }, [sessionId, attempts.length, sentencesCorrect])

  return {
    // Material management
    materials,
    isLoadingMaterials,
    materialsError,
    fetchMaterials,
    createMaterial,
    deleteMaterial,

    // Session state
    sentences,
    currentSentenceIndex,
    currentSentence,
    sessionId,
    isLoading,
    error,
    sentencesCorrect,
    totalAttempts: attempts.length,
    isSessionComplete,
    attempts,
    currentMaterial,

    // Actions
    startSession,
    checkSentence,
    skipSentence,
    endSession,
  }
}
