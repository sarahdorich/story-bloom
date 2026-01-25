'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { useChild } from '../../../../../ProtectedLayoutClient'
import { useSentenceShenanigans } from '@/lib/hooks/useSentenceShenanigans'
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition'
import { usePets } from '@/lib/hooks/usePets'
import { Button, Card } from '@/components/ui'
import {
  SpeechButton,
  ProgressBar,
  SuccessAnimation,
  PetRewardModal,
  PostSessionPetReaction,
} from '@/components/word-quest'
import { SentenceCard } from '../../../components/SentenceCard'
import type { Pet, PetType, PetCustomization, SentenceWordResult } from '@/lib/types'
import { PET_MAPPINGS, SENTENCE_ACCURACY_THRESHOLD } from '@/lib/types'

interface PageProps {
  params: Promise<{ materialId: string }>
}

export default function PracticeSessionPage({ params }: PageProps) {
  const { materialId } = use(params)
  const router = useRouter()
  const { selectedChild } = useChild()

  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null)
  const [lastWordResults, setLastWordResults] = useState<SentenceWordResult[]>([])
  const [lastAccuracy, setLastAccuracy] = useState<number>(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [showPetReward, setShowPetReward] = useState(false)
  const [showPetReaction, setShowPetReaction] = useState(false)
  const [newPet, setNewPet] = useState<Pet | null>(null)
  const [isFirstPet, setIsFirstPet] = useState(false)
  const [earnedPetReward, setEarnedPetReward] = useState(false)
  const [rewardPetType, setRewardPetType] = useState<PetType>('cat')

  const {
    sentences,
    currentSentenceIndex,
    currentSentence,
    currentMaterial,
    isLoading,
    error,
    sentencesCorrect,
    isSessionComplete,
    startSession,
    checkSentence,
    skipSentence,
    endSession,
  } = useSentenceShenanigans({ childId: selectedChild?.id || '' })

  const { pets, favoritePet, createPetWithCustomization, pollImageStatus } = usePets({
    childId: selectedChild?.id || '',
  })

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
      if (!currentSentence || isAdvancing) return

      const result = await checkSentence(text)
      if (result) {
        setLastResult(result.correct ? 'correct' : 'incorrect')
        setLastWordResults(result.wordResults)
        setLastAccuracy(result.accuracy)
        setIsAdvancing(true)

        // Advance to next sentence after showing result
        const delay = result.correct ? 2000 : 2500
        setTimeout(() => {
          setLastResult(null)
          setLastWordResults([])
          setLastAccuracy(0)
          setIsAdvancing(false)
        }, delay)
      }
    },
    [currentSentence, checkSentence, isAdvancing]
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
    if (selectedChild && materialId) {
      startSession(materialId)
    }
  }, [selectedChild, materialId, startSession])

  // Handle session complete
  useEffect(() => {
    async function handleSessionComplete() {
      if (isSessionComplete && !showSuccess) {
        setShowSuccess(true)
        const sessionResult = await endSession()

        if (sessionResult) {
          // The API returns { session, stats, petReward }
          const accuracy = (sessionResult as { stats?: { overallAccuracy: number } }).stats?.overallAccuracy || 0

          if (pets.length === 0 && selectedChild && accuracy >= SENTENCE_ACCURACY_THRESHOLD) {
            // First pet - awarded for high score
            const petType = selectPetTypeFromFavorites(selectedChild.favorite_things || [])
            setRewardPetType(petType)
            setIsFirstPet(true)
            setEarnedPetReward(true)
          } else if (accuracy >= SENTENCE_ACCURACY_THRESHOLD && selectedChild) {
            // High score reward - new pet!
            const petType = selectPetTypeFromFavorites(selectedChild.favorite_things || [])
            setRewardPetType(petType)
            setIsFirstPet(false)
            setEarnedPetReward(true)
          }
        }
      }
    }
    handleSessionComplete()
  }, [
    isSessionComplete,
    showSuccess,
    endSession,
    pets.length,
    selectedChild,
    selectPetTypeFromFavorites,
  ])

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

  const handleSkip = () => {
    skipSentence()
    resetTranscript()
    setLastResult(null)
    setLastWordResults([])
    setLastAccuracy(0)
  }

  const handleEndSession = async () => {
    await endSession()
    router.push('/games/sentence-shenanigans')
  }

  if (!selectedChild) {
    router.push('/games/sentence-shenanigans')
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
          <Button onClick={() => router.push('/games/sentence-shenanigans')}>
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-secondary-200 border-t-secondary-500 animate-spin" />
        <p className="text-gray-600">Getting sentences ready...</p>
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
            <Button onClick={() => startSession(materialId)}>Try Again</Button>
            <Button
              variant="outline"
              onClick={() => router.push('/games/sentence-shenanigans')}
            >
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Exit</span>
        </button>
        <div className="text-sm text-gray-500 text-center">
          <div className="font-medium">{currentMaterial?.name || 'Practice'}</div>
          <div className="text-xs">{selectedChild.name}</div>
        </div>
        <div className="w-12" />
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <ProgressBar
          current={currentSentenceIndex}
          total={sentences.length}
          correct={sentencesCorrect}
        />
      </div>

      {/* Sentence Card */}
      {currentSentence && (
        <div className="mb-8">
          <SentenceCard
            sentence={currentSentence.sentence_text}
            status={status}
            lastResult={lastResult}
            wordResults={lastWordResults}
            accuracy={lastAccuracy}
          />
        </div>
      )}

      {/* Speech feedback */}
      <div className="h-16 text-center mb-4">
        {transcript && (
          <div className="bg-gray-50 rounded-xl px-4 py-2 inline-block">
            <span className="text-gray-500 text-sm">I heard: </span>
            <span className="font-medium text-gray-700">&quot;{transcript}&quot;</span>
          </div>
        )}
        {speechError && (
          <span className="text-red-500 text-sm">{speechError}</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6">
        <SpeechButton
          status={status}
          onStart={startListening}
          onStop={stopListening}
          disabled={!currentSentence || lastResult !== null || isAdvancing}
        />

        <p className="text-gray-500 text-sm text-center">
          {status === 'listening'
            ? 'Listening... Read the sentence!'
            : lastResult === 'correct'
              ? 'Excellent! Moving to next sentence...'
              : lastResult === 'incorrect'
                ? 'Keep practicing! Moving on...'
                : 'Tap the microphone and read the sentence aloud'}
        </p>

        <div className="flex gap-4">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={lastResult !== null || isAdvancing}
          >
            Skip Sentence
          </Button>
          <Button variant="outline" onClick={handleEndSession}>
            End Session
          </Button>
        </div>
      </div>

      {/* Success Animation */}
      <SuccessAnimation
        show={showSuccess && !showPetReward && !showPetReaction}
        wordsCorrect={sentencesCorrect}
        totalWords={sentences.length}
        onComplete={() => {
          setShowSuccess(false)
          if (earnedPetReward) {
            setShowPetReward(true)
          } else if (favoritePet) {
            setShowPetReaction(true)
          } else {
            router.push('/games/sentence-shenanigans')
          }
        }}
      />

      {/* Pet Reaction for existing pets */}
      {favoritePet && selectedChild && (
        <PostSessionPetReaction
          pet={favoritePet}
          childId={selectedChild.id}
          sessionData={{
            wordsPracticed: sentences.length,
            wordsCorrect: sentencesCorrect,
          }}
          show={showPetReaction}
          onComplete={() => {
            setShowPetReaction(false)
            router.push('/games/sentence-shenanigans')
          }}
        />
      )}

      {/* Pet Reward Modal for first pet */}
      <PetRewardModal
        show={showPetReward}
        pet={newPet}
        petType={rewardPetType}
        isFirstPet={isFirstPet}
        onClose={() => router.push('/games/sentence-shenanigans')}
        onVisitPet={() => {
          if (newPet) {
            router.push(`/games/word-quest/pets/${newPet.id}`)
          }
        }}
        onCreatePet={handleCreatePet}
        pollImageStatus={pollImageStatus}
      />
    </div>
  )
}
