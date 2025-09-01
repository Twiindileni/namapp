'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface OrderFormProps {
  productId: string
  productName: string
  productPrice: number
  onClose: () => void
}

interface OrderData {
  name: string
  phone: string
  delivery_address: string
  delivery_fee_option: 'windhoek' | 'out_of_windhoek'
  preferred_contact: 'phone' | 'email'
  order_date: string
  special_request: string
  product_id: string
  product_name: string
  product_price: number
  total_amount: number
}

export default function OrderForm({ productId, productName, productPrice, onClose }: OrderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<OrderData>({
    name: '',
    phone: '',
    delivery_address: '',
    delivery_fee_option: 'windhoek',
    preferred_contact: 'phone',
    order_date: new Date().toISOString().split('T')[0],
    special_request: '',
    product_id: productId,
    product_name: productName,
    product_price: productPrice,
    total_amount: productPrice + 40
  })

  const deliveryFees = {
    windhoek: 40,
    out_of_windhoek: 70
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = { ...prev, [name]: value }
      
      // Recalculate total when delivery option changes
      if (name === 'delivery_fee_option') {
        newData.total_amount = productPrice + deliveryFees[value as keyof typeof deliveryFees]
      }
      
      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('orders')
        .insert([{
          ...formData,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Error creating order:', error)
        toast.error('Failed to submit order. Please try again.')
        return
      }

      toast.success('Order submitted successfully! We will contact you soon.')
      onClose()
      router.push(`/orders/confirmation?product=${encodeURIComponent(productName)}`)
    } catch (error) {
      console.error('Error submitting order:', error)
      toast.error('Failed to submit order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Place Order</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900">{productName}</h3>
            <p className="text-sm text-gray-600">Product Price: N$ {productPrice.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Delivery Fee: N$ {deliveryFees[formData.delivery_fee_option].toFixed(2)}</p>
            <p className="font-semibold text-lg text-indigo-600">Total: N$ {formData.total_amount.toFixed(2)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label htmlFor="delivery_address" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address *
              </label>
              <textarea
                id="delivery_address"
                name="delivery_address"
                required
                rows={3}
                value={formData.delivery_address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your complete delivery address"
              />
            </div>

            <div>
              <label htmlFor="delivery_fee_option" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Area *
              </label>
              <select
                id="delivery_fee_option"
                name="delivery_fee_option"
                required
                value={formData.delivery_fee_option}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="windhoek">Windhoek - N$40.00</option>
                <option value="out_of_windhoek">Out of Windhoek (Nampost) - N$70.00</option>
              </select>
            </div>

            <div>
              <label htmlFor="preferred_contact" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Contact Method *
              </label>
              <select
                id="preferred_contact"
                name="preferred_contact"
                required
                value={formData.preferred_contact}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="phone">Phone</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div>
              <label htmlFor="order_date" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Delivery Date *
              </label>
              <input
                type="date"
                id="order_date"
                name="order_date"
                required
                value={formData.order_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="special_request" className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests
              </label>
              <textarea
                id="special_request"
                name="special_request"
                rows={3}
                value={formData.special_request}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Any special instructions or requests..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}