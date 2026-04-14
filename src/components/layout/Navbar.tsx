'use client'

import { Fragment, useState, useEffect } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import toast from 'react-hot-toast'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
  const { user, logout, userRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      router.push('/')
    } catch {
      toast.error('Failed to logout')
    }
  }

  const navigation = [
    { name: 'Home',          href: '/' },
    { name: 'Apps',          href: '/apps' },
    { name: 'Photography',   href: '/categories' },
    { name: 'Driving School',href: '/driving-school' },
    { name: 'Track Device',  href: '/devices' },
    { name: 'Products',      href: '/products' },
    { name: 'Signal',        href: '/signal' },
    { name: 'Borrow',        href: '/borrow' },
    { name: 'Contact',       href: '/contact' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <Disclosure
      as="nav"
      className={classNames(
        'fixed top-0 inset-x-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-[rgba(2,11,26,0.92)] backdrop-blur-xl border-b border-[rgba(0,53,128,0.25)] shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'bg-transparent'
      )}
    >
      {({ open }) => (
        <>
          {/* Top blue accent bar */}
          <div className="accent-bar" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-[#003580] opacity-30 blur-md group-hover:opacity-50 transition-opacity duration-300" />
                  <Image
                    src="/purpose_logo.png"
                    alt="Purpose Technology"
                    width={38}
                    height={38}
                    className="relative h-9 w-9 object-contain"
                  />
                </div>
                <div className="flex flex-col leading-none">
                  <span
                    className="font-bold text-white"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.05rem', letterSpacing: '-0.02em' }}
                  >
                    Purpose
                  </span>
                  <span className="text-[10px] font-medium tracking-widest uppercase text-[#5a9ef5]">
                    Technology
                  </span>
                </div>
              </Link>

              {/* Desktop nav */}
              <div className="hidden lg:flex lg:items-center lg:gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      'relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
                      isActive(item.href)
                        ? 'text-white bg-[rgba(0,53,128,0.35)] border border-[rgba(0,85,200,0.3)]'
                        : 'text-[#8baed4] hover:text-white hover:bg-[rgba(0,53,128,0.2)]'
                    )}
                  >
                    {item.name}
                    {isActive(item.href) && (
                      <span
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#1a72f0]"
                      />
                    )}
                  </Link>
                ))}
              </div>

              {/* Right actions */}
              <div className="hidden sm:flex sm:items-center sm:gap-3">
                {user ? (
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[rgba(0,85,200,0.3)] bg-[rgba(9,24,48,0.6)] text-sm text-white transition-all hover:border-[rgba(0,85,204,0.4)] hover:bg-[rgba(0,53,128,0.25)] focus:outline-none focus:ring-2 focus:ring-[#003580]">
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: 'linear-gradient(135deg, #003580, #1a72f0)' }}
                      >
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <span className="max-w-[100px] truncate text-[#8baed4]">{user.email?.split('@')[0]}</span>
                      <ChevronDownIcon className="h-3.5 w-3.5 text-[#4a6a90]" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95 translate-y-2"
                      enterTo="transform opacity-100 scale-100 translate-y-0"
                      leave="transition ease-in duration-100"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl focus:outline-none overflow-hidden"
                        style={{
                          background: 'rgba(5,16,36,0.97)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(0,85,200,0.25)',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                        }}>
                        <div className="p-1.5 space-y-0.5">
                          {[
                            { label: 'Your Profile', href: '/profile' },
                            { label: 'My Orders',    href: '/orders' },
                            { label: 'My Devices',   href: '/devices' },
                            { label: 'Driving Portal', href: '/dashboard' },
                            ...(userRole === 'admin' ? [{ label: 'Admin Panel', href: '/admin' }] : []),
                          ].map((item) => (
                            <Menu.Item key={item.href}>
                              {({ active }) => (
                                <Link
                                  href={item.href}
                                  className={classNames(
                                    'block px-3 py-2 text-sm rounded-xl transition-colors',
                                    active
                                      ? 'bg-[rgba(0,53,128,0.35)] text-white'
                                      : 'text-[#8baed4] hover:bg-[rgba(0,53,128,0.2)] hover:text-white'
                                  )}
                                >
                                  {item.label}
                                </Link>
                              )}
                            </Menu.Item>
                          ))}
                          <div className="border-t border-[rgba(0,85,200,0.15)] my-1" />
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={handleLogout}
                                className={classNames(
                                  'block w-full text-left px-3 py-2 text-sm rounded-xl transition-colors',
                                  active
                                    ? 'bg-[rgba(0,53,128,0.2)] text-[#5a9ef5]'
                                    : 'text-[#8baed4] hover:bg-[rgba(0,53,128,0.15)] hover:text-white'
                                )}
                              >
                                Sign out
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="px-4 py-1.5 text-sm font-medium text-[#8baed4] hover:text-white rounded-xl border border-transparent hover:border-[rgba(0,53,128,0.35)] hover:bg-[rgba(0,53,128,0.15)] transition-all duration-200"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="px-4 py-1.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,85,204,0.35)] hover:-translate-y-0.5"
                      style={{
                        background: 'linear-gradient(135deg, #003580, #1a72f0)',
                        boxShadow: '0 2px 12px rgba(0,53,128,0.4)',
                      }}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="flex items-center lg:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-xl p-2 text-[#8baed4] hover:bg-[rgba(0,53,128,0.2)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#003580] transition-all">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-5 w-5" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Mobile menu panel */}
          <Transition
            show={open}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 -translate-y-4"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-4"
          >
            <Disclosure.Panel
              static
              className="lg:hidden mx-4 mb-4 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(5,16,36,0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,53,128,0.2)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              <div className="p-3 space-y-1">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    href={item.href}
                    className={classNames(
                      'flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                      isActive(item.href)
                        ? 'bg-[rgba(0,53,128,0.35)] text-white border border-[rgba(0,85,200,0.3)]'
                        : 'text-[#8baed4] hover:bg-[rgba(0,53,128,0.2)] hover:text-white'
                    )}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>

              <div className="border-t border-[rgba(0,53,128,0.2)] p-3">
                {user ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-4 py-2 mb-2">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #003580, #1a72f0)' }}
                      >
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-[#8baed4] truncate">{user.email}</span>
                    </div>
                    {['/profile', '/orders', '/devices', '/dashboard'].map((href) => (
                      <Disclosure.Button
                        key={href}
                        as={Link}
                        href={href}
                        className="block px-4 py-2 text-sm text-[#8baed4] hover:text-white hover:bg-[rgba(0,53,128,0.2)] rounded-xl transition-all"
                      >
                        {href === '/profile' ? 'Your Profile' : href === '/orders' ? 'My Orders' : href === '/devices' ? 'My Devices' : 'Driving Portal'}
                      </Disclosure.Button>
                    ))}
                    {userRole === 'admin' && (
                      <Disclosure.Button
                        as={Link}
                        href="/admin"
                        className="block px-4 py-2 text-sm text-[#8baed4] hover:text-white hover:bg-[rgba(0,53,128,0.2)] rounded-xl transition-all"
                      >
                        Admin Panel
                      </Disclosure.Button>
                    )}
                    <Disclosure.Button
                      as="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-[#5a9ef5] hover:bg-[rgba(0,53,128,0.15)] rounded-xl transition-all"
                    >
                      Sign out
                    </Disclosure.Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Disclosure.Button
                      as={Link}
                      href="/login"
                      className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-[#8baed4] border border-[rgba(0,85,200,0.3)] rounded-xl hover:text-white hover:bg-[rgba(0,53,128,0.2)] transition-all"
                    >
                      Login
                    </Disclosure.Button>
                    <Disclosure.Button
                      as={Link}
                      href="/register"
                      className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
                      style={{ background: 'linear-gradient(135deg, #003580, #1a72f0)' }}
                    >
                      Register
                    </Disclosure.Button>
                  </div>
                )}
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}