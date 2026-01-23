import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Fetch all reading materials for a child
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

    // Fetch all active materials for this child with sentence count
    const { data: materials, error } = await supabase
      .from('reading_materials')
      .select(`
        *,
        sentence_practice_sessions (
          id,
          completed_at
        )
      `)
      .eq('child_id', childId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching materials:', error)
      return NextResponse.json(
        { error: 'Failed to fetch materials' },
        { status: 500 }
      )
    }

    // Calculate last practiced date for each material
    const materialsWithStats = (materials || []).map((material) => {
      const sessions = material.sentence_practice_sessions || []
      const completedSessions = sessions.filter((s: { completed_at: string | null }) => s.completed_at)
      const lastSession = completedSessions[0]

      return {
        ...material,
        last_practiced_at: lastSession?.completed_at || null,
        total_sessions: completedSessions.length,
        sentence_practice_sessions: undefined, // Remove from response
      }
    })

    return NextResponse.json({ materials: materialsWithStats })
  } catch (error) {
    console.error('Error in materials GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface CreateMaterialBody {
  childId: string
  name: string
  description?: string
  sentences: Array<{
    text: string
    order: number
    confidence?: number
  }>
  imageData?: string // Base64 encoded image
}

// POST: Create a new reading material with sentences
export async function POST(request: NextRequest) {
  try {
    const body: CreateMaterialBody = await request.json()
    const { childId, name, description, sentences, imageData } = body

    if (!childId) {
      return NextResponse.json({ error: 'Missing childId' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 })
    }

    if (!sentences || sentences.length === 0) {
      return NextResponse.json(
        { error: 'At least one sentence is required' },
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

    // Handle image upload if provided
    let imageUrl: string | null = null
    let imageStoragePath: string | null = null

    if (imageData) {
      try {
        // Extract base64 data
        const base64Data = imageData.includes(',')
          ? imageData.split(',')[1]
          : imageData
        const buffer = Buffer.from(base64Data, 'base64')

        // Generate unique filename
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 9)
        const fileName = `${timestamp}-${randomId}.jpg`
        imageStoragePath = `${user.id}/${fileName}`

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('reading-materials')
          .upload(imageStoragePath, buffer, {
            contentType: 'image/jpeg',
            cacheControl: '31536000',
          })

        if (uploadError) {
          console.error('Error uploading image:', uploadError)
          // Continue without image - not a fatal error
        } else {
          // Get signed URL
          const { data: urlData } = await supabase.storage
            .from('reading-materials')
            .createSignedUrl(imageStoragePath, 60 * 60 * 24 * 7) // 7 days

          imageUrl = urlData?.signedUrl || null
        }
      } catch (uploadErr) {
        console.error('Error processing image:', uploadErr)
        // Continue without image
      }
    }

    // Create the reading material
    const { data: material, error: materialError } = await supabase
      .from('reading_materials')
      .insert({
        child_id: childId,
        name,
        description: description || null,
        image_url: imageUrl,
        image_storage_path: imageStoragePath,
        sentence_count: sentences.length,
        is_active: true,
      })
      .select()
      .single()

    if (materialError) {
      console.error('Error creating material:', materialError)
      return NextResponse.json(
        { error: 'Failed to create material' },
        { status: 500 }
      )
    }

    // Insert all sentences
    const sentenceRecords = sentences.map((s) => ({
      material_id: material.id,
      sentence_text: s.text.trim(),
      display_order: s.order,
      ocr_confidence: s.confidence || null,
      is_edited: false,
      is_active: true,
    }))

    const { data: insertedSentences, error: sentencesError } = await supabase
      .from('material_sentences')
      .insert(sentenceRecords)
      .select()

    if (sentencesError) {
      console.error('Error creating sentences:', sentencesError)
      // Clean up the material if sentences fail
      await supabase.from('reading_materials').delete().eq('id', material.id)
      return NextResponse.json(
        { error: 'Failed to create sentences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      material: {
        ...material,
        sentences: insertedSentences,
      },
    })
  } catch (error) {
    console.error('Error in materials POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
