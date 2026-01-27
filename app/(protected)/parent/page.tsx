'use client'

import Link from 'next/link'
import { useChild } from '../ProtectedLayoutClient'
import { Card } from '@/components/ui'

interface ParentCardProps {
  title: string
  description: string
  icon: string
  href: string
  color: string
}

function ParentCard({ title, description, icon, href, color }: ParentCardProps) {
  return (
    <Link href={href}>
      <Card
        className="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
      >
        <div className={`absolute top-0 left-0 right-0 h-2 ${color}`} />
        <div className="pt-6 pb-4 px-4 text-center">
          <div className="text-5xl mb-4">{icon}</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </Card>
    </Link>
  )
}

export default function ParentPage() {
  const { selectedChild } = useChild()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
          <span className="text-4xl">👨‍👩‍👧</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Parent Dashboard</h1>
        <p className="text-gray-600">
          Manage settings and track progress
          {selectedChild ? ` for ${selectedChild.name}` : ''}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <ParentCard
          title="Word List"
          description="View and manage struggling words that need practice"
          icon="📝"
          href="/parent/struggling-words"
          color="bg-amber-500"
        />
        <ParentCard
          title="Cash Rewards"
          description="Track earnings and mark rewards as paid"
          icon="💵"
          href="/parent/rewards"
          color="bg-green-500"
        />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">About Parent Features</h2>
        <div className="space-y-4 text-gray-600">
          <div className="flex gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h3 className="font-semibold text-gray-800">Word List</h3>
              <p className="text-sm">
                Words are automatically captured when your child struggles during Sentence Shenanigans.
                You can also add words manually for extra practice.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">💵</span>
            <div>
              <h3 className="font-semibold text-gray-800">Cash Rewards</h3>
              <p className="text-sm">
                Enable cash rewards to motivate learning! Set how much each mastered word is worth
                and track weekly earnings. Mark as paid when you give the reward.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
