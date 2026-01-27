'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { SpeechRecognitionStatus } from '@/lib/types'

// Web Speech API type definitions
interface SpeechRecognitionResult {
  readonly length: number
  readonly isFinal: boolean
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
  // Continuous mode options
  continuous?: boolean           // Enable continuous listening (default: false)
  interimResults?: boolean       // Show words as they're recognized (default: false)
  onInterimResult?: (interim: string) => void  // Callback for interim results
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean
  status: SpeechRecognitionStatus
  transcript: string
  interimTranscript: string      // Current interim (unfinalized) text
  finalTranscript: string        // Accumulated finalized text
  startListening: () => void
  stopListening: () => void
  finishListening: () => void    // For continuous mode "Done" action
  resetTranscript: () => void
  error: string | null
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options
  const abortRetryCountRef = useRef(0)
  const maxAbortRetries = 3
  const isListeningIntentRef = useRef(false)
  // Track accumulated final transcript for continuous mode (avoids stale closure issues)
  const finalTranscriptRef = useRef('')

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
      // Apply options - continuous and interimResults based on options
      recognition.continuous = optionsRef.current.continuous ?? false
      recognition.interimResults = optionsRef.current.interimResults ?? false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setStatus('listening')
        setError(null)
        abortRetryCountRef.current = 0
      }

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        const isContinuousMode = optionsRef.current.continuous

        if (isContinuousMode) {
          // Continuous mode: accumulate final results, show interim
          let interim = ''
          let newFinal = ''

          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i]
            const text = result[0].transcript

            if (result.isFinal) {
              newFinal += text + ' '
            } else {
              interim += text
            }
          }

          // Update interim transcript (current unfinalized text)
          setInterimTranscript(interim)

          // Update final transcript if we got new final results
          if (newFinal) {
            finalTranscriptRef.current = newFinal.trim()
            setFinalTranscript(newFinal.trim())
          }

          // Call interim callback if provided
          if (interim && optionsRef.current.onInterimResult) {
            optionsRef.current.onInterimResult(interim)
          }
        } else {
          // Non-continuous mode: original behavior
          const result = event.results[event.results.length - 1]
          const text = result[0].transcript.trim().toLowerCase()
          setTranscript(text)
          setStatus('processing')
          isListeningIntentRef.current = false
          optionsRef.current.onResult?.(text)
        }
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
        // In continuous mode, auto-restart if user still intends to listen
        if (optionsRef.current.continuous && isListeningIntentRef.current) {
          try {
            recognition.start()
          } catch {
            // Recognition might already be running, ignore
          }
        } else {
          setStatus((prevStatus) => {
            if (prevStatus === 'listening') {
              return 'idle'
            }
            return prevStatus
          })
        }
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
      setInterimTranscript('')
      setFinalTranscript('')
      finalTranscriptRef.current = ''
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
    setInterimTranscript('')
    setFinalTranscript('')
    finalTranscriptRef.current = ''
    setStatus('idle')
    setError(null)
    isListeningIntentRef.current = false
  }, [])

  // For continuous mode: finalize and process the complete transcript
  const finishListening = useCallback(() => {
    if (recognitionRef.current) {
      isListeningIntentRef.current = false
      recognitionRef.current.stop()

      // Combine final + interim for complete transcript
      const fullTranscript = (finalTranscriptRef.current + ' ' + interimTranscript).trim().toLowerCase()

      if (fullTranscript) {
        setTranscript(fullTranscript)
        setStatus('processing')
        // Fire the onResult callback with complete transcript
        optionsRef.current.onResult?.(fullTranscript)
      } else {
        // Nothing was recognized
        setError("I didn't hear anything. Try tapping the microphone and reading again!")
        setStatus('idle')
      }

      // Clear interim states
      setInterimTranscript('')
      setFinalTranscript('')
      finalTranscriptRef.current = ''
    }
  }, [interimTranscript])

  return {
    isSupported,
    status,
    transcript,
    interimTranscript,
    finalTranscript,
    startListening,
    stopListening,
    finishListening,
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
