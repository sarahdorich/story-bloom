'use client'

import { useState, useCallback, useEffect } from 'react'
import type { AppSettings } from '@/lib/types'
import { DEFAULT_APP_SETTINGS } from '@/lib/types'

interface UseAppSettingsReturn {
  settings: AppSettings | null
  isLoading: boolean
  error: string | null
  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<AppSettings>) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useAppSettings(): UseAppSettingsReturn {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/app-settings')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch settings')
      }

      const { settings: fetchedSettings } = await response.json()
      setSettings(fetchedSettings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>): Promise<boolean> => {
      setError(null)

      try {
        const response = await fetch('/api/app-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to update settings')
        }

        const { settings: updatedSettings } = await response.json()
        setSettings(updatedSettings)

        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update settings')
        return false
      }
    },
    []
  )

  const refetch = useCallback(() => fetchSettings(), [fetchSettings])

  // Auto-fetch on mount
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
    updateSettings,
    refetch,
  }
}

// Helper hook to get specific setting values with defaults
export function useAppSetting<K extends keyof AppSettings>(
  key: K
): AppSettings[K] {
  const { settings } = useAppSettings()

  if (settings && key in settings) {
    return settings[key]
  }

  // Return default if settings not loaded yet
  if (key in DEFAULT_APP_SETTINGS) {
    return DEFAULT_APP_SETTINGS[key as keyof typeof DEFAULT_APP_SETTINGS] as AppSettings[K]
  }

  // Fallback for id, user_id, created_at, updated_at
  return '' as AppSettings[K]
}
