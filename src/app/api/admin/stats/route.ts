/**
 * Admin dashboard stats – server-side only. Uses service role so RLS doesn't block.
 * Returns all stats needed for the dashboard, including total order value.
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
  return { ok: true as const, supabase }
}

export async function GET(request: NextRequest) {
  try {
    const result = await ensureAdmin(request)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const { supabase } = result

    const [
      { count: usersCount, error: usersError },
      { data: appsData, error: appsError },
      { data: productsData, error: productsError },
      { data: ordersData, error: ordersError },
      { data: ratingsData, error: ratingsError },
      { count: contactsCount, error: contactsError },
      { count: newContactsCount, error: newContactsError },
      { data: drivingPackagesData, error: drivingPackagesError },
      { data: drivingBookingsData, error: drivingBookingsError },
      { data: photoBookingsData, error: photoBookingsError },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('apps').select('status, downloads'),
      supabase.from('products').select('status'),
      supabase.from('orders').select('status, total_amount'),
      supabase.from('product_ratings').select('rating'),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('driving_school_packages').select('id'),
      supabase
        .from('driving_school_bookings')
        .select('status, driving_school_packages(price_nad)'),
      supabase
        .from('photography_bookings')
        .select('status, package_id, photography_packages(price)'),
    ])

    if (usersError) console.warn('Stats users:', usersError)
    if (appsError) console.warn('Stats apps:', appsError)
    if (productsError) console.warn('Stats products:', productsError)
    if (ordersError) console.warn('Stats orders:', ordersError)
    if (ratingsError) console.warn('Stats ratings:', ratingsError)
    if (contactsError) console.warn('Stats contacts:', contactsError)
    if (newContactsError) console.warn('Stats new contacts:', newContactsError)
    if (drivingPackagesError) console.warn('Stats driving packages:', drivingPackagesError)
    if (drivingBookingsError) console.warn('Stats driving bookings:', drivingBookingsError)
    if (photoBookingsError) console.warn('Stats photography bookings:', photoBookingsError)

    const totalApps = appsData?.length ?? 0
    const pendingApps = (appsData ?? []).filter((a: { status?: string }) => a.status === 'pending').length
    const totalDownloads = (appsData ?? []).reduce((sum: number, a: { downloads?: number }) => sum + (a.downloads ?? 0), 0)

    const totalProducts = productsData?.length ?? 0
    const pendingProducts = (productsData ?? []).filter((p: { status?: string }) => p.status === 'pending').length

    const totalOrders = ordersData?.length ?? 0
    const pendingOrders = (ordersData ?? []).filter((o: { status?: string }) => o.status === 'pending').length
    const totalOrderValue = (ordersData ?? []).reduce(
      (sum: number, o: { total_amount?: number | string }) => sum + (Number(o.total_amount) || 0),
      0
    )

    const photographyBookings = photoBookingsData?.length ?? 0
    const revenuePhotography = (photoBookingsData ?? []).reduce((sum: number, b) => {
      const row = b as {
        status?: string
        photography_packages?: { price?: number | string } | { price?: number | string }[] | null
      }
      if (row.status === 'cancelled') return sum
      const pkg = row.photography_packages
      const priceRaw = Array.isArray(pkg) ? pkg[0]?.price : pkg?.price
      return sum + (Number(priceRaw) || 0)
    }, 0)

    const revenueDrivingSchool = (drivingBookingsData ?? []).reduce((sum: number, b) => {
      const row = b as {
        status?: string
        driving_school_packages?: { price_nad?: number | string } | { price_nad?: number | string }[] | null
      }
      if (row.status === 'cancelled') return sum
      const pkg = row.driving_school_packages
      const priceRaw = Array.isArray(pkg) ? pkg[0]?.price_nad : pkg?.price_nad
      return sum + (Number(priceRaw) || 0)
    }, 0)

    const totalRevenue = totalOrderValue + revenuePhotography + revenueDrivingSchool

    const totalRatings = ratingsData?.length ?? 0
    const averageRating =
      totalRatings > 0
        ? (ratingsData ?? []).reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalRatings
        : 0

    const drivingSchoolPackages = drivingPackagesData?.length ?? 0
    const drivingSchoolBookings = drivingBookingsData?.length ?? 0
    const drivingSchoolPendingBookings =
      (drivingBookingsData ?? []).filter((b: { status?: string }) => b.status === 'pending').length

    return NextResponse.json({
      totalUsers: usersCount ?? 0,
      totalApps,
      pendingApps,
      totalDownloads,
      totalProducts,
      pendingProducts,
      totalOrders,
      pendingOrders,
      totalOrderValue,
      revenuePhotography,
      revenueDrivingSchool,
      totalRevenue,
      totalRatings,
      averageRating,
      totalContacts: contactsCount ?? 0,
      newContacts: newContactsCount ?? 0,
      drivingSchoolPackages,
      drivingSchoolBookings,
      drivingSchoolPendingBookings,
      photographyBookings,
    })
  } catch (err) {
    console.error('Admin stats API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
