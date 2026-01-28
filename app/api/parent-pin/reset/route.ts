import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPinResetEmail } from '@/lib/email/sendPinResetEmail'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const SALT_ROUNDS = 10
const TOKEN_EXPIRY_HOURS = 1

// POST: Request PIN reset (sends email)
export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'No email associated with account' },
        { status: 400 }
      )
    }

    // Check if PIN is actually set
    const { data: settings } = await supabase
      .from('app_settings')
      .select('parent_pin_hash')
      .eq('user_id', user.id)
      .single()

    if (!settings?.parent_pin_hash) {
      return NextResponse.json(
        { error: 'No PIN set for this account' },
        { status: 404 }
      )
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    // Store the reset token
    const { error: updateError } = await supabase
      .from('app_settings')
      .update({
        pin_reset_token: resetToken,
        pin_reset_token_expires_at: expiresAt.toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error storing reset token:', updateError)
      return NextResponse.json(
        { error: 'Failed to initiate reset' },
        { status: 500 }
      )
    }

    // Send the reset email
    await sendPinResetEmail({
      to: user.email,
      resetToken,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in parent-pin/reset POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Complete PIN reset (validate token and set new PIN)
export async function PUT(request: NextRequest) {
  try {
    const { token, newPin } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token required' },
        { status: 400 }
      )
    }

    if (!newPin || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { error: 'New PIN must be exactly 4 digits' },
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

    // Find settings with matching token
    const { data: settings } = await supabase
      .from('app_settings')
      .select('pin_reset_token, pin_reset_token_expires_at')
      .eq('user_id', user.id)
      .single()

    if (!settings?.pin_reset_token) {
      return NextResponse.json(
        { error: 'No pending reset request' },
        { status: 404 }
      )
    }

    // Verify token matches
    if (settings.pin_reset_token !== token) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 403 }
      )
    }

    // Check token expiry
    if (settings.pin_reset_token_expires_at) {
      const expiresAt = new Date(settings.pin_reset_token_expires_at)
      if (expiresAt < new Date()) {
        // Clear expired token
        await supabase
          .from('app_settings')
          .update({
            pin_reset_token: null,
            pin_reset_token_expires_at: null,
          })
          .eq('user_id', user.id)

        return NextResponse.json(
          { error: 'Reset token has expired' },
          { status: 410 }
        )
      }
    }

    // Hash the new PIN
    const pinHash = await bcrypt.hash(newPin, SALT_ROUNDS)

    // Update PIN and clear reset token
    const { error: updateError } = await supabase
      .from('app_settings')
      .update({
        parent_pin_hash: pinHash,
        pin_reset_token: null,
        pin_reset_token_expires_at: null,
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error setting new PIN:', updateError)
      return NextResponse.json(
        { error: 'Failed to set new PIN' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in parent-pin/reset PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Validate reset token (check if valid before showing form)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
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
      .select('pin_reset_token, pin_reset_token_expires_at')
      .eq('user_id', user.id)
      .single()

    if (!settings?.pin_reset_token || settings.pin_reset_token !== token) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token' },
        { status: 200 }
      )
    }

    // Check expiry
    if (settings.pin_reset_token_expires_at) {
      const expiresAt = new Date(settings.pin_reset_token_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { valid: false, error: 'Token has expired' },
          { status: 200 }
        )
      }
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Error in parent-pin/reset GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
