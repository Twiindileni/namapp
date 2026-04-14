'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { 
  PlusIcon, 
  CpuChipIcon, 
  MapPinIcon, 
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
  CommandLineIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

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
    }
  },
  'Samsung': {
    models: {
      'Galaxy S24 Ultra': ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'],
      'Galaxy S24+': ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'],
      'Galaxy S24': ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'],
      'Galaxy S23 Ultra': ['Phantom Black', 'Green', 'Cream', 'Lavender'],
      'Galaxy Z Fold 5': ['Phantom Black', 'Cream', 'Icy Blue'],
      'Galaxy Z Flip 5': ['Mint', 'Graphite', 'Cream', 'Lavender'],
    }
  },
  'Huawei': {
    models: {
      'P60 Pro': ['Black', 'Pearl', 'Rococo Pearl'],
      'P50 Pro': ['Golden Black', 'Cocoa Gold', 'Pearl Pink'],
      'Mate 60 Pro': ['Black', 'White', 'Green', 'Purple'],
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
      toast.error('Identity Verification Required')
      router.push('/login')
      return
    }

    if (!/^\d{15}$/.test(formData.imei_number)) {
      toast.error('IMEI signature must be 15 digits')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
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

      if (error) throw error
      toast.success('Asset enrollment successful')
      router.push('/devices')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Enrollment failure')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020b1a]">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-10 fade-in-up">
           <Link href="/devices" className="p-2 glass-card hover:bg-[rgba(0,53,128,0.3)] text-[#5a9ef5] transition-all">
              <ArrowLeftIcon className="w-5 h-5" />
           </Link>
           <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#5a9ef5]">Deployment Protocol</span>
              <h1 className="text-3xl font-bold text-white mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Asset <span className="gradient-text">Enrollment</span></h1>
           </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
           
           {/* Terminal Info */}
           <div className="lg:col-span-2 space-y-6 fade-in-up fade-in-up-delay-1">
              <div className="glass-card p-6 bg-[rgba(0,53,128,0.05)] border-[rgba(0,85,204,0.1)]">
                 <div className="flex items-center gap-3 mb-4">
                    <ExclamationCircleIcon className="w-5 h-5 text-[#5a9ef5]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Hardware ID Brief</h3>
                 </div>
                 <p className="text-xs text-[#8baed4] leading-relaxed mb-6">
                    A unique 15-digit IMEI signature is required to establish a secure monitoring link.
                 </p>
                 <ul className="space-y-3 text-[10px] uppercase font-bold tracking-widest text-[#4a6a90]">
                    <li className="flex items-center gap-2">
                       <span className="text-[#5a9ef5]">»</span> Dial *#06# on hardware
                    </li>
                    <li className="flex items-center gap-2">
                       <span className="text-[#5a9ef5]">»</span> Check Settings → About
                    </li>
                    <li className="flex items-center gap-2">
                       <span className="text-[#5a9ef5]">»</span> Inspect Physical Box
                    </li>
                    <li className="flex items-center gap-2">
                       <span className="text-[#5a9ef5]">»</span> Inspect SIM Chassis
                    </li>
                 </ul>
              </div>

              <div className="glass-card p-6 bg-[rgba(26,114,240,0.02)]">
                 <div className="flex items-center gap-3 mb-4">
                    <ShieldCheckIcon className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Global Security</h3>
                 </div>
                 <p className="text-[11px] text-[#4a6a90] leading-relaxed">
                    Once enrolled, your asset signature is synchronized with the Purpose Tracking Map and Emergency Signal protocol.
                 </p>
              </div>
           </div>

           {/* Enrollment Form */}
           <div className="lg:col-span-3 fade-in-up fade-in-up-delay-2">
              <div className="glass-card p-8 md:p-10 relative overflow-hidden">
                 {/* Decorative bloom */}
                 <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-5 bg-[#0055cc] blur-[100px]" />
                 
                 <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Asset Brand</label>
                          <select name="brand" value={formData.brand} onChange={handleChange} required>
                             <option value="">Select Brand</option>
                             {Object.keys(phoneDatabase).map(brand => (
                               <option key={brand} value={brand}>{brand}</option>
                             ))}
                          </select>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Hardware Model</label>
                          <select 
                            name="model" 
                            value={formData.model} 
                            onChange={handleChange} 
                            required 
                            disabled={!formData.brand}
                            className={!formData.brand ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                             <option value="">{formData.brand ? 'Select Model' : 'Select Brand First'}</option>
                             {availableModels.map(model => (
                               <option key={model} value={model}>{model}</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Color Variant</label>
                          <select 
                            name="color" 
                            value={formData.color} 
                            onChange={handleChange} 
                            required 
                            disabled={!formData.model}
                            className={!formData.model ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                             <option value="">{formData.model ? 'Select Color' : 'Select Model First'}</option>
                             {availableColors.map(color => (
                               <option key={color} value={color}>{color}</option>
                             ))}
                          </select>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">IMEI Signature (15 digits)</label>
                          <input
                            type="text"
                            name="imei_number"
                            value={formData.imei_number}
                            onChange={handleChange}
                            placeholder="000000000000000"
                            maxLength={15}
                            required
                            className="font-mono text-sm tracking-widest"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Designation Name</label>
                       <input
                         type="text"
                         name="device_name"
                         value={formData.device_name}
                         onChange={handleChange}
                         placeholder="e.g. Primary iPhone"
                         required
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Initial Deployment Date</label>
                          <input
                            type="date"
                            name="purchase_date"
                            value={formData.purchase_date}
                            onChange={handleChange}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">S/N Signature (Optional)</label>
                          <input
                            type="text"
                            name="serial_number"
                            value={formData.serial_number}
                            onChange={handleChange}
                            placeholder="Manufacturer Serial"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Hardware Technical Notes</label>
                       <textarea
                         name="description"
                         value={formData.description}
                         onChange={handleChange}
                         rows={3}
                         placeholder="Screen status, specific marks, or software build..."
                       />
                    </div>

                    <div className="pt-6 flex gap-4">
                       <button
                         type="submit"
                         disabled={loading}
                         className="flex-1 btn-primary justify-center group"
                       >
                          <span>{loading ? 'Enrollment in Progress...' : 'Initialize Asset Enrollment'}</span>
                          <ChevronRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                       </button>
                       <button
                         type="button"
                         onClick={() => router.push('/devices')}
                         className="btn-outline !px-8"
                       >
                          Abort
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
