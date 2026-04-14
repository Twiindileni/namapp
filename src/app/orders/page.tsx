'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

interface Booking {
    id: string
    created_at: string
    event_type: string
    event_date: string
    preferred_package_name: string | null
    status: string
    event_location: string
}

interface Order {
    id: string
    created_at: string
    product_name: string
    total_amount: number
    status: string
    order_date: string
}

export default function MyOrdersPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [bookings, setBookings] = useState<Booking[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            router.push('/login')
            return
        }

        const fetchData = async () => {
            try {
                setLoading(true)

                // Fetch Photography Bookings
                const { data: bookingsData } = await supabase
                    .from('photography_bookings')
                    .select('*')
                    .eq('customer_email', user.email)
                    .order('created_at', { ascending: false })

                // Fetch Product Orders
                // Note: We try to match by user_email if it exists, or loosely by phone/name if we could, 
                // but for now let's rely on the strategy that we will start saving user_email 
                // or effectively assume orders table might have it. 
                // If the table doesn't have user_email, this might fail or return nothing.
                // We will try to select assuming user_email might be there or we can't show old orders.
                // Actually, let's try to query 'orders' table.
                // If it fails, it will catch error.

                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('user_email', user.email) // We will try to add this column or use it if exists
                    .order('created_at', { ascending: false })

                if (bookingsData) setBookings(bookingsData)
                if (ordersData) setOrders(ordersData)

            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user])

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'confirmed': return 'bg-blue-100 text-blue-800'
            case 'completed': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            case 'delivered': return 'bg-green-100 text-green-800'
            case 'processing': return 'bg-indigo-100 text-indigo-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders & Bookings</h1>

                    <div className="space-y-12">
                        {/* Photography Bookings Section */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Photography Bookings
                            </h2>

                            {bookings.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
                                    <p className="text-gray-500 mb-4">You haven't booked any photoshoots yet.</p>
                                    <Link href="/categories" className="text-indigo-600 font-medium hover:underline">
                                        Browse Photography Packages &rarr;
                                    </Link>
                                </div>
                            ) : (
                                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                        {bookings.map((booking) => (
                                            <li key={booking.id}>
                                                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <p className="text-lg font-medium text-indigo-600 truncate">
                                                                {booking.event_type}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {booking.preferred_package_name || 'Custom Package'}
                                                            </p>
                                                        </div>
                                                        <div className="ml-2 flex-shrink-0 flex">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                                                {booking.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 sm:flex sm:justify-between">
                                                        <div className="sm:flex">
                                                            <p className="flex items-center text-sm text-gray-500 mr-6">
                                                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                {new Date(booking.event_date).toLocaleDateString()}
                                                            </p>
                                                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                {booking.event_location || 'TBD'}
                                                            </p>
                                                        </div>
                                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                            Booked on {new Date(booking.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>

                        {/* Product Orders Section */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                Product Orders
                            </h2>

                            {orders.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
                                    <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                                    <Link href="/products" className="text-indigo-600 font-medium hover:underline">
                                        Browse Products &rarr;
                                    </Link>
                                </div>
                            ) : (
                                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                        {orders.map((order) => (
                                            <li key={order.id}>
                                                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <p className="text-lg font-medium text-indigo-600 truncate">
                                                                {order.product_name}
                                                            </p>
                                                            <p className="text-sm text-gray-900 font-semibold">
                                                                N$ {order.total_amount?.toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <div className="ml-2 flex-shrink-0 flex">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                                {order.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 sm:flex sm:justify-between">
                                                        <div className="sm:flex">
                                                            <p className="flex items-center text-sm text-gray-500">
                                                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                Ordered on {new Date(order.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                            Requested Date: {new Date(order.order_date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
