/**
 * Send a welcome email to a newly registered user.
 * Called fire-and-forget from AuthContext after signUp succeeds.
 * Requires a valid Supabase access token to prevent abuse.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { renderEmail } from '@/lib/emails'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) {
      console.warn('welcome-email: RESEND_API_KEY not configured — skipping.')
      return NextResponse.json({ skipped: true }, { status: 200 })
    }

    // Verify the caller is a real authenticated user (prevents cold spam).
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
    }

    const supabase = getSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = (user.email ?? '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'No email on user record' }, { status: 400 })
    }

    const { subject, html } = renderEmail('welcome_signup', {
      customerName: name || 'there',
    })

    const from =
      process.env.RESEND_FROM?.trim() ||
      'Purpose Technology <admin@purposetech.online>'

    const resend = new Resend(apiKey)
    const { error: sendError } = await resend.emails.send({
      from,
      to: [email],
      subject,
      html,
      replyTo: 'admin@purposetech.online',
    })

    if (sendError) {
      console.error('welcome-email send error:', sendError)
      return NextResponse.json({ error: sendError.message }, { status: 500 })
    }

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('welcome-email route error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
