'use client'

import { useState, useMemo, useEffect, useRef, type ComponentType, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import {
  TEMPLATE_IDS, TEMPLATE_META, defaultMergeForTemplate, renderEmail,
  type TemplateId, type EmailMergeFields,
} from '@/lib/emails'
import {
  EnvelopeIcon, PhotoIcon, AcademicCapIcon, DevicePhoneMobileIcon,
  ChartBarIcon, BanknotesIcon, EyeIcon, PaperAirplaneIcon,
  UserGroupIcon, MagnifyingGlassIcon, CheckCircleIcon,
  ExclamationTriangleIcon, ArrowPathIcon, XMarkIcon,
  NewspaperIcon, UserPlusIcon,
} from '@heroicons/react/24/outline'

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const h: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`
  return h
}

const SEGMENTS = [
  { value: 'photography_bookings',    label: 'Photography customers' },
  { value: 'driving_school_bookings', label: 'Driving students' },
  { value: 'registered_devices',      label: 'Device tracking users' },
  { value: 'loans',                   label: 'Loan applicants' },
  { value: 'platform_users',          label: 'All platform users' },
  { value: 'newsletter_subscribers',  label: 'Newsletter subscribers' },
] as const

const TEMPLATE_ICONS: Record<TemplateId, ComponentType<{ className?: string }>> = {
  photography_booking_reminder: PhotoIcon,
  driving_class_reminder:       AcademicCapIcon,
  device_tracking_update:       DevicePhoneMobileIcon,
  signal_market_update:         ChartBarIcon,
  loan_application_update:      BanknotesIcon,
  welcome_signup:               UserPlusIcon,
  newsletter_product_update:    NewspaperIcon,
}

function TemplateBar({
  value, onChange,
}: { value: TemplateId; onChange: (v: TemplateId) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TEMPLATE_IDS.map((id) => {
        const Icon = TEMPLATE_ICONS[id]
        const active = value === id
        return (
          <button key={id} type="button" onClick={() => onChange(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              active ? 'bg-[#1a72f0] text-white border-[#1a72f0] shadow-md shadow-[#1a72f0]/20'
                     : 'bg-white text-gray-500 border-gray-200 hover:border-[#1a72f0] hover:text-[#1a72f0]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {TEMPLATE_META[id].shortLabel}
          </button>
        )
      })}
    </div>
  )
}

function MergeFieldGrid({
  fields, merge, onChange, lockedKeys = [],
}: {
  fields: { key: string; label: string; placeholder: string }[]
  merge: EmailMergeFields
  onChange: (key: string, v: string) => void
  lockedKeys?: string[]
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((f) => {
        const locked = lockedKeys.includes(f.key)
        return (
          <div key={f.key}>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              {f.label}
              {locked && <span className="ml-1.5 text-[9px] text-emerald-600 font-black tracking-widest">AUTO-FILLED</span>}
            </label>
            <input
              type="text"
              value={merge[f.key] ?? ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className={`w-full rounded-xl border px-4 py-3 text-sm transition-all outline-none ${
                locked
                  ? 'bg-emerald-50 border-emerald-200 text-gray-800 focus:border-emerald-400'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#1a72f0]'
              }`}
            />
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Map template → segment used to load the student/customer list
───────────────────────────────────────────────────────────── */
const TEMPLATE_SEGMENT: Record<TemplateId, string> = {
  driving_class_reminder:       'driving_school_bookings',
  photography_booking_reminder: 'photography_bookings',
  device_tracking_update:       'registered_devices',
  loan_application_update:      'loans',
  signal_market_update:         'platform_users',
  welcome_signup:               'platform_users',
  newsletter_product_update:    'newsletter_subscribers',
}

type Product = {
  id: string
  name: string
  description: string | null
  price_nad: number
  image_url: string | null
  status: string
}

type PhotographyPackage = {
  id: string
  name: string
  price: number
  duration: string
  features: string[]
  is_popular: boolean
  is_active: boolean
  display_order: number
}

type RichStudent = { name: string; email: string; meta?: string }

/* ─────────────────────────────────────────────────────────────
   INDIVIDUAL PANEL — pick from dropdown, auto-lookup portal data
───────────────────────────────────────────────────────────── */
function IndividualPanel({ templateId }: { templateId: TemplateId }) {
  const meta   = TEMPLATE_META[templateId]
  const fields = meta.fields

  const isNewsletter = templateId === 'newsletter_product_update'

  // student picker
  const [students,     setStudents]     = useState<RichStudent[]>([])
  const [loadingList,  setLoadingList]  = useState(false)
  const [search,       setSearch]       = useState('')
  const [dropOpen,     setDropOpen]     = useState(false)

  // selected customer
  const [selected,    setSelected]    = useState<RichStudent | null>(null)
  const [email,       setEmail]       = useState('')

  // product picker (newsletter only)
  const [products,        setProducts]        = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [productSearch,   setProductSearch]   = useState('')
  const [productDropOpen, setProductDropOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const productDropRef = useRef<HTMLDivElement>(null)

  // compose
  const [merge,       setMerge]       = useState<EmailMergeFields>(() => defaultMergeForTemplate(templateId))
  const [subject,     setSubject]     = useState(meta.defaultSubject)
  const [lockedKeys,  setLockedKeys]  = useState<string[]>([])
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle')
  const [showPreview, setShowPreview] = useState(false)
  const [sending,     setSending]     = useState(false)

  // reset + fetch lists whenever template changes
  useEffect(() => {
    setMerge(defaultMergeForTemplate(templateId))
    setSubject(TEMPLATE_META[templateId].defaultSubject)
    setLockedKeys([])
    setLookupState('idle')
    setShowPreview(false)
    setSelected(null)
    setEmail('')
    setSearch('')
    setSelectedProduct(null)
    setProductSearch('')

    const fetchStudents = async () => {
      setLoadingList(true)
      try {
        const headers = await getAuthHeaders()
        const seg = TEMPLATE_SEGMENT[templateId]
        const res  = await fetch(
          `/api/admin/email/recipients?segment=${encodeURIComponent(seg)}&withNames=true`,
          { headers }
        )
        const data = await res.json()
        if (res.ok) setStudents(data.students ?? [])
        else toast.error(data?.error ?? 'Could not load list')
      } catch { toast.error('Failed to load customer list') }
      finally { setLoadingList(false) }
    }
    fetchStudents()

    // For newsletter: also load all products
    if (templateId === 'newsletter_product_update') {
      const fetchProducts = async () => {
        setLoadingProducts(true)
        try {
          const headers = await getAuthHeaders()
          const res  = await fetch('/api/admin/products', { headers })
          const data = await res.json()
          if (res.ok) setProducts(data.products ?? [])
          else toast.error(data?.error ?? 'Could not load products')
        } catch { toast.error('Failed to load products') }
        finally { setLoadingProducts(false) }
      }
      fetchProducts()
    }
  }, [templateId])

  // Close product dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (productDropRef.current && !productDropRef.current.contains(e.target as Node))
        setProductDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const dropRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.meta ?? '').toLowerCase().includes(q)
    )
  }, [students, search])

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
    )
  }, [products, productSearch])

  const selectProduct = (p: Product) => {
    setSelectedProduct(p)
    setProductSearch(p.name)
    setProductDropOpen(false)
    // Auto-fill product merge fields
    setMerge((prev) => ({
      ...prev,
      featuredProductName:  p.name,
      featuredProductDesc:  p.description ?? '',
      featuredProductPrice: p.price_nad ? `N$ ${Number(p.price_nad).toLocaleString('en-NA', { minimumFractionDigits: 2 })}` : '',
      featuredProductImage: p.image_url ?? '',
    }))
    setLockedKeys((prev) => [
      ...new Set([...prev, 'featuredProductName', 'featuredProductDesc', 'featuredProductPrice', 'featuredProductImage']),
    ])
    toast.success(`"${p.name}" loaded into template ✓`)
  }

  const preview = useMemo(() => renderEmail(templateId, merge), [templateId, merge])

  const runLookup = async (targetEmail: string) => {
    const trimmed = targetEmail.trim().toLowerCase()
    if (!trimmed) return
    setLookupState('loading')
    try {
      const headers = await getAuthHeaders()
      const res  = await fetch(
        `/api/admin/email/lookup?email=${encodeURIComponent(trimmed)}&templateId=${encodeURIComponent(templateId)}`,
        { headers }
      )
      const data = await res.json()
      if (!res.ok) { toast.error(data?.error ?? 'Lookup failed'); setLookupState('idle'); return }

      if (data.found && data.merge) {
        const pulled = data.merge as EmailMergeFields
        const locked = Object.keys(pulled).filter((k) => (pulled[k] ?? '').trim() !== '')
        setMerge((prev) => ({ ...prev, ...pulled }))
        setLockedKeys(locked)
        setLookupState('found')
        toast.success('Portal data loaded ✓')
      } else {
        setLookupState('not_found')
        toast('No portal record found — fill fields manually.', { icon: '⚠️' })
      }
    } catch (e) {
      console.error(e); toast.error('Lookup error'); setLookupState('idle')
    }
  }

  const selectStudent = (s: RichStudent) => {
    setSelected(s)
    setEmail(s.email)
    setSearch(s.name || s.email)
    setDropOpen(false)
    setMerge(defaultMergeForTemplate(templateId))
    setLockedKeys([])
    runLookup(s.email)
  }

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { toast.error('Select a customer first.'); return }
    setSending(true)
    try {
      const headers = await getAuthHeaders()
      const res  = await fetch('/api/admin/email/send', {
        method: 'POST', headers,
        body: JSON.stringify({ templateId, merge, to: trimmed, sendMode: 'individual', subject: subject.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data?.error ?? 'Send failed'); return }
      toast.success(`Email sent to ${trimmed} ✓`)
      setSelected(null); setEmail(''); setSearch('')
      setMerge(defaultMergeForTemplate(templateId)); setLockedKeys([]); setLookupState('idle')
    } catch (e) {
      console.error(e); toast.error('Send failed')
    } finally { setSending(false) }
  }

  return (
    <div className="space-y-8">
      {/* Step 1 — Customer picker */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="h-1 rounded-t-2xl bg-gradient-to-r from-[#003580] via-[#1a72f0] to-[#009543]" />
        <div className="p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Step 1 — Choose customer</p>
          <p className="text-xs text-gray-400 mb-4">
            {loadingList
              ? 'Loading customers…'
              : `${students.length} customer${students.length !== 1 ? 's' : ''} found — type to filter`}
          </p>

          {/* Searchable dropdown */}
          <div className="relative" ref={dropRef}>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setDropOpen(true) }}
                  onFocus={() => setDropOpen(true)}
                  placeholder={loadingList ? 'Loading…' : 'Search by name or email…'}
                  disabled={loadingList}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:border-[#1a72f0] outline-none transition-all disabled:opacity-50"
                />
                {selected && (
                  <button type="button"
                    onClick={() => { setSelected(null); setEmail(''); setSearch(''); setLookupState('idle'); setMerge(defaultMergeForTemplate(templateId)); setLockedKeys([]) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Manual lookup for typed email */}
              {!selected && email.includes('@') && (
                <button type="button" onClick={() => runLookup(email)}
                  disabled={lookupState === 'loading'}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {lookupState === 'loading' ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <MagnifyingGlassIcon className="w-4 h-4" />}
                  Look up
                </button>
              )}
            </div>

            {/* Dropdown list — show all when no search term, filtered when typing */}
            {dropOpen && !selected && filteredStudents.length > 0 && (
              <div className="absolute z-[300] mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                {filteredStudents.map((s) => (
                  <button key={s.email} type="button"
                    onClick={() => selectStudent(s)}
                    className="w-full text-left px-5 py-3.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{s.name || '(no name)'}</p>
                        <p className="text-xs text-[#1a72f0] truncate">{s.email}</p>
                      </div>
                      {s.meta && (
                        <span className="shrink-0 text-[10px] font-semibold text-gray-400 bg-gray-100 rounded-lg px-2 py-0.5 capitalize">{s.meta}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {dropOpen && !selected && search.trim() && filteredStudents.length === 0 && !loadingList && (
              <div className="absolute z-[300] mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl px-5 py-4 text-sm text-gray-500">
                No customers match &ldquo;{search}&rdquo;
              </div>
            )}
          </div>

          {/* Selected customer card */}
          {selected && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-[#1a72f0] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {(selected.name || selected.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{selected.name || selected.email}</p>
                <p className="text-xs text-gray-500">{selected.email}{selected.meta ? ` · ${selected.meta}` : ''}</p>
              </div>
              {lookupState === 'loading' && <ArrowPathIcon className="w-4 h-4 text-[#1a72f0] animate-spin ml-auto shrink-0" />}
            </div>
          )}

          {/* Status banners */}
          {lookupState === 'found' && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
              <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Portal data found and pre-filled below. You can edit any field before sending.</span>
            </div>
          )}
          {lookupState === 'not_found' && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0" />
              <span>No portal record found — fill in the fields below manually.</span>
            </div>
          )}
        </div>
      </div>

      {/* Step 1b — Product picker (newsletter only) */}
      {isNewsletter && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="h-1 rounded-t-2xl bg-gradient-to-r from-[#1a72f0] via-[#009543] to-[#003580]" />
          <div className="p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Step 1b — Choose featured product</p>
            <p className="text-xs text-gray-400 mb-4">
              {loadingProducts
                ? 'Loading products…'
                : `${products.length} approved product${products.length !== 1 ? 's' : ''} available — type to filter`}
            </p>

            <div className="relative" ref={productDropRef}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setProductDropOpen(true) }}
                  onFocus={() => setProductDropOpen(true)}
                  placeholder={loadingProducts ? 'Loading products…' : 'Search products by name or description…'}
                  disabled={loadingProducts}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:border-[#1a72f0] outline-none transition-all disabled:opacity-50"
                />
                {selectedProduct && (
                  <button type="button"
                    onClick={() => {
                      setSelectedProduct(null); setProductSearch('')
                      setMerge((prev) => ({ ...prev, featuredProductName: '', featuredProductDesc: '', featuredProductPrice: '', featuredProductImage: '' }))
                      setLockedKeys((prev) => prev.filter((k) => !['featuredProductName','featuredProductDesc','featuredProductPrice','featuredProductImage'].includes(k)))
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Product dropdown */}
              {productDropOpen && !selectedProduct && filteredProducts.length > 0 && (
                <div className="absolute z-[300] mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                  {filteredProducts.map((p) => (
                    <button key={p.id} type="button"
                      onClick={() => selectProduct(p)}
                      className="w-full text-left px-5 py-3.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        {p.image_url && (
                          <img src={p.image_url} alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                          {p.description && (
                            <p className="text-xs text-gray-400 truncate">{p.description}</p>
                          )}
                        </div>
                        {p.price_nad && (
                          <span className="shrink-0 text-sm font-bold text-[#1a72f0]">
                            N$&nbsp;{Number(p.price_nad).toLocaleString('en-NA', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {productDropOpen && !selectedProduct && productSearch.trim() && filteredProducts.length === 0 && !loadingProducts && (
                <div className="absolute z-[300] mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl px-5 py-4 text-sm text-gray-500">
                  No products match &ldquo;{productSearch}&rdquo;
                </div>
              )}
            </div>

            {/* Selected product card */}
            {selectedProduct && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                {selectedProduct.image_url && (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-emerald-100"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900">{selectedProduct.name}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedProduct.description}</p>
                </div>
                {selectedProduct.price_nad && (
                  <span className="shrink-0 text-sm font-black text-emerald-700">
                    N$&nbsp;{Number(selectedProduct.price_nad).toLocaleString('en-NA', { minimumFractionDigits: 2 })}
                  </span>
                )}
                <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2 — Compose */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            {isNewsletter ? 'Step 3 — Review & edit message' : 'Step 2 — Review & edit message'}
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Subject line</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder={meta.defaultSubject}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-[#1a72f0] outline-none"
            />
          </div>

          <MergeFieldGrid fields={fields} merge={merge} lockedKeys={lockedKeys}
            onChange={(key, v) => setMerge((prev) => ({ ...prev, [key]: v }))}
          />

          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={handleSend} disabled={sending || !email.trim()}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1a72f0] text-white font-bold text-sm shadow-lg shadow-[#1a72f0]/20 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              {sending ? 'Sending…' : `Send to ${selected?.name || email.trim() || '…'}`}
            </button>
            <button type="button" onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-[#1a72f0] hover:text-[#1a72f0] transition-colors"
            >
              <EyeIcon className="w-5 h-5" />
              {showPreview ? 'Hide preview' : 'Preview email'}
            </button>
            {lookupState !== 'idle' && (
              <button type="button"
                onClick={() => { setMerge(defaultMergeForTemplate(templateId)); setLockedKeys([]); setLookupState('idle') }}
                className="flex items-center gap-2 px-4 py-3.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:border-gray-300"
              >
                <XMarkIcon className="w-4 h-4" /> Reset fields
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">{preview.subject}</span>
          </div>
          <div className="bg-slate-100 p-6 flex justify-center">
            <iframe title="Email preview" className="w-full max-w-[600px] h-[700px] rounded-xl bg-white border shadow-inner"
              srcDoc={preview.html} sandbox="allow-same-origin" />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   NEWSLETTER PANEL — product-picker → send to all subscribers
───────────────────────────────────────────────────────────── */
function NewsletterPanel() {
  const meta   = TEMPLATE_META['newsletter_product_update']

  const [products,      setProducts]      = useState<Product[]>([])
  const [loadingProds,  setLoadingProds]  = useState(true)
  const [prodSearch,    setProdSearch]    = useState('')
  const [prodDropOpen,  setProdDropOpen]  = useState(false)
  const [selectedProd,  setSelectedProd]  = useState<Product | null>(null)
  const prodDropRef = useRef<HTMLDivElement>(null)

  const [photoPackages,      setPhotoPackages]      = useState<PhotographyPackage[]>([])
  const [loadingPhotoPkgs,   setLoadingPhotoPkgs]   = useState(true)
  const [photoPkgSearch,     setPhotoPkgSearch]     = useState('')
  const [photoPkgDropOpen,   setPhotoPkgDropOpen]   = useState(false)
  const [selectedPhotoPkg,   setSelectedPhotoPkg]   = useState<PhotographyPackage | null>(null)
  const photoPkgDropRef = useRef<HTMLDivElement>(null)

  const [merge,       setMerge]       = useState<EmailMergeFields>(() => defaultMergeForTemplate('newsletter_product_update'))
  const [subject,     setSubject]     = useState(meta.defaultSubject)
  const [showPreview, setShowPreview] = useState(false)
  const [sending,     setSending]     = useState(false)
  const [subCount,    setSubCount]    = useState<number | null>(null)

  const applyProductToMerge = (p: Product) => {
    setMerge((prev) => ({
      ...prev,
      newsletterHeadline: prev.newsletterHeadline?.trim() || 'Fresh arrivals now in store',
      introText:
        prev.introText?.trim() ||
        'We picked a featured item from our latest uploaded products just for this newsletter.',
      featuredProductName: p.name,
      featuredProductDesc: p.description ?? '',
      featuredProductPrice: `N$ ${Number(p.price_nad).toLocaleString('en-NA', { minimumFractionDigits: 2 })}`,
      featuredProductImage: p.image_url ?? '',
      extraMessage:
        prev.extraMessage?.trim() ||
        'Browse more products on Purpose Technology for the latest specials and new arrivals.',
    }))
  }

  const applyPhotoPackageToMerge = (pkg: PhotographyPackage) => {
    const topFeatures = Array.isArray(pkg.features) ? pkg.features.slice(0, 3).join(', ') : ''
    const packageDesc = [pkg.duration, topFeatures].filter(Boolean).join(' | ')

    setMerge((prev) => ({
      ...prev,
      featuredPhotographyPackageName: pkg.name,
      featuredPhotographyPackageDesc: packageDesc,
      featuredPhotographyPackagePrice: `N$ ${Number(pkg.price).toLocaleString('en-NA', { minimumFractionDigits: 2 })}`,
    }))
  }

  // Load products on mount
  useEffect(() => {
    const load = async () => {
      setLoadingProds(true)
      try {
        const headers = await getAuthHeaders()
        const res  = await fetch('/api/admin/products', { headers })
        const data = await res.json()
        if (res.ok) {
          const list = (data.products ?? []) as Product[]
          setProducts(list)
          // Auto-select newest product so newsletter is ready without manual entry.
          if (list.length > 0) {
            setSelectedProd(list[0])
            setProdSearch(list[0].name)
            applyProductToMerge(list[0])
            const more = list
              .slice(1, 4)
              .map((p) => `${p.name} (N$ ${Number(p.price_nad).toLocaleString('en-NA', { minimumFractionDigits: 2 })})`)
              .join(' • ')
            if (more) {
              setMerge((prev) => ({ ...prev, specialOffer: `Also new in store: ${more}` }))
            }
          }
        }
        else toast.error(data?.error ?? 'Could not load products')
      } catch { toast.error('Failed to load products') }
      finally { setLoadingProds(false) }
    }
    load()
  }, [])

  // Load photography packages on mount
  useEffect(() => {
    const load = async () => {
      setLoadingPhotoPkgs(true)
      try {
        const headers = await getAuthHeaders()
        const res = await fetch('/api/admin/photography-packages', { headers })
        const data = await res.json()
        if (res.ok) {
          const list = (data.packages ?? []) as PhotographyPackage[]
          setPhotoPackages(list)
          if (list.length > 0) {
            setSelectedPhotoPkg(list[0])
            setPhotoPkgSearch(list[0].name)
            applyPhotoPackageToMerge(list[0])
          }
        } else {
          toast.error(data?.error ?? 'Could not load photography packages')
        }
      } catch {
        toast.error('Failed to load photography packages')
      } finally {
        setLoadingPhotoPkgs(false)
      }
    }
    load()
  }, [])

  // Load subscriber count on mount
  useEffect(() => {
    const load = async () => {
      try {
        const headers = await getAuthHeaders()
        const res  = await fetch('/api/admin/email/recipients?segment=newsletter_subscribers', { headers })
        const data = await res.json()
        if (res.ok) setSubCount(data.count ?? 0)
      } catch { /* non-critical */ }
    }
    load()
  }, [])

  // Close product dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (prodDropRef.current && !prodDropRef.current.contains(e.target as Node)) setProdDropOpen(false)
      if (photoPkgDropRef.current && !photoPkgDropRef.current.contains(e.target as Node)) setPhotoPkgDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredProds = useMemo(() => {
    const q = prodSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    )
  }, [products, prodSearch])

  const filteredPhotoPkgs = useMemo(() => {
    const q = photoPkgSearch.trim().toLowerCase()
    if (!q) return photoPackages
    return photoPackages.filter((pkg) =>
      pkg.name.toLowerCase().includes(q) ||
      pkg.duration.toLowerCase().includes(q) ||
      (pkg.features ?? []).join(' ').toLowerCase().includes(q)
    )
  }, [photoPackages, photoPkgSearch])

  const selectProduct = (p: Product) => {
    setSelectedProd(p)
    setProdSearch(p.name)
    setProdDropOpen(false)
    applyProductToMerge(p)
  }

  const clearProduct = () => {
    setSelectedProd(null)
    setProdSearch('')
    setMerge((prev) => ({
      ...prev,
      featuredProductName:  '',
      featuredProductDesc:  '',
      featuredProductPrice: '',
      featuredProductImage: '',
    }))
  }

  const selectPhotoPackage = (pkg: PhotographyPackage) => {
    setSelectedPhotoPkg(pkg)
    setPhotoPkgSearch(pkg.name)
    setPhotoPkgDropOpen(false)
    applyPhotoPackageToMerge(pkg)
  }

  const clearPhotoPackage = () => {
    setSelectedPhotoPkg(null)
    setPhotoPkgSearch('')
    setMerge((prev) => ({
      ...prev,
      featuredPhotographyPackageName: '',
      featuredPhotographyPackageDesc: '',
      featuredPhotographyPackagePrice: '',
    }))
  }

  const preview = useMemo(() => renderEmail('newsletter_product_update', merge), [merge])

  const handleSend = async () => {
    setSending(true)
    try {
      const headers = await getAuthHeaders()
      // First load all subscriber emails
      const recipRes = await fetch('/api/admin/email/recipients?segment=newsletter_subscribers', { headers })
      const recipData = await recipRes.json()
      if (!recipRes.ok) { toast.error(recipData?.error ?? 'Could not load subscribers'); return }
      const emails: string[] = recipData.emails ?? []
      if (emails.length === 0) { toast.error('No newsletter subscribers found.'); return }

      const res = await fetch('/api/admin/email/send', {
        method: 'POST', headers,
        body: JSON.stringify({
          sendMode: 'bulk_notice',
          templateId: 'newsletter_product_update',
          to: emails,
          merge,
          subject: subject.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data?.error ?? 'Send failed'); return }
      toast.success(`Newsletter sent to ${data.sent ?? 0} subscriber${(data.sent ?? 0) !== 1 ? 's' : ''}${data.failed ? ` · ${data.failed} failed` : ''} ✓`)
      clearProduct()
      setMerge(defaultMergeForTemplate('newsletter_product_update'))
      setSubject(meta.defaultSubject)
    } catch (e) { console.error(e); toast.error('Send failed') }
    finally { setSending(false) }
  }

  // Fields the admin edits (hide featuredProductImage — it's shown as thumbnail instead)
  const editableFields = meta.fields.filter((f) => f.key !== 'featuredProductImage')

  return (
    <div className="space-y-8">

      {/* Subscriber count banner */}
      {subCount !== null && (
        <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
          <NewspaperIcon className="w-5 h-5 text-[#1a72f0] shrink-0" />
          <span>
            This newsletter will be delivered to{' '}
            <strong>{subCount} subscriber{subCount !== 1 ? 's' : ''}</strong> who opted in.
          </span>
        </div>
      )}

      {/* Step 1 — Product picker */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="h-1 rounded-t-2xl bg-gradient-to-r from-[#1a72f0] via-[#003580] to-[#1a72f0]" />
        <div className="p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Step 1 — Pick a featured product</p>
          <p className="text-xs text-gray-400 mb-4">
            {loadingProds
              ? 'Loading products…'
              : `${products.length} approved product${products.length !== 1 ? 's' : ''} — type to search`}
          </p>

          <div className="relative" ref={prodDropRef}>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={prodSearch}
                  onChange={(e) => { setProdSearch(e.target.value); setProdDropOpen(true) }}
                  onFocus={() => setProdDropOpen(true)}
                  placeholder={loadingProds ? 'Loading…' : 'Search products…'}
                  disabled={loadingProds}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:border-[#1a72f0] outline-none transition-all disabled:opacity-50"
                />
                {selectedProd && (
                  <button type="button" onClick={clearProduct} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown */}
            {prodDropOpen && !selectedProd && filteredProds.length > 0 && (
              <div className="absolute z-[300] mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                {filteredProds.map((p) => (
                  <button key={p.id} type="button"
                    onClick={() => selectProduct(p)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-4"
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center">
                        <NewspaperIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{p.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-bold text-[#059669]">
                      N$ {Number(p.price_nad).toLocaleString('en-NA', { minimumFractionDigits: 2 })}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {prodDropOpen && !selectedProd && prodSearch.trim() && filteredProds.length === 0 && !loadingProds && (
              <div className="absolute z-[300] mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl px-5 py-4 text-sm text-gray-500">
                No products match &ldquo;{prodSearch}&rdquo;
              </div>
            )}
          </div>

          {/* Selected product card */}
          {selectedProd && (
            <div className="mt-4 flex items-center gap-4 px-4 py-4 bg-blue-50 border border-blue-100 rounded-xl">
              {selectedProd.image_url ? (
                <img src={selectedProd.image_url} alt={selectedProd.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-blue-100 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-blue-100 shrink-0 flex items-center justify-center">
                  <NewspaperIcon className="w-6 h-6 text-[#1a72f0]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">{selectedProd.name}</p>
                {selectedProd.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{selectedProd.description}</p>
                )}
                <p className="text-sm font-bold text-[#059669] mt-1">
                  N$ {Number(selectedProd.price_nad).toLocaleString('en-NA', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-700">Auto-filled</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2 — Photography package picker */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="h-1 rounded-t-2xl bg-gradient-to-r from-[#7c3aed] via-[#1a72f0] to-[#7c3aed]" />
        <div className="p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Step 2 — Pick a photography package</p>
          <p className="text-xs text-gray-400 mb-4">
            {loadingPhotoPkgs
              ? 'Loading photography packages…'
              : `${photoPackages.length} active package${photoPackages.length !== 1 ? 's' : ''} available — type to search`}
          </p>

          <div className="relative" ref={photoPkgDropRef}>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={photoPkgSearch}
                onChange={(e) => { setPhotoPkgSearch(e.target.value); setPhotoPkgDropOpen(true) }}
                onFocus={() => setPhotoPkgDropOpen(true)}
                placeholder={loadingPhotoPkgs ? 'Loading photography packages…' : 'Search photography packages…'}
                disabled={loadingPhotoPkgs}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:border-[#7c3aed] outline-none transition-all disabled:opacity-50"
              />
              {selectedPhotoPkg && (
                <button type="button" onClick={clearPhotoPackage} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {photoPkgDropOpen && !selectedPhotoPkg && filteredPhotoPkgs.length > 0 && (
              <div className="absolute z-[300] mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                {filteredPhotoPkgs.map((pkg) => (
                  <button key={pkg.id} type="button"
                    onClick={() => selectPhotoPackage(pkg)}
                    className="w-full text-left px-5 py-3.5 hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{pkg.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {pkg.duration}{pkg.features?.length ? ` · ${pkg.features.slice(0, 2).join(', ')}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-[#7c3aed]">
                        N$ {Number(pkg.price).toLocaleString('en-NA', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {photoPkgDropOpen && !selectedPhotoPkg && photoPkgSearch.trim() && filteredPhotoPkgs.length === 0 && !loadingPhotoPkgs && (
              <div className="absolute z-[300] mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl px-5 py-4 text-sm text-gray-500">
                No photography packages match &ldquo;{photoPkgSearch}&rdquo;
              </div>
            )}
          </div>

          {selectedPhotoPkg && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-purple-50 border border-purple-100 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-purple-100 shrink-0 flex items-center justify-center">
                <PhotoIcon className="w-6 h-6 text-[#7c3aed]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">{selectedPhotoPkg.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {selectedPhotoPkg.duration}{selectedPhotoPkg.features?.length ? ` · ${selectedPhotoPkg.features.slice(0, 2).join(', ')}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-sm font-black text-[#7c3aed]">
                N$ {Number(selectedPhotoPkg.price).toLocaleString('en-NA', { minimumFractionDigits: 2 })}
              </span>
              <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* Step 2 — Compose */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Step 3 — Compose newsletter</p>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Subject line</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder={meta.defaultSubject}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-[#1a72f0] outline-none"
            />
          </div>

          <MergeFieldGrid
            fields={editableFields}
            merge={merge}
            lockedKeys={[
              ...(selectedProd ? ['featuredProductName', 'featuredProductDesc', 'featuredProductPrice'] : []),
              ...(selectedPhotoPkg ? ['featuredPhotographyPackageName', 'featuredPhotographyPackageDesc', 'featuredPhotographyPackagePrice'] : []),
            ]}
            onChange={(key, v) => setMerge((prev) => ({ ...prev, [key]: v }))}
          />

          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1a72f0] text-white font-bold text-sm shadow-lg shadow-[#1a72f0]/20 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              {sending
                ? 'Sending…'
                : subCount !== null
                  ? `Send to ${subCount} subscriber${subCount !== 1 ? 's' : ''}`
                  : 'Send newsletter'}
            </button>
            <button type="button" onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-[#1a72f0] hover:text-[#1a72f0] transition-colors"
            >
              <EyeIcon className="w-5 h-5" />
              {showPreview ? 'Hide preview' : 'Preview email'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">{preview.subject}</span>
          </div>
          <div className="bg-slate-100 p-6 flex justify-center">
            <iframe title="Newsletter preview"
              className="w-full max-w-[600px] h-[700px] rounded-xl bg-white border shadow-inner"
              srcDoc={preview.html} sandbox="allow-same-origin" />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   BULK NOTICE PANEL — free-form custom message to many recipients
───────────────────────────────────────────────────────────── */
function BulkPanel() {
  const [recipients,  setRecipients]  = useState('')
  const [subject,     setSubject]     = useState('')
  const [bodyText,    setBodyText]    = useState('')
  const [ctaLabel,    setCtaLabel]    = useState('')
  const [ctaHref,     setCtaHref]     = useState('')
  const [loadingList, setLoadingList] = useState(false)
  const [sending,     setSending]     = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Build a live preview HTML using the same logic as the API
  const previewHtml = useMemo(() => {
    if (!bodyText.trim()) return ''
    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    const subj = esc(subject.trim() || 'Notice from Purpose Technology')
    const paragraphs = bodyText
      .split(/\n{2,}/)
      .map((block) => `<p style="margin:0 0 16px 0;">${esc(block.trim()).replace(/\n/g,'<br />')}</p>`)
      .join('\n')

    const ctaBlock = ctaLabel.trim() && ctaHref.trim()
      ? `<tr><td class="email-cta-wrap" style="padding:32px 40px 0;text-align:center;">
           <a class="email-cta" href="${esc(ctaHref.trim())}" target="_blank"
             style="display:inline-block;padding:18px 40px;background-color:#1a72f0;color:#fff;font-family:'Inter',-apple-system,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:14px;text-transform:uppercase;letter-spacing:0.08em;">
             ${esc(ctaLabel.trim())}
           </a>
         </td></tr>`
      : ''

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light">
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:0;background:#eff3f8;-webkit-text-size-adjust:100%}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
  .email-card{max-width:600px;width:100%;background:#fff;border-radius:32px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.06)}
  .email-header{background:linear-gradient(135deg,#020b1a 0%,#003580 100%);padding:48px 40px;text-align:center}
  .email-headline{margin:0;font-family:'Inter',-apple-system,sans-serif;font-size:28px;font-weight:700;color:#fff;line-height:1.25}
  .email-body{padding:48px 40px 0;font-family:'Inter',-apple-system,sans-serif;font-size:15px;line-height:1.7;color:#1f2937}
  .email-cta-wrap{padding:32px 40px 0;text-align:center}
  .email-cta{display:inline-block;padding:18px 40px;background:#1a72f0;color:#fff;font-family:'Inter',-apple-system,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:14px;text-transform:uppercase;letter-spacing:0.08em}
  .email-footer{padding:36px 40px;border-top:1px solid #f3f4f6;font-family:'Inter',-apple-system,sans-serif}
  @media only screen and (max-width:620px){
    .email-card{border-radius:20px!important}
    .email-header{padding:32px 20px!important}
    .email-headline{font-size:22px!important}
    .email-body{padding:28px 20px 0!important;font-size:15px!important}
    .email-cta-wrap{padding:20px 20px 0!important}
    .email-cta{display:block!important;width:100%!important;text-align:center!important;padding:16px!important}
    .email-footer{padding:24px 20px!important}
  }
  @media(prefers-color-scheme:dark){
    body{background:#0d1117!important}
    .email-card{background:#161b22!important}
    .email-body{color:#c9d1d9!important}
    .email-footer{border-top-color:#30363d!important;color:#8b949e!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#eff3f8;">
<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eff3f8;padding:32px 16px;">
  <tr><td align="center">
    <table cellspacing="0" cellpadding="0" border="0" class="email-card">
      <tr>
        <td class="email-header" style="background:linear-gradient(135deg,#020b1a 0%,#003580 100%);padding:48px 40px;text-align:center;">
          <span style="display:block;margin-bottom:14px;font-family:'Inter',-apple-system,sans-serif;font-size:11px;font-weight:800;color:#5a9ef5;letter-spacing:.4em;text-transform:uppercase;">Purpose Technology</span>
          <h1 class="email-headline" style="margin:0;font-family:'Inter',-apple-system,sans-serif;font-size:28px;font-weight:700;color:#fff;line-height:1.25;">${subj}</h1>
        </td>
      </tr>
      <tr><td style="height:4px;background:linear-gradient(90deg,#1a72f0 0%,#003580 100%);font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td class="email-body" style="padding:48px 40px 0;font-family:'Inter',-apple-system,sans-serif;font-size:15px;line-height:1.7;color:#1f2937;">${paragraphs}</td></tr>
      ${ctaBlock}
      <tr>
        <td class="email-footer" style="padding:36px 40px;border-top:1px solid #f3f4f6;">
          <p style="margin:0 0 10px;font-size:13px;color:#6b7280;">Questions? <a href="mailto:admin@purposetech.online" style="color:#1a72f0;font-weight:600;text-decoration:none;">admin@purposetech.online</a></p>
          <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;">&copy; ${new Date().getFullYear()} Purpose Technology Namibia</p>
        </td>
      </tr>
    </table>
    <p style="padding:20px 12px;text-align:center;font-family:'Inter',-apple-system,sans-serif;font-size:11px;color:#9ca3af;line-height:1.7;">
      Windhoek, Namibia &middot; Trust through Transparency.
    </p>
  </td></tr>
</table>
</body></html>`
  }, [subject, bodyText, ctaLabel, ctaHref])

  const loadSegment = async (segment: string) => {
    setLoadingList(true)
    try {
      const headers = await getAuthHeaders()
      const res  = await fetch(`/api/admin/email/recipients?segment=${encodeURIComponent(segment)}`, { headers })
      const data = await res.json()
      if (!res.ok) { toast.error(data?.error ?? 'Failed'); return }
      const emails: string[] = data.emails ?? []
      setRecipients((prev) => {
        const existing = prev.trim() ? prev.trim() + '\n' : ''
        return existing + emails.join('\n')
      })
      toast.success(`${emails.length} address(es) loaded`)
    } catch (e) { console.error(e); toast.error('Failed to load list') }
    finally { setLoadingList(false) }
  }

  const handleSend = async () => {
    if (!recipients.trim()) { toast.error('Add at least one recipient.'); return }
    if (!bodyText.trim()) { toast.error('Write your message first.'); return }
    setSending(true)
    try {
      const headers = await getAuthHeaders()
      const res  = await fetch('/api/admin/email/send', {
        method: 'POST', headers,
        body: JSON.stringify({
          sendMode: 'custom_notice',
          to: recipients,
          subject: subject.trim() || undefined,
          bodyText: bodyText.trim(),
          ctaLabel: ctaLabel.trim() || undefined,
          ctaHref: ctaHref.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data?.error ?? 'Send failed'); return }
      toast.success(`Sent to ${data.sent ?? 0}${data.failed ? ` · ${data.failed} failed` : ''} ✓`)
      setRecipients(''); setBodyText(''); setSubject(''); setCtaLabel(''); setCtaHref('')
    } catch (e) { console.error(e); toast.error('Broadcast failed') }
    finally { setSending(false) }
  }

  const count = recipients.trim()
    ? [...new Set(recipients.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean))].length
    : 0

  const charCount = bodyText.length

  return (
    <div className="space-y-8">

      {/* Recipients */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="h-1 rounded-t-2xl bg-gradient-to-r from-[#003580] via-[#1a72f0] to-[#009543]" />
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                Recipients{count > 0 && <span className="ml-1 text-[#1a72f0]">({count})</span>}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Load a group or type emails manually</p>
            </div>
            <select
              className="text-xs font-bold rounded-xl border border-gray-200 px-3 py-2 bg-white text-gray-600 focus:border-[#1a72f0] outline-none cursor-pointer"
              defaultValue=""
              onChange={(e) => { const v = e.target.value; if (v) loadSegment(v); e.target.value = '' }}
              disabled={loadingList}
            >
              <option value="">{loadingList ? 'Loading…' : 'Load from group…'}</option>
              {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <textarea
            value={recipients} onChange={(e) => setRecipients(e.target.value)} rows={4}
            placeholder={"email1@example.com\nemail2@example.com\nor paste comma-separated"}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900 focus:border-[#1a72f0] outline-none resize-y"
          />
          <p className="text-xs text-gray-400">Separate with commas, spaces, or newlines. Max 40 per batch.</p>
        </div>
      </div>

      {/* Message composer */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Write your message</p>
          <p className="text-xs text-gray-400 mt-1">Type freely — inconveniences, announcements, reminders, anything.</p>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Subject line</label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Important notice regarding your service"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-[#1a72f0] outline-none"
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Message body</label>
            <span className={`text-xs font-semibold ${charCount > 3000 ? 'text-red-500' : 'text-gray-400'}`}>{charCount} chars</span>
          </div>
          <textarea
            value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={12}
            placeholder={`Dear valued customer,\n\nWe would like to inform you that...\n\nDue to [reason], there will be an inconvenience with [service] from [date] to [date].\n\nWe sincerely apologise for the inconvenience and are working to resolve this as quickly as possible.\n\nThank you for your patience and continued support.\n\nWarm regards,\nPurpose Technology Team`}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-[#1a72f0] outline-none resize-y leading-relaxed"
          />
          <p className="text-xs text-gray-400 mt-1.5">Double blank line = new paragraph. Single line break = line break in email.</p>
        </div>

        {/* Optional CTA */}
        <div className="rounded-2xl border border-dashed border-gray-200 p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Optional — Call to action button</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Button label</label>
              <input type="text" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="e.g. Visit our website"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-[#1a72f0] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Button URL</label>
              <input type="url" value={ctaHref} onChange={(e) => setCtaHref(e.target.value)}
                placeholder="https://purposetech.online"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-[#1a72f0] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={handleSend}
            disabled={sending || !recipients.trim() || !bodyText.trim()}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1a72f0] text-white font-bold text-sm shadow-lg shadow-[#1a72f0]/20 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
            {sending ? 'Sending…' : `Send to ${count || '…'} recipient${count !== 1 ? 's' : ''}`}
          </button>
          <button type="button" onClick={() => setShowPreview(!showPreview)}
            disabled={!bodyText.trim()}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-[#1a72f0] hover:text-[#1a72f0] disabled:opacity-40 transition-colors"
          >
            <EyeIcon className="w-5 h-5" />
            {showPreview ? 'Hide preview' : 'Preview email'}
          </button>
          {(subject || bodyText || ctaLabel || ctaHref) && (
            <button type="button"
              onClick={() => { setSubject(''); setBodyText(''); setCtaLabel(''); setCtaHref(''); setShowPreview(false) }}
              className="flex items-center gap-2 px-4 py-3.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:border-gray-300"
            >
              <XMarkIcon className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      {showPreview && previewHtml && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#1a72f0]" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">
              {subject.trim() || 'Notice from Purpose Technology'}
            </span>
          </div>
          <div className="bg-slate-100 p-6 flex justify-center">
            <iframe title="Email preview"
              className="w-full max-w-[600px] h-[700px] rounded-xl bg-white border shadow-inner"
              srcDoc={previewHtml} sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ROOT
───────────────────────────────────────────────────────────── */
function EmailStudioContent() {
  const { userRole, loading: authLoading } = useAuth()
  const router = useRouter()
  const [mode,       setMode]       = useState<'individual' | 'bulk' | 'newsletter'>('individual')
  const [templateId, setTemplateId] = useState<TemplateId>('driving_class_reminder')

  useEffect(() => {
    if (authLoading) return
    if (userRole !== 'admin') { toast.error('Unauthorized'); router.push('/admin') }
  }, [userRole, authLoading, router])

  if (authLoading || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-[#1a72f0] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">

          {/* Header */}
          <div className="mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#1a72f0] mb-2 flex items-center gap-2">
              <EnvelopeIcon className="w-4 h-4" /> Email Studio
            </p>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Customer Communications</h1>
            <p className="mt-2 text-gray-500">
              Send branded emails from <span className="font-semibold text-gray-700">admin@purposetech.online</span> via Resend.
            </p>
          </div>

          {/* Mode switcher */}
          <div className="flex rounded-2xl bg-white border border-gray-200 shadow-sm p-1.5 w-fit mb-8 flex-wrap gap-1">
            <button type="button" onClick={() => setMode('individual')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === 'individual' ? 'bg-[#1a72f0] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <EnvelopeIcon className="w-4 h-4" />
              Individual
            </button>
            <button type="button" onClick={() => setMode('newsletter')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === 'newsletter' ? 'bg-[#1a72f0] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <NewspaperIcon className="w-4 h-4" />
              Newsletter
            </button>
            <button type="button" onClick={() => setMode('bulk')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === 'bulk' ? 'bg-[#1a72f0] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <UserGroupIcon className="w-4 h-4" />
              Bulk notice
            </button>
          </div>

          {/* Mode description */}
          {mode === 'individual' && (
            <p className="mb-6 text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <strong className="text-gray-800">Individual:</strong> Enter one customer email, look up their portal data (driving hours, bookings, etc.), review the pre-filled message, then send.
            </p>
          )}
          {mode === 'newsletter' && (
            <p className="mb-6 text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <strong className="text-gray-800">Newsletter:</strong> Pick a product from your store — name, image and price are auto-filled — then broadcast to all newsletter subscribers at once.
            </p>
          )}
          {mode === 'bulk' && (
            <p className="mb-6 text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <strong className="text-gray-800">Bulk notice:</strong> Write any custom message — inconveniences, service updates, announcements — and broadcast to a group of recipients at once.
            </p>
          )}

          {/* Template picker — only for Individual mode */}
          {mode === 'individual' && (
            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Template</p>
              <TemplateBar value={templateId} onChange={setTemplateId} />
            </div>
          )}

          {/* Panel */}
          {mode === 'individual' && <IndividualPanel key={`ind-${templateId}`} templateId={templateId} />}
          {mode === 'newsletter'  && <NewsletterPanel key="newsletter" />}
          {mode === 'bulk'        && <BulkPanel />}

          {/* Infra note */}
          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold mb-1">Resend / Hostinger checklist</p>
            <ul className="list-disc list-inside space-y-1 text-amber-800/90 text-xs">
              <li>Add <strong>purposetech.online</strong> as a domain in Resend → Domains.</li>
              <li>Copy SPF, DKIM, DMARC records into Hostinger DNS.</li>
              <li>Set <code className="bg-amber-100 px-1 rounded">RESEND_API_KEY</code> in <code>.env.local</code> and Vercel env vars.</li>
              <li>Optional: <code className="bg-amber-100 px-1 rounded">RESEND_FROM="Purpose Technology &lt;admin@purposetech.online&gt;"</code></li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AdminEmailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-[#1a72f0] border-t-transparent animate-spin" />
      </div>
    }>
      <EmailStudioContent />
    </Suspense>
  )
}
