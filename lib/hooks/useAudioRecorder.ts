'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export type AudioRecorderStatus =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'processing'
  | 'error'

interface UseAudioRecorderOptions {
  maxDurationMs?: number
  onRecordingComplete?: (audioBlob: Blob) => void
  onError?: (error: string) => void
}

interface UseAudioRecorderReturn {
  isSupported: boolean
  status: AudioRecorderStatus
  error: string | null
  audioBlob: Blob | null
  audioDuration: number
  startRecording: () => Promise<void>
  stopRecording: () => void
  resetRecording: () => void
  isRecording: boolean
}

// Get the best supported MIME type for audio recording
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ]

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  // Fallback - let the browser choose
  return ''
}

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const { maxDurationMs = 10000, onRecordingComplete, onError } = options

  const [isSupported, setIsSupported] = useState(false)
  const [status, setStatus] = useState<AudioRecorderStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Check browser support on mount
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia &&
      !!window.MediaRecorder

    setIsSupported(supported)

    return () => {
      // Cleanup on unmount
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = 'Audio recording is not supported in this browser.'
      setError(errorMsg)
      setStatus('error')
      onError?.(errorMsg)
      return
    }

    // Reset state
    setError(null)
    setAudioBlob(null)
    setAudioDuration(0)
    chunksRef.current = []

    setStatus('requesting_permission')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      )
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Calculate duration
        const duration = (Date.now() - startTimeRef.current) / 1000
        setAudioDuration(duration)

        // Create blob from chunks
        const recordedMimeType = mediaRecorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: recordedMimeType })
        setAudioBlob(blob)
        setStatus('idle')
        onRecordingComplete?.(blob)

        // Stop all tracks to release microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.onerror = () => {
        const errorMsg = 'Recording failed. Please try again.'
        setError(errorMsg)
        setStatus('error')
        onError?.(errorMsg)

        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      // Start recording
      startTimeRef.current = Date.now()
      mediaRecorder.start(100) // Collect data every 100ms
      setStatus('recording')

      // Set max duration timer
      maxDurationTimerRef.current = setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === 'recording'
        ) {
          mediaRecorderRef.current.stop()
        }
      }, maxDurationMs)
    } catch (err) {
      let errorMsg = 'Failed to access microphone.'

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMsg =
            'Microphone access denied. Please allow microphone access in your browser settings.'
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMsg = 'No microphone found. Please check your microphone connection.'
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMsg =
            'Microphone is in use by another application. Please close other apps using the microphone.'
        }
      }

      setError(errorMsg)
      setStatus('error')
      onError?.(errorMsg)
    }
  }, [isSupported, maxDurationMs, onRecordingComplete, onError])

  const stopRecording = useCallback(() => {
    // Clear max duration timer
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current)
      maxDurationTimerRef.current = null
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      setStatus('processing')
      mediaRecorderRef.current.stop()
    }
  }, [])

  const resetRecording = useCallback(() => {
    // Clear max duration timer
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current)
      maxDurationTimerRef.current = null
    }

    // Stop any ongoing recording
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop()
    }

    // Release microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    // Reset state
    setStatus('idle')
    setError(null)
    setAudioBlob(null)
    setAudioDuration(0)
    chunksRef.current = []
  }, [])

  return {
    isSupported,
    status,
    error,
    audioBlob,
    audioDuration,
    startRecording,
    stopRecording,
    resetRecording,
    isRecording: status === 'recording',
  }
}
