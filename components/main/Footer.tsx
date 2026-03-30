'use client'

import Link from 'next/link'
import { useLocale } from '@/lib/i18n'

const SOCIAL_LINKS = [
  {
    label: 'X',
    href: 'https://x.com/gogrimbang',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  // Threads — 나중에 활성화
  // {
  //   label: 'Threads',
  //   href: '#',
  //   icon: (...),
  // },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@gogrimbang',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
]

export default function Footer() {
  const { t } = useLocale()

  const navLinks = [
    { label: t.footer.features, href: '#features' },
    { label: t.footer.pricing, href: '#pricing' },
    { label: t.footer.privacy, href: '/privacy' },
    { label: t.footer.terms, href: '/terms' },
  ]

  return (
    <footer className="px-6 pb-8 pt-16">
      <div className="max-w-6xl mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.08] px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Logo + Socials */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 no-underline text-white">
              <img
                src="/grimbang_logo_dark.webp"
                alt="Grimbang logo"
                width={20}
                height={20}
                className="object-contain"
              />
              <span className="text-sm font-bold tracking-tight text-white/80">
                GRIMBANG
              </span>
            </a>

            {/* Divider */}
            <div className="hidden md:block w-px h-4 bg-white/[0.1]" />

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="text-white/30 transition-colors hover:text-white/60"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Right: Nav links */}
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-white/40 text-sm no-underline transition-colors hover:text-white/70"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom copyright */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
          <p className="text-white/20 text-xs">
            &copy; {new Date().getFullYear()} Grimbang. {t.footer.allRightsReserved}
          </p>
        </div>
      </div>
    </footer>
  )
}
