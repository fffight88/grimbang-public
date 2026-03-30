'use client'

import Image from 'next/image'
import { useLocale } from '@/lib/i18n'
import { useEffect, useState, useRef } from 'react'

const FEATURE_IMAGES = [
  '/main/1.png',
  '/main/2-1.png',
  '/main/3.png',
  '/main/4.png',
  '/main/5-1.png',
] as const

const DEMO_PROMPTS = {
  en: 'Top 5 Seoul bakery cafes to visit + thumbnail hook in Korean',
  ko: '서울 베이커리까페 top5 소개 영상 썸네일 + 한국어 후킹메세지',
} as const

function TypingDemo() {
  const { locale } = useLocale()
  const prompt = DEMO_PROMPTS[locale]
  const [displayedText, setDisplayedText] = useState('')
  const [phase, setPhase] = useState<'typing' | 'generating' | 'reveal'>('typing')
  const [started, setStarted] = useState(false)
  const [cycle, setCycle] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isVisibleRef = useRef(false)

  // Intersection observer — set started once, track visibility via ref
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.4 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [started])

  // Animation sequence — runs on first visibility, then repeats via cycle
  useEffect(() => {
    if (!started) return

    let cancelled = false
    let charIndex = 0
    const timers: ReturnType<typeof setTimeout>[] = []

    setDisplayedText('')
    setPhase('typing')

    // Phase 1: typing
    const typeInterval = setInterval(() => {
      if (cancelled) return
      charIndex++
      setDisplayedText(prompt.slice(0, charIndex))
      if (charIndex >= prompt.length) {
        clearInterval(typeInterval)
        // Phase 2: generating
        timers.push(setTimeout(() => {
          if (cancelled) return
          setPhase('generating')
          // Phase 3: reveal
          timers.push(setTimeout(() => {
            if (cancelled) return
            setPhase('reveal')
            // Wait 10s then restart only if still visible
            timers.push(setTimeout(() => {
              if (cancelled) return
              if (isVisibleRef.current) {
                setCycle(c => c + 1)
              }
            }, 10000))
          }, 1500))
        }, 400))
      }
    }, 45)

    return () => {
      cancelled = true
      clearInterval(typeInterval)
      timers.forEach(t => clearTimeout(t))
    }
  }, [started, prompt, cycle])

  const { t } = useLocale()

  return (
    <div ref={ref} className="relative w-full h-full flex flex-col">
      {/* Mock prompt box — mirrors real PromptArea style */}
      <div className="relative z-10 rounded-none rounded-t-2xl bg-white/[0.06] border-b border-white/[0.1] backdrop-blur-xl">
        {/* Textarea area */}
        <div className="px-5 pt-4 pb-2">
          <span className="text-white/80 text-sm md:text-base leading-relaxed break-keep">
            {displayedText}
            {phase === 'typing' && (
              <span className="inline-block w-[2px] h-[16px] bg-white/70 ml-0.5 animate-pulse align-middle" />
            )}
            {phase !== 'typing' && !displayedText && (
              <span className="text-white/25 text-sm md:text-base">{t.prompt.placeholders[0]}</span>
            )}
          </span>
        </div>

        {/* Toolbar — mirrors real PromptArea bottom bar */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          {/* Left: fake icon buttons */}
          <div className="flex items-center gap-0.5">
            {/* Grid icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            {/* Attachment icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </div>
            {/* Mic icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
          </div>

          {/* Right: fake Generate button */}
          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              phase === 'generating'
                ? 'bg-white text-black/80'
                : 'bg-white/[0.08] border border-white/[0.1] text-white/40'
            }`}>
              {phase === 'generating' ? (
                <>
                  <div className="w-3 h-3 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
                  <span>{t.prompt.generating}</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <circle cx="12" cy="12" r="10" fill="#D4A017" />
                    <circle cx="12" cy="12" r="7.5" fill="#FFD700" />
                    <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#8B6914" fontFamily="system-ui">C</text>
                  </svg>
                  <span>{t.prompt.generate}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail reveal */}
      <div className="relative flex-1 overflow-hidden">
        <div
          className={`absolute inset-0 transition-all duration-700 ease-out ${
            phase === 'reveal'
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          <Image
            src="/main/1.png"
            alt="Generated thumbnail demo"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 66vw"
          />
        </div>
        {/* Placeholder before reveal */}
        {phase !== 'reveal' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BeforeAfterSlider() {
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const updatePosition = (clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setSliderPos((x / rect.width) * 100)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    updatePosition(e.clientX)
  }

  const handlePointerUp = () => {
    isDragging.current = false
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/9] overflow-hidden cursor-col-resize select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* After image (full, behind) */}
      <Image
        src="/main/5-2.png"
        alt="After — edited"
        fill
        className="object-cover pointer-events-none"
        sizes="(max-width: 768px) 100vw, 66vw"
        draggable={false}
      />

      {/* Before image (clipped by slider) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <Image
          src="/main/5-1.png"
          alt="Before — original"
          fill
          className="object-cover pointer-events-none"
          sizes="(max-width: 768px) 100vw, 66vw"
          draggable={false}
        />
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 z-10 pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        {/* Vertical line */}
        <div className="absolute top-0 bottom-0 -translate-x-1/2 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
        {/* Handle circle */}
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round">
            <path d="M8 4l-6 8 6 8" />
            <path d="M16 4l6 8-6 8" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 z-10">
        <span className="px-2.5 py-1 rounded-md bg-black/60 text-white text-xs font-semibold backdrop-blur-sm">
          Before
        </span>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <span className="px-2.5 py-1 rounded-md bg-emerald-500/80 text-white text-xs font-semibold backdrop-blur-sm">
          After
        </span>
      </div>
    </div>
  )
}

export default function Features() {
  const { t } = useLocale()

  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-3">
            {t.features.label}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            {t.features.heading}
          </h2>
          <p className="mt-4 text-lg text-white/50 max-w-md mx-auto">
            {t.features.subheading}
          </p>
        </div>

        {/* Feature rows — each feature takes full width */}
        <div className="flex flex-col gap-6">
          {FEATURE_IMAGES.map((image, i) => (
            <div
              key={i}
              className={`group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.08] transition-colors hover:bg-white/[0.05] hover:border-white/[0.12] grid grid-cols-1 md:grid-cols-3 ${
                i % 2 === 1 ? 'md:direction-rtl' : ''
              }`}
            >
              {/* Image / Demo */}
              <div className={`relative md:col-span-2 ${i % 2 === 1 ? 'md:order-2 md:direction-ltr' : ''}`}>
                {i === 0 ? (
                  <div className="relative w-full aspect-[16/9]">
                    <TypingDemo />
                  </div>
                ) : i === 1 ? (
                  /* Card 2: Before/After text comparison */
                  <div className="relative w-full aspect-[16/9] grid grid-cols-2 bg-black/40">
                    {/* Others — broken text */}
                    <div className="relative overflow-hidden flex items-center justify-center">
                      <Image
                        src="/main/2-2.png"
                        alt="Other AI — broken text"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
                        <span className="px-3 py-1 rounded-full bg-red-500/80 text-white text-xs font-semibold backdrop-blur-sm">
                          Others
                        </span>
                      </div>
                    </div>
                    {/* Grimbang — clean text */}
                    <div className="relative overflow-hidden flex items-center justify-center ">
                      <Image
                        src="/main/2-1.png"
                        alt="Grimbang — crisp text"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/80 text-white text-xs font-semibold backdrop-blur-sm">
                          GRIMBANG
                        </span>
                      </div>
                    </div>
                  </div>
                ) : i === 2 ? (
                  /* Card 3: Rule of thirds + focal point overlay */
                  <div className="relative w-full aspect-[16/9] overflow-hidden">
                    <Image
                      src={image}
                      alt={t.features.items[i].title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 66vw"
                    />
                    {/* Rule of thirds grid lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Vertical lines */}
                      <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/30" />
                      <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/30" />
                      {/* Horizontal lines */}
                      <div className="absolute left-0 right-0 top-1/3 h-px bg-white/30" />
                      <div className="absolute left-0 right-0 top-2/3 h-px bg-white/30" />
                      {/* Focal point indicators at intersections */}
                      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                      <div className="absolute top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                      <div className="absolute top-2/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                      <div className="absolute top-2/3 left-2/3 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                      {/* Analysis labels */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/80 text-white text-[10px] font-semibold backdrop-blur-sm">
                          Rule of Thirds
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/80 text-white text-[10px] font-semibold backdrop-blur-sm">
                          High Contrast
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/80 text-white text-[10px] font-semibold backdrop-blur-sm">
                          Focal Point
                        </span>
                      </div>
                    </div>
                  </div>
                ) : i === 3 ? (
                  /* Card 4: Zoom-in loupe for 2K detail */
                  <div className="relative w-full aspect-[16/9] overflow-hidden">
                    <Image
                      src={image}
                      alt={t.features.items[i].title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 66vw"
                    />
                    {/* Zoom loupe — target area on hanbok (right side of image) */}
                    <div className="absolute pointer-events-none border-2 border-dashed border-white/60 rounded-sm" style={{ top: '50%', left: '58%', width: '18%', height: '35%' }} />
                    {/* Zoomed detail panel (left side to not cover the subject) */}
                    <div className="absolute top-3 left-3 w-[35%] aspect-square rounded-lg border-2 border-white/60 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                      <Image
                        src={image}
                        alt="Zoomed detail"
                        fill
                        className="object-cover scale-[3] origin-[92%_78%]"
                        sizes="200px"
                      />
                      {/* Zoom label */}
                      <div className="absolute bottom-1.5 right-1.5 z-10">
                        <span className="px-1.5 py-0.5 rounded bg-white/90 text-black text-[10px] font-bold">
                          3x ZOOM
                        </span>
                      </div>
                    </div>
                    {/* Resolution badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 rounded-md bg-white/90 text-black text-xs font-bold">
                        2K
                      </span>
                    </div>
                  </div>
                ) : i === 4 ? (
                  /* Card 5: Before/After slider for Precision Edit */
                  <BeforeAfterSlider />
                ) : (
                  <div className="relative w-full aspect-[16/9] overflow-hidden">
                    <Image
                      src={image}
                      alt={t.features.items[i].title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 66vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className={`flex flex-col justify-center p-8 ${i % 2 === 1 ? 'md:order-1 md:direction-ltr' : ''}`}>
                <h3 className="text-white font-semibold text-xl md:text-2xl">
                  {t.features.items[i].title}
                </h3>
                <p className="mt-3 text-white/40 text-sm md:text-base leading-relaxed">
                  {t.features.items[i].description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
