'use client'

import { ParentPinGate } from '@/components/parent/ParentPinGate'

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ParentPinGate>{children}</ParentPinGate>
}
