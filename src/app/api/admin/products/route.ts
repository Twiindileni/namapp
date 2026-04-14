/**
 * Return products for the admin newsletter product picker.
 * Admin only — returns all approved products with name, description, price and image.
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
      .from('products')
      .select('id, name, description, price_nad, image_url, status')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ products: data ?? [] })
  } catch (err) {
    console.error('Admin products error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
