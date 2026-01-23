'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChild } from '../../../ProtectedLayoutClient'
import { useSentenceShenanigans } from '@/lib/hooks/useSentenceShenanigans'
import { useOCR } from '@/lib/hooks/useOCR'
import { Button, Card } from '@/components/ui'
import type { ExtractedSentence } from '@/lib/types'

type UploadStep = 'name' | 'capture' | 'processing' | 'review'

export default function UploadPage() {
  const router = useRouter()
  const { selectedChild } = useChild()
  const { createMaterial } = useSentenceShenanigans({ childId: selectedChild?.id || '' })
  const { isProcessing, progress, progressStatus, error: ocrError, extractText, reset: resetOCR } = useOCR()

  const [step, setStep] = useState<UploadStep>('name')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [sentences, setSentences] = useState<ExtractedSentence[]>([])
  const [materialName, setMaterialName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Start OCR processing
    setStep('processing')
    const result = await extractText(file)

    if (result && result.sentences.length > 0) {
      setSentences(result.sentences)
      setStep('review')
    } else if (result && result.sentences.length === 0) {
      // No sentences found but OCR succeeded
      setSentences([])
      setStep('review')
    } else {
      // OCR failed - show error but stay on capture
      setStep('capture')
    }
  }, [extractText])

  const handleFileSelect = useCallback(async (file: File) => {
    setPendingFile(file)
    // If no name yet, go to name step first
    if (!materialName.trim()) {
      setStep('name')
      // Create preview while on name step
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      // Already have a name, process directly
      await processFile(file)
    }
  }, [materialName, processFile])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleAddSentence = useCallback(() => {
    const newOrder = sentences.length > 0 ? Math.max(...sentences.map(s => s.order)) + 1 : 1
    setSentences([...sentences, { text: '', confidence: 1, order: newOrder }])
  }, [sentences])

  const handleUpdateSentence = useCallback((index: number, text: string) => {
    setSentences(sentences.map((s, i) => i === index ? { ...s, text } : s))
  }, [sentences])

  const handleRemoveSentence = useCallback((index: number) => {
    setSentences(sentences.filter((_, i) => i !== index))
  }, [sentences])

  const handleSave = useCallback(async () => {
    if (!materialName.trim()) {
      setSaveError('Please enter a name for this material')
      return
    }

    const validSentences = sentences.filter(s => s.text.trim().length > 0)
    if (validSentences.length === 0) {
      setSaveError('Please add at least one sentence')
      return
    }

    setIsSaving(true)
    setSaveError(null)

    const material = await createMaterial(
      materialName.trim(),
      validSentences.map((s, i) => ({
        text: s.text.trim(),
        order: i + 1,
        confidence: s.confidence,
      })),
      undefined,
      imagePreview || undefined
    )

    setIsSaving(false)

    if (material) {
      router.push('/games/sentence-shenanigans')
    } else {
      setSaveError('Failed to save material. Please try again.')
    }
  }, [materialName, sentences, imagePreview, createMaterial, router])

  const handleContinueWithName = useCallback(async () => {
    if (!materialName.trim()) {
      setSaveError('Please enter a name for this material')
      return
    }
    setSaveError(null)

    if (pendingFile) {
      // We have a file waiting, process it
      await processFile(pendingFile)
    } else {
      // No file yet, go to capture step
      setStep('capture')
    }
  }, [materialName, pendingFile, processFile])

  const handleBack = useCallback(() => {
    if (step === 'review') {
      setStep('capture')
      resetOCR()
    } else if (step === 'capture') {
      setStep('name')
    } else {
      router.push('/games/sentence-shenanigans')
    }
  }, [step, resetOCR, router])

  if (!selectedChild) {
    router.push('/games/sentence-shenanigans')
    return null
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-lg font-bold text-gray-800">Add Material</h1>
        <div className="w-16" />
      </div>

      {/* Step: Name */}
      {step === 'name' && (
        <div className="space-y-6">
          <Card className="text-center py-8">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Name Your Material
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Give this reading material a name so you can find it later
            </p>

            <div className="max-w-sm mx-auto mb-6">
              <input
                type="text"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="e.g., Chapter 3 Worksheet"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-secondary-400 text-center"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && materialName.trim()) {
                    handleContinueWithName()
                  }
                }}
              />
            </div>

            {/* Show image preview if we already captured one */}
            {imagePreview && (
              <div className="mb-6">
                <img
                  src={imagePreview}
                  alt="Captured"
                  className="max-h-32 mx-auto rounded-xl shadow-md"
                />
              </div>
            )}

            {saveError && (
              <p className="text-red-500 text-sm mb-4">{saveError}</p>
            )}

            <Button
              size="lg"
              onClick={handleContinueWithName}
              disabled={!materialName.trim()}
              className="bg-gradient-to-r from-secondary-500 to-primary-500"
            >
              {pendingFile ? 'Process Image' : 'Continue'}
            </Button>
          </Card>
        </div>
      )}

      {/* Step: Capture */}
      {step === 'capture' && (
        <div className="space-y-6">
          <Card className="text-center py-8">
            <div className="text-5xl mb-4">📷</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Capture Reading Material
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Take a photo or upload an image of a worksheet, book page, or other
              reading material
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take Photo
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Image
              </Button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </Card>

          {ocrError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {ocrError}
            </div>
          )}

          {/* Or add manually */}
          <div className="text-center">
            <span className="text-gray-400 text-sm">or</span>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setSentences([{ text: '', confidence: 1, order: 1 }])
              setPendingFile(null)
              setImagePreview(null)
              setStep('review')
            }}
          >
            Add sentences manually
          </Button>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <Card className="text-center py-12">
          {imagePreview && (
            <div className="mb-6">
              <img
                src={imagePreview}
                alt="Captured"
                className="max-h-48 mx-auto rounded-xl shadow-md"
              />
            </div>
          )}

          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-secondary-200 border-t-secondary-500 animate-spin" />

          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Extracting Text...
          </h2>
          <p className="text-gray-600 text-sm mb-4">{progressStatus}</p>

          <div className="w-full max-w-xs mx-auto bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary-500 to-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs mt-2">{progress}%</p>
        </Card>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="space-y-6">
          {/* Material Name Header */}
          <Card className="flex items-center gap-4">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Captured"
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Material</p>
              <h2 className="text-lg font-bold text-gray-800 truncate">{materialName}</h2>
            </div>
            <button
              onClick={() => setStep('name')}
              className="text-secondary-500 hover:text-secondary-600 text-sm font-medium"
            >
              Edit
            </button>
          </Card>

          {/* Sentences */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                Extracted Sentences ({sentences.length})
              </h3>
              <Button variant="ghost" size="sm" onClick={handleAddSentence}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </Button>
            </div>

            {sentences.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No sentences extracted. Add some manually!</p>
                <Button variant="outline" onClick={handleAddSentence}>
                  Add Sentence
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sentences.map((sentence, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center text-xs font-medium mt-2">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <textarea
                        value={sentence.text}
                        onChange={(e) => handleUpdateSentence(index, e.target.value)}
                        placeholder="Enter sentence..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-secondary-400 text-sm resize-none"
                      />
                      {sentence.confidence < 0.8 && (
                        <p className="text-xs text-amber-600 mt-1">
                          Low confidence - please verify this sentence
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveSentence(index)}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors mt-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Error */}
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {saveError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-secondary-500 to-primary-500"
            >
              {isSaving ? 'Saving...' : 'Save Material'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
