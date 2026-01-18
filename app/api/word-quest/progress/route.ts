import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RequestBody {
  childId: string
  wordListId: string
  correct: boolean
  sessionId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { childId, wordListId, correct, sessionId } = body

    if (!childId || !wordListId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user owns this child
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify child belongs to user
    const { data: child } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('user_id', user.id)
      .single()

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // Get existing progress
    const { data: existingProgress } = await supabase
      .from('word_progress')
      .select('*')
      .eq('child_id', childId)
      .eq('word_list_id', wordListId)
      .single()

    const timesPracticed = (existingProgress?.times_practiced || 0) + 1
    const timesCorrect =
      (existingProgress?.times_correct || 0) + (correct ? 1 : 0)

    // Calculate new mastery level (0-5)
    const masteryLevel = calculateMasteryLevel(timesPracticed, timesCorrect)

    if (existingProgress) {
      // Update existing progress
      const { error: updateError } = await supabase
        .from('word_progress')
        .update({
          times_practiced: timesPracticed,
          times_correct: timesCorrect,
          mastery_level: masteryLevel,
          last_practiced_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id)

      if (updateError) {
        console.error('Error updating progress:', updateError)
        return NextResponse.json(
          { error: 'Failed to update progress' },
          { status: 500 }
        )
      }
    } else {
      // Insert new progress
      const { error: insertError } = await supabase
        .from('word_progress')
        .insert({
          child_id: childId,
          word_list_id: wordListId,
          times_practiced: 1,
          times_correct: correct ? 1 : 0,
          mastery_level: 0,
          last_practiced_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Error inserting progress:', insertError)
        return NextResponse.json(
          { error: 'Failed to create progress' },
          { status: 500 }
        )
      }
    }

    // Update session stats if sessionId provided
    if (sessionId) {
      const { data: session } = await supabase
        .from('practice_sessions')
        .select('words_practiced, words_correct')
        .eq('id', sessionId)
        .single()

      if (session) {
        await supabase
          .from('practice_sessions')
          .update({
            words_practiced: session.words_practiced + 1,
            words_correct: session.words_correct + (correct ? 1 : 0),
          })
          .eq('id', sessionId)
      }
    }

    return NextResponse.json({ success: true, masteryLevel })
  } catch (error) {
    console.error('Error in progress endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateMasteryLevel(
  timesPracticed: number,
  timesCorrect: number
): number {
  // Need at least 3 attempts before determining mastery
  if (timesPracticed < 3) return 0

  const accuracy = timesCorrect / timesPracticed

  if (accuracy >= 0.9) return 5
  if (accuracy >= 0.8) return 4
  if (accuracy >= 0.7) return 3
  if (accuracy >= 0.5) return 2
  if (accuracy >= 0.3) return 1
  return 0
}
