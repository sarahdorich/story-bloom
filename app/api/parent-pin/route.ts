import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

// POST: Set or update PIN
export async function POST(request: NextRequest) {
  try {
    const { pin, currentPin } = await request.json()

    // Validate PIN format (4 digits)
    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current settings to check if PIN already exists
    const { data: settings } = await supabase
      .from('app_settings')
      .select('parent_pin_hash')
      .eq('user_id', user.id)
      .single()

    // If PIN already exists, require current PIN to change it
    if (settings?.parent_pin_hash) {
      if (!currentPin) {
        return NextResponse.json(
          { error: 'Current PIN required to change PIN' },
          { status: 400 }
        )
      }

      const isValid = await bcrypt.compare(currentPin, settings.parent_pin_hash)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current PIN is incorrect' },
          { status: 403 }
        )
      }
    }

    // Hash the new PIN
    const pinHash = await bcrypt.hash(pin, SALT_ROUNDS)

    // Update or insert settings with new PIN hash
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        {
          user_id: user.id,
          parent_pin_hash: pinHash,
          // Clear any pending reset token
          pin_reset_token: null,
          pin_reset_token_expires_at: null,
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('Error setting PIN:', error)
      return NextResponse.json(
        { error: 'Failed to set PIN' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in parent-pin POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Verify PIN
export async function PUT(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: settings } = await supabase
      .from('app_settings')
      .select('parent_pin_hash')
      .eq('user_id', user.id)
      .single()

    if (!settings?.parent_pin_hash) {
      return NextResponse.json(
        { error: 'No PIN set' },
        { status: 404 }
      )
    }

    const isValid = await bcrypt.compare(pin, settings.parent_pin_hash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect PIN', valid: false },
        { status: 403 }
      )
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Error in parent-pin PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Remove PIN (requires current PIN verification)
export async function DELETE(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Current PIN required to remove PIN' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: settings } = await supabase
      .from('app_settings')
      .select('parent_pin_hash')
      .eq('user_id', user.id)
      .single()

    if (!settings?.parent_pin_hash) {
      return NextResponse.json(
        { error: 'No PIN set' },
        { status: 404 }
      )
    }

    // Verify current PIN before removing
    const isValid = await bcrypt.compare(pin, settings.parent_pin_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect PIN' },
        { status: 403 }
      )
    }

    // Remove the PIN
    const { error } = await supabase
      .from('app_settings')
      .update({
        parent_pin_hash: null,
        pin_reset_token: null,
        pin_reset_token_expires_at: null,
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error removing PIN:', error)
      return NextResponse.json(
        { error: 'Failed to remove PIN' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in parent-pin DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
