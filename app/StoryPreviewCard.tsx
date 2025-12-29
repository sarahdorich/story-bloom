'use client'

import { useState } from 'react'
import Image from 'next/image'

export function StoryPreviewCard() {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-r from-primary-200 to-secondary-200 rounded-3xl blur-2xl opacity-50" />
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Illustration */}
        <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 relative overflow-hidden">
          {!imageError && (
            <Image
              src="/dallas-axolotl.png"
              alt="Dallas and the Rainbow Axolotl - a colorful illustration of a girl with pink glasses looking at a rainbow axolotl in the water"
              fill
              className="object-cover"
              priority
              onError={() => setImageError(true)}
            />
          )}
          {/* Fallback decorative elements if no image or image fails to load */}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">🌈</div>
                <div className="flex justify-center gap-2">
                  <span className="text-4xl">🦎</span>
                  <span className="text-4xl">✨</span>
                </div>
              </div>
            </div>
          )}
          {/* Decorative waves */}
          <div className="absolute bottom-0 left-0 right-0 h-16">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-white">
              <path d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z" />
            </svg>
          </div>
        </div>

        {/* Story Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center text-xl flex-shrink-0">
              🌟
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">Dallas and the Rainbow Axolotl</h3>
              <p className="text-sm text-gray-500">Personalized for Dallas, age 7</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm">
            &quot;Dallas put on her pink glasses. She saw something amazing in the water! A rainbow axolotl swam by her boat. It had bright colors like a rainbow. &apos;Look Duke!&apos; she called to her brother. The axolotl smiled at them. Dallas and Duke waved goodbye as it swam away.&quot;
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">Axolotl</span>
            <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">Adventure</span>
            <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm font-medium">Boating</span>
          </div>
        </div>
      </div>
    </div>
  )
}
