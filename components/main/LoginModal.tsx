'use client'

import { useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/lib/i18n'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { t } = useLocale()
  const supabase = useMemo(() => createClient(), [])
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  if (!open) return null

  return createPortal(
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="relative rounded-2xl bg-[#1e1e1e] p-8 w-full max-w-sm mx-4">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 cursor-pointer transition-colors hover:text-white/70 hover:bg-white/[0.06]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/grimbang_logo_dark.webp"
            alt="Grimbang logo"
            className="h-12 object-contain"
          />
        </div>

        {/* Heading */}
        <h2 className="text-xl font-bold text-white text-center">
          {t.auth.welcome}
        </h2>
        <p className="mt-2 text-white/50 text-sm text-center leading-relaxed">
          Your Sentence, Becomes Art.
        </p>

        {/* Google sign in */}
        <button
          onClick={handleGoogleSignIn}
          className="mt-6 w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl bg-white text-gray-800 font-semibold text-sm cursor-pointer transition-all duration-200 hover:bg-white/90 hover:shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
        >
          <GoogleIcon />
          {t.auth.continueWithGoogle}
        </button>

        {/* Terms */}
        <p className="mt-4 text-white/25 text-xs text-center">
          {t.auth.agreeDesktop}{' '}
          <a href="/terms" className="text-white/40 underline underline-offset-2 transition-colors hover:text-white/60">
            {t.auth.terms}
          </a>
          {' '}{t.auth.and}{' '}
          <a href="/privacy" className="text-white/40 underline underline-offset-2 transition-colors hover:text-white/60">
            {t.auth.privacyPolicy}
          </a>
        </p>
      </div>
    </div>,
    document.body,
  )
}
