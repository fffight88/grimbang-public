'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { useLocale } from '@/lib/i18n'
import type { Thumbnail } from '@/lib/types'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

function ThumbnailCard({ thumbnail, onDelete }: { thumbnail: Thumbnail; onDelete: (id: string) => void }) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(thumbnail.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (deleting) return
    setDeleting(true)
    onDelete(thumbnail.id)
  }

  return (
    <div className="group rounded-xl overflow-hidden bg-foreground/[0.03] border border-foreground/[0.06] transition-all duration-200 hover:bg-foreground/[0.06] hover:border-foreground/[0.1] hover:shadow-[0_4px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      {thumbnail.image_url && (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={thumbnail.image_url}
            alt={thumbnail.prompt}
            fill
            sizes="264px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/30 to-transparent" />
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/60 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-500/80 hover:border-red-400/30"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div className="p-3">
        <p className="text-foreground/50 text-xs leading-relaxed line-clamp-2">
          {thumbnail.prompt}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-2 flex items-center gap-1.5 text-foreground/30 text-xs cursor-pointer transition-colors hover:text-foreground/60"
        >
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          {copied ? t.sidebar.copied : t.sidebar.copyPrompt}
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useLocale()
  const { user } = useAuth()
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('thumbnails')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!cancelled && !error && data) {
        setThumbnails(data as Thumbnail[])
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [user, supabase])

  const handleDelete = async (id: string) => {
    const target = thumbnails.find((t) => t.id === id)
    // Optimistically remove from UI
    setThumbnails((prev) => prev.filter((t) => t.id !== id))

    // Delete storage file if path exists
    if (target?.storage_path) {
      await supabase.storage.from('thumbnails').remove([target.storage_path])
    }

    const { error } = await supabase
      .from('thumbnails')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete thumbnail:', error)
      // Reload on failure
      const { data } = await supabase
        .from('thumbnails')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(100)
      if (data) setThumbnails(data as Thumbnail[])
    }
  }

  // Realtime subscription for new thumbnails
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('sidebar-thumbnails')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thumbnails',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as Thumbnail
            if (row.status === 'completed' && row.image_url) {
              setThumbnails((prev) => {
                const filtered = prev.filter((t) => t.id !== row.id)
                return [row, ...filtered]
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 pt-[64px] flex flex-col bg-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-foreground/70 text-sm font-semibold tracking-wide uppercase">
              {t.sidebar.myThumbnails}
            </h3>
            <button
              type="button"
              onClick={async () => {
                setLoading(true)
                const { data } = await supabase
                  .from('thumbnails')
                  .select('*')
                  .eq('user_id', user!.id)
                  .eq('status', 'completed')
                  .order('created_at', { ascending: false })
                  .limit(100)
                if (data) setThumbnails(data as Thumbnail[])
                setLoading(false)
              }}
              className="text-foreground/30 hover:text-foreground/60 transition-colors cursor-pointer"
              title="Refresh"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
          <span className="text-foreground/30 text-xs">
            {thumbnails.length}
          </span>
        </div>

        {/* Gallery */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground/60 rounded-full animate-spin" />
            </div>
          ) : thumbnails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-foreground/[0.04] flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/25">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="text-foreground/30 text-sm">{t.sidebar.noThumbnails}</p>
              <p className="text-foreground/20 text-xs mt-1">{t.sidebar.generateFirst}</p>
            </div>
          ) : (
            thumbnails.map((thumb) => (
              <ThumbnailCard key={thumb.id} thumbnail={thumb} onDelete={handleDelete} />
            ))
          )}
        </div>

        {/* Glass right edge */}
        <div className="absolute top-0 right-0 w-px h-full bg-border" />
      </aside>
    </>
  )
}
