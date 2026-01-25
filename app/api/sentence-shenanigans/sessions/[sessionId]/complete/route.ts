import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  SENTENCE_ACCURACY_THRESHOLD,
  SENTENCE_XP_REWARDS,
} from '@/lib/types'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

interface CompleteSessionBody {
  sentencesPracticed: number
  sentencesCorrect: number
  durationSeconds: number
}

// POST: Complete a practice session
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

    // Fetch session with child info
    const { data: session } = await supabase
      .from('sentence_practice_sessions')
      .select(`
        *,
        children!inner(user_id, id),
        reading_materials!inner(sentence_count)
      `)
      .eq('id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if ((session.children as { user_id: string }).user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Calculate final accuracy
    const totalWords = session.total_words_attempted || 0
    const correctWords = session.total_words_correct || 0
    const overallAccuracy =
      totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0

    // Calculate XP earned
    const sentencesPracticed = session.sentences_practiced || 0
    const sentencesCorrect = session.sentences_correct || 0
    const materialSentenceCount = (session.reading_materials as { sentence_count: number }).sentence_count || 0
    const allSentencesPracticed = sentencesPracticed >= materialSentenceCount

    let pointsEarned = sentencesPracticed * SENTENCE_XP_REWARDS.basePerSentence

    // Accuracy bonuses
    if (overallAccuracy >= 100) {
      pointsEarned += SENTENCE_XP_REWARDS.accuracyBonus100
    } else if (overallAccuracy >= 95) {
      pointsEarned += SENTENCE_XP_REWARDS.accuracyBonus95
    } else if (overallAccuracy >= 90) {
      pointsEarned += SENTENCE_XP_REWARDS.accuracyBonus90
    }

    // Completion bonus
    if (allSentencesPracticed) {
      pointsEarned += SENTENCE_XP_REWARDS.completionBonus
    }

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('sentence_practice_sessions')
      .update({
        accuracy_percentage: overallAccuracy,
        duration_seconds: durationSeconds,
        points_earned: pointsEarned,
        completed_at: new Date().toISOString(),
      })
      .select()
      .eq('id', sessionId)
      .single()

    if (updateError) {
      console.error('Error completing session:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete session' },
        { status: 500 }
      )
    }

    // Check for pet rewards (if accuracy >= threshold)
    let petReward = null
    const childId = (session.children as { id: string }).id

    if (overallAccuracy >= SENTENCE_ACCURACY_THRESHOLD) {
      // Child earned a new pet! They get to customize one every time they hit the threshold
      const { data: existingPets } = await supabase
        .from('pets')
        .select('id')
        .eq('child_id', childId)

      const isFirstPet = !existingPets || existingPets.length === 0

      petReward = {
        isNewPet: true,
        isFirstPet,
        xpGained: pointsEarned,
      }
    }

    // Update child's practice stats (non-fatal if this fails)
    try {
      await supabase
        .from('children')
        .update({
          last_practice_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', childId)
    } catch (err) {
      console.error('Error updating child practice stats:', err)
    }

    return NextResponse.json({
      session: updatedSession,
      stats: {
        sentencesPracticed,
        sentencesCorrect,
        overallAccuracy,
        pointsEarned,
        allSentencesPracticed,
      },
      petReward,
    })
  } catch (error) {
    console.error('Error in session complete POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
