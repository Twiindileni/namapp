/**
 * Cron job: send welcome emails to newly created users that have not
 * been processed yet (users.welcome_email_sent = false).
 *
 * Secure with CRON_SECRET and configure in Vercel Cron.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { renderEmail } from '@/lib/emails'

const BATCH_SIZE = 50

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const authHeader = request.headers.get('authorization') ?? ''
  return authHeader === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 503 })
    }

    const supabase = getSupabaseServerClient()
    const resend = new Resend(apiKey)
    const from = process.env.RESEND_FROM?.trim() || 'Purpose Technology <admin@purposetech.online>'

    const { data: pendingUsers, error: pendingError } = await supabase
      .from('users')
      .select('id, email, name, welcome_email_sent, created_at')
      .eq('welcome_email_sent', false)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (pendingError) throw pendingError
    if (!pendingUsers || pendingUsers.length === 0) {
      return NextResponse.json({ processed: 0, sent: 0, failed: 0 })
    }

    let sent = 0
    let failed = 0
    const failedIds: string[] = []

    for (const row of pendingUsers) {
      const email = String(row.email ?? '').trim().toLowerCase()
      if (!email) {
        failed++
        failedIds.push(String(row.id))
        continue
      }

      try {
        const { subject, html } = renderEmail('welcome_signup', {
          customerName: String(row.name ?? '').trim() || 'there',
        })

        const { error: sendError } = await resend.emails.send({
          from,
          to: [email],
          subject,
          html,
          replyTo: 'admin@purposetech.online',
        })

        if (sendError) {
          failed++
          failedIds.push(String(row.id))
          continue
        }

        const { error: markError } = await supabase
          .from('users')
          .update({ welcome_email_sent: true })
          .eq('id', row.id)

        if (markError) {
          failed++
          failedIds.push(String(row.id))
          continue
        }

        sent++
      } catch {
        failed++
        failedIds.push(String(row.id))
      }
    }

    return NextResponse.json({
      processed: pendingUsers.length,
      sent,
      failed,
      failedIds,
    })
  } catch (err) {
    console.error('welcome-emails cron error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
