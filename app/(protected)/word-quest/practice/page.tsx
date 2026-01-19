'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChild } from '../../ProtectedLayoutClient'
import { useWordQuest } from '@/lib/hooks/useWordQuest'
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition'
import { usePets } from '@/lib/hooks/usePets'
import { Button, Card } from '@/components/ui'
import {
  WordCard,
  SpeechButton,
  ProgressBar,
  SuccessAnimation,
  PetRewardModal,
} from '@/components/word-quest'
import type { Pet, PetType, PetCustomization } from '@/lib/types'
import { PET_MAPPINGS } from '@/lib/types'

export default function PracticePage() {
  const router = useRouter()
  const { selectedChild } = useChild()
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(
    null
  )
  const [showSuccess, setShowSuccess] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [showPetReward, setShowPetReward] = useState(false)
  const [newPet, setNewPet] = useState<Pet | null>(null)
  const [isFirstPet, setIsFirstPet] = useState(false)
  const [rewardPetType, setRewardPetType] = useState<PetType>('cat')

  const {
    words,
    currentWordIndex,
    currentWord,
    isLoading,
    error,
    wordsCorrect,
    isSessionComplete,
    startSession,
    checkAnswer,
    skipWord,
    endSession,
  } = useWordQuest({
    childId: selectedChild?.id || '',
    readingLevel: selectedChild?.reading_level || 'Kindergarten',
    wordsPerSession: 10,
  })

  const { pets, createPetWithCustomization } = usePets({ childId: selectedChild?.id || '' })

  // Determine pet type from child's favorite things
  const selectPetTypeFromFavorites = useCallback((favoriteThings: string[]): PetType => {
    for (const thing of favoriteThings) {
      const normalized = thing.toLowerCase().trim()
      const words = normalized.split(/\s+/)
      for (const word of words) {
        if (PET_MAPPINGS[word]) {
          return PET_MAPPINGS[word]
        }
      }
    }
    return 'cat'
  }, [])

  const handleSpeechResult = useCallback(
    async (text: string) => {
      if (!currentWord || isAdvancing) return

      const isCorrect = await checkAnswer(text)
      setLastResult(isCorrect ? 'correct' : 'incorrect')
      setIsAdvancing(true)

      // Advance to next word after showing result
      const delay = isCorrect ? 1500 : 2000
      setTimeout(() => {
        setLastResult(null)
        setIsAdvancing(false)
      }, delay)
    },
    [currentWord, checkAnswer, isAdvancing]
  )

  const {
    isSupported,
    status,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition({
    onResult: handleSpeechResult,
  })

  // Start session on mount
  useEffect(() => {
    if (selectedChild) {
      startSession()
    }
  }, [selectedChild, startSession])

  // Handle session complete
  useEffect(() => {
    async function handleSessionComplete() {
      if (isSessionComplete && !showSuccess) {
        setShowSuccess(true)
        await endSession()

        // If this is the child's first session (no pets yet), show pet reward modal
        if (pets.length === 0 && selectedChild) {
          const petType = selectPetTypeFromFavorites(selectedChild.favorite_things || [])
          setRewardPetType(petType)
          setIsFirstPet(true)
        }
      }
    }
    handleSessionComplete()
  }, [isSessionComplete, showSuccess, endSession, pets.length, selectedChild, selectPetTypeFromFavorites])

  // Handle pet creation from the reward modal
  const handleCreatePet = useCallback(
    async (customization: PetCustomization, name: string): Promise<Pet | null> => {
      const pet = await createPetWithCustomization(rewardPetType, name, customization)
      if (pet) {
        setNewPet(pet)
      }
      return pet
    },
    [createPetWithCustomization, rewardPetType]
  )

  // Reset transcript when advancing
  useEffect(() => {
    if (lastResult === null) {
      resetTranscript()
    }
  }, [lastResult, resetTranscript])

  // Advance word index when result is cleared
  useEffect(() => {
    if (lastResult === null && isAdvancing === false && currentWord) {
      // Word already advanced via checkAnswer in useWordQuest
    }
  }, [lastResult, isAdvancing, currentWord])

  const handleSkip = () => {
    skipWord()
    resetTranscript()
    setLastResult(null)
  }

  const handleEndSession = async () => {
    await endSession()
    router.push('/word-quest')
  }

  if (!selectedChild) {
    router.push('/word-quest')
    return null
  }

  if (!isSupported) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Card className="py-8">
          <div className="text-6xl mb-4">🎤</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Speech Recognition Not Available
          </h2>
          <p className="text-gray-600 mb-6">
            Your browser doesn&apos;t support speech recognition. Please try
            using Chrome or Edge.
          </p>
          <Button onClick={() => router.push('/word-quest')}>Go Back</Button>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin" />
        <p className="text-gray-600">Getting words ready...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Card className="py-8">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => startSession()}>Try Again</Button>
            <Button variant="outline" onClick={() => router.push('/word-quest')}>
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleEndSession}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">Exit</span>
        </button>
        <div className="text-sm text-gray-500">{selectedChild.name}</div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <ProgressBar
          current={currentWordIndex}
          total={words.length}
          correct={wordsCorrect}
        />
      </div>

      {/* Word Card */}
      {currentWord && (
        <div className="mb-8">
          <WordCard
            word={currentWord.word}
            status={status}
            lastResult={lastResult}
          />
        </div>
      )}

      {/* Speech feedback */}
      <div className="h-8 text-center mb-4">
        {transcript && (
          <span className="text-lg text-gray-500">
            I heard: &quot;
            <span className="font-medium text-gray-700">{transcript}</span>
            &quot;
          </span>
        )}
        {speechError && <span className="text-red-500">{speechError}</span>}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6">
        <SpeechButton
          status={status}
          onStart={startListening}
          onStop={stopListening}
          disabled={!currentWord || lastResult !== null || isAdvancing}
        />

        <p className="text-gray-500 text-sm text-center">
          {status === 'listening'
            ? 'Listening... Say the word!'
            : lastResult === 'correct'
              ? 'Great job! ⭐'
              : lastResult === 'incorrect'
                ? 'Try again! You can do it!'
                : 'Tap the microphone and read the word'}
        </p>

        <div className="flex gap-4">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={lastResult !== null || isAdvancing}
          >
            Skip Word
          </Button>
          <Button variant="outline" onClick={handleEndSession}>
            End Session
          </Button>
        </div>
      </div>

      {/* Success Animation */}
      <SuccessAnimation
        show={showSuccess && !showPetReward}
        wordsCorrect={wordsCorrect}
        totalWords={words.length}
        onComplete={() => {
          if (isFirstPet) {
            setShowSuccess(false)
            setShowPetReward(true)
          } else {
            router.push('/word-quest')
          }
        }}
      />

      {/* Pet Reward Modal */}
      <PetRewardModal
        show={showPetReward}
        pet={newPet}
        petType={rewardPetType}
        isFirstPet={isFirstPet}
        onClose={() => router.push('/word-quest')}
        onVisitPet={() => {
          if (newPet) {
            router.push(`/word-quest/pets/${newPet.id}`)
          }
        }}
        onCreatePet={handleCreatePet}
      />
    </div>
  )
}
