/**
 * Handle newsletter unsubscribe requests.
 * POST /api/unsubscribe  { token: string }
 * Looks up users.unsubscribe_token and sets newsletter_subscribed = false.
 * No authentication required — the UUID token acts as the proof of identity.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = typeof body.token === 'string' ? body.token.trim() : ''

    if (!token) {
      return NextResponse.json({ error: 'Missing unsubscribe token' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { data: userRow, error: lookupError } = await supabase
      .from('users')
      .select('id, newsletter_subscribed')
      .eq('unsubscribe_token', token)
      .maybeSingle()

    if (lookupError) {
      console.error('unsubscribe lookup error:', lookupError)
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }

    if (!userRow) {
      return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 404 })
    }

    if (!userRow.newsletter_subscribed) {
      return NextResponse.json({ alreadyUnsubscribed: true })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ newsletter_subscribed: false })
      .eq('unsubscribe_token', token)

    if (updateError) {
      console.error('unsubscribe update error:', updateError)
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    return NextResponse.json({ unsubscribed: true })
  } catch (err) {
    console.error('unsubscribe route error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
