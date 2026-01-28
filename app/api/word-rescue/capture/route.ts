import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syllabify, normalizeWord } from '@/lib/utils/syllabify'

interface CaptureWordInput {
  word: string
  sentenceId?: string
  context?: string
}

interface CaptureWordsBody {
  childId: string
  words: CaptureWordInput[]
}

// POST: Capture struggling words from Sentence Shenanigans
export async function POST(request: NextRequest) {
  try {
    const body: CaptureWordsBody = await request.json()
    const { childId, words } = body

    if (!childId || !words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: childId and words array' },
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
      .select('id, user_id')
      .eq('id', childId)
      .single()

    if (!child || child.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    let captured = 0
    let skipped = 0
    let existing = 0

    for (const wordInput of words) {
      const normalizedWord = normalizeWord(wordInput.word)

      // Skip empty or invalid words (no API call for game performance)
      if (!normalizedWord || !/^[a-z']+$/i.test(normalizedWord)) {
        skipped++
        continue
      }

      // Generate syllable breakdown
      const syllables = syllabify(normalizedWord)

      // Try to insert the word
      const { data: insertedWord, error: insertError } = await supabase
        .from('struggling_words')
        .insert({
          child_id: childId,
          word: normalizedWord,
          source: 'sentence_shenanigans',
          source_sentence_id: wordInput.sentenceId || null,
          syllable_breakdown: syllables,
          times_seen: 1,
        })
        .select()
        .single()

      if (insertError) {
        // Check if it's a unique constraint violation (word already exists)
        if (insertError.code === '23505') {
          // Word already exists - increment times_seen
          const { error: updateError } = await supabase
            .from('struggling_words')
            .update({
              times_seen: supabase.rpc('increment', { x: 1 }),
            })
            .eq('child_id', childId)
            .eq('word', normalizedWord)

          // Use RPC function instead since the above update syntax doesn't work
          if (updateError) {
            await supabase.rpc('increment_struggling_word_seen', {
              p_child_id: childId,
              p_word: normalizedWord,
            })
          }
          existing++
        } else {
          console.error('Error inserting word:', insertError)
        }
      } else {
        captured++
      }
    }

    return NextResponse.json({
      captured,
      existing,
      skipped,
      total: words.length,
    })
  } catch (error) {
    console.error('Error in word-rescue capture:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
