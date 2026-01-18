import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PracticeWord } from '@/lib/types'

interface RequestBody {
  childId: string
  readingLevel: string
  count: number
}

interface WordWithProgress {
  id: string
  word: string
  difficulty_rank: number
  word_progress: Array<{
    mastery_level: number
    last_practiced_at: string | null
  }> | null
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { childId, readingLevel, count = 10 } = body

    if (!childId || !readingLevel) {
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

    const { data: child } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('user_id', user.id)
      .single()

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // Fetch words for this reading level
    const { data: words, error: wordsError } = await supabase
      .from('word_lists')
      .select('id, word, difficulty_rank')
      .eq('reading_level', readingLevel)
      .order('difficulty_rank', { ascending: true })

    if (wordsError) {
      console.error('Error fetching words:', wordsError)
      return NextResponse.json(
        { error: 'Failed to fetch words' },
        { status: 500 }
      )
    }

    if (!words || words.length === 0) {
      return NextResponse.json(
        { error: 'No words found for this level' },
        { status: 404 }
      )
    }

    // Fetch progress for this child separately
    const { data: progressData } = await supabase
      .from('word_progress')
      .select('word_list_id, mastery_level, last_practiced_at')
      .eq('child_id', childId)

    // Build a map of word_list_id -> progress
    const progressMap = new Map(
      progressData?.map((p) => [p.word_list_id, p]) || []
    )

    // Combine words with their progress
    const wordsWithProgress: WordWithProgress[] = words.map((word) => ({
      id: word.id,
      word: word.word,
      difficulty_rank: word.difficulty_rank,
      word_progress: progressMap.has(word.id)
        ? [progressMap.get(word.id)!]
        : null,
    }))

    // Smart word selection algorithm
    const selectedWords = selectWordsForPractice(wordsWithProgress, count)

    // Create a new practice session
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .insert({
        child_id: childId,
        words_practiced: 0,
        words_correct: 0,
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
      words: selectedWords,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Error in words endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function selectWordsForPractice(
  wordsWithProgress: WordWithProgress[],
  count: number
): PracticeWord[] {
  // Categorize words by mastery level
  const needsPractice: PracticeWord[] = [] // mastery < 3
  const maintenance: PracticeWord[] = [] // mastery 3-4
  const newWords: PracticeWord[] = [] // no progress record

  for (const word of wordsWithProgress) {
    const progress = word.word_progress?.[0]

    const practiceWord: PracticeWord = {
      id: word.id,
      word: word.word,
      mastery_level: progress?.mastery_level || 0,
      word_list_id: word.id,
    }

    if (!progress) {
      newWords.push(practiceWord)
    } else if (progress.mastery_level < 3) {
      needsPractice.push(practiceWord)
    } else if (progress.mastery_level < 5) {
      maintenance.push(practiceWord)
    }
    // Skip fully mastered words (level 5)
  }

  // Mix: 60% needs practice, 20% maintenance, 20% new
  const result: PracticeWord[] = []
  const needsCount = Math.ceil(count * 0.6)
  const maintenanceCount = Math.ceil(count * 0.2)
  const newCount = count - needsCount - maintenanceCount

  // Shuffle and take from each category
  result.push(...shuffleArray(needsPractice).slice(0, needsCount))
  result.push(...shuffleArray(maintenance).slice(0, maintenanceCount))
  result.push(...shuffleArray(newWords).slice(0, newCount))

  // If we don't have enough words, fill from any category
  if (result.length < count) {
    const allAvailable = [...needsPractice, ...maintenance, ...newWords]
    const remaining = allAvailable.filter(
      (w) => !result.find((r) => r.id === w.id)
    )
    const shuffledRemaining = shuffleArray(remaining)

    while (result.length < count && shuffledRemaining.length > 0) {
      const word = shuffledRemaining.shift()
      if (word) result.push(word)
    }
  }

  // Final shuffle to mix categories
  return shuffleArray(result).slice(0, count)
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
