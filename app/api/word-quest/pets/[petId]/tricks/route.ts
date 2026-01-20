import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  TRICK_XP_REWARDS,
  getTrickAnimation,
  getTrickAnimationDuration,
  XP_PER_LEVEL,
  BEHAVIORS_BY_LEVEL,
  type PetType,
  type PetTrick,
} from '@/lib/types';

interface RouteParams {
  params: Promise<{ petId: string }>;
}

// GET: Fetch all trick records for a pet
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { petId } = await params;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch tricks for this pet (RLS will verify ownership)
    const { data: tricks, error } = await supabase
      .from('pet_tricks')
      .select('*')
      .eq('pet_id', petId)
      .order('times_performed', { ascending: false });

    if (error) {
      console.error('Error fetching pet tricks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tricks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tricks: tricks || [] });
  } catch (error) {
    console.error('Error in tricks GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface PerformTrickBody {
  trickName: string;
}

// POST: Perform a trick
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { petId } = await params;
    const body: PerformTrickBody = await request.json();
    const { trickName } = body;

    if (!trickName) {
      return NextResponse.json(
        { error: 'Trick name is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the pet to verify ownership and check unlocked behaviors
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .single();

    if (petError || !pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    // Verify the trick is unlocked
    const unlockedBehaviors: string[] = pet.unlocked_behaviors || [];
    if (!unlockedBehaviors.includes(trickName)) {
      return NextResponse.json(
        { error: 'This trick is not unlocked yet' },
        { status: 400 }
      );
    }

    // Upsert the trick record (increment times_performed)
    const { data: existingTrick } = await supabase
      .from('pet_tricks')
      .select('*')
      .eq('pet_id', petId)
      .eq('trick_name', trickName)
      .single();

    let trick: PetTrick;
    const now = new Date().toISOString();

    if (existingTrick) {
      // Update existing trick
      const newTimesPerformed = existingTrick.times_performed + 1;
      // Mastery increases every 5 performances, max level 5
      const newMasteryLevel = Math.min(5, Math.floor(newTimesPerformed / 5));

      const { data: updatedTrick, error: updateError } = await supabase
        .from('pet_tricks')
        .update({
          times_performed: newTimesPerformed,
          mastery_level: newMasteryLevel,
          last_performed_at: now,
        })
        .eq('id', existingTrick.id)
        .select()
        .single();

      if (updateError || !updatedTrick) {
        console.error('Error updating trick:', updateError);
        return NextResponse.json(
          { error: 'Failed to update trick' },
          { status: 500 }
        );
      }

      trick = updatedTrick as PetTrick;
    } else {
      // Create new trick record
      const { data: newTrick, error: insertError } = await supabase
        .from('pet_tricks')
        .insert({
          pet_id: petId,
          trick_name: trickName,
          times_performed: 1,
          mastery_level: 0,
          last_performed_at: now,
        })
        .select()
        .single();

      if (insertError || !newTrick) {
        console.error('Error creating trick:', insertError);
        return NextResponse.json(
          { error: 'Failed to create trick record' },
          { status: 500 }
        );
      }

      trick = newTrick as PetTrick;
    }

    // Calculate XP reward
    const baseXP = TRICK_XP_REWARDS.base;
    const masteryBonus = trick.mastery_level * TRICK_XP_REWARDS.masteryBonus;
    const xpEarned = baseXP + masteryBonus;

    // Update pet's XP
    const newXP = pet.experience_points + xpEarned;

    // Check for level up
    let newLevel = pet.level;
    let leveledUp = false;
    let newBehaviors: string[] = [...unlockedBehaviors];

    while (newLevel < 10 && newXP >= XP_PER_LEVEL[newLevel]) {
      newLevel++;
      leveledUp = true;

      // Unlock new behaviors for this level
      const petBehaviors = BEHAVIORS_BY_LEVEL[pet.pet_type as PetType] || [];
      const levelBehaviors = petBehaviors[newLevel - 1] || [];
      for (const behavior of levelBehaviors) {
        if (!newBehaviors.includes(behavior)) {
          newBehaviors.push(behavior);
        }
      }
    }

    // Update pet
    const { data: updatedPet, error: petUpdateError } = await supabase
      .from('pets')
      .update({
        experience_points: newXP,
        level: newLevel,
        unlocked_behaviors: newBehaviors,
        last_interacted_at: now,
      })
      .eq('id', petId)
      .select()
      .single();

    if (petUpdateError) {
      console.error('Error updating pet XP:', petUpdateError);
      // Don't fail the whole request, just log it
    }

    // Get animation info
    const animationClass = getTrickAnimation(trickName);
    const animationDuration = getTrickAnimationDuration(trickName);

    return NextResponse.json({
      success: true,
      trick,
      xpEarned,
      masteryBonus,
      animationClass,
      animationDuration,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
      newBehaviors: leveledUp
        ? newBehaviors.filter((b) => !unlockedBehaviors.includes(b))
        : undefined,
      pet: updatedPet || pet,
    });
  } catch (error) {
    console.error('Error in tricks POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
