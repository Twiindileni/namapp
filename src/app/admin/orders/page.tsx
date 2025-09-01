'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface Order {
  id: string
  name: string
  phone: string
  delivery_address: string
  delivery_fee_option: 'windhoek' | 'out_of_windhoek'
  preferred_contact: 'phone' | 'email'
  order_date: string
  special_request: string | null
  product_id: string
  product_name: string
  product_price: number
  total_amount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  created_at: string
  updated_at: string
}

export default function AdminOrdersPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'>('all')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching orders:', error)
          toast.error('Failed to load orders')
          return
        }

        setOrders(data || [])
      } catch (error) {
        console.error('Error fetching orders:', error)
        toast.error('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    if (authLoading) return
    if (userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      setLoading(false)
      return
    }

    fetchOrders()
  }, [userRole, authLoading])

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) {
        console.error('Error updating order:', error)
        toast.error('Failed to update order status')
        return
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ))

      toast.success(`Order status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order status')
    }
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDeliveryFee = (option: string) => {
    return option === 'windhoek' ? 'N$40.00' : 'N$70.00'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Order Management
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage and track all product orders
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: 'All Orders', count: orders.length },
                  { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
                  { key: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
                  { key: 'shipped', label: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
                  { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
                  { key: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      filter === tab.key
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders found.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <li key={order.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              Order #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-gray-900 font-semibold">
                              {order.product_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              N$ {order.total_amount.toFixed(2)}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Customer:</strong> {order.name}</p>
                            <p><strong>Phone:</strong> {order.phone}</p>
                            <p><strong>Contact:</strong> {order.preferred_contact}</p>
                          </div>
                          <div>
                            <p><strong>Delivery:</strong> {order.delivery_fee_option === 'windhoek' ? 'Windhoek' : 'Out of Windhoek'}</p>
                            <p><strong>Fee:</strong> {getDeliveryFee(order.delivery_fee_option)}</p>
                            <p><strong>Date:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p><strong>Address:</strong> {order.delivery_address}</p>
                            {order.special_request && (
                              <p><strong>Special Request:</strong> {order.special_request}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-400">
                          <p>Ordered: {new Date(order.created_at).toLocaleString()}</p>
                          {order.updated_at !== order.created_at && (
                            <p>Updated: {new Date(order.updated_at).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Update Buttons */}
                      <div className="ml-4 flex flex-col space-y-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                            className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
                          >
                            Mark Shipped
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}