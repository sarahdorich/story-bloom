'use client'

import Link from 'next/link'
import { useChild } from '../ProtectedLayoutClient'
import { Button, Card } from '@/components/ui'

export default function ProfilePage() {
  const { children, selectedChild, selectChild } = useChild()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Child Profiles</h1>
          <p className="text-gray-600">Select a profile to personalize stories</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {children.map(child => (
          <Card
            key={child.id}
            className={`relative ${selectedChild?.id === child.id ? 'ring-2 ring-primary-500' : ''}`}
          >
            {selectedChild?.id === child.id && (
              <span className="absolute -top-2 -right-2 px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
                Active
              </span>
            )}

            <div className="flex items-start gap-4">
              {child.profile_image_url ? (
                <img
                  src={child.profile_image_url}
                  alt={child.name}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {child.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-800">{child.name}</h3>
                <p className="text-sm text-gray-600">
                  {child.age} years old • {child.reading_level}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {child.favorite_things.slice(0, 3).map(thing => (
                    <span
                      key={thing}
                      className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                    >
                      {thing}
                    </span>
                  ))}
                  {child.favorite_things.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      +{child.favorite_things.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              {selectedChild?.id !== child.id && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => selectChild(child)}
                  className="flex-1"
                >
                  Select
                </Button>
              )}
              {selectedChild?.id === child.id && (
                <div className="flex-1 text-center text-sm text-primary-600 font-medium py-2">
                  Currently Active
                </div>
              )}
            </div>
          </Card>
        ))}

        {children.length === 0 && (
          <Card className="sm:col-span-2 text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No profiles yet</h3>
            <p className="text-gray-500 mb-4">Ask a parent to create a profile for you!</p>
          </Card>
        )}
      </div>

      {/* Info card about editing profiles */}
      <Card className="mt-6 bg-gray-50 border-gray-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700">Need to edit a profile?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Profile editing is available in the Parents section. Ask a parent to help you make changes to your profile.
            </p>
            <Link href="/parent/profiles">
              <Button variant="outline" size="sm" className="mt-3">
                Go to Parent Settings
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
