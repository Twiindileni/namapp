/**
 * Lookup portal data for one customer email + template.
 * Returns the pre-filled merge fields so the UI can display them before sending.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { type TemplateId, TEMPLATE_IDS } from '@/lib/emails'

const HOURS_RATE_NAD = 130

async function ensureAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return { ok: false as const, status: 401, error: 'Missing Authorization header' }

  const supabase = getSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return { ok: false as const, status: 401, error: 'Invalid or expired token' }

  const { data: row } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
  if (!row || row.role !== 'admin') return { ok: false as const, status: 403, error: 'Admin access required' }
  return { ok: true as const, supabase }
}

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export async function GET(request: NextRequest) {
  try {
    const gate = await ensureAdmin(request)
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
    const { supabase } = gate

    const { searchParams } = request.nextUrl
    const email = (searchParams.get('email') ?? '').trim().toLowerCase()
    const templateId = searchParams.get('templateId') as TemplateId

    if (!email || !templateId) {
      return NextResponse.json({ error: 'email and templateId are required' }, { status: 400 })
    }
    if (!(TEMPLATE_IDS as readonly string[]).includes(templateId)) {
      return NextResponse.json({ error: 'Invalid templateId' }, { status: 400 })
    }

    let merge: Record<string, string> = {}
    let found = false

    // ─── Driving school ───────────────────────────────────────────────────────
    if (templateId === 'driving_class_reminder') {
      const { data: booking } = await supabase
        .from('driving_school_bookings')
        .select('id, customer_name, status, preferred_date, preferred_time, driving_school_packages(name, price_nad)')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (booking) {
        found = true
        const bookingId = booking.id as string
        const pkg = booking.driving_school_packages as { name?: string; price_nad?: number } | null

        const [{ data: payments }, { data: sessions }] = await Promise.all([
          supabase.from('driving_school_payments').select('amount_nad').eq('booking_id', bookingId),
          supabase.from('driving_school_sessions').select('hours, session_date').eq('booking_id', bookingId).order('session_date', { ascending: false }),
        ])

        const totalPaid = (payments ?? []).reduce((sum, p) => sum + (Number((p as { amount_nad?: number }).amount_nad) || 0), 0)
        const hoursPurchased = totalPaid / HOURS_RATE_NAD
        const hoursUsed = (sessions ?? []).reduce((sum, s) => sum + (Number((s as { hours?: number }).hours) || 0), 0)
        const hoursLeft = Math.max(0, hoursPurchased - hoursUsed)
        const lastSession = (sessions ?? [])[0] as { session_date?: string } | undefined
        const nextLesson = (booking.preferred_date as string | null) ?? ''
        const nextTime = (booking.preferred_time as string | null) ?? ''
        const lessonDate = nextLesson ? `${nextLesson}${nextTime ? ' at ' + nextTime : ''}` : 'Upcoming lesson'

        merge = {
          customerName: String((booking.customer_name as string) ?? ''),
          packageName: pkg?.name ?? '',
          bookingStatus: String((booking.status as string) ?? 'pending'),
          lessonDate,
          hoursPurchased: fmt(hoursPurchased),
          hoursUsed: fmt(hoursUsed),
          hoursLeft: fmt(hoursLeft),
          totalPaid: `N$ ${totalPaid.toFixed(2)}`,
          lastSessionDate: String(lastSession?.session_date ?? ''),
          instructorNote: '',
          extraMessage: '',
        }
      }
    }

    // ─── Photography booking ──────────────────────────────────────────────────
    else if (templateId === 'photography_booking_reminder') {
      const { data } = await supabase
        .from('photography_bookings')
        .select('customer_name, event_type, event_date, event_location, preferred_package_name, status')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        found = true
        merge = {
          customerName: String((data.customer_name as string) ?? ''),
          eventType: String((data.event_type as string) ?? ''),
          eventDate: String((data.event_date as string) ?? ''),
          eventLocation: String((data.event_location as string) ?? ''),
          packageName: String((data.preferred_package_name as string) ?? ''),
          extraMessage: '',
        }
      }
    }

    // ─── Device tracking ─────────────────────────────────────────────────────
    else if (templateId === 'device_tracking_update') {
      const { data } = await supabase
        .from('registered_devices')
        .select('device_name, imei_number, brand, model, admin_status')
        .eq('user_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        found = true
        const imei = String((data.imei_number as string) ?? '')
        merge = {
          customerName: '',
          deviceName: [data.brand, data.model, data.device_name].filter(Boolean).join(' '),
          imeiLast4: imei.slice(-4),
          statusMessage: `Your device tracking status is: ${String((data.admin_status as string) ?? 'pending')}.`,
          extraMessage: '',
        }
      }
    }

    // ─── Loan ────────────────────────────────────────────────────────────────
    else if (templateId === 'loan_application_update') {
      const { data } = await supabase
        .from('loans')
        .select('applicant_name, amount, status, id')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        found = true
        merge = {
          customerName: String((data.applicant_name as string) ?? ''),
          reference: String((data.id as string) ?? '').slice(0, 8).toUpperCase(),
          statusMessage: `Your loan application status is: ${String((data.status as string) ?? 'pending')}.`,
          nextStep: '',
          extraMessage: '',
        }
      }
    }

    // ─── Signal (no individual lookup — notice only) ─────────────────────────
    else if (templateId === 'signal_market_update') {
      found = true
      merge = {
        customerName: 'Trader',
        instrument: '',
        headline: 'Market update from Purpose Technology',
        summary: '',
        extraMessage: '',
      }
    }

    return NextResponse.json({ found, email, merge })
  } catch (err) {
    console.error('Email lookup error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
