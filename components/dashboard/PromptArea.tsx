'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { BorderBeam } from '@/components/ui/border-beam'
import { Component as GeneratingLoader } from '@/components/ui/quantum-pulse-loade'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { useLocale } from '@/lib/i18n'
import type { Thumbnail } from '@/lib/types'
import { PRESETS, applyPreset } from '@/lib/presets'
import PresetSelector from './PresetSelector'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_ATTACHMENTS = 10
const MAX_ATTACHMENTS_PRECISION = 1
const REF_IMAGE_MAX_DIM = 1024 // max width/height for reference images sent to API

/** Resize an image blob to fit within maxDim, return { data: base64, mimeType } */
async function compressImageBlob(
  blob: Blob,
  maxDim: number
): Promise<{ data: string; mimeType: string }> {
  const bitmap = await createImageBitmap(blob)
  const { width, height } = bitmap

  let targetW = width
  let targetH = height
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height)
    targetW = Math.round(width * scale)
    targetH = Math.round(height * scale)
  }

  const canvas = new OffscreenCanvas(targetW, targetH)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close()

  const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
  const buffer = await outBlob.arrayBuffer()
  const base64 = btoa(
    new Uint8Array(buffer).reduce((s, b) => s + String.fromCharCode(b), '')
  )
  return { data: base64, mimeType: 'image/jpeg' }
}

interface Attachment {
  id: string
  url: string        // object URL (local file) or image_url (existing thumbnail)
  file?: File        // present for local uploads
  name: string
}

interface PromptAreaProps {
  onOpenPricing?: () => void
}

type Mode = 'generate' | 'precision'

export default function PromptArea({ onOpenPricing }: PromptAreaProps) {
  const { user } = useAuth()
  const { t } = useLocale()
  const [mode, setMode] = useState<Mode>('generate')
  const [value, setValue] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<Thumbnail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [existingThumbnails, setExistingThumbnails] = useState<Thumbnail[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [showExistingPopover, setShowExistingPopover] = useState(false)
  const [isPrecisionGenerating, setIsPrecisionGenerating] = useState(false)
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const existingBtnRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // Fetch user's existing thumbnails for the popover (paginated)
  const PAGE_SIZE = 20
  const [hasMoreThumbnails, setHasMoreThumbnails] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadExistingThumbnails = useCallback(async (offset = 0) => {
    if (!user) return
    if (offset > 0) setLoadingMore(true)
    const { data } = await supabase
      .from('thumbnails')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    if (data) {
      if (offset === 0) {
        setExistingThumbnails(data as Thumbnail[])
      } else {
        setExistingThumbnails((prev) => [...prev, ...(data as Thumbnail[])])
      }
      setHasMoreThumbnails(data.length === PAGE_SIZE)
    }
    setLoadingMore(false)
  }, [user, supabase])

  useEffect(() => { loadExistingThumbnails() }, [loadExistingThumbnails])

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const inBtn = existingBtnRef.current?.contains(target)
      const inPopover = popoverRef.current?.contains(target)
      if (!inBtn && !inPopover) {
        setShowExistingPopover(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Calculate popover position from button
  const openPopover = useCallback(() => {
    if (existingBtnRef.current) {
      const rect = existingBtnRef.current.getBoundingClientRect()
      setPopoverPos({ x: rect.left, y: rect.top })
    }
    setHasMoreThumbnails(true)
    loadExistingThumbnails(0)
    setShowExistingPopover(true)
  }, [loadExistingThumbnails])

  // Reset state when mode changes
  useEffect(() => {
    setPlaceholderIndex(0)
    setDisplayedPlaceholder('')
    setIsTyping(true)
    setSelectedPresetId(null)
  }, [mode])

  // Typewriter effect for placeholder
  const activePlaceholders = mode === 'precision' ? t.prompt.precisionPlaceholders : t.prompt.placeholders
  useEffect(() => {
    const target = activePlaceholders[placeholderIndex]
    let charIndex = 0

    if (isTyping) {
      intervalRef.current = setInterval(() => {
        charIndex++
        setDisplayedPlaceholder(target.slice(0, charIndex))
        if (charIndex >= target.length) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setTimeout(() => setIsTyping(false), 2000)
        }
      }, 40)
    } else {
      let remaining = target.length
      intervalRef.current = setInterval(() => {
        remaining--
        setDisplayedPlaceholder(target.slice(0, remaining))
        if (remaining <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setPlaceholderIndex((i) => (i + 1) % activePlaceholders.length)
          setIsTyping(true)
        }
      }, 25)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [placeholderIndex, isTyping, activePlaceholders])

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files)
    const errors: string[] = []

    const validFiles = fileArr.filter((f) => {
      if (!f.type.startsWith('image/')) {
        errors.push(`${f.name}: ${t.prompt.notAnImage}`)
        return false
      }
      if (f.size > MAX_FILE_SIZE) {
        errors.push(`${f.name}: ${t.prompt.exceeds5MB}`)
        return false
      }
      return true
    })

    setAttachments((prev) => {
      const max = mode === 'precision' ? MAX_ATTACHMENTS_PRECISION : MAX_ATTACHMENTS
      const remaining = max - prev.length
      if (remaining <= 0) {
        errors.push(t.prompt.maxAttachments.replace('{n}', String(max)))
        return prev
      }
      const toAdd = validFiles.slice(0, remaining)
      return [
        ...prev,
        ...toAdd.map((f) => ({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(f),
          file: f,
          name: f.name,
        })),
      ]
    })

    if (errors.length > 0) {
      setError(errors.join('. '))
      setTimeout(() => setError(null), 4000)
    }
  }, [t, mode])

  const attachExistingThumbnail = useCallback((thumb: Thumbnail) => {
    if (!thumb.image_url) return

    setAttachments((prev) => {
      const max = mode === 'precision' ? MAX_ATTACHMENTS_PRECISION : MAX_ATTACHMENTS
      if (prev.length >= max) return prev
      if (prev.some((a) => a.id === thumb.id)) return prev
      return [
        ...prev,
        {
          id: thumb.id,
          url: thumb.image_url!,
          name: thumb.prompt.slice(0, 30),
        },
      ]
    })
    setShowExistingPopover(false)
  }, [mode])

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((a) => a.id === id)
      if (removed?.file) URL.revokeObjectURL(removed.url)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault()
      if (!value.trim() || isGenerating || isPrecisionGenerating) return

      setIsGenerating(true)
      setError(null)
      setResult(null)

      try {
        // Build request body — compress all images to fit API limits
        const images: { data: string; mimeType: string }[] = []

        for (const att of attachments) {
          const blob = att.file
            ? att.file
            : await fetch(att.url).then((r) => r.blob())
          images.push(await compressImageBlob(blob, REF_IMAGE_MAX_DIM))
        }

        // Combine user prompt with preset if selected
        const userPrompt = value.trim()
        const selectedPreset = PRESETS.find((p) => p.id === selectedPresetId)
        const finalPrompt = selectedPreset
          ? applyPreset(selectedPreset.template, userPrompt)
          : userPrompt

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 200_000)

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userPrompt,
            ...(selectedPreset && { generationPrompt: finalPrompt }),
            ...(images.length > 0 && { images }),
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 402) {
            onOpenPricing?.()
            return
          }
          throw new Error(data.error || 'Generation failed')
        }

        setResult(data.thumbnail)
        setExistingThumbnails((prev) => [data.thumbnail, ...prev])
        setValue('')
        setAttachments([])
        setSelectedPresetId(null)
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      } catch (err: unknown) {
        const message =
          err instanceof DOMException && err.name === 'AbortError'
            ? t.prompt.timedOut
            : err instanceof Error ? err.message : t.prompt.somethingWentWrong
        setError(message)
      } finally {
        setIsGenerating(false)
      }
    },
    [value, isGenerating, attachments, selectedPresetId, t, onOpenPricing]
  )

  // Precision edit via Kontext — requires at least one image attached or a result
  const precisionAttachment = attachments.length > 0 ? attachments[attachments.length - 1] : null
  const precisionImageUrl = precisionAttachment?.url ?? result?.image_url ?? null
  const canPrecision = !!precisionImageUrl && !!value.trim() && !isGenerating && !isPrecisionGenerating

  const handlePrecision = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault()
      if (!precisionImageUrl || !value.trim() || isPrecisionGenerating) return

      setIsPrecisionGenerating(true)
      setError(null)
      setResult(null)

      try {
        // Convert blob URLs (local files) to data URIs so the server can use them
        let imageForApi = precisionImageUrl
        if (precisionAttachment?.file) {
          const buf = await precisionAttachment.file.arrayBuffer()
          const base64 = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''))
          imageForApi = `data:${precisionAttachment.file.type || 'image/png'};base64,${base64}`
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 200_000)

        const response = await fetch('/api/inpaint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: imageForApi,
            prompt: value.trim(),
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 402) {
            onOpenPricing?.()
            return
          }
          throw new Error(data.error || 'Precision edit failed')
        }

        setResult(data.thumbnail)
        setExistingThumbnails((prev) => [data.thumbnail, ...prev])
        setValue('')
        setAttachments([])
        setSelectedPresetId(null)
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      } catch (err: unknown) {
        const message =
          err instanceof DOMException && err.name === 'AbortError'
            ? t.prompt.timedOut
            : err instanceof Error ? err.message : t.prompt.somethingWentWrong
        setError(message)
      } finally {
        setIsPrecisionGenerating(false)
      }
    },
    [precisionImageUrl, precisionAttachment, value, isPrecisionGenerating, t, onOpenPricing]
  )

  const handleRetry = useCallback(() => {
    setError(null)
    setResult(null)
  }, [])

  const hasResult = result && result.image_url
  const hasError = !!error

  return (
    <div className="flex flex-col items-center justify-center px-6 w-full">
      {/* Title — only show when idle (no result/error/generating) */}
      {!hasResult && !hasError && !isGenerating && !isPrecisionGenerating && (
        <h2 className="mb-10 text-4xl font-bold font-handwriting text-foreground text-center leading-tight">
          {mode === 'precision' ? t.prompt.precisionHeading : t.prompt.heading}
        </h2>
      )}

      {/* Generating loader — above the prompt */}
      {(isGenerating || isPrecisionGenerating) && (
        <div className="mb-8 w-full max-w-2xl py-16 px-6">
          <GeneratingLoader />
        </div>
      )}

      {/* Result display — above the prompt */}
      {hasResult && (
        <div className="mb-8 w-full max-w-2xl">
          <div className="rounded-2xl overflow-hidden bg-foreground/[0.04] border border-foreground/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
            <div className="relative aspect-video">
              <Image
                src={result.image_url!}
                alt={result.prompt}
                fill
                sizes="(max-width: 672px) 100vw, 672px"
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-foreground/50 text-sm truncate">{result.prompt}</p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch(result.image_url!)
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `thumbnail-${result.id}.png`
                    a.click()
                    URL.revokeObjectURL(url)
                    setResult(null)
                  }}
                  className="px-4 py-2 rounded-lg bg-foreground/10 text-foreground text-sm font-medium cursor-pointer hover:bg-foreground/15 transition-colors"
                >
                  {t.prompt.download}
                </button>
                <button
                  type="button"
                  disabled={attachments.some((a) => a.id === result.id)}
                  onClick={() => {
                    attachExistingThumbnail(result)
                    setResult(null)
                  }}
                  className="px-4 py-2 rounded-lg bg-foreground/10 text-foreground text-sm font-medium cursor-pointer hover:bg-foreground/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {attachments.some((a) => a.id === result.id) ? t.prompt.attached : t.prompt.attachToPrompt}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error display — above the prompt */}
      {hasError && !isGenerating && (
        <div className="mb-8 w-full max-w-2xl">
          <div className="flex flex-col items-center gap-5 py-12 px-6 rounded-2xl bg-foreground/[0.04] border border-foreground/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
            <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <p className="text-foreground text-lg font-semibold">{t.prompt.generationFailed}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="px-6 py-2.5 rounded-xl bg-foreground/10 border border-foreground/[0.08] text-foreground text-sm font-medium cursor-pointer transition-colors hover:bg-foreground/15"
            >
              {t.prompt.tryAgain}
            </button>
          </div>
        </div>
      )}

      {/* Mode tabs */}
      <div className="w-full max-w-2xl mb-3 flex items-center gap-1 p-1 rounded-xl bg-foreground/[0.04]">
        <button
          type="button"
          onClick={() => setMode('generate')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            mode === 'generate'
              ? 'bg-foreground/[0.1] text-foreground shadow-sm'
              : 'text-foreground/40 hover:text-foreground/60'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <circle cx="12" cy="12" r="10" fill={mode === 'generate' ? '#D4A017' : 'currentColor'} opacity={mode === 'generate' ? 1 : 0.3} />
            <circle cx="12" cy="12" r="7.5" fill={mode === 'generate' ? '#FFD700' : 'currentColor'} opacity={mode === 'generate' ? 1 : 0.2} />
            <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill={mode === 'generate' ? '#8B6914' : 'currentColor'} opacity={mode === 'generate' ? 1 : 0.5} fontFamily="system-ui">C</text>
          </svg>
          {t.prompt.modeGenerate}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('precision')
            setAttachments((prev) => prev.slice(0, MAX_ATTACHMENTS_PRECISION))
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            mode === 'precision'
              ? 'bg-foreground/[0.1] text-foreground shadow-sm'
              : 'text-foreground/40 hover:text-foreground/60'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <circle cx="12" cy="12" r="10" fill={mode === 'precision' ? '#A8A8A8' : 'currentColor'} opacity={mode === 'precision' ? 1 : 0.3} />
            <circle cx="12" cy="12" r="7.5" fill={mode === 'precision' ? '#C0C0C0' : 'currentColor'} opacity={mode === 'precision' ? 1 : 0.2} />
            <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill={mode === 'precision' ? '#6B6B6B' : 'currentColor'} opacity={mode === 'precision' ? 1 : 0.5} fontFamily="system-ui">P</text>
          </svg>
          {t.prompt.modePrecision}
        </button>
      </div>

      {/* Prompt form */}
      <form onSubmit={mode === 'precision' ? handlePrecision : handleSubmit} className="relative w-full max-w-2xl rounded-2xl overflow-hidden bg-foreground/[0.06] border border-foreground/[0.1] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-all duration-200 focus-within:border-foreground/20 focus-within:shadow-[0_4px_32px_rgba(0,0,0,0.15)] dark:focus-within:shadow-[0_4px_32px_rgba(0,0,0,0.3)] focus-within:bg-foreground/[0.08]">
        {/* Precision mode: image required hint */}
        {mode === 'precision' && attachments.length === 0 && !result?.image_url && (
          <div className="flex items-center gap-2 px-5 pt-3 text-foreground/30 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {t.prompt.precisionImageRequired}
          </div>
        )}

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex gap-2 px-4 pt-4 pb-1 overflow-x-auto scrollbar-thin">
            {attachments.map((att) => (
              <div key={att.id} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-foreground/[0.1] group/att">
                <Image
                  src={att.url}
                  alt={att.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized={!!att.file}
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  aria-label={t.prompt.removeAttachment}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white/80 flex items-center justify-center opacity-0 group-hover/att:opacity-100 transition-opacity cursor-pointer"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            <span className="self-center text-foreground/20 text-xs shrink-0">
              {attachments.length}/{mode === 'precision' ? MAX_ATTACHMENTS_PRECISION : MAX_ATTACHMENTS}
            </span>
          </div>
        )}

        {/* Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            const el = e.target
            el.style.height = 'auto'
            el.style.height = `${el.scrollHeight}px`
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (value.trim() && !isGenerating) {
                textareaRef.current?.form?.requestSubmit()
              }
            }
          }}
          placeholder={displayedPlaceholder}
          disabled={isGenerating}
          rows={1}
          className="w-full px-6 pt-5 pb-3 bg-transparent text-foreground text-lg placeholder:text-foreground/25 outline-none disabled:opacity-50 resize-none overflow-hidden"
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 pb-3">
          {/* Left: existing thumbnails + attachment + mic */}
          <div className="flex items-center gap-1">
            {/* Existing thumbnails button */}
            <button
              ref={existingBtnRef}
              type="button"
              disabled={isGenerating}
              onMouseEnter={openPopover}
              onClick={openPopover}
              title={t.prompt.myThumbnails}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground/35 cursor-pointer transition-colors hover:text-foreground/70 hover:bg-foreground/[0.06] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {/* Grid/gallery icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>

            {/* Existing thumbnails popover — portaled to body to escape backdrop-blur containing block */}
            {showExistingPopover && existingThumbnails.length > 0 && popoverPos && createPortal(
              <div
                ref={popoverRef}
                style={{ left: popoverPos.x, top: popoverPos.y }}
                className="fixed -translate-y-full -mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-popover border border-border shadow-[0_8px_40px_rgba(0,0,0,0.3)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] p-3 scrollbar-thin z-[9999]"
                onMouseLeave={() => setShowExistingPopover(false)}
                onScroll={(e) => {
                  if (!hasMoreThumbnails || loadingMore) return
                  const el = e.currentTarget
                  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
                    loadExistingThumbnails(existingThumbnails.length)
                  }
                }}
              >
                <p className="px-2 py-1.5 text-foreground/40 text-xs font-semibold uppercase tracking-wide">
                  {t.prompt.attachExisting}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {existingThumbnails.map((thumb) => (
                    <button
                      key={thumb.id}
                      type="button"
                      onClick={() => attachExistingThumbnail(thumb)}
                      disabled={attachments.some((a) => a.id === thumb.id)}
                      className="relative aspect-video rounded-lg overflow-hidden border border-foreground/[0.06] cursor-pointer transition-all hover:border-foreground/[0.2] hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {thumb.image_url && (
                        <Image
                          src={thumb.image_url}
                          alt={thumb.prompt}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
                {loadingMore && (
                  <div className="flex justify-center py-3">
                    <span className="w-4 h-4 border-2 border-foreground/10 border-t-foreground/40 rounded-full animate-spin" />
                  </div>
                )}
              </div>,
              document.body,
            )}

            {/* File attachment button */}
            <button
              type="button"
              disabled={isGenerating || attachments.length >= (mode === 'precision' ? MAX_ATTACHMENTS_PRECISION : MAX_ATTACHMENTS)}
              onClick={() => fileInputRef.current?.click()}
              title={t.prompt.attachImages}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground/35 cursor-pointer transition-colors hover:text-foreground/70 hover:bg-foreground/[0.06] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              aria-label={t.prompt.uploadImages}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files)
                e.target.value = ''
              }}
            />

            {/* Mic button */}
            <button
              type="button"
              disabled={isGenerating}
              title={t.prompt.voiceInput}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground/35 cursor-pointer transition-colors hover:text-foreground/70 hover:bg-foreground/[0.06] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>

          {/* Right: single action button based on mode */}
          <div className="flex items-center gap-2">
            {mode === 'generate' ? (
              <button
                type="submit"
                disabled={isGenerating || !value.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background/20 border-t-background/80 rounded-full animate-spin" />
                    {t.prompt.generating}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <circle cx="12" cy="12" r="10" fill="#D4A017" />
                      <circle cx="12" cy="12" r="7.5" fill="#FFD700" />
                      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#8B6914" fontFamily="system-ui">C</text>
                    </svg>
                    {t.prompt.generate}
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canPrecision}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPrecisionGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background/20 border-t-background/80 rounded-full animate-spin" />
                    {t.prompt.generating}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <circle cx="12" cy="12" r="10" fill="#A8A8A8" />
                      <circle cx="12" cy="12" r="7.5" fill="#C0C0C0" />
                      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#6B6B6B" fontFamily="system-ui">P</text>
                    </svg>
                    {t.prompt.precisionEdit}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <BorderBeam
          duration={6}
          size={400}
          className="from-transparent via-[#FFD700] to-transparent"
        />
        <BorderBeam
          duration={6}
          delay={3}
          size={400}
          borderWidth={2}
          className="from-transparent via-[#C0C0C0] to-transparent"
        />
      </form>

      {/* Preset selector — generate mode only */}
      {mode === 'generate' && (
        <PresetSelector
          selectedPresetId={selectedPresetId}
          onSelect={setSelectedPresetId}
          disabled={isGenerating}
        />
      )}

      <p className="mt-4 text-foreground/30 text-sm">
        {mode === 'precision' ? t.prompt.precisionHelper : t.prompt.helper}
      </p>

    </div>
  )
}
