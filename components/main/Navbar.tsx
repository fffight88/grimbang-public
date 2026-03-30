'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n'

interface NavbarProps {
  onLoginClick?: () => void
}

export default function Navbar({ onLoginClick }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { locale, setLocale, t } = useLocale()

  const NAV_LINKS = [
    { label: t.nav.features, href: '#features' },
    { label: t.nav.compare, href: '#compare' },
    { label: t.nav.pricing, href: '#pricing' },
  ]

  return (
    <nav className="fixed top-0 inset-x-0 z-[100] bg-black/40 backdrop-blur-[12px] backdrop-saturate-[120%] border-b border-white/[0.08] font-sans text-white">
      <div className="flex items-center justify-between px-8 h-16">
        {/* Left: Logo */}
        <a href="/" className="flex items-center gap-2.5 no-underline text-white">
          <img
            src="/grimbang_logo_dark.webp"
            alt="Grimbang logo"
            width={22}
            height={22}
            className="object-contain"
          />
          <span className="text-lg font-bold tracking-tight">
            GRIMBANG
          </span>
        </a>

        {/* Center: Desktop nav links */}
        <div className="hidden md:flex gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-white/75 no-underline text-sm font-medium transition-colors duration-200 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: CTA + Hamburger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
            aria-label="Toggle language"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/50 cursor-pointer transition-colors hover:text-white hover:bg-white/[0.06]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onLoginClick}
            className="py-2 px-5 rounded-[10px] bg-white/12 text-white text-sm font-semibold border border-white/18 backdrop-blur-sm cursor-pointer transition-colors duration-200 hover:bg-white/20"
          >
            {t.nav.getStarted}
          </button>

          {/* Hamburger - mobile only */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/70 transition-colors hover:text-white hover:bg-white/[0.06] cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/[0.06] px-8 py-4 flex flex-col gap-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-white/75 no-underline text-sm font-medium py-2 transition-colors duration-200 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
