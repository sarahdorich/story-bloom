'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { SpeechRecognitionStatus } from '@/lib/types'

// Web Speech API type definitions
interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEventInit extends EventInit {
  resultIndex?: number
  results: SpeechRecognitionResultList
}

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null
  onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition
}

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean
  status: SpeechRecognitionStatus
  transcript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options
  const abortRetryCountRef = useRef(0)
  const maxAbortRetries = 3
  const isListeningIntentRef = useRef(false)

  useEffect(() => {
    // Access the Web Speech API from window
    const windowWithSpeech = window as Window & {
      SpeechRecognition?: ISpeechRecognitionConstructor
      webkitSpeechRecognition?: ISpeechRecognitionConstructor
    }

    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition
        : null

    setIsSupported(!!SpeechRecognitionAPI)

    // Detect iOS/iPadOS for retry behavior
    const isIOS =
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setStatus('listening')
        setError(null)
        abortRetryCountRef.current = 0
      }

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1]
        const text = result[0].transcript.trim().toLowerCase()
        setTranscript(text)
        setStatus('processing')
        isListeningIntentRef.current = false
        optionsRef.current.onResult?.(text)
      }

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        // On iOS/iPadOS, auto-retry on 'aborted' errors (common issue with Safari)
        if (isIOS && event.error === 'aborted' && isListeningIntentRef.current) {
          if (abortRetryCountRef.current < maxAbortRetries) {
            abortRetryCountRef.current++
            // Small delay before retrying to let the system settle
            setTimeout(() => {
              if (isListeningIntentRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start()
                } catch {
                  // If retry fails, show error
                  setError(getErrorMessage(event.error))
                  setStatus('error')
                  isListeningIntentRef.current = false
                }
              }
            }, 100)
            return
          }
        }

        const errorMessage = getErrorMessage(event.error)
        setError(errorMessage)
        setStatus('error')
        isListeningIntentRef.current = false
        optionsRef.current.onError?.(errorMessage)
      }

      recognition.onend = () => {
        setStatus((prevStatus) => {
          if (prevStatus === 'listening') {
            return 'idle'
          }
          return prevStatus
        })
      }

      recognitionRef.current = recognition
    }

    return () => {
      isListeningIntentRef.current = false
      recognitionRef.current?.abort()
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognitionRef.current && status !== 'listening') {
      setError(null)
      setTranscript('')
      isListeningIntentRef.current = true
      abortRetryCountRef.current = 0
      try {
        recognitionRef.current.start()
      } catch {
        // Recognition might already be running
      }
    }
  }, [status])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      isListeningIntentRef.current = false
      recognitionRef.current.stop()
      setStatus('idle')
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setStatus('idle')
    setError(null)
    isListeningIntentRef.current = false
  }, [])

  return {
    isSupported,
    status,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  }
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return "I didn't hear anything. Try again!"
    case 'audio-capture':
      return 'Microphone not found. Please check your microphone.'
    case 'not-allowed':
      return 'Microphone access denied. Please allow microphone access.'
    case 'network':
      return 'Network error. Please check your connection.'
    case 'aborted':
      return 'Listening was cancelled.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
