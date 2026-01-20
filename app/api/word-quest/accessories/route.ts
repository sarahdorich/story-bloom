import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Accessory, ChildAccessory, UnlockRequirement } from '@/lib/types';

// GET: Fetch all accessories and child's unlocked accessories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json(
        { error: 'Missing childId parameter' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user owns this child
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: child } = await supabase
      .from('children')
      .select('id, total_practice_sessions, total_words_mastered, current_streak_days')
      .eq('id', childId)
      .eq('user_id', user.id)
      .single();

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Fetch all active accessories
    const { data: accessories, error: accessoriesError } = await supabase
      .from('accessories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (accessoriesError) {
      console.error('Error fetching accessories:', accessoriesError);
      return NextResponse.json(
        { error: 'Failed to fetch accessories' },
        { status: 500 }
      );
    }

    // Fetch child's unlocked accessories
    const { data: unlockedAccessories, error: unlockedError } = await supabase
      .from('child_accessories')
      .select('*, accessory:accessories(*)')
      .eq('child_id', childId);

    if (unlockedError) {
      console.error('Error fetching unlocked accessories:', unlockedError);
      return NextResponse.json(
        { error: 'Failed to fetch unlocked accessories' },
        { status: 500 }
      );
    }

    // Get child's stats for unlock progress
    const stats = {
      sessions: child.total_practice_sessions || 0,
      wordsMastered: child.total_words_mastered || 0,
      streakDays: child.current_streak_days || 0,
      level: 1, // Will need to get from pet if relevant
    };

    return NextResponse.json({
      accessories: accessories || [],
      unlockedAccessories: unlockedAccessories || [],
      stats,
    });
  } catch (error) {
    console.error('Error in accessories GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface UnlockAccessoryBody {
  childId: string;
  accessoryId: string;
  source?: string;
}

// POST: Unlock a new accessory for a child
export async function POST(request: NextRequest) {
  try {
    const body: UnlockAccessoryBody = await request.json();
    const { childId, accessoryId, source = 'achievement' } = body;

    if (!childId || !accessoryId) {
      return NextResponse.json(
        { error: 'Missing childId or accessoryId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user owns this child
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: child } = await supabase
      .from('children')
      .select('id, total_practice_sessions, total_words_mastered, current_streak_days')
      .eq('id', childId)
      .eq('user_id', user.id)
      .single();

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Verify accessory exists
    const { data: accessory } = await supabase
      .from('accessories')
      .select('*')
      .eq('id', accessoryId)
      .eq('is_active', true)
      .single();

    if (!accessory) {
      return NextResponse.json({ error: 'Accessory not found' }, { status: 404 });
    }

    // Check if already unlocked
    const { data: existing } = await supabase
      .from('child_accessories')
      .select('id')
      .eq('child_id', childId)
      .eq('accessory_id', accessoryId)
      .single();

    if (existing) {
      return NextResponse.json({
        message: 'Accessory already unlocked',
        alreadyUnlocked: true,
      });
    }

    // Verify the child meets the unlock requirement
    const requirement = accessory.unlock_requirement as UnlockRequirement;
    const stats = {
      sessions: child.total_practice_sessions || 0,
      wordsMastered: child.total_words_mastered || 0,
      streakDays: child.current_streak_days || 0,
      level: 1,
    };

    let meetsRequirement = false;
    switch (requirement.type) {
      case 'sessions':
        meetsRequirement = stats.sessions >= requirement.count;
        break;
      case 'words_mastered':
        meetsRequirement = stats.wordsMastered >= requirement.count;
        break;
      case 'streak_days':
        meetsRequirement = stats.streakDays >= requirement.count;
        break;
      case 'level':
        meetsRequirement = stats.level >= requirement.count;
        break;
    }

    if (!meetsRequirement) {
      return NextResponse.json(
        { error: 'Unlock requirement not met' },
        { status: 400 }
      );
    }

    // Unlock the accessory
    const { data: unlocked, error } = await supabase
      .from('child_accessories')
      .insert({
        child_id: childId,
        accessory_id: accessoryId,
        unlock_source: source,
      })
      .select('*, accessory:accessories(*)')
      .single();

    if (error) {
      console.error('Error unlocking accessory:', error);
      return NextResponse.json(
        { error: 'Failed to unlock accessory' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Accessory unlocked!',
      unlockedAccessory: unlocked,
    });
  } catch (error) {
    console.error('Error in accessories POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
