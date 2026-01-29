'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'

// Phone brands with their models and colors
const phoneDatabase = {
  'Apple': {
    models: {
      'iPhone 15 Pro Max': ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
      'iPhone 15 Pro': ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
      'iPhone 15 Plus': ['Black', 'Blue', 'Green', 'Yellow', 'Pink'],
      'iPhone 15': ['Black', 'Blue', 'Green', 'Yellow', 'Pink'],
      'iPhone 14 Pro Max': ['Deep Purple', 'Gold', 'Silver', 'Space Black'],
      'iPhone 14 Pro': ['Deep Purple', 'Gold', 'Silver', 'Space Black'],
      'iPhone 14 Plus': ['Midnight', 'Purple', 'Starlight', 'Blue', 'Red'],
      'iPhone 14': ['Midnight', 'Purple', 'Starlight', 'Blue', 'Red'],
      'iPhone 13 Pro Max': ['Graphite', 'Gold', 'Silver', 'Sierra Blue', 'Alpine Green'],
      'iPhone 13 Pro': ['Graphite', 'Gold', 'Silver', 'Sierra Blue', 'Alpine Green'],
      'iPhone 13': ['Midnight', 'Starlight', 'Blue', 'Pink', 'Green', 'Red'],
      'iPhone 12 Pro Max': ['Graphite', 'Silver', 'Gold', 'Pacific Blue'],
      'iPhone 12 Pro': ['Graphite', 'Silver', 'Gold', 'Pacific Blue'],
      'iPhone 12': ['Black', 'White', 'Blue', 'Green', 'Red', 'Purple'],
      'iPhone 11 Pro Max': ['Space Grey', 'Silver', 'Gold', 'Midnight Green'],
      'iPhone 11 Pro': ['Space Grey', 'Silver', 'Gold', 'Midnight Green'],
      'iPhone 11': ['Black', 'White', 'Yellow', 'Green', 'Purple', 'Red'],
    }
  },
  'Samsung': {
    models: {
      'Galaxy S24 Ultra': ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'],
      'Galaxy S24+': ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'],
      'Galaxy S24': ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'],
      'Galaxy S23 Ultra': ['Phantom Black', 'Green', 'Cream', 'Lavender'],
      'Galaxy S23+': ['Phantom Black', 'Cream', 'Green', 'Lavender'],
      'Galaxy S23': ['Phantom Black', 'Cream', 'Green', 'Lavender'],
      'Galaxy S22 Ultra': ['Phantom Black', 'Phantom White', 'Green', 'Burgundy'],
      'Galaxy S22+': ['Phantom Black', 'Phantom White', 'Pink Gold', 'Green'],
      'Galaxy S22': ['Phantom Black', 'Phantom White', 'Pink Gold', 'Green'],
      'Galaxy A54': ['Awesome Black', 'Awesome Violet', 'Awesome Lime', 'Awesome White'],
      'Galaxy A34': ['Awesome Black', 'Awesome Violet', 'Awesome Lime', 'Awesome Silver'],
      'Galaxy A14': ['Black', 'Silver', 'Green', 'Red'],
      'Galaxy Z Fold 5': ['Phantom Black', 'Cream', 'Icy Blue'],
      'Galaxy Z Flip 5': ['Mint', 'Graphite', 'Cream', 'Lavender'],
    }
  },
  'Huawei': {
    models: {
      'P60 Pro': ['Black', 'Pearl', 'Rococo Pearl'],
      'P50 Pro': ['Golden Black', 'Cocoa Gold', 'Pearl Pink', 'Premium Edition'],
      'Mate 60 Pro': ['Black', 'White', 'Green', 'Purple'],
      'Mate 50 Pro': ['Black', 'Silver', 'Orange', 'Purple'],
      'Nova 11 Pro': ['Black', 'White', 'Green', 'Gold'],
      'Nova 11': ['Black', 'White', 'Green'],
    }
  },
  'Xiaomi': {
    models: {
      'Xiaomi 14 Pro': ['Black', 'White', 'Titanium'],
      'Xiaomi 14': ['Black', 'White', 'Green'],
      'Xiaomi 13 Pro': ['Black', 'White', 'Flora Green'],
      'Xiaomi 13': ['Black', 'White', 'Blue', 'Pink'],
      'Redmi Note 13 Pro': ['Midnight Black', 'Ocean Teal', 'Prism Gold'],
      'Redmi Note 13': ['Midnight Black', 'Ice Blue', 'Mint Green'],
      'Redmi Note 12 Pro': ['Graphite Gray', 'Glacier Blue', 'Pearl White'],
      'Redmi Note 12': ['Onyx Gray', 'Ice Blue', 'Mint Green'],
    }
  },
  'Oppo': {
    models: {
      'Find X6 Pro': ['Black', 'Gold', 'Blue'],
      'Find X5 Pro': ['Black', 'White', 'Ceramic Blue'],
      'Reno 11 Pro': ['Rock Gray', 'Coral Purple'],
      'Reno 11': ['Rock Gray', 'Wave Green'],
      'Reno 10 Pro': ['Silvery Grey', 'Glossy Purple'],
      'Reno 10': ['Silvery Grey', 'Ice Blue'],
      'A98': ['Cool Black', 'Dreamy Blue'],
      'A78': ['Glowing Black', 'Glowing Blue'],
    }
  },
  'Tecno': {
    models: {
      'Phantom X2 Pro': ['Stardust Grey', 'Mars Orange'],
      'Phantom X2': ['Stardust Grey', 'Moonlight Silver'],
      'Camon 20 Pro': ['Serenity Blue', 'Dark Welkin'],
      'Camon 20': ['Serenity Blue', 'Predawn Black'],
      'Spark 10 Pro': ['Meta Black', 'Meta Blue', 'Pearl White'],
      'Spark 10': ['Meta Black', 'Meta Blue'],
    }
  },
  'Infinix': {
    models: {
      'Zero 30 5G': ['Rome Green', 'Golden Hour', 'Knight Black'],
      'Note 30 Pro': ['Magic Black', 'Variable Gold', 'Obsidian Black'],
      'Note 30': ['Magic Black', 'Interstellar Blue', 'Variable Gold'],
      'Hot 30': ['Knight Black', 'Aurora Blue', 'Palm Green'],
    }
  },
  'Other': {
    models: {
      'Custom Device': ['Custom Color']
    }
  }
}

export default function RegisterDevicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    device_name: '',
    imei_number: '',
    brand: '',
    model: '',
    color: '',
    purchase_date: '',
    serial_number: '',
    description: ''
  })
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [availableColors, setAvailableColors] = useState<string[]>([])

  // Update available models when brand changes
  useEffect(() => {
    if (formData.brand && phoneDatabase[formData.brand as keyof typeof phoneDatabase]) {
      const models = Object.keys(phoneDatabase[formData.brand as keyof typeof phoneDatabase].models)
      setAvailableModels(models)
      setFormData(prev => ({ ...prev, model: '', color: '' }))
      setAvailableColors([])
    } else {
      setAvailableModels([])
      setAvailableColors([])
    }
  }, [formData.brand])

  // Update available colors when model changes
  useEffect(() => {
    if (formData.brand && formData.model && phoneDatabase[formData.brand as keyof typeof phoneDatabase]) {
      const brandData = phoneDatabase[formData.brand as keyof typeof phoneDatabase]
      const colors = brandData.models[formData.model as keyof typeof brandData.models] || []
      setAvailableColors(colors)
      setFormData(prev => ({ ...prev, color: '' }))
    } else {
      setAvailableColors([])
    }
  }, [formData.model])

  // Auto-populate device name when brand and model are selected
  useEffect(() => {
    if (formData.brand && formData.model && formData.brand !== 'Other') {
      setFormData(prev => ({
        ...prev,
        device_name: `${formData.brand} ${formData.model}`
      }))
    }
  }, [formData.brand, formData.model])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please login to register a device')
      router.push('/login')
      return
    }

    if (!formData.brand || !formData.model || !formData.color || !formData.imei_number || !formData.device_name) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate IMEI (15 digits)
    if (!/^\d{15}$/.test(formData.imei_number)) {
      toast.error('IMEI must be 15 digits')
      return
    }

    setLoading(true)

    // Debug: Check authentication
    const { data: sessionData } = await supabase.auth.getSession()
    console.log('Session:', sessionData.session)
    console.log('Current user:', user)
    console.log('User email:', user.email)
    console.log('Form data:', formData)

    if (!sessionData.session) {
      toast.error('Not authenticated. Please log in again.')
      router.push('/login')
      return
    }

    try {
      const { data, error } = await supabase
        .from('registered_devices')
        .insert([{
          user_email: user.email,
          device_name: formData.device_name,
          imei_number: formData.imei_number,
          brand: formData.brand || null,
          model: formData.model || null,
          color: formData.color || null,
          purchase_date: formData.purchase_date || null,
          serial_number: formData.serial_number || null,
          description: formData.description || null,
          status: 'active'
        }])

      if (error) {
        console.error('Supabase error details:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        throw error
      }

      toast.success('Device registered successfully!')
      router.push('/devices')
    } catch (error: any) {
      console.error('Error registering device:', error)
      toast.error(error?.message || 'Failed to register device. Please check console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Register Your Device</h1>
            <p className="text-gray-600 mt-2">
              Register your phone's IMEI number for tracking and recovery assistance
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📱 How to find your IMEI:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Dial *#06# on your phone</li>
              <li>• Check Settings → About Phone → IMEI</li>
              <li>• Look on the original box or receipt</li>
              <li>• Check the SIM tray or back of device</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand <span className="text-red-500">*</span>
                </label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Brand</option>
                  {Object.keys(phoneDatabase).map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model <span className="text-red-500">*</span>
                </label>
                <select
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  disabled={!formData.brand}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.brand ? 'Select Model' : 'Select Brand First'}
                  </option>
                  {availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color <span className="text-red-500">*</span>
                </label>
                <select
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  required
                  disabled={!formData.model}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.model ? 'Select Color' : 'Select Model First'}
                  </option>
                  {availableColors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IMEI Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="imei_number"
                  value={formData.imei_number}
                  onChange={handleChange}
                  placeholder="15 digits"
                  maxLength={15}
                  pattern="\d{15}"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="device_name"
                  value={formData.device_name}
                  onChange={handleChange}
                  placeholder="Auto-filled or enter custom name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-populated from brand and model</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional details about your device..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Registering...' : 'Register Device'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/devices')}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
