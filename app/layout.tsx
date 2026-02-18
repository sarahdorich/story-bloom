import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StoryBloom - AI-Powered Personalized Children\'s Stories',
  description: 'Create magical, personalized stories for your child with AI. Age-appropriate content tailored to their interests, reading level, and imagination.',
  icons: {
    icon: '/storybloom_logo.png',
    apple: '/storybloom_logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
