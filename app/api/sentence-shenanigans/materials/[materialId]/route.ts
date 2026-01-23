import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ materialId: string }>
}

// GET: Fetch a specific material with all sentences
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { materialId } = await params

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the material with its sentences
    const { data: material, error } = await supabase
      .from('reading_materials')
      .select(`
        *,
        material_sentences (
          id,
          sentence_text,
          display_order,
          ocr_confidence,
          is_edited,
          times_practiced,
          times_correct,
          best_accuracy,
          last_practiced_at,
          is_active
        ),
        children!inner (
          user_id
        )
      `)
      .eq('id', materialId)
      .eq('is_active', true)
      .single()

    if (error || !material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Verify user owns this material via child
    if (material.children.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Sort sentences by display_order and filter active ones
    const sentences = (material.material_sentences || [])
      .filter((s: { is_active: boolean }) => s.is_active)
      .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)

    // Get session stats
    const { data: sessions } = await supabase
      .from('sentence_practice_sessions')
      .select('accuracy_percentage, completed_at')
      .eq('material_id', materialId)
      .not('completed_at', 'is', null)

    const completedSessions = sessions || []
    const avgAccuracy =
      completedSessions.length > 0
        ? completedSessions.reduce(
            (sum: number, s: { accuracy_percentage: number }) => sum + (s.accuracy_percentage || 0),
            0
          ) / completedSessions.length
        : null

    return NextResponse.json({
      material: {
        id: material.id,
        child_id: material.child_id,
        name: material.name,
        description: material.description,
        image_url: material.image_url,
        sentence_count: material.sentence_count,
        is_active: material.is_active,
        created_at: material.created_at,
        updated_at: material.updated_at,
        sentences,
        stats: {
          total_sessions: completedSessions.length,
          average_accuracy: avgAccuracy ? Math.round(avgAccuracy) : null,
          last_practiced_at:
            completedSessions.length > 0
              ? completedSessions[completedSessions.length - 1].completed_at
              : null,
        },
      },
    })
  } catch (error) {
    console.error('Error in material GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface UpdateMaterialBody {
  name?: string
  description?: string
  sentences?: Array<{
    id?: string
    text: string
    order: number
  }>
}

// PUT: Update a material (name, description, or sentences)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { materialId } = await params
    const body: UpdateMaterialBody = await request.json()

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this material
    const { data: material } = await supabase
      .from('reading_materials')
      .select('id, children!inner(user_id)')
      .eq('id', materialId)
      .single()

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // children is an object when using !inner join
    const childrenData = material.children as unknown as { user_id: string }
    if (childrenData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update material fields if provided
    if (body.name !== undefined || body.description !== undefined) {
      const updates: Record<string, unknown> = {}
      if (body.name !== undefined) updates.name = body.name
      if (body.description !== undefined) updates.description = body.description

      const { error: updateError } = await supabase
        .from('reading_materials')
        .update(updates)
        .eq('id', materialId)

      if (updateError) {
        console.error('Error updating material:', updateError)
        return NextResponse.json(
          { error: 'Failed to update material' },
          { status: 500 }
        )
      }
    }

    // Update sentences if provided
    if (body.sentences && body.sentences.length > 0) {
      // For each sentence, update if id exists, insert if not
      for (const sentence of body.sentences) {
        if (sentence.id) {
          // Update existing sentence
          await supabase
            .from('material_sentences')
            .update({
              sentence_text: sentence.text.trim(),
              display_order: sentence.order,
              is_edited: true,
            })
            .eq('id', sentence.id)
            .eq('material_id', materialId)
        } else {
          // Insert new sentence
          await supabase.from('material_sentences').insert({
            material_id: materialId,
            sentence_text: sentence.text.trim(),
            display_order: sentence.order,
            is_edited: true,
            is_active: true,
          })
        }
      }
    }

    // Fetch updated material
    const { data: updatedMaterial } = await supabase
      .from('reading_materials')
      .select(`
        *,
        material_sentences (
          id,
          sentence_text,
          display_order,
          is_edited,
          is_active
        )
      `)
      .eq('id', materialId)
      .single()

    return NextResponse.json({ material: updatedMaterial })
  } catch (error) {
    console.error('Error in material PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Soft delete a material (set is_active = false)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { materialId } = await params

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this material
    const { data: material } = await supabase
      .from('reading_materials')
      .select('id, image_storage_path, children!inner(user_id)')
      .eq('id', materialId)
      .single()

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    const childrenData = material.children as unknown as { user_id: string }
    if (childrenData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Soft delete - set is_active = false
    const { error: deleteError } = await supabase
      .from('reading_materials')
      .update({ is_active: false })
      .eq('id', materialId)

    if (deleteError) {
      console.error('Error deleting material:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete material' },
        { status: 500 }
      )
    }

    // Optionally delete the image from storage
    if (material.image_storage_path) {
      await supabase.storage
        .from('reading-materials')
        .remove([material.image_storage_path])
        .catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in material DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
