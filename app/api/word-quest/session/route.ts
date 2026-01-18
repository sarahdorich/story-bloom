import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PatchRequestBody {
  sessionId: string
  wordsPracticed: number
  wordsCorrect: number
  durationSeconds: number
}

export async function PATCH(request: NextRequest) {
  try {
    const body: PatchRequestBody = await request.json()
    const { sessionId, wordsPracticed, wordsCorrect, durationSeconds } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update session with final stats
    const { data, error } = await supabase
      .from('practice_sessions')
      .update({
        words_practiced: wordsPracticed,
        words_correct: wordsCorrect,
        duration_seconds: durationSeconds,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating session:', error)
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in session endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
