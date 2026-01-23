import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface StartSessionBody {
  childId: string
  materialId: string
}

// POST: Start a new practice session
export async function POST(request: NextRequest) {
  try {
    const body: StartSessionBody = await request.json()
    const { childId, materialId } = body

    if (!childId || !materialId) {
      return NextResponse.json(
        { error: 'Missing childId or materialId' },
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

    // Verify user owns this child
    const { data: child } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('user_id', user.id)
      .single()

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // Verify material exists and belongs to this child
    const { data: material, error: materialError } = await supabase
      .from('reading_materials')
      .select('id, name, sentence_count')
      .eq('id', materialId)
      .eq('child_id', childId)
      .eq('is_active', true)
      .single()

    if (materialError || !material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      )
    }

    // Fetch active sentences for this material
    const { data: sentences, error: sentencesError } = await supabase
      .from('material_sentences')
      .select('id, sentence_text, display_order, best_accuracy')
      .eq('material_id', materialId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (sentencesError || !sentences || sentences.length === 0) {
      return NextResponse.json(
        { error: 'No sentences found for this material' },
        { status: 400 }
      )
    }

    // Create a new practice session
    const { data: session, error: sessionError } = await supabase
      .from('sentence_practice_sessions')
      .insert({
        child_id: childId,
        material_id: materialId,
        sentences_practiced: 0,
        sentences_correct: 0,
        total_words_attempted: 0,
        total_words_correct: 0,
        points_earned: 0,
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session,
      sentences: sentences.map((s) => ({
        id: s.id,
        sentence_text: s.sentence_text,
        display_order: s.display_order,
        best_accuracy: s.best_accuracy,
      })),
      material: {
        id: material.id,
        name: material.name,
        sentenceCount: material.sentence_count,
      },
    })
  } catch (error) {
    console.error('Error in sessions POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
