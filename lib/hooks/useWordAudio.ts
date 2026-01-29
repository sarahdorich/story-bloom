'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const BUCKET_NAME = 'word-audio'

interface AudioUploadResult {
  url: string
  storagePath: string
}

interface UseWordAudioReturn {
  uploadAudio: (
    wordId: string,
    childId: string,
    audioBlob: Blob
  ) => Promise<AudioUploadResult | null>
  deleteAudio: (wordId: string, storagePath: string) => Promise<boolean>
  isUploading: boolean
  isDeleting: boolean
  error: string | null
}

// Get file extension from MIME type
function getExtensionFromMime(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm'
  if (mimeType.includes('mp4')) return 'mp4'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mpeg')) return 'mp3'
  return 'webm' // default
}

export function useWordAudio(): UseWordAudioReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadAudio = useCallback(
    async (
      wordId: string,
      childId: string,
      audioBlob: Blob
    ): Promise<AudioUploadResult | null> => {
      setIsUploading(true)
      setError(null)

      try {
        const supabase = createClient()

        // Generate unique filename
        const ext = getExtensionFromMime(audioBlob.type)
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 9)
        const fileName = `${timestamp}-${randomId}.${ext}`
        const storagePath = `${childId}/${wordId}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, audioBlob, {
            contentType: audioBlob.type || 'audio/webm',
            cacheControl: '31536000', // 1 year
          })

        if (uploadError) {
          console.error('Error uploading audio:', uploadError)
          throw new Error('Failed to upload audio file')
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath)

        const url = publicUrlData.publicUrl

        // Update the struggling word record with the audio URL
        const { error: updateError } = await supabase
          .from('struggling_words')
          .update({
            parent_audio_url: url,
            parent_audio_storage_path: storagePath,
          })
          .eq('id', wordId)

        if (updateError) {
          // Try to clean up the uploaded file
          await supabase.storage.from(BUCKET_NAME).remove([storagePath])
          console.error('Error updating word record:', updateError)
          throw new Error('Failed to save audio reference')
        }

        setIsUploading(false)
        return { url, storagePath }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to upload audio'
        setError(errorMsg)
        setIsUploading(false)
        return null
      }
    },
    []
  )

  const deleteAudio = useCallback(
    async (wordId: string, storagePath: string): Promise<boolean> => {
      setIsDeleting(true)
      setError(null)

      try {
        const supabase = createClient()

        // Clear the audio fields in the database first
        const { error: updateError } = await supabase
          .from('struggling_words')
          .update({
            parent_audio_url: null,
            parent_audio_storage_path: null,
          })
          .eq('id', wordId)

        if (updateError) {
          console.error('Error clearing audio reference:', updateError)
          throw new Error('Failed to remove audio reference')
        }

        // Delete the file from storage
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([storagePath])

        if (deleteError) {
          // Log but don't fail - database is already updated
          console.error('Error deleting audio file:', deleteError)
        }

        setIsDeleting(false)
        return true
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to delete audio'
        setError(errorMsg)
        setIsDeleting(false)
        return false
      }
    },
    []
  )

  return {
    uploadAudio,
    deleteAudio,
    isUploading,
    isDeleting,
    error,
  }
}
