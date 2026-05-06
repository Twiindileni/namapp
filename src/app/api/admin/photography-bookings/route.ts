/**
 * Admin photography bookings API – server-only. Uses service role to bypass RLS.
 * Requires Authorization: Bearer <access_token> and user must have role = 'admin'.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

const ALLOWED_STATUS = ['pending', 'confirmed', 'cancelled', 'completed'] as const

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
  return { ok: true as const, supabase }
}

export async function GET(request: NextRequest) {
  try {
    const result = await ensureAdmin(request)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const { supabase } = result

    const { data, error } = await supabase
      .from('photography_bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Admin photography bookings fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('Admin photography bookings API error:', err)
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
    const { id, status, admin_notes } = body as {
      id?: string
      status?: string
      admin_notes?: string | null
    }
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (status !== undefined) {
      if (!ALLOWED_STATUS.includes(status as (typeof ALLOWED_STATUS)[number])) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.status = status
    }
    if (admin_notes !== undefined) {
      updates.admin_notes = admin_notes
    }

    if (status === undefined && admin_notes === undefined) {
      return NextResponse.json({ error: 'status or admin_notes required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('photography_bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Admin photography booking update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Admin photography bookings PATCH error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = await ensureAdmin(request)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const { supabase } = result

    const id = new URL(request.url).searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id query parameter required' }, { status: 400 })
    }

    const { error } = await supabase.from('photography_bookings').delete().eq('id', id)

    if (error) {
      console.error('Admin photography booking delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Admin photography bookings DELETE error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
