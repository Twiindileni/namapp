/**
 * Look up a single customer's portal data for pre-filling Individual email merge fields.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { EmailMergeFields } from '@/lib/emails'

const HOURS_RATE_NAD = 130

async function ensureAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return { ok: false as const, status: 401, error: 'Missing Authorization header' }

  const supabase = getSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) return { ok: false as const, status: 401, error: 'Invalid or expired token' }

  const { data: userRow, error: roleError } = await supabase
    .from('users').select('role').eq('id', user.id).maybeSingle()
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

export async function GET(request: NextRequest) {
  try {
    const gate = await ensureAdmin(request)
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
    const { supabase } = gate

    const { searchParams } = request.nextUrl
    const email      = searchParams.get('email')?.trim().toLowerCase()
    const templateId = searchParams.get('templateId')

    if (!email || !templateId) {
      return NextResponse.json({ error: 'email and templateId are required' }, { status: 400 })
    }

    let found = false
    const merge: EmailMergeFields = {}

    /* ── Driving class reminder ── */
    if (templateId === 'driving_class_reminder') {
      const { data: booking } = await supabase
        .from('driving_school_bookings')
        .select('id, customer_name, status, preferred_date, driving_school_packages(name)')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (booking) {
        found = true
        const bookingId   = booking.id as string
        const packageName = ((booking.driving_school_packages as { name?: string } | null)?.name ?? '')

        const [{ data: payments }, { data: sessions }] = await Promise.all([
          supabase.from('driving_school_payments').select('amount_nad').eq('booking_id', bookingId),
          supabase.from('driving_school_sessions').select('hours').eq('booking_id', bookingId),
        ])

        const totalPaid      = (payments ?? []).reduce((s, p) => s + (Number((p as { amount_nad?: number }).amount_nad) || 0), 0)
        const hoursPurchased = totalPaid / HOURS_RATE_NAD
        const hoursUsed      = (sessions ?? []).reduce((s, r) => s + (Number((r as { hours?: number }).hours) || 0), 0)
        const hoursLeft      = Math.max(0, hoursPurchased - hoursUsed)

        merge.customerName    = String(booking.customer_name ?? '')
        merge.packageName     = packageName
        merge.bookingStatus   = String(booking.status ?? '')
        merge.hoursPurchased  = fmtHours(hoursPurchased)
        merge.hoursUsed       = fmtHours(hoursUsed)
        merge.hoursLeft       = fmtHours(hoursLeft)
        merge.totalPaid       = fmtNad(totalPaid)
      }
    }

    /* ── Photography booking reminder ── */
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
        merge.customerName   = String(data.customer_name ?? '')
        merge.eventType      = String(data.event_type ?? '')
        merge.eventDate      = String(data.event_date ?? '')
        merge.eventLocation  = String(data.event_location ?? '')
        merge.packageName    = String(data.preferred_package_name ?? '')
        merge.bookingStatus  = String(data.status ?? '')
      }
    }

    /* ── Device tracking update ── */
    else if (templateId === 'device_tracking_update') {
      const { data } = await supabase
        .from('registered_devices')
        .select('device_name, imei_number, admin_status')
        .eq('user_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        found = true
        const imei = String(data.imei_number ?? '')
        merge.deviceName     = String(data.device_name ?? '')
        merge.imeiLast4      = imei ? imei.slice(-4) : ''
        merge.statusMessage  = `Current tracking status: ${String(data.admin_status ?? 'pending')}.`
      }
    }

    /* ── Loan application update ── */
    else if (templateId === 'loan_application_update') {
      const { data } = await supabase
        .from('loans')
        .select('applicant_name, status, id')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        found = true
        merge.customerName   = String(data.applicant_name ?? '')
        merge.reference      = String(data.id ?? '')
        merge.statusMessage  = `Your application status is currently: ${String(data.status ?? 'pending')}.`
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
