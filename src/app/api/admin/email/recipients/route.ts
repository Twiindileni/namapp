/**
 * Suggest recipient emails from Supabase (admin only, service role).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

function collectEmails(values: (string | null | undefined)[]): string[] {
  const set = new Set<string>()
  for (const v of values) {
    const e = String(v ?? '')
      .trim()
      .toLowerCase()
    if (EMAIL_RE.test(e)) set.add(e)
  }
  return [...set].sort()
}

export async function GET(request: NextRequest) {
  try {
    const gate = await ensureAdmin(request)
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }
    const { supabase } = gate

    const segment = request.nextUrl.searchParams.get('segment') ?? ''
    const allowed = [
      'photography_bookings',
      'driving_school_bookings',
      'registered_devices',
      'loans',
      'platform_users',
      'newsletter_subscribers',
    ] as const
    if (!allowed.includes(segment as (typeof allowed)[number])) {
      return NextResponse.json(
        {
          error: 'Invalid segment',
          allowed,
        },
        { status: 400 }
      )
    }

    let emails: string[] = []
    // rich = [{name, email, meta?}] — returned when withNames=true
    const withNames = request.nextUrl.searchParams.get('withNames') === 'true'
    type RichRow = { name: string; email: string; meta?: string }
    let rich: RichRow[] = []

    if (segment === 'photography_bookings') {
      const { data, error } = await supabase
        .from('photography_bookings')
        .select('customer_name, customer_email, event_type, event_date, status')
        .order('created_at', { ascending: false })
      if (error) throw error
      const seen = new Set<string>()
      for (const r of data || []) {
        const e = String(r.customer_email ?? '').trim().toLowerCase()
        if (!EMAIL_RE.test(e) || seen.has(e)) continue
        seen.add(e)
        rich.push({ name: String(r.customer_name ?? ''), email: e, meta: `${r.event_type ?? ''} · ${r.event_date ?? ''} · ${r.status ?? ''}` })
      }
      emails = rich.map((r) => r.email)
    } else if (segment === 'driving_school_bookings') {
      const { data, error } = await supabase
        .from('driving_school_bookings')
        .select('customer_name, customer_email, customer_phone, status, preferred_date, driving_school_packages(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      const seen = new Set<string>()
      for (const r of data || []) {
        const e = String(r.customer_email ?? '').trim().toLowerCase()
        if (!EMAIL_RE.test(e) || seen.has(e)) continue
        seen.add(e)
        const pkg = (r.driving_school_packages as { name?: string } | null)?.name ?? ''
        rich.push({ name: String(r.customer_name ?? ''), email: e, meta: `${pkg ? pkg + ' · ' : ''}${r.status ?? 'pending'}${r.preferred_date ? ' · ' + r.preferred_date : ''}` })
      }
      emails = rich.map((r) => r.email)
    } else if (segment === 'registered_devices') {
      const { data, error } = await supabase.from('registered_devices').select('user_email, device_name, admin_status').order('created_at', { ascending: false })
      if (error) throw error
      const seen = new Set<string>()
      for (const r of data || []) {
        const e = String(r.user_email ?? '').trim().toLowerCase()
        if (!EMAIL_RE.test(e) || seen.has(e)) continue
        seen.add(e)
        rich.push({ name: '', email: e, meta: `${r.device_name ?? ''} · ${r.admin_status ?? ''}` })
      }
      emails = rich.map((r) => r.email)
    } else if (segment === 'loans') {
      const { data, error } = await supabase.from('loans').select('applicant_name, email, status').order('created_at', { ascending: false })
      if (error) throw error
      const seen = new Set<string>()
      for (const r of data || []) {
        const e = String(r.email ?? '').trim().toLowerCase()
        if (!EMAIL_RE.test(e) || seen.has(e)) continue
        seen.add(e)
        rich.push({ name: String(r.applicant_name ?? ''), email: e, meta: r.status ?? '' })
      }
      emails = rich.map((r) => r.email)
    } else if (segment === 'platform_users') {
      const { data, error } = await supabase.from('users').select('email, name, role').order('created_at', { ascending: false })
      if (error) throw error
      emails = collectEmails((data || []).map((r) => r.email))
      rich = (data || [])
        .filter((r) => EMAIL_RE.test(String(r.email ?? '').trim()))
        .map((r) => ({ name: String(r.name ?? ''), email: String(r.email).trim().toLowerCase(), meta: r.role ?? '' }))
    } else if (segment === 'newsletter_subscribers') {
      const { data, error } = await supabase
        .from('users')
        .select('email, name')
        .eq('newsletter_subscribed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      emails = collectEmails((data || []).map((r) => r.email))
      rich = (data || [])
        .filter((r) => EMAIL_RE.test(String(r.email ?? '').trim()))
        .map((r) => ({ name: String(r.name ?? ''), email: String(r.email).trim().toLowerCase(), meta: 'subscribed' }))
    }

    if (withNames) return NextResponse.json({ students: rich, count: rich.length })
    return NextResponse.json({ emails, count: emails.length })
  } catch (err) {
    console.error('Admin email recipients error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
