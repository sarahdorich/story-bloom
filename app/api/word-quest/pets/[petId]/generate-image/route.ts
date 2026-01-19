import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAndSavePetImage } from '@/lib/services/pet-image-generator';
import { buildPetImagePrompt } from '@/lib/pet-customization-options';
import type { PetType, PetCustomization } from '@/lib/types';

interface RouteParams {
  params: Promise<{ petId: string }>;
}

/**
 * POST: Trigger image generation for a pet
 * Can optionally provide new customization to use
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { petId } = await params;
    const supabase = await createClient();

    // Verify authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch pet with ownership verification via RLS
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .single();

    if (petError || !pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    // Check if already generating
    if (pet.image_generation_status === 'generating') {
      return NextResponse.json(
        { error: 'Image generation already in progress' },
        { status: 409 }
      );
    }

    // Optionally accept new customization from request body
    let prompt = pet.image_generation_prompt;

    const body = await request.json().catch(() => ({}));
    if (body.customization || !prompt) {
      // Build new prompt from customization
      const customization: PetCustomization = body.customization || {
        colorPrimary: pet.color_primary,
        colorSecondary: pet.color_secondary,
        pattern: pet.pattern,
        accessory: pet.accessory,
        customDescription: pet.custom_description,
      };

      prompt = buildPetImagePrompt(
        pet.pet_type as PetType,
        pet.name,
        customization
      );

      // Update customization fields if provided
      if (body.customization) {
        await supabase
          .from('pets')
          .update({
            color_primary: customization.colorPrimary,
            color_secondary: customization.colorSecondary,
            pattern: customization.pattern,
            accessory: customization.accessory,
            custom_description: customization.customDescription,
          })
          .eq('id', petId);
      }
    }

    // Generate the image (this handles status updates internally)
    const result = await generateAndSavePetImage(petId, prompt);

    if (result.success) {
      // Fetch updated pet to return
      const { data: updatedPet } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();

      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl,
        pet: updatedPet,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to generate image',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in generate-image POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET: Check image generation status
 * Useful for polling during generation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { petId } = await params;
    const supabase = await createClient();

    // Verify authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch pet status (RLS ensures ownership)
    const { data: pet, error } = await supabase
      .from('pets')
      .select('id, image_url, image_generation_status')
      .eq('id', petId)
      .single();

    if (error || !pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: pet.image_generation_status,
      imageUrl: pet.image_url,
    });
  } catch (error) {
    console.error('Error in generate-image GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Increase max duration for DALL-E generation (can take up to 60 seconds)
export const maxDuration = 60;
