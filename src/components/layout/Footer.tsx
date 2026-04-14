'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa'

const footerLinks = {
  product: [
    { name: 'Browse Apps',     href: '/apps' },
    { name: 'Photography',     href: '/categories' },
    { name: 'Products',        href: '/products' },
    { name: 'Driving School',  href: '/driving-school' },
    { name: 'Signal',          href: '/signal' },
    { name: 'Borrow',          href: '/borrow' },
  ],
  company: [
    { name: 'Home',            href: '/' },
    { name: 'About Us',        href: '/about' },
    { name: 'Developers',      href: '/developers' },
    { name: 'Contact',         href: '/contact' },
    { name: 'Privacy Policy',  href: '/privacy-policy' },
    { name: 'Terms of Service',href: '/terms-of-service' },
  ],
}

export default function Footer() {
  return (
    <footer
      style={{
        background: 'linear-gradient(180deg, rgba(2,11,26,0) 0%, rgba(2,11,26,1) 120px)',
        borderTop: '1px solid rgba(0,53,128,0.2)',
      }}
    >
      {/* Blue accent bar */}
      <div className="accent-bar" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">

          {/* Brand column */}
          <div className="md:col-span-1 space-y-5">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative flex-shrink-0">
                <div
                  className="absolute inset-0 rounded-xl opacity-30 blur-md group-hover:opacity-50 transition-opacity duration-300"
                  style={{ background: '#003580' }}
                />
                <Image
                  src="/purpose_logo.png"
                  alt="Purpose Technology"
                  width={40}
                  height={40}
                  className="relative h-10 w-10 object-contain"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span
                  className="font-bold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', letterSpacing: '-0.02em' }}
                >
                  Purpose
                </span>
                <span className="text-[10px] font-medium tracking-widest uppercase text-[#5a9ef5]">
                  Technology
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: '#4a6a90', maxWidth: '240px' }}>
              Namibia&apos;s premier hub for innovative technology solutions, apps, and digital services.
            </p>
            <div className="flex items-center gap-2">
              <span className="pulse-dot" />
              <span className="text-xs font-medium text-[#5a9ef5]">Systems Operational</span>
            </div>

            {/* Social icons */}
            <div className="flex gap-3 pt-1">
              {[
                { icon: FaFacebook,  href: 'https://facebook.com',  label: 'Facebook' },
                { icon: FaTwitter,   href: 'https://twitter.com',   label: 'Twitter' },
                { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
                { icon: FaLinkedin,  href: 'https://linkedin.com',  label: 'LinkedIn' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-1"
                  style={{
                    background: 'rgba(9,24,48,0.8)',
                    border: '1px solid rgba(0,65,168,0.22)',
                    color: '#4a6a90',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,53,128,0.35)'
                    ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,85,204,0.45)'
                    ;(e.currentTarget as HTMLAnchorElement).style.color = '#5a9ef5'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(9,24,48,0.8)'
                    ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,65,168,0.22)'
                    ;(e.currentTarget as HTMLAnchorElement).style.color = '#4a6a90'
                  }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest mb-5 text-[#5a9ef5]"
            >
              Products
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200 hover:text-white"
                    style={{ color: '#4a6a90' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest mb-5 text-[#5a9ef5]"
            >
              Company
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200 hover:text-white"
                    style={{ color: '#4a6a90' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest mb-5 text-[#5a9ef5]"
            >
              Contact
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:+264817854573"
                  className="flex items-center gap-3 text-sm group"
                  style={{ color: '#4a6a90' }}
                >
                  <span
                    className="icon-ring w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ minWidth: '2rem' }}
                  >
                    <FaPhone className="w-3.5 h-3.5" />
                  </span>
                  <span className="group-hover:text-white transition-colors">+264 81 785 4573</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:purposenamibia@gmail.com"
                  className="flex items-center gap-3 text-sm group"
                  style={{ color: '#4a6a90' }}
                >
                  <span
                    className="icon-ring w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ minWidth: '2rem' }}
                  >
                    <FaEnvelope className="w-3.5 h-3.5" />
                  </span>
                  <span className="group-hover:text-white transition-colors">purposenamibia@gmail.com</span>
                </a>
              </li>
              <li>
                <div className="flex items-center gap-3 text-sm" style={{ color: '#4a6a90' }}>
                  <span
                    className="icon-ring w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ minWidth: '2rem' }}
                  >
                    <FaMapMarkerAlt className="w-3.5 h-3.5" />
                  </span>
                  <span>Windhoek, Namibia</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(0,53,128,0.15)' }}
        >
          <p className="text-xs" style={{ color: '#4a6a90' }}>
            © {new Date().getFullYear()} Purpose Technology. All rights reserved. · Made with ❤️ in Namibia
          </p>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{
                background: 'rgba(0,85,204,0.1)',
                border: '1px solid rgba(0,85,204,0.25)',
                color: '#5a9ef5',
              }}
            >
              v2.1
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}