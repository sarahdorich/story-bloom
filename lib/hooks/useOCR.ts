'use client'

import { useState, useCallback } from 'react'
import type { ExtractedSentence, OCRResult } from '@/lib/types'

interface UseOCRReturn {
  isProcessing: boolean
  progress: number
  progressStatus: string
  error: string | null
  extractText: (imageFile: File | Blob) => Promise<OCRResult | null>
  parseSentences: (text: string) => ExtractedSentence[]
  reset: () => void
}

/**
 * Check if a string looks like valid readable text vs garbled OCR from images
 */
function isReadableText(text: string): boolean {
  // Remove punctuation and numbers for analysis
  const letters = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase()

  if (letters.length < 10) return false

  // Check for too many consonant clusters (sign of garbled text)
  const consonantClusters = letters.match(/[bcdfghjklmnpqrstvwxyz]{4,}/g) || []
  if (consonantClusters.length > 2) return false

  // Check vowel to consonant ratio - English text has ~40% vowels
  const vowels = letters.replace(/[^aeiou]/g, '').length
  const vowelRatio = vowels / letters.replace(/\s/g, '').length
  if (vowelRatio < 0.2 || vowelRatio > 0.7) return false

  // Check for too many repeated characters (common in image artifacts)
  const repeats = letters.match(/(.)\1{3,}/g) || []
  if (repeats.length > 1) return false

  // Check for reasonable word lengths
  const words = letters.split(/\s+/).filter(w => w.length > 0)
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length
  if (avgWordLength < 2 || avgWordLength > 12) return false

  return true
}

/**
 * Check if a line looks like a title/header (should be skipped)
 */
function isTitleOrHeader(text: string, lineIndex: number, totalLines: number): boolean {
  const trimmed = text.trim()

  // First line or two that are short are likely titles
  if (lineIndex < 2 && trimmed.split(/\s+/).length <= 6 && !trimmed.endsWith('.')) {
    return true
  }

  // All caps text is often a header
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 50) {
    return true
  }

  // Lines with mostly numbers (like "Page 1" or dates)
  const digits = trimmed.replace(/[^0-9]/g, '').length
  if (digits / trimmed.length > 0.3 && trimmed.length < 20) {
    return true
  }

  return false
}

/**
 * Split raw text into sentences.
 * Handles common OCR artifacts and normalizes whitespace.
 * Filters out titles, headers, and garbled image-derived text.
 */
export function splitIntoSentences(text: string): ExtractedSentence[] {
  // Clean up common OCR artifacts
  let cleaned = text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/[""]/g, '"') // Normalize quotes
    .replace(/['']/g, "'") // Normalize apostrophes
    .replace(/\.{2,}/g, '.') // Remove multiple periods
    .trim()

  // Split into lines first to identify and skip titles/headers
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  // Filter out title lines and garbled text
  const contentLines = lines.filter((line, index) => {
    // Skip titles and headers
    if (isTitleOrHeader(line, index, lines.length)) {
      return false
    }
    // Skip lines that look like garbled image text
    if (!isReadableText(line)) {
      return false
    }
    return true
  })

  // Rejoin filtered content
  cleaned = contentLines.join(' ').replace(/\s+/g, ' ').trim()

  // Split on sentence-ending punctuation
  // This regex matches text followed by . ! or ? and optional closing quotes/parens
  const sentenceRegex = /[^.!?]*[.!?]+["'\)]?/g
  const matches = cleaned.match(sentenceRegex) || []

  // Also try splitting on newlines if no punctuation found
  if (matches.length === 0 && contentLines.length > 0) {
    return contentLines
      .filter(line => line.split(/\s+/).length >= 3)
      .map((text, index) => ({
        text: text.charAt(0).toUpperCase() + text.slice(1),
        confidence: 0.8, // Lower confidence for line-based splitting
        order: index + 1,
      }))
  }

  // Filter and clean sentences
  const sentences = matches
    .map((s) => s.trim())
    .filter((s) => {
      // Must have at least 3 words
      const wordCount = s.split(/\s+/).length
      if (wordCount < 3) return false
      // Must pass readability check
      return isReadableText(s)
    })
    .map((s, index) => {
      // Capitalize first letter if needed
      const text = s.charAt(0).toUpperCase() + s.slice(1)
      return {
        text,
        confidence: 0.9, // Default confidence for punctuation-based splitting
        order: index + 1,
      }
    })

  return sentences
}

export function useOCR(): UseOCRReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStatus, setProgressStatus] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setIsProcessing(false)
    setProgress(0)
    setProgressStatus('')
    setError(null)
  }, [])

  const parseSentences = useCallback((text: string): ExtractedSentence[] => {
    return splitIntoSentences(text)
  }, [])

  const extractText = useCallback(
    async (imageFile: File | Blob): Promise<OCRResult | null> => {
      setIsProcessing(true)
      setProgress(0)
      setProgressStatus('Uploading image...')
      setError(null)

      try {
        // Send image to OCR API
        const formData = new FormData()
        formData.append('image', imageFile)

        setProgress(20)
        setProgressStatus('Processing image...')

        const response = await fetch('/api/ocr', {
          method: 'POST',
          body: formData,
        })

        setProgress(80)
        setProgressStatus('Extracting text...')

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to process image')
        }

        const { text, confidence } = await response.json()

        // Parse confidence - handle both string and number formats
        const confidenceValue =
          typeof confidence === 'string' ? parseFloat(confidence) : confidence
        // Normalize to 0-1 range if needed
        const normalizedConfidence =
          confidenceValue > 1 ? confidenceValue / 100 : confidenceValue

        // Parse sentences from the recognized text
        const sentences = splitIntoSentences(text)

        // Adjust confidence based on API confidence
        const adjustedSentences = sentences.map((s) => ({
          ...s,
          confidence: normalizedConfidence * s.confidence,
        }))

        const result: OCRResult = {
          text,
          confidence: normalizedConfidence,
          sentences: adjustedSentences,
        }

        setProgress(100)
        setProgressStatus('Complete!')

        return result
      } catch (err) {
        console.error('OCR error:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to extract text from image'
        )
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  return {
    isProcessing,
    progress,
    progressStatus,
    error,
    extractText,
    parseSentences,
    reset,
  }
}
