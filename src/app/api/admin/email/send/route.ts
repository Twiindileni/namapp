/**
 * Send branded customer emails via Resend (admin only).
 * Set RESEND_API_KEY and optionally RESEND_FROM (default: Purpose Technology <admin@purposetech.online>).
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { renderEmail, TEMPLATE_IDS, type TemplateId, type EmailMergeFields } from '@/lib/emails'
import { buildEmailShell } from '@/lib/emails/shell'
import { escapeHtml } from '@/lib/emails/escape-html'

const MAX_RECIPIENTS = 40
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HOURS_RATE_NAD = 130
type SendMode = 'individual' | 'bulk_notice' | 'custom_notice'

/** Convert plain text with newlines into branded HTML paragraphs */
function buildCustomHtml(subject: string, bodyText: string, ctaLabel?: string, ctaHref?: string): string {
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((block) =>
      `<p style="margin:0 0 16px 0;">${escapeHtml(block.trim()).replace(/\n/g, '<br />')}</p>`
    )
    .join('\n')

  return buildEmailShell({
    preheader: bodyText.slice(0, 120),
    headline: escapeHtml(subject),   // raw user input — must escape before shell
    innerHtml: paragraphs,
    ctaLabel: ctaLabel?.trim() || undefined,
    ctaHref: ctaHref?.trim() || undefined,
  })
}

async function ensureAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return { ok: false as const, status: 401, error: 'Missing Authorization header' }

  const supabase = getSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)
  if (userError || !user) return { ok: false as const, status: 401, error: 'Invalid or expired token' }

  const { data: userRow, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (roleError || !userRow || userRow.role !== 'admin') {
    return { ok: false as const, status: 403, error: 'Admin access required' }
  }
  return { ok: true as const, supabase }
}

function fmtHours(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function fmtNad(value: number) {
  return `N$ ${value.toFixed(2)}`
}

async function enrichDrivingMerge(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  recipientEmail: string,
  baseMerge: EmailMergeFields
): Promise<EmailMergeFields> {
  const merge = { ...baseMerge }

  const { data: booking, error: bookingError } = await supabase
    .from('driving_school_bookings')
    .select('id, customer_name, status, driving_school_packages(name)')
    .eq('customer_email', recipientEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (bookingError || !booking) return merge

  const bookingId = booking.id as string
  const customerName = (booking.customer_name as string | null) ?? ''
  const status = (booking.status as string | null) ?? ''
  const packageName =
    ((booking.driving_school_packages as { name?: string } | null)?.name ?? '').toString()

  const [{ data: payments, error: payErr }, { data: sessions, error: sessionErr }] =
    await Promise.all([
      supabase.from('driving_school_payments').select('amount_nad').eq('booking_id', bookingId),
      supabase.from('driving_school_sessions').select('hours').eq('booking_id', bookingId),
    ])

  if (payErr || sessionErr) return merge

  const totalPaid = (payments ?? []).reduce(
    (sum, p) => sum + (Number((p as { amount_nad?: number }).amount_nad) || 0),
    0
  )
  const hoursPurchased = totalPaid / HOURS_RATE_NAD
  const hoursUsed = (sessions ?? []).reduce(
    (sum, s) => sum + (Number((s as { hours?: number }).hours) || 0),
    0
  )
  const hoursLeft = Math.max(0, hoursPurchased - hoursUsed)

  return {
    ...merge,
    customerName: merge.customerName?.trim() || customerName || 'Student',
    packageName: merge.packageName?.trim() || packageName || merge.packageName || '',
    bookingStatus: merge.bookingStatus?.trim() || status || merge.bookingStatus || '',
    hoursPurchased: fmtHours(hoursPurchased),
    hoursUsed: fmtHours(hoursUsed),
    hoursLeft: fmtHours(hoursLeft),
    totalPaid: fmtNad(totalPaid),
  }
}

async function enrichMergeByTemplate(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  templateId: TemplateId,
  recipientEmail: string,
  baseMerge: EmailMergeFields
): Promise<EmailMergeFields> {
  if (templateId === 'driving_class_reminder') {
    return enrichDrivingMerge(supabase, recipientEmail, baseMerge)
  }

  if (templateId === 'photography_booking_reminder') {
    const { data } = await supabase
      .from('photography_bookings')
      .select('customer_name, event_type, event_date, event_location, preferred_package_name')
      .eq('customer_email', recipientEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!data) return baseMerge
    return {
      ...baseMerge,
      customerName: baseMerge.customerName?.trim() || (data.customer_name as string) || '',
      eventType: baseMerge.eventType?.trim() || (data.event_type as string) || '',
      eventDate: baseMerge.eventDate?.trim() || String((data.event_date as string) ?? ''),
      eventLocation: baseMerge.eventLocation?.trim() || String((data.event_location as string) ?? ''),
      packageName:
        baseMerge.packageName?.trim() || String((data.preferred_package_name as string) ?? ''),
    }
  }

  if (templateId === 'device_tracking_update') {
    const { data } = await supabase
      .from('registered_devices')
      .select('device_name, imei_number, admin_status')
      .eq('user_email', recipientEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!data) return baseMerge
    const imei = String((data.imei_number as string) ?? '')
    const imeiLast4 = imei ? imei.slice(-4) : ''
    return {
      ...baseMerge,
      deviceName: baseMerge.deviceName?.trim() || String((data.device_name as string) ?? ''),
      imeiLast4: baseMerge.imeiLast4?.trim() || imeiLast4,
      statusMessage:
        baseMerge.statusMessage?.trim() ||
        `Current tracking status: ${String((data.admin_status as string) ?? 'pending')}.`,
    }
  }

  if (templateId === 'loan_application_update') {
    const { data } = await supabase
      .from('loans')
      .select('applicant_name, status, id')
      .eq('email', recipientEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!data) return baseMerge
    return {
      ...baseMerge,
      customerName: baseMerge.customerName?.trim() || String((data.applicant_name as string) ?? ''),
      reference: baseMerge.reference?.trim() || String((data.id as string) ?? ''),
      statusMessage:
        baseMerge.statusMessage?.trim() ||
        `Your application status is currently: ${String((data.status as string) ?? 'pending')}.`,
    }
  }

  return baseMerge
}

export async function POST(request: NextRequest) {
  try {
    const gate = await ensureAdmin(request)
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'RESEND_API_KEY is not configured. Add it in .env.local (Resend dashboard → API Keys).',
        },
        { status: 503 }
      )
    }

    const from =
      process.env.RESEND_FROM?.trim() ||
      'Purpose Technology <admin@purposetech.online>'

    const body = await request.json()
    const requestedSendMode = body.sendMode as SendMode | undefined
    const rawTo = body.to

    let toList: string[] = []
    if (Array.isArray(rawTo)) {
      toList = rawTo.filter((x) => typeof x === 'string').map((e) => e.trim().toLowerCase())
    } else if (typeof rawTo === 'string') {
      toList = rawTo
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    }

    toList = [...new Set(toList)].filter((e) => EMAIL_RE.test(e))
    if (toList.length === 0) {
      return NextResponse.json({ error: 'Provide at least one valid email in "to"' }, { status: 400 })
    }
    if (toList.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_RECIPIENTS} recipients per send. Split into multiple batches.` },
        { status: 400 }
      )
    }

    const resend = new Resend(apiKey)
    const results: { email: string; ok: boolean; id?: string; error?: string }[] = []

    /* ── Custom / free-form notice ─────────────────────────── */
    if (requestedSendMode === 'custom_notice') {
      const subject = typeof body.subject === 'string' && body.subject.trim()
        ? body.subject.trim() : 'Notice from Purpose Technology'
      const bodyText = typeof body.bodyText === 'string' ? body.bodyText.trim() : ''
      if (!bodyText) {
        return NextResponse.json({ error: 'bodyText is required for custom_notice' }, { status: 400 })
      }
      const html = buildCustomHtml(subject, bodyText, body.ctaLabel, body.ctaHref)

      for (const to of toList) {
        try {
          const { data, error } = await resend.emails.send({
            from, to: [to], subject, html, replyTo: 'admin@purposetech.online',
          })
          if (error) results.push({ email: to, ok: false, error: error.message })
          else results.push({ email: to, ok: true, id: data?.id })
        } catch (e) {
          results.push({ email: to, ok: false, error: e instanceof Error ? e.message : 'Send failed' })
        }
      }

      const okCount = results.filter((r) => r.ok).length
      return NextResponse.json({ sent: okCount, failed: results.length - okCount, results })
    }

    /* ── Template-based send (individual or bulk_notice) ───── */
    const templateId = body.templateId as TemplateId
    const merge = (body.merge ?? {}) as EmailMergeFields
    const subjectOverride =
      typeof body.subject === 'string' && body.subject.trim().length > 0
        ? body.subject.trim()
        : null

    if (!(TEMPLATE_IDS as readonly string[]).includes(templateId)) {
      return NextResponse.json({ error: 'Invalid templateId' }, { status: 400 })
    }

    const sendMode: SendMode =
      requestedSendMode ?? (toList.length === 1 ? 'individual' : 'bulk_notice')

    if (sendMode === 'individual' && toList.length !== 1) {
      return NextResponse.json(
        { error: 'Individual mode requires exactly one recipient.' },
        { status: 400 }
      )
    }

    for (const to of toList) {
      try {
        const personalizedMerge =
          sendMode === 'individual'
            ? await enrichMergeByTemplate(gate.supabase, templateId, to, merge)
            : merge

        // For newsletter emails, attach a per-recipient unsubscribe link.
        let unsubscribeUrl: string | undefined
        if (templateId === 'newsletter_product_update') {
          const { data: uRow } = await gate.supabase
            .from('users')
            .select('unsubscribe_token')
            .eq('email', to)
            .maybeSingle()
          if (uRow?.unsubscribe_token) {
            const baseUrl =
              process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://purposetech.online'
            unsubscribeUrl = `${baseUrl}/unsubscribe?token=${uRow.unsubscribe_token}`
          }
        }

        const { subject: defaultSubject, html } = renderEmail(templateId, personalizedMerge, {
          unsubscribeUrl,
        })
        const subject = subjectOverride || defaultSubject

        const { data, error } = await resend.emails.send({
          from,
          to: [to],
          subject,
          html,
          replyTo: 'admin@purposetech.online',
        })
        if (error) {
          results.push({ email: to, ok: false, error: error.message })
        } else {
          results.push({ email: to, ok: true, id: data?.id })
        }
      } catch (e) {
        results.push({
          email: to,
          ok: false,
          error: e instanceof Error ? e.message : 'Send failed',
        })
      }
    }

    const okCount = results.filter((r) => r.ok).length
    return NextResponse.json({
      sent: okCount,
      failed: results.length - okCount,
      results,
    })
  } catch (err) {
    console.error('Admin email send error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
