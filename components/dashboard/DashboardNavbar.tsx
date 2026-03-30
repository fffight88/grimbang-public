'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useLocale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
interface DashboardNavbarProps {
  onToggleSidebar?: () => void
  onOpenPricing?: () => void
}

export default function DashboardNavbar({ onToggleSidebar, onOpenPricing }: DashboardNavbarProps) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { locale, setLocale, t } = useLocale()
  const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false)
  const [userPlan, setUserPlan] = useState<{ plan: string; status: string; credits: number; precisionCredits: number }>({
    plan: 'free',
    status: 'inactive',
    credits: 0,
    precisionCredits: 0,
  })
  const [portalLoading, setPortalLoading] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'
  const avatarUrl = user?.user_metadata?.avatar_url

  const hasPaidPlan =
    userPlan.plan !== 'free' &&
    (userPlan.status === 'active' || userPlan.status === 'canceled')

  // Fetch user plan
  useEffect(() => {
    if (!user) return
    supabase
      .from('users')
      .select('plan, subscription_status, credits, precision_credits')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setUserPlan({ plan: data.plan, status: data.subscription_status, credits: data.credits ?? 0, precisionCredits: data.precision_credits ?? 0 })
        }
      })
  }, [user, supabase])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePortal = useCallback(async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.open(data.url, '_blank')
    } catch (err) {
      console.error('Portal error:', err)
    } finally {
      setPortalLoading(false)
    }
  }, [])

  return (
  <>
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 pointer-events-none">
      {/* Left: toggle + logo */}
      <div className="pointer-events-auto flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={t.dashboard.toggleSidebar}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-foreground/50 cursor-pointer transition-colors hover:text-foreground/80 hover:bg-foreground/[0.06]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <a
          href="/dashboard"
          className="transition-opacity duration-200 hover:opacity-80"
        >
          <Image
            src={theme === 'dark' ? '/grimbang_logo_dark.webp' : '/grimbang_logo.webp'}
            alt="Grimbang logo"
            width={34}
            height={34}
            className="object-contain"
          />
        </a>
      </div>

      {/* Right: theme toggle + profile */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={t.dashboard.toggleTheme}
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-foreground/50 cursor-pointer transition-colors hover:text-foreground/80 hover:bg-foreground/[0.06]"
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Language toggle */}
        <button
          type="button"
          onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
          aria-label={t.dashboard.toggleLanguage}
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-foreground/50 cursor-pointer transition-colors hover:text-foreground/80 hover:bg-foreground/[0.06]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </button>

      {/* Profile — floating pill with popover */}
      <div ref={popoverRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={34}
              height={34}
              className="rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-[34px] h-[34px] rounded-full bg-foreground/10 flex items-center justify-center text-foreground/60 text-sm font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        {/* Popover dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-popover border border-border shadow-[0_8px_40px_rgba(0,0,0,0.3)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/60 text-sm font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-foreground/80 text-sm truncate">{displayName}</p>
                {user?.email && (
                  <p className="text-foreground/40 text-xs truncate">{user.email}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-foreground/35 text-xs font-medium">
                    {userPlan.plan === 'ultra' ? 'Ultra' : userPlan.plan === 'pro' ? 'Pro' : 'Free'} {t.dashboard.plan}
                  </span>
                  {userPlan.status !== 'active' && userPlan.plan !== 'free' && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      userPlan.status === 'canceled'
                        ? 'bg-amber-500/15 text-amber-400/80'
                        : userPlan.status === 'past_due'
                          ? 'bg-red-500/15 text-red-400/80'
                          : 'bg-foreground/[0.06] text-foreground/40'
                    }`}>
                      {userPlan.status}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <circle cx="12" cy="12" r="10" fill="#D4A017" />
                      <circle cx="12" cy="12" r="7.5" fill="#FFD700" />
                      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#8B6914" fontFamily="system-ui">C</text>
                    </svg>
                    <span className="text-foreground/35 text-xs font-medium">
                      {userPlan.credits}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <circle cx="12" cy="12" r="10" fill="#A8A8A8" />
                      <circle cx="12" cy="12" r="7.5" fill="#C0C0C0" />
                      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#6B6B6B" fontFamily="system-ui">P</text>
                    </svg>
                    <span className="text-foreground/35 text-xs font-medium">
                      {userPlan.precisionCredits}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  onOpenPricing?.()
                  setOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-foreground text-background text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {t.dashboard.upgrade}
              </button>
            </div>
            {hasPaidPlan && (
              <button
                type="button"
                disabled={portalLoading}
                onClick={() => {
                  handlePortal()
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-foreground/50 text-sm cursor-pointer transition-colors hover:bg-foreground/[0.04] hover:text-foreground/80 disabled:opacity-50"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                {portalLoading ? t.dashboard.loading : t.dashboard.manageSubscription}
              </button>
            )}
            <button
              type="button"
              onClick={signOut}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-foreground/50 text-sm cursor-pointer transition-colors hover:bg-foreground/[0.04] hover:text-foreground/80"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {t.dashboard.signOut}
            </button>
          </div>
        )}
      </div>
      </div>
    </nav>

  </>
  )
}
