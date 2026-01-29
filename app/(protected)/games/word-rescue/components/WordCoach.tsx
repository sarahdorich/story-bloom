'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSpeechSynthesis } from '@/lib/hooks/useSpeechSynthesis'
import { Button } from '@/components/ui'
import type { StrugglingWord, Pet, PetType } from '@/lib/types'

interface WordCoachProps {
  word: StrugglingWord
  onComplete: () => void
  onSkip?: () => void
  buddyPet?: Pet
}

export function WordCoach({ word, onComplete, onSkip, buddyPet }: WordCoachProps) {
  const [step, setStep] = useState<'listen' | 'try'>('listen')
  const [timesHeard, setTimesHeard] = useState(0)
  const [currentSyllableIndex, setCurrentSyllableIndex] = useState(-1)
  const [isPlayingSequence, setIsPlayingSequence] = useState(false)
  const [audioSource, setAudioSource] = useState<'parent' | 'tts'>('tts')

  const parentAudioRef = useRef<HTMLAudioElement | null>(null)

  const { speak, isSpeaking, stop } = useSpeechSynthesis({
    petType: buddyPet?.pet_type as PetType | undefined,
  })

  const syllables = word.syllable_breakdown || [word.word]
  const hasParentAudio = !!word.parent_audio_url

  // Play parent's recorded audio
  const playParentAudio = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!word.parent_audio_url) {
        reject(new Error('No parent audio'))
        return
      }

      if (!parentAudioRef.current) {
        parentAudioRef.current = new Audio()
      }

      const audio = parentAudioRef.current
      audio.src = word.parent_audio_url

      const handleEnded = () => {
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('error', handleError)
        resolve()
      }

      const handleError = () => {
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('error', handleError)
        reject(new Error('Audio playback failed'))
      }

      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('error', handleError)

      audio.play().catch((err) => {
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('error', handleError)
        reject(err)
      })
    })
  }, [word.parent_audio_url])

  // Cleanup parent audio on unmount
  useEffect(() => {
    return () => {
      if (parentAudioRef.current) {
        parentAudioRef.current.pause()
        parentAudioRef.current = null
      }
    }
  }, [])

  // Play individual syllable with highlight
  const playSyllableWithDelay = useCallback(
    async (index: number): Promise<void> => {
      return new Promise((resolve) => {
        setCurrentSyllableIndex(index)
        speak(syllables[index])

        // Wait for speech + small pause
        setTimeout(resolve, 600 + syllables[index].length * 80)
      })
    },
    [syllables, speak]
  )

  // Play the full pronunciation sequence
  const playPronunciation = useCallback(async () => {
    if (isPlayingSequence) return

    setIsPlayingSequence(true)
    stop() // Cancel any ongoing speech

    // Try parent audio first if available
    if (word.parent_audio_url) {
      try {
        setAudioSource('parent')
        await playParentAudio()
        setTimesHeard((prev) => prev + 1)
        setIsPlayingSequence(false)
        return
      } catch {
        // Fall back to TTS if parent audio fails
        console.warn('Parent audio failed, falling back to TTS')
      }
    }

    // Use TTS (original behavior)
    setAudioSource('tts')

    // Play each syllable with highlight
    for (let i = 0; i < syllables.length; i++) {
      await playSyllableWithDelay(i)
    }

    // Brief pause
    await new Promise((resolve) => setTimeout(resolve, 400))

    // Play the whole word
    setCurrentSyllableIndex(-1)
    speak(word.word)

    // Wait for word to finish
    await new Promise((resolve) => setTimeout(resolve, 1000 + word.word.length * 80))

    setIsPlayingSequence(false)
    setTimesHeard((prev) => prev + 1)
  }, [syllables, word.word, word.parent_audio_url, speak, stop, playSyllableWithDelay, playParentAudio, isPlayingSequence])

  // Auto-play on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      playPronunciation()
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        {/* Pet buddy encouragement */}
        {buddyPet && (
          <div className="flex items-start gap-3 mb-6">
            {buddyPet.image_url ? (
              <img
                src={buddyPet.image_url}
                alt={buddyPet.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
                🐾
              </div>
            )}
            <div className="flex-1 bg-purple-50 rounded-xl p-3 relative">
              <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-purple-50 border-b-8 border-b-transparent" />
              <p className="text-purple-800 font-medium">
                &quot;Let&apos;s learn this word together!&quot;
              </p>
            </div>
          </div>
        )}

        {/* The word, large and friendly */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-purple-600 mb-4">{word.word}</h2>

          {/* Tap to hear button */}
          <button
            onClick={playPronunciation}
            disabled={isPlayingSequence}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-medium transition-all ${
              isPlayingSequence
                ? 'bg-purple-200 text-purple-700'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200 hover:scale-105'
            }`}
          >
            <span className={`text-2xl ${isPlayingSequence ? 'animate-pulse' : ''}`}>🔊</span>
            {timesHeard === 0 ? 'Hear it' : 'Hear again'}
          </button>
          {/* Show audio source indicator */}
          {hasParentAudio && (
            <p className="text-sm text-purple-500 mt-2">
              {isPlayingSequence && audioSource === 'parent'
                ? "Playing your parent's voice..."
                : "Your parent recorded this word for you!"}
            </p>
          )}
        </div>

        {/* Syllable breakdown */}
        {syllables.length > 1 && (
          <div className="flex justify-center items-center gap-2 mb-6">
            {syllables.map((syllable, index) => (
              <span key={index} className="flex items-center">
                <span
                  className={`px-3 py-1 rounded-lg text-xl font-semibold transition-all duration-200 ${
                    currentSyllableIndex === index
                      ? 'bg-yellow-300 text-yellow-900 scale-110'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {syllable}
                </span>
                {index < syllables.length - 1 && (
                  <span className="text-gray-400 mx-1">•</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Example sentence */}
        {word.example_sentence && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center">
            <p className="text-blue-800 italic">&quot;{word.example_sentence}&quot;</p>
          </div>
        )}

        {/* Phonetic hint */}
        {word.phonetic_hint && (
          <div className="text-center mb-6">
            <span className="text-gray-500 text-sm">Sounds like: </span>
            <span className="text-gray-700 font-medium">{word.phonetic_hint}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          {onSkip && (
            <Button variant="ghost" onClick={onSkip}>
              Skip for now
            </Button>
          )}
          <Button onClick={onComplete} className="px-8">
            I got it! ✨
          </Button>
        </div>
      </div>
    </div>
  )
}
