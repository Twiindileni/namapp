/**
 * Return active photography packages for newsletter highlights.
 * Admin only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

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

export async function GET(request: NextRequest) {
  try {
    const gate = await ensureAdmin(request)
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { data, error } = await gate.supabase
      .from('photography_packages')
      .select('id, name, price, duration, features, is_popular, is_active, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ packages: data ?? [] })
  } catch (err) {
    console.error('Admin photography packages error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
