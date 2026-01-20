import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { HabitatType } from '@/lib/types'

interface RouteParams {
  params: Promise<{ petId: string }>
}

// GET: Fetch a single pet
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { petId } = await params

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch pet with ownership check via RLS
    const { data: pet, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .single()

    if (error || !pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    return NextResponse.json({ pet })
  } catch (error) {
    console.error('Error in pet GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface UpdatePetBody {
  name?: string
  is_favorite?: boolean
  habitat_type?: HabitatType
}

// PATCH: Update a pet
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { petId } = await params
    const body: UpdatePetBody = await request.json()

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.is_favorite !== undefined) updates.is_favorite = body.is_favorite
    if (body.habitat_type !== undefined) updates.habitat_type = body.habitat_type

    const { data: pet, error } = await supabase
      .from('pets')
      .update(updates)
      .eq('id', petId)
      .select()
      .single()

    if (error) {
      console.error('Error updating pet:', error)
      return NextResponse.json(
        { error: 'Failed to update pet' },
        { status: 500 }
      )
    }

    return NextResponse.json({ pet })
  } catch (error) {
    console.error('Error in pet PATCH:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
