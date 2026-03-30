'use client'

import { useLocale } from '@/lib/i18n'

interface CTAProps {
  onLoginClick?: () => void
}

export default function CTA({ onLoginClick }: CTAProps) {
  const { t } = useLocale()

  return (
    <section className="px-6 py-20">
      <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/[0.08]">
        {/* Radial glow background */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.04] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-white/[0.06] blur-[80px]" />

        {/* Content */}
        <div className="relative z-[1] flex flex-col items-center text-center py-20 px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight max-w-lg">
            {t.cta.heading}
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-md">
            {t.cta.subheading}
          </p>

          <button
            type="button"
            onClick={onLoginClick}
            className="mt-8 inline-flex items-center gap-2 py-3.5 px-8 rounded-xl bg-white text-[#181818] text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 shadow-[0_8px_32px_rgba(255,255,255,0.1)]"
          >
            {t.cta.button}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          {/* Trust badges */}
          <div className="mt-6 flex items-center gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t.cta.freeCredits}
            </span>
            <span className="w-px h-3 bg-white/[0.1]" />
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t.cta.noCard}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
