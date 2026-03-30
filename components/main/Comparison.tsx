'use client'

import { useLocale } from '@/lib/i18n'

const CHECK = (
  <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const CROSS = (
  <svg className="w-4 h-4 shrink-0 text-red-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const DASH = (
  <svg className="w-4 h-4 shrink-0 text-yellow-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
  </svg>
)

export default function Comparison() {
  const { t } = useLocale()
  const c = t.comparison

  const options = [
    {
      name: c.designer.name,
      cost: c.designer.cost,
      time: c.designer.time,
      rows: [CROSS, CROSS, DASH, CROSS],
      highlighted: false,
    },
    {
      name: c.diy.name,
      cost: c.diy.cost,
      time: c.diy.time,
      rows: [DASH, CROSS, DASH, CROSS],
      highlighted: false,
    },
    {
      name: c.grimbang.name,
      cost: c.grimbang.cost,
      time: c.grimbang.time,
      rows: [CHECK, CHECK, CHECK, CHECK],
      highlighted: true,
    },
  ]

  const criteria = [c.criteria.instant, c.criteria.koreanText, c.criteria.aiComposition, c.criteria.precisionEdit]

  return (
    <section id="compare" className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-3">
            {c.label}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            {c.heading}
          </h2>
          <p className="mt-4 text-lg text-white/50 max-w-lg mx-auto">
            {c.subheading}
          </p>
        </div>

        {/* Comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {options.map((opt) => (
            <div
              key={opt.name}
              className={`relative rounded-2xl p-7 flex flex-col ${
                opt.highlighted
                  ? 'bg-white/[0.06] border border-white/[0.15] ring-1 ring-white/[0.08]'
                  : 'bg-white/[0.03] border border-white/[0.08]'
              }`}
            >
              {opt.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white/[0.12] text-white/80 text-xs font-semibold uppercase tracking-wider border border-white/[0.1]">
                  {c.recommended}
                </span>
              )}

              {/* Name */}
              <p className={`text-sm font-semibold uppercase tracking-widest ${opt.highlighted ? 'text-white/70' : 'text-white/40'}`}>
                {opt.name}
              </p>

              {/* Cost */}
              <p className={`mt-4 font-bold whitespace-nowrap ${opt.highlighted ? 'text-3xl text-white' : 'text-2xl text-white/70'}`}>
                {opt.cost}
              </p>

              {/* Time */}
              <p className="mt-1 text-sm text-white/40">
                {opt.time}
              </p>

              {/* Divider */}
              <div className="mt-5 mb-5 h-px bg-white/[0.08]" />

              {/* Criteria rows */}
              <ul className="space-y-3.5">
                {criteria.map((label, i) => (
                  <li key={label} className="flex items-center gap-3 text-sm text-white/60">
                    {opt.rows[i]}
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
