'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder'
import { useWordAudio } from '@/lib/hooks/useWordAudio'

interface VoiceRecordButtonProps {
  wordId: string
  childId: string
  word: string
  currentAudioUrl: string | null
  currentStoragePath: string | null
  onAudioChange: (
    audioUrl: string | null,
    storagePath: string | null
  ) => void
}

export function VoiceRecordButton({
  wordId,
  childId,
  word,
  currentAudioUrl,
  currentStoragePath,
  onAudioChange,
}: VoiceRecordButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const {
    status: recorderStatus,
    error: recorderError,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
    isRecording,
  } = useAudioRecorder({
    maxDurationMs: 10000, // 10 seconds max
  })

  const {
    uploadAudio,
    deleteAudio,
    isUploading,
    isDeleting,
    error: uploadError,
  } = useWordAudio()

  // Handle recording completion - upload the audio
  useEffect(() => {
    if (audioBlob && recorderStatus === 'idle') {
      handleUpload(audioBlob)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, recorderStatus])

  const handleUpload = async (blob: Blob) => {
    // Delete old audio if exists
    if (currentStoragePath) {
      await deleteAudio(wordId, currentStoragePath)
    }

    const result = await uploadAudio(wordId, childId, blob)
    if (result) {
      onAudioChange(result.url, result.storagePath)
    }
    resetRecording()
  }

  const handleStartRecording = useCallback(async () => {
    await startRecording()
  }, [startRecording])

  const handleStopRecording = useCallback(() => {
    stopRecording()
  }, [stopRecording])

  const handlePlayAudio = useCallback(() => {
    if (!currentAudioUrl) return

    if (!audioRef.current) {
      audioRef.current = new Audio()
    }

    audioRef.current.src = currentAudioUrl
    audioRef.current.onplay = () => setIsPlaying(true)
    audioRef.current.onended = () => setIsPlaying(false)
    audioRef.current.onerror = () => setIsPlaying(false)
    audioRef.current.play().catch(() => setIsPlaying(false))
  }, [currentAudioUrl])

  const handleStopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [])

  const handleDelete = useCallback(async () => {
    if (!currentStoragePath) return

    const success = await deleteAudio(wordId, currentStoragePath)
    if (success) {
      onAudioChange(null, null)
    }
    setShowConfirmDelete(false)
  }, [wordId, currentStoragePath, deleteAudio, onAudioChange])

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const error = recorderError || uploadError
  const isLoading = isUploading || recorderStatus === 'processing'
  const hasRecording = !!currentAudioUrl

  // Recording in progress state
  if (isRecording) {
    return (
      <div className="flex items-center gap-1">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <button
          onClick={handleStopRecording}
          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          title={`Stop recording "${word}"`}
          aria-label={`Stop recording ${word}`}
        >
          <StopIcon className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // Loading/uploading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <span className="p-1.5">
          <LoadingSpinner className="w-4 h-4 text-purple-600" />
        </span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleStartRecording}
          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          title={error}
          aria-label={`Recording failed: ${error}. Click to try again.`}
        >
          <MicIcon className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // Delete confirmation state
  if (showConfirmDelete) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors text-xs font-medium"
          title="Confirm delete"
        >
          {isDeleting ? <LoadingSpinner className="w-4 h-4" /> : 'Yes'}
        </button>
        <button
          onClick={() => setShowConfirmDelete(false)}
          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-medium"
          title="Cancel"
        >
          No
        </button>
      </div>
    )
  }

  // Has recording - show play, re-record, and delete buttons
  if (hasRecording) {
    return (
      <div className="flex items-center gap-1">
        {isPlaying ? (
          <button
            onClick={handleStopPlayback}
            className="p-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
            title={`Stop playing "${word}"`}
            aria-label={`Stop playing ${word}`}
          >
            <StopIcon className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handlePlayAudio}
            className="p-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
            title={`Play your recording of "${word}"`}
            aria-label={`Play your recording of ${word}`}
          >
            <PlayIcon className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleStartRecording}
          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          title={`Re-record "${word}"`}
          aria-label={`Re-record ${word}`}
        >
          <MicIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowConfirmDelete(true)}
          className="p-1.5 rounded-lg bg-gray-100 text-red-500 hover:bg-red-50 transition-colors"
          title={`Delete recording of "${word}"`}
          aria-label={`Delete recording of ${word}`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // No recording - show record button
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleStartRecording}
        className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
        title={`Record your voice saying "${word}"`}
        aria-label={`Record your voice saying ${word}`}
      >
        <MicIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

// Icons
function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
      />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M6 6h12v12H6z" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
