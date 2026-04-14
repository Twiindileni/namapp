'use client'

import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FeaturedApps from '@/components/home/FeaturedApps'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import { 
  DevicePhoneMobileIcon, 
  CameraIcon, 
  AcademicCapIcon, 
  SignalIcon, 
  ShoppingBagIcon, 
  BellAlertIcon,
  SparklesIcon,
  RocketLaunchIcon,
  GlobalAltIcon,
  CubeIcon
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

const categories = [
  { name: 'Productivity',   icon: DevicePhoneMobileIcon },
  { name: 'Entertainment',  icon: SparklesIcon },
  { name: 'Education',      icon: AcademicCapIcon },
  { name: 'Games',          icon: RocketLaunchIcon },
  { name: 'Social',         icon: BellAlertIcon },
  { name: 'Utilities',      icon: CubeIcon },
]

const stats = [
  { number: '200+', label: 'Apps Published' },
  { number: '50+',  label: 'Active Developers' },
  { number: '10K+', label: 'Downloads' },
  { number: '5★',   label: 'Avg Rating' },
]

const services = [
  {
    icon: DevicePhoneMobileIcon,
    title: 'Mobile Apps',
    desc: 'Discover innovative apps built by Namibian developers solving local challenges.',
    href: '/apps',
  },
  {
    icon: CameraIcon,
    title: 'Photography',
    desc: 'Browse our curated gallery of stunning Namibian photography and videography.',
    href: '/categories',
  },
  {
    icon: AcademicCapIcon,
    title: 'Driving School',
    desc: 'Book lessons and track your progress with our digital driving portal.',
    href: '/driving-school',
  },
  {
    icon: SignalIcon,
    title: 'Device Tracking',
    desc: 'Real-time GPS tracking for your devices across Namibia.',
    href: '/devices',
  },
  {
    icon: ShoppingBagIcon,
    title: 'Products',
    desc: 'Shop a curated selection of tech products and accessories.',
    href: '/products',
  },
  {
    icon: BellAlertIcon,
    title: 'Signal',
    desc: 'Stay connected with real-time notifications and alerts.',
    href: '/signal',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-16">

        {/* ═══════════════════════════════════════
            HERO SECTION
        ════════════════════════════════════════ */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Radial blue spotlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 70% 60% at 30% 40%, rgba(0,53,128,0.18) 0%, transparent 70%)',
            }}
          />

          <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 lg:py-32 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left: Copy */}
              <div>
                {/* Eyebrow badge */}
                <div className="inline-flex items-center gap-2 mb-6 fade-in-up">
                  <span className="pulse-dot" />
                  <span
                    className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
                    style={{
                      background: 'rgba(0, 85, 204, 0.1)',
                      border: '1px solid rgba(0, 85, 204, 0.25)',
                      color: '#5a9ef5',
                    }}
                  >
                    Namibia&apos;s Tech Hub
                  </span>
                </div>

                <h1 className="hero-title fade-in-up fade-in-up-delay-1 mb-6">
                  Discover{' '}
                  <span className="relative">
                    <span className="animate-gradient-flow-1">Amazing</span>
                  </span>
                  <br />
                  <span style={{ color: '#8baed4' }}>Namibian</span>{' '}
                  <span className="underline-accent">Technology</span>
                </h1>

                <p
                  className="text-lg leading-relaxed mb-10 fade-in-up fade-in-up-delay-2 max-w-xl"
                  style={{ color: '#8baed4' }}
                >
                  Explore innovative technology solutions, apps, products, and services
                  created by Namibian developers and entrepreneurs. Your one-stop hub
                  for local tech excellence.
                </p>

                <div className="flex flex-wrap items-center gap-4 fade-in-up fade-in-up-delay-3">
                  <Link href="/apps" className="btn-primary">
                    <RocketLaunchIcon className="w-5 h-5" />
                    <span>Browse Apps</span>
                  </Link>
                  <Link href="/register" className="btn-outline">
                    <span>Register as Developer →</span>
                  </Link>
                </div>
              </div>

              {/* Right: Stats cards */}
              <div className="hidden lg:grid grid-cols-2 gap-4 fade-in-up fade-in-up-delay-2">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="stat-card"
                  >
                    <div className="stat-number">
                      {s.number}
                    </div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}

                {/* Decorative accent card */}
                <div
                  className="col-span-2 rounded-2xl p-4 flex items-center gap-4 border border-[rgba(0,53,128,0.2)]"
                  style={{ background: 'rgba(0,53,128,0.12)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5a9ef5] flex-shrink-0"
                    style={{ background: 'rgba(5, 16, 36, 0.3)', border: '1px solid rgba(0, 85, 204, 0.15)' }}
                  >
                    <SparklesIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Built for Namibians</p>
                    <p className="text-xs" style={{ color: '#4a6a90' }}>Proudly local. Globally relevant.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section divider */}
        <div className="section-divider mx-8" />

        {/* ═══════════════════════════════════════
            SERVICES SECTION
        ════════════════════════════════════════ */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-14">
              <span
                className="text-xs font-bold uppercase tracking-widest text-[#5a9ef5]"
              >
                What We Offer
              </span>
              <h2 className="section-title mt-3">
                Our <span className="gradient-text">Services</span>
              </h2>
              <p className="mt-3 max-w-xl mx-auto text-base" style={{ color: '#4a6a90' }}>
                Everything you need in one powerful Namibian tech platform.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((svc) => (
                <Link
                  key={svc.title}
                  href={svc.href}
                  className="glass-card p-6 flex flex-col gap-1 group"
                >
                  <div
                    className="icon-ring w-12 h-12"
                  >
                    <svc.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-white text-base mt-2 group-hover:text-[#5a9ef5] transition-colors">{svc.title}</h3>
                  <p className="text-sm leading-relaxed mt-2" style={{ color: '#4a6a90' }}>
                    {svc.desc}
                  </p>
                  <span
                    className="mt-4 text-xs font-semibold inline-flex items-center gap-1 transition-all duration-200 group-hover:gap-2 text-[#5a9ef5]"
                  >
                    Explore →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Section divider */}
        <div className="section-divider mx-8" />

        {/* ═══════════════════════════════════════
            FEATURED APPS
        ════════════════════════════════════════ */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span
                  className="text-xs font-bold uppercase tracking-widest text-[#5a9ef5]"
                >
                  Top Picks
                </span>
                <h2 className="section-title mt-2 text-white">Featured Apps</h2>
              </div>
              <Link
                href="/apps"
                className="text-sm font-semibold hidden sm:inline-flex items-center gap-1 transition-colors text-[#5a9ef5] hover:text-white"
              >
                View all apps →
              </Link>
            </div>
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'rgba(9, 24, 48, 0.5)',
                border: '1px solid rgba(0, 53, 128, 0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <FeaturedApps />
            </div>
          </div>
        </section>

        {/* Section divider */}
        <div className="section-divider mx-8" />

        {/* ═══════════════════════════════════════
            FEATURED PRODUCTS
        ════════════════════════════════════════ */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span
                  className="text-xs font-bold uppercase tracking-widest text-[#5a9ef5]"
                >
                  Shop
                </span>
                <h2 className="section-title mt-2 text-white">Featured Products</h2>
              </div>
              <Link
                href="/products"
                className="text-sm font-semibold hidden sm:inline-flex items-center gap-1 transition-colors text-[#5a9ef5] hover:text-white"
              >
                View all products →
              </Link>
            </div>
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'rgba(9, 24, 48, 0.5)',
                border: '1px solid rgba(0, 53, 128, 0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <FeaturedProducts />
            </div>
          </div>
        </section>

        {/* Section divider */}
        <div className="section-divider mx-8" />

        {/* ═══════════════════════════════════════
            CATEGORIES
        ════════════════════════════════════════ */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <span
                className="text-xs font-bold uppercase tracking-widest text-[#5a9ef5]"
              >
                Browse by Category
              </span>
              <h2 className="section-title mt-3 text-white">Popular Categories</h2>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/apps?category=${cat.name.toLowerCase()}`}
                  className="category-chip"
                >
                  <cat.icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Section divider */}
        <div className="section-divider mx-8" />

        {/* ═══════════════════════════════════════
            CTA BANNER
        ════════════════════════════════════════ */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div
              className="relative overflow-hidden rounded-3xl px-8 py-16 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(2,11,26,0.95) 0%, rgba(0,53,128,0.9) 50%, rgba(0,71,168,0.8) 100%)',
                border: '1px solid rgba(0, 85, 204, 0.3)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
              }}
            >
              {/* Decorative blue blobs */}
              <div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #0047a8, transparent)', filter: 'blur(40px)' }}
              />
              <div
                className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #0055cc, transparent)', filter: 'blur(40px)' }}
              />

              <div className="relative z-10">
                <span
                  className="text-xs font-bold uppercase tracking-widest mb-4 inline-block text-[#5a9ef5]"
                >
                  Join the Community
                </span>
                <h2 className="section-title mb-4 text-white">
                  Are You a Namibian Developer?
                </h2>
                <p className="mb-8 max-w-xl mx-auto" style={{ color: '#8baed4' }}>
                  List your app or product on Purpose Technology and reach thousands of Namibians.
                  Join our growing community of local innovators.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link href="/register" className="btn-primary">
                    <RocketLaunchIcon className="w-5 h-5" />
                    <span>Get Started Free</span>
                  </Link>
                  <Link href="/about" className="btn-outline">
                    <span>Learn More →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
