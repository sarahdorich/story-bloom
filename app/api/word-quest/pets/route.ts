import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PetType, PetCustomization } from '@/lib/types'
import { BEHAVIORS_BY_LEVEL, PET_MAPPINGS } from '@/lib/types'
import { buildPetImagePrompt } from '@/lib/pet-customization-options'
import { generateAndSavePetImage } from '@/lib/services/pet-image-generator'

// GET: Fetch all pets for a child
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')

    if (!childId) {
      return NextResponse.json(
        { error: 'Missing childId parameter' },
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

    // Fetch all pets for this child
    const { data: pets, error } = await supabase
      .from('pets')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching pets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pets' },
        { status: 500 }
      )
    }

    return NextResponse.json({ pets: pets || [] })
  } catch (error) {
    console.error('Error in pets GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface CreatePetBody {
  childId: string
  petType?: PetType
  name?: string
  customization?: PetCustomization
  generateImage?: boolean
}

// POST: Create a new pet
export async function POST(request: NextRequest) {
  try {
    const body: CreatePetBody = await request.json()
    const {
      childId,
      petType: requestedPetType,
      name: requestedName,
      customization,
      generateImage = true,
    } = body

    if (!childId) {
      return NextResponse.json(
        { error: 'Missing childId' },
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
      .select('id, name, favorite_things, pet_preferences')
      .eq('id', childId)
      .eq('user_id', user.id)
      .single()

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // Determine pet type from child's favorite things if not specified
    const petType = requestedPetType || selectPetTypeFromFavorites(child.favorite_things || [])

    // Generate a cute name if not provided
    const name = requestedName || generatePetName(petType)

    // Generate personality
    const personality = generatePersonality(petType)

    // Get initial behaviors (level 1)
    const initialBehaviors = BEHAVIORS_BY_LEVEL[petType]?.[0] || []

    // Build image generation prompt from customization
    const finalCustomization: PetCustomization = {
      colorPrimary: customization?.colorPrimary ?? null,
      colorSecondary: customization?.colorSecondary ?? null,
      pattern: customization?.pattern ?? null,
      accessory: customization?.accessory ?? null,
      customDescription: customization?.customDescription ?? null,
    }

    const imagePrompt = buildPetImagePrompt(petType, name, finalCustomization)

    // Create the pet with customization fields
    const { data: pet, error } = await supabase
      .from('pets')
      .insert({
        child_id: childId,
        pet_type: petType,
        name,
        personality,
        color_primary: finalCustomization.colorPrimary,
        color_secondary: finalCustomization.colorSecondary,
        pattern: finalCustomization.pattern,
        accessory: finalCustomization.accessory,
        custom_description: finalCustomization.customDescription,
        image_generation_prompt: imagePrompt,
        image_generation_status: generateImage ? 'pending' : 'completed',
        happiness: 100,
        energy: 100,
        level: 1,
        experience_points: 0,
        unlocked_behaviors: initialBehaviors,
        is_favorite: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating pet:', error)
      return NextResponse.json(
        { error: 'Failed to create pet' },
        { status: 500 }
      )
    }

    // Trigger async image generation if requested (fire and forget)
    if (generateImage && pet) {
      // Don't await - let it run in the background
      generateAndSavePetImage(pet.id, imagePrompt).catch((err) => {
        console.error('Background image generation failed:', err)
      })
    }

    return NextResponse.json({ pet })
  } catch (error) {
    console.error('Error in pets POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function selectPetTypeFromFavorites(favoriteThings: string[]): PetType {
  for (const thing of favoriteThings) {
    const normalized = thing.toLowerCase().trim()
    // Check each word in the favorite thing
    const words = normalized.split(/\s+/)
    for (const word of words) {
      if (PET_MAPPINGS[word]) {
        return PET_MAPPINGS[word]
      }
    }
  }
  // Default to cat if no match
  return 'cat'
}

const PET_NAMES: Record<PetType, string[]> = {
  cat: ['Whiskers', 'Mittens', 'Luna', 'Shadow', 'Cleo', 'Mochi', 'Felix', 'Bella'],
  dog: ['Buddy', 'Max', 'Charlie', 'Cooper', 'Daisy', 'Luna', 'Rocky', 'Bear'],
  dinosaur: ['Rex', 'Spike', 'Dino', 'Tiny', 'Stompy', 'Chomper', 'Thunder', 'Pebbles'],
  unicorn: ['Sparkle', 'Rainbow', 'Star', 'Twinkle', 'Magic', 'Crystal', 'Aurora', 'Shimmer'],
  dragon: ['Ember', 'Flame', 'Smoky', 'Blaze', 'Cinder', 'Ash', 'Spark', 'Flare'],
  bunny: ['Fluffy', 'Snowball', 'Thumper', 'Cotton', 'Bun-Bun', 'Clover', 'Hoppy', 'Patches'],
  bear: ['Teddy', 'Honey', 'Bruno', 'Coco', 'Maple', 'Berry', 'Cubby', 'Fuzzy'],
  bird: ['Tweety', 'Sky', 'Sunny', 'Chirpy', 'Feathers', 'Rio', 'Blue', 'Pip'],
  fish: ['Bubbles', 'Goldie', 'Splash', 'Finn', 'Coral', 'Shimmer', 'Wave', 'Neptune'],
  butterfly: ['Flutter', 'Blossom', 'Petal', 'Sunny', 'Wings', 'Monarch', 'Pixie', 'Rainbow'],
}

function generatePetName(petType: PetType): string {
  const names = PET_NAMES[petType] || PET_NAMES.cat
  return names[Math.floor(Math.random() * names.length)]
}

const PERSONALITIES: Record<PetType, string[]> = {
  cat: ['playful and curious', 'gentle and cuddly', 'adventurous and brave', 'sleepy and snuggly'],
  dog: ['loyal and friendly', 'energetic and playful', 'gentle and caring', 'brave and protective'],
  dinosaur: ['mighty and gentle', 'curious and adventurous', 'friendly and silly', 'brave and strong'],
  unicorn: ['magical and kind', 'graceful and gentle', 'sparkly and cheerful', 'dreamy and loving'],
  dragon: ['fierce but friendly', 'brave and protective', 'playful and fiery', 'wise and gentle'],
  bunny: ['soft and gentle', 'bouncy and happy', 'curious and sweet', 'fluffy and cuddly'],
  bear: ['cuddly and warm', 'gentle and strong', 'playful and loving', 'cozy and sweet'],
  bird: ['cheerful and melodic', 'curious and bright', 'friendly and musical', 'colorful and happy'],
  fish: ['graceful and calm', 'shimmery and magical', 'playful and splashy', 'peaceful and pretty'],
  butterfly: ['delicate and beautiful', 'colorful and free', 'gentle and magical', 'graceful and sweet'],
}

function generatePersonality(petType: PetType): string {
  const personalities = PERSONALITIES[petType] || PERSONALITIES.cat
  return personalities[Math.floor(Math.random() * personalities.length)]
}
