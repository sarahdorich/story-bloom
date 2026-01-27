import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

interface CompleteSessionBody {
  durationSeconds?: number
}

// POST: Complete a Word Rescue session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params
    const body: CompleteSessionBody = await request.json()
    const { durationSeconds } = body

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify session exists and user owns it
    const { data: session } = await supabase
      .from('word_rescue_sessions')
      .select('*, children!inner(user_id)')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const childrenData = session.children as unknown as { user_id: string }
    if (childrenData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update session as completed
    const { data: updatedSession, error: updateError } = await supabase
      .from('word_rescue_sessions')
      .update({
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds || null,
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error completing session:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Error in session complete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
