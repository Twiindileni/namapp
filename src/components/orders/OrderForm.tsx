'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  XMarkIcon, 
  CreditCardIcon, 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  CalendarIcon,
  ChatBubbleBottomCenterTextIcon,
  ShoppingBagIcon,
  TruckIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'

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
      const { data: { session } } = await supabase.auth.getSession()

      const baseOrderData = {
        name: formData.name,
        phone: formData.phone,
        delivery_address: formData.delivery_address,
        delivery_fee_option: formData.delivery_fee_option,
        preferred_contact: formData.preferred_contact,
        order_date: formData.order_date,
        special_request: formData.special_request || null,
        product_id: formData.product_id,
        product_name: formData.product_name,
        product_price: formData.product_price,
        total_amount: formData.total_amount,
        status: 'pending'
      }

      let { error } = await supabase
        .from('orders')
        .insert({
          ...baseOrderData,
          user_email: session?.user?.email || null
        })

      if (error) {
        const { error: retryError } = await supabase
          .from('orders')
          .insert(baseOrderData)

        if (retryError) throw retryError
      }

      toast.success('Transaction Initiated! Our team will verify shortly.')
      onClose()
      router.push(`/orders/confirmation?product=${encodeURIComponent(productName)}`)
    } catch (error: any) {
      console.error('Exception:', error)
      toast.error(error?.message || 'Transaction Failure. Please verify input data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#020b1a]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[5000]">
      <div className="glass-card !p-0 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border-[rgba(0,85,204,0.15)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] fade-in-up">
        
        {/* Terminal Header */}
        <div className="bg-gradient-to-r from-[#003580] to-[#001a40] p-6 border-b border-[rgba(0,85,204,0.1)] flex justify-between items-center relative">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#020b1a]/40 flex items-center justify-center border border-[rgba(0,85,204,0.2)]">
                 <CreditCardIcon className="w-6 h-6 text-[#5a9ef5]" />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-white uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Transaction Platform</h2>
                 <p className="text-[10px] font-bold text-[#4a6a90] uppercase tracking-[0.2em]">Secure Checkout Engine</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#4a6a90] hover:text-white">
              <XMarkIcon className="w-6 h-6" />
           </button>
        </div>

        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-8 bg-[#020b1a]/40">
           
           {/* Transaction Summary Card */}
           <div className="glass-card !bg-[rgba(0,53,128,0.05)] border-[rgba(26,114,240,0.15)] p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <ShoppingBagIcon className="w-20 h-20 text-[#1a72f0]" />
              </div>
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                 <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-2">
                       <CheckBadgeIcon className="w-4 h-4 text-[#5a9ef5]" />
                       Selected Asset
                    </h3>
                    <p className="text-lg font-bold text-[#8baed4]">{productName}</p>
                 </div>
                 <div className="text-left md:text-right space-y-1">
                    <p className="text-[10px] text-[#4a6a90] font-bold uppercase tracking-widest">Calculated Total</p>
                    <p className="text-3xl font-bold text-white tracking-tighter">
                       <span className="text-sm mr-1.5 align-top opacity-50">N$</span>
                       {formData.total_amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[#5a9ef5] font-bold uppercase tracking-widest">
                       Inc. N${deliveryFees[formData.delivery_fee_option]} Handling
                    </p>
                 </div>
              </div>
           </div>

           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Full Legal Name</label>
                     <div className="relative">
                        <input
                           type="text"
                           name="name"
                           required
                           value={formData.name}
                           onChange={handleInputChange}
                           placeholder="Enter Identification"
                        />
                     </div>
                 </div>

                 <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Contact Signal (Phone)</label>
                     <div className="relative">
                        <input
                           type="tel"
                           name="phone"
                           required
                           value={formData.phone}
                           onChange={handleInputChange}
                           placeholder="+264..."
                        />
                        <PhoneIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6a90]" />
                     </div>
                 </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Deployment Destination (Address)</label>
                  <div className="relative">
                     <textarea
                        name="delivery_address"
                        required
                        rows={2}
                        value={formData.delivery_address}
                        onChange={handleInputChange}
                        placeholder="Complete logistics destination..."
                     />
                     <MapPinIcon className="absolute right-4 top-4 w-4 h-4 text-[#4a6a90]" />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Logistics Area</label>
                     <div className="relative">
                        <select
                           name="delivery_fee_option"
                           required
                           value={formData.delivery_fee_option}
                           onChange={handleInputChange}
                        >
                           <option value="windhoek">Windhoek Zone (Local)</option>
                           <option value="out_of_windhoek">Domestic (Outside Windhoek)</option>
                        </select>
                        <TruckIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6a90] pointer-events-none" />
                     </div>
                 </div>

                 <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Preferred Protocol</label>
                     <div className="relative">
                        <select
                           name="preferred_contact"
                           required
                           value={formData.preferred_contact}
                           onChange={handleInputChange}
                        >
                           <option value="phone">Direct Voice (Phone)</option>
                           <option value="email">Digital Relay (Email)</option>
                        </select>
                        <EnvelopeIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6a90] pointer-events-none" />
                     </div>
                 </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Request Deployment Date</label>
                  <div className="relative">
                     <input
                        type="date"
                        name="order_date"
                        required
                        value={formData.order_date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                     />
                     <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6a90]" />
                  </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Special Requirements / Modifiers</label>
                  <div className="relative">
                     <textarea
                        name="special_request"
                        rows={2}
                        value={formData.special_request}
                        onChange={handleInputChange}
                        placeholder="Additional configuration instructions..."
                     />
                     <ChatBubbleBottomCenterTextIcon className="absolute right-4 top-4 w-4 h-4 text-[#4a6a90]" />
                  </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                 <button
                   type="submit"
                   disabled={loading}
                   className="flex-1 btn-primary !py-4 justify-center"
                 >
                    {loading ? 'Processing Transaction...' : 'Authorize Transaction'}
                 </button>
                 <button
                   type="button"
                   onClick={onClose}
                   className="btn-outline !py-4 !px-8 justify-center"
                 >
                    Abort
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  )
}