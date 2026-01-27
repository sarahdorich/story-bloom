import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper to get week start date (Monday)
function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date)
  const dayOfWeek = d.getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Adjust for Monday
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

// GET: Get cash rewards for a child (current week and history)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')
    const includeHistory = searchParams.get('history') === 'true'

    if (!childId) {
      return NextResponse.json(
        { error: 'Missing required parameter: childId' },
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
      .select('id, user_id, name')
      .eq('id', childId)
      .single()

    if (!child || child.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const weekStartDate = getWeekStartDate()

    // Get current week's record (or create if doesn't exist)
    let { data: currentWeek } = await supabase
      .from('cash_rewards')
      .select('*')
      .eq('child_id', childId)
      .eq('week_start_date', weekStartDate)
      .single()

    if (!currentWeek) {
      // Create current week's record
      const { data: newWeek, error: createError } = await supabase
        .from('cash_rewards')
        .insert({
          child_id: childId,
          week_start_date: weekStartDate,
          words_mastered_this_week: 0,
          cash_earned: 0,
        })
        .select()
        .single()

      if (createError && createError.code !== '23505') {
        console.error('Error creating cash reward record:', createError)
      } else if (newWeek) {
        currentWeek = newWeek
      } else {
        // Try to get it again (might have been created by another request)
        const { data: existingWeek } = await supabase
          .from('cash_rewards')
          .select('*')
          .eq('child_id', childId)
          .eq('week_start_date', weekStartDate)
          .single()
        currentWeek = existingWeek
      }
    }

    // Get history if requested
    let history = null
    if (includeHistory) {
      const { data: historyData } = await supabase
        .from('cash_rewards')
        .select('*')
        .eq('child_id', childId)
        .neq('week_start_date', weekStartDate)
        .order('week_start_date', { ascending: false })
        .limit(10)

      history = historyData
    }

    // Get settings for milestone info
    const { data: settings } = await supabase
      .from('app_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Calculate next milestone
    const wordsMastered = currentWeek?.words_mastered_this_week || 0
    let nextMilestone = null
    if (settings?.cash_milestone_bonus_enabled) {
      if (wordsMastered < 10) {
        nextMilestone = { wordsNeeded: 10, bonus: settings.cash_milestone_10_words || 1.0 }
      } else if (wordsMastered < 25) {
        nextMilestone = { wordsNeeded: 25, bonus: settings.cash_milestone_25_words || 3.0 }
      } else if (wordsMastered < 50) {
        nextMilestone = { wordsNeeded: 50, bonus: settings.cash_milestone_50_words || 5.0 }
      }
    }

    return NextResponse.json({
      currentWeek: currentWeek || {
        child_id: childId,
        week_start_date: weekStartDate,
        words_mastered_this_week: 0,
        cash_earned: 0,
        is_paid: false,
      },
      history,
      childName: child.name,
      nextMilestone,
      cashRewardEnabled: settings?.cash_reward_enabled || false,
    })
  } catch (error) {
    console.error('Error in cash-rewards GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Mark a week as paid
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { rewardId, paidAmount } = body

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Missing required field: rewardId' },
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

    // Verify reward exists and user owns it via child
    const { data: reward } = await supabase
      .from('cash_rewards')
      .select('*, children!inner(user_id)')
      .eq('id', rewardId)
      .single()

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    const childrenData = reward.children as unknown as { user_id: string }
    if (childrenData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Mark as paid
    const { data: updatedReward, error: updateError } = await supabase
      .from('cash_rewards')
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        paid_amount: paidAmount || reward.cash_earned,
      })
      .eq('id', rewardId)
      .select()
      .single()

    if (updateError) {
      console.error('Error marking reward as paid:', updateError)
      return NextResponse.json(
        { error: 'Failed to update reward' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reward: updatedReward })
  } catch (error) {
    console.error('Error in cash-rewards PATCH:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
