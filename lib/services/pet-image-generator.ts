import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const STORAGE_BUCKET = 'story-illustrations';

export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  storagePath?: string;
  error?: string;
}

/**
 * Generates a pet image using DALL-E 3 and uploads it to Supabase storage.
 * This function is designed to be called server-side (from API routes).
 *
 * @param petId - The pet's UUID, used for organizing storage paths
 * @param prompt - The DALL-E prompt built from pet customization
 * @returns Result object with success status and image URL or error
 */
export async function generatePetImage(
  petId: string,
  prompt: string
): Promise<GenerateImageResult> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!openaiApiKey) {
    console.error('Missing OPENAI_API_KEY');
    return { success: false, error: 'Image generation not configured' };
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration');
    return { success: false, error: 'Storage not configured' };
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const tempImageUrl = response.data?.[0]?.url;
    if (!tempImageUrl) {
      return { success: false, error: 'No image URL returned from DALL-E' };
    }

    // Fetch the generated image
    const imageResponse = await fetch(tempImageUrl);
    if (!imageResponse.ok) {
      return { success: false, error: 'Failed to fetch generated image' };
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Upload to Supabase storage
    const timestamp = Date.now();
    const storagePath = `pet-images/${petId}/${timestamp}.png`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000', // Cache for 1 year
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: 'Failed to upload image to storage' };
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return {
      success: true,
      imageUrl: publicUrlData.publicUrl,
      storagePath,
    };
  } catch (error) {
    console.error('Pet image generation error:', error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return { success: false, error: 'Image generation rate limit reached. Please try again later.' };
      }
      if (error.status === 400) {
        return { success: false, error: 'Image generation request was invalid.' };
      }
    }

    return { success: false, error: 'Image generation failed unexpectedly' };
  }
}

/**
 * Updates a pet's image generation status in the database.
 * Uses the service role client for server-side operations.
 */
export async function updatePetImageStatus(
  petId: string,
  status: 'pending' | 'generating' | 'completed' | 'failed',
  imageUrl?: string,
  storagePath?: string,
  prompt?: string
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const updates: Record<string, unknown> = {
    image_generation_status: status,
  };

  if (imageUrl !== undefined) {
    updates.image_url = imageUrl;
  }

  if (storagePath !== undefined) {
    updates.image_storage_path = storagePath;
  }

  if (prompt !== undefined) {
    updates.image_generation_prompt = prompt;
  }

  const { error } = await supabase
    .from('pets')
    .update(updates)
    .eq('id', petId);

  if (error) {
    console.error('Failed to update pet image status:', error);
    return false;
  }

  return true;
}

/**
 * Orchestrates the full pet image generation process:
 * 1. Updates status to 'generating'
 * 2. Generates image via DALL-E
 * 3. Uploads to storage
 * 4. Updates pet record with results
 *
 * This is the main function to call from API routes.
 */
export async function generateAndSavePetImage(
  petId: string,
  prompt: string
): Promise<GenerateImageResult> {
  // Mark as generating
  await updatePetImageStatus(petId, 'generating', undefined, undefined, prompt);

  // Generate the image
  const result = await generatePetImage(petId, prompt);

  // Update based on result
  if (result.success && result.imageUrl) {
    await updatePetImageStatus(
      petId,
      'completed',
      result.imageUrl,
      result.storagePath
    );
  } else {
    await updatePetImageStatus(petId, 'failed');
  }

  return result;
}
