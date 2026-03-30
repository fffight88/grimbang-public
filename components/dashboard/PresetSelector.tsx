'use client'

import Image from 'next/image'
import { useLocale } from '@/lib/i18n'
import { PRESETS } from '@/lib/presets'

const PRESET_LABEL_MAP: Record<string, keyof ReturnType<typeof useLocale>['t']['preset']> = {
  'viral-impact': 'viralImpact',
  'epic-story': 'epicStory',
  'k-webtoon-pop': 'kWebtoonPop',
  'tech-future': 'techFuture',
  'versus-battle': 'versusBattle',
  'curiosity-reveal': 'curiosityReveal',
  'glow-up': 'glowUp',
  'bold-headline': 'boldHeadline',
  'soft-minimal': 'softMinimal',
  'dark-tension': 'darkTension',
}

interface PresetSelectorProps {
  selectedPresetId: string | null
  onSelect: (presetId: string | null) => void
  disabled?: boolean
}

export default function PresetSelector({ selectedPresetId, onSelect, disabled }: PresetSelectorProps) {
  const { t } = useLocale()

  return (
    <div className="flex flex-col items-center gap-3 mt-4 w-full max-w-2xl">
      <p className="text-foreground/30 text-sm font-bold">
        {t.preset.label}
      </p>
      <div className="grid grid-cols-5 gap-3">
        {PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id
          const labelKey = PRESET_LABEL_MAP[preset.id]
          const label = labelKey ? t.preset[labelKey] : preset.id

          return (
            <div key={preset.id} className="relative group">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(isSelected ? null : preset.id)}
                className={`
                  relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer
                  disabled:opacity-30 disabled:cursor-not-allowed
                  ${isSelected
                    ? 'border-foreground/50 ring-2 ring-foreground/20 scale-110'
                    : 'border-foreground/[0.08] hover:border-foreground/25 hover:scale-105'
                  }
                `}
              >
                <Image
                  src={preset.icon}
                  alt={label}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
              {/* Instant tooltip */}
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
