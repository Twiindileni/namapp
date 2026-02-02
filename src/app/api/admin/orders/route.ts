/**
 * Admin orders API – server-side only. Uses service role to bypass RLS.
 * Requires Authorization: Bearer <access_token> and user must have role = 'admin'.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

async function ensureAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return { ok: false as const, status: 401, error: 'Missing Authorization header' }

  const supabase = getSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) return { ok: false as const, status: 401, error: 'Invalid or expired token' }

  const { data: userRow, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (roleError || !userRow || userRow.role !== 'admin') {
    return { ok: false as const, status: 403, error: 'Admin access required' }
  }
  return { ok: true as const, supabase, userId: user.id }
}

export async function GET(request: NextRequest) {
  try {
    const result = await ensureAdmin(request)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const { supabase } = result

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Admin orders fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('Admin orders API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const result = await ensureAdmin(request)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const { supabase } = result

    const body = await request.json()
    const { id, status } = body as { id?: string; status?: string }
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    }
    const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Admin order update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Admin orders PATCH error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
