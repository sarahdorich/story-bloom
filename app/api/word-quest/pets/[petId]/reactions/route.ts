import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  calculatePetMood,
  calculateHappinessDecay,
  getReactionMessage,
  STREAK_MILESTONES,
  READING_XP_BONUSES,
  type PetMood,
  type ReadingReactionType,
} from '@/lib/types';

interface RouteParams {
  params: Promise<{ petId: string }>;
}

// GET: Get pet's current mood and recent reactions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { petId } = await params;
    const supabase = await createClient();

    // Verify ownership
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pet with reading stats
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('*, children!inner(user_id, current_streak_days, last_practice_date)')
      .eq('id', petId)
      .single();

    if (petError || !pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    const petWithChild = pet as {
      id: string;
      happiness: number;
      last_reading_session_at: string | null;
      reading_streak_days: number;
      current_mood: PetMood;
      children: { user_id: string; current_streak_days: number; last_practice_date: string | null };
    };

    if (petWithChild.children.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Calculate days since last practice
    const lastPractice = petWithChild.last_reading_session_at
      ? new Date(petWithChild.last_reading_session_at)
      : null;
    const now = new Date();
    const daysSinceLastPractice = lastPractice
      ? Math.floor((now.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Calculate current mood and happiness (with decay)
    const currentHappiness = calculateHappinessDecay(petWithChild.happiness, daysSinceLastPractice);
    const hasRecentStreak = petWithChild.children.current_streak_days >= 3;
    const currentMood = calculatePetMood(currentHappiness, daysSinceLastPractice, hasRecentStreak);

    // Fetch recent reactions
    const { data: reactions, error: reactionsError } = await supabase
      .from('pet_reading_reactions')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError);
    }

    return NextResponse.json({
      pet: {
        ...pet,
        current_mood: currentMood,
        effective_happiness: currentHappiness,
        days_since_last_practice: daysSinceLastPractice,
      },
      reactions: reactions || [],
    });
  } catch (error) {
    console.error('Error in pet reactions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface LogReadingSessionBody {
  practiceSessionId?: string;
  wordsPracticed: number;
  wordsCorrect: number;
  wordsMastered?: number; // New words mastered this session
  petLeveledUp?: boolean;
  newLevel?: number;
}

// POST: Log a reading session and get pet's reaction
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { petId } = await params;
    const body: LogReadingSessionBody = await request.json();
    const {
      practiceSessionId,
      wordsPracticed,
      wordsCorrect,
      wordsMastered = 0,
      petLeveledUp = false,
      newLevel,
    } = body;

    const supabase = await createClient();

    // Verify ownership
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pet with child data
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('*, children!inner(id, user_id, current_streak_days, last_practice_date, total_practice_sessions)')
      .eq('id', petId)
      .single();

    if (petError || !pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    type PetWithChild = {
      id: string;
      happiness: number;
      energy: number;
      experience_points: number;
      last_reading_session_at: string | null;
      reading_streak_days: number;
      current_mood: PetMood;
      children: {
        id: string;
        user_id: string;
        current_streak_days: number;
        last_practice_date: string | null;
        total_practice_sessions: number;
      };
    };

    const petWithChild = pet as PetWithChild;
    if (petWithChild.children.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastPracticeDate = petWithChild.children.last_practice_date;
    const lastPetSession = petWithChild.last_reading_session_at
      ? new Date(petWithChild.last_reading_session_at)
      : null;

    // Determine reaction types
    const reactions: Array<{
      type: ReadingReactionType;
      mood: PetMood;
      message: string;
      xpBonus: number;
    }> = [];

    // Calculate accuracy
    const accuracy = wordsPracticed > 0 ? Math.round((wordsCorrect / wordsPracticed) * 100) : 0;

    // Check for comeback (hasn't practiced in 3+ days)
    const daysSinceLastPractice = lastPetSession
      ? Math.floor((now.getTime() - lastPetSession.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    const isComeback = daysSinceLastPractice >= 3;

    // Calculate new streak
    let newStreak = petWithChild.children.current_streak_days;
    const isNewDay = lastPracticeDate !== today;

    if (isNewDay) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastPracticeDate === yesterdayStr) {
        // Continued streak
        newStreak = petWithChild.children.current_streak_days + 1;
      } else {
        // Streak broken or first day
        newStreak = 1;
      }
    }

    // Calculate mood based on performance
    const hasRecentStreak = newStreak >= 3;
    const newHappiness = Math.min(100, petWithChild.happiness + 10); // Boost happiness
    const currentMood = calculatePetMood(newHappiness, 0, hasRecentStreak);

    // Determine which reactions to trigger
    let totalXpBonus = 0;

    // Daily first session
    if (isNewDay) {
      const dailyFirstXp = READING_XP_BONUSES.dailyFirst;
      totalXpBonus += dailyFirstXp;
      reactions.push({
        type: 'daily_first',
        mood: currentMood,
        message: getReactionMessage('daily_first', currentMood),
        xpBonus: dailyFirstXp,
      });
    }

    // Comeback after absence
    if (isComeback) {
      const comebackXp = READING_XP_BONUSES.comeback;
      totalXpBonus += comebackXp;
      reactions.push({
        type: 'comeback',
        mood: 'lonely',
        message: getReactionMessage('comeback', 'lonely'),
        xpBonus: comebackXp,
      });
    }

    // Perfect session
    if (accuracy === 100 && wordsPracticed >= 5) {
      const perfectXp = READING_XP_BONUSES.perfectSession;
      totalXpBonus += perfectXp;
      reactions.push({
        type: 'perfect_session',
        mood: 'excited',
        message: getReactionMessage('perfect_session', 'excited'),
        xpBonus: perfectXp,
      });
    }

    // Streak milestones
    if (isNewDay && STREAK_MILESTONES.includes(newStreak as typeof STREAK_MILESTONES[number])) {
      let streakXp: number = READING_XP_BONUSES.streakMilestone3;
      if (newStreak >= 30) streakXp = READING_XP_BONUSES.streakMilestone30;
      else if (newStreak >= 14) streakXp = READING_XP_BONUSES.streakMilestone14;
      else if (newStreak >= 7) streakXp = READING_XP_BONUSES.streakMilestone7;

      totalXpBonus += streakXp;
      reactions.push({
        type: 'streak_milestone',
        mood: 'excited',
        message: getReactionMessage('streak_milestone', 'excited', { days: newStreak }),
        xpBonus: streakXp,
      });
    }

    // Word mastery
    if (wordsMastered > 0) {
      reactions.push({
        type: 'word_mastery',
        mood: currentMood,
        message: getReactionMessage('word_mastery', currentMood),
        xpBonus: 0,
      });
    }

    // Pet level up
    if (petLeveledUp && newLevel) {
      reactions.push({
        type: 'level_up',
        mood: 'excited',
        message: getReactionMessage('level_up', 'excited', { level: newLevel }),
        xpBonus: 0,
      });
    }

    // Always add session complete (if no other major reaction)
    if (reactions.length === 0 || (reactions.length === 1 && reactions[0].type === 'daily_first')) {
      reactions.push({
        type: 'session_complete',
        mood: currentMood,
        message: getReactionMessage('session_complete', currentMood),
        xpBonus: 0,
      });
    }

    // Store the primary reaction in the database
    const primaryReaction = reactions[0];
    const { error: reactionError } = await supabase.from('pet_reading_reactions').insert({
      pet_id: petId,
      practice_session_id: practiceSessionId || null,
      reaction_type: primaryReaction.type,
      reaction_mood: primaryReaction.mood,
      reaction_message: primaryReaction.message,
      words_practiced: wordsPracticed,
      accuracy_percent: accuracy,
      streak_days: newStreak,
      xp_bonus: totalXpBonus,
    });

    if (reactionError) {
      console.error('Error storing reaction:', reactionError);
    }

    // Update pet stats
    const { error: petUpdateError } = await supabase
      .from('pets')
      .update({
        happiness: newHappiness,
        current_mood: currentMood,
        mood_updated_at: now.toISOString(),
        last_reading_session_at: now.toISOString(),
        reading_streak_days: newStreak,
        experience_points: petWithChild.experience_points + totalXpBonus,
      })
      .eq('id', petId);

    if (petUpdateError) {
      console.error('Error updating pet:', petUpdateError);
    }

    // Update child stats
    const { error: childUpdateError } = await supabase
      .from('children')
      .update({
        current_streak_days: newStreak,
        last_practice_date: today,
        total_practice_sessions: (petWithChild.children.total_practice_sessions || 0) + 1,
      })
      .eq('id', petWithChild.children.id);

    if (childUpdateError) {
      console.error('Error updating child:', childUpdateError);
    }

    return NextResponse.json({
      reactions,
      totalXpBonus,
      newStreak,
      currentMood,
      newHappiness,
    });
  } catch (error) {
    console.error('Error in pet reactions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
