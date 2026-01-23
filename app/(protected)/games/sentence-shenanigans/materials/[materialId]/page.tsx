'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { useChild } from '../../../../ProtectedLayoutClient'
import { useSentenceShenanigans } from '@/lib/hooks/useSentenceShenanigans'
import { Button, Card } from '@/components/ui'
import type { ReadingMaterial, MaterialSentence } from '@/lib/types'

interface PageProps {
  params: Promise<{ materialId: string }>
}

export default function MaterialDetailPage({ params }: PageProps) {
  const { materialId } = use(params)
  const router = useRouter()
  const { selectedChild } = useChild()
  const { deleteMaterial } = useSentenceShenanigans({ childId: selectedChild?.id || '' })

  const [material, setMaterial] = useState<(ReadingMaterial & { stats?: { total_sessions: number; average_accuracy: number | null } }) | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Fetch material details
  useEffect(() => {
    async function fetchMaterial() {
      try {
        const response = await fetch(`/api/sentence-shenanigans/materials/${materialId}`)
        if (!response.ok) {
          throw new Error('Material not found')
        }
        const { material: fetchedMaterial } = await response.json()
        setMaterial(fetchedMaterial)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load material')
      } finally {
        setIsLoading(false)
      }
    }

    if (selectedChild) {
      fetchMaterial()
    }
  }, [materialId, selectedChild])

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    const success = await deleteMaterial(materialId)
    if (success) {
      router.push('/games/sentence-shenanigans')
    } else {
      setError('Failed to delete material')
      setIsDeleting(false)
    }
  }, [deleteMaterial, materialId, router])

  if (!selectedChild) {
    router.push('/games/sentence-shenanigans')
    return null
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-secondary-200 border-t-secondary-500 animate-spin" />
        <p className="text-gray-500">Loading material...</p>
      </div>
    )
  }

  if (error || !material) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <Card className="py-8">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {error || 'Material not found'}
          </h2>
          <Button onClick={() => router.push('/games/sentence-shenanigans')}>
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/games/sentence-shenanigans')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-lg font-bold text-gray-800">Material Details</h1>
        <div className="w-16" />
      </div>

      {/* Material Info */}
      <Card className="mb-6">
        <div className="flex items-start gap-4">
          {material.image_url ? (
            <img
              src={material.image_url}
              alt={material.name}
              className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-secondary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">📄</span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              {material.name}
            </h2>
            {material.description && (
              <p className="text-gray-600 text-sm mb-2">{material.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{material.sentence_count} sentences</span>
              {(material.stats?.total_sessions ?? 0) > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>{material.stats?.total_sessions} sessions</span>
                </>
              )}
              {material.stats?.average_accuracy && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>{material.stats.average_accuracy}% avg accuracy</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Sentences List */}
      <Card className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Sentences</h3>
        <div className="space-y-3">
          {material.sentences?.map((sentence: MaterialSentence, index: number) => (
            <div
              key={sentence.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="text-gray-800">{sentence.sentence_text}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {sentence.times_practiced > 0 && (
                    <span>Practiced {sentence.times_practiced}x</span>
                  )}
                  {sentence.best_accuracy !== null && (
                    <span>Best: {Math.round(sentence.best_accuracy)}%</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Material
        </Button>
        <Button
          className="flex-1 bg-gradient-to-r from-secondary-500 to-primary-500"
          onClick={() =>
            router.push(`/games/sentence-shenanigans/materials/${materialId}/practice`)
          }
        >
          Start Practice
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <Card className="max-w-sm w-full text-center py-6">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Delete Material?
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              This will permanently delete &quot;{material.name}&quot; and all
              practice history. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
