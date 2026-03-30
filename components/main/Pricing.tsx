'use client'

import { BorderBeam } from '@/components/ui/border-beam'
import { useLocale } from '@/lib/i18n'

const PLANS_STATIC = [
  { name: 'Starter', price: 9.99, credits: 30, perUse: '$0.33', perUseKo: '₩430', popular: false },
  { name: 'Pro', price: 24.99, credits: 100, perUse: '$0.25', perUseKo: '₩325', popular: true },
  { name: 'Ultra', price: 59.99, credits: 300, perUse: '$0.20', perUseKo: '₩260', popular: false },
]

interface PricingProps {
  onLoginClick?: () => void
}

export default function Pricing({ onLoginClick }: PricingProps) {
  const { t, locale } = useLocale()

  const plans = PLANS_STATIC.map(p => ({
    ...p,
    perUseLabel: locale === 'ko' ? p.perUseKo : p.perUse,
  }))

  return (
    <section id="pricing" className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-3">
            {t.landingPricing.label}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            {t.landingPricing.heading}
          </h2>
          <p className="mt-4 text-lg text-white/50 max-w-md mx-auto">
            {t.landingPricing.subheading}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.popular
                  ? 'bg-white/[0.06] border border-white/[0.12]'
                  : 'bg-white/[0.03] border border-white/[0.08]'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white/[0.12] text-white/80 text-xs font-semibold uppercase tracking-wider border border-white/[0.1]">
                  {t.landingPricing.mostPopular}
                </span>
              )}

              {/* Plan name */}
              <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">
                {plan.name}
              </p>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">${plan.price}</span>
                <span className="text-white/40 text-sm">{t.landingPricing.month}</span>
              </div>

              {/* Per-use cost */}
              <p className="mt-2 text-white/40 text-sm">
                {plan.perUseLabel}{t.landingPricing.perUse}
              </p>

              {/* Divider */}
              <div className="mt-6 mb-6 h-px bg-white/[0.08]" />

              {/* Feature */}
              <div className="flex-1">
                <p className="flex items-start gap-3 text-sm text-white/60">
                  <svg
                    className="w-4 h-4 mt-0.5 shrink-0 text-white/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {t.landingPricing.features.creditsPerMonth.replace('{n}', String(plan.credits))}
                </p>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={onLoginClick}
                className={`mt-8 w-full block text-center py-3 rounded-xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 ${
                  plan.popular
                    ? 'bg-white text-[#181818]'
                    : 'bg-white/[0.08] text-white border border-white/[0.1]'
                }`}
              >
                {t.landingPricing.getPlan.replace('{name}', plan.name)}
              </button>

              {/* Border beam for popular plan */}
              {plan.popular && (
                <>
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
                </>
              )}
            </div>
          ))}
        </div>
        {/* Add-ons */}
        <div className="mt-12">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/30 mb-6">
            {t.landingPricing.addons.label}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              { name: 'Precision 30', uses: 30, price: 4.99 },
              { name: 'Precision 100', uses: 100, price: 9.99 },
            ].map((addon) => (
              <div
                key={addon.name}
                className="relative rounded-xl p-6 bg-white/[0.03] border border-white/[0.08] flex items-center justify-between"
              >
                <div>
                  <p className="text-white/70 text-sm font-semibold">{addon.name}</p>
                  <p className="text-white/40 text-xs mt-1">
                    {t.landingPricing.addons.description}
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    {t.landingPricing.addons.usesPerMonth.replace('{n}', String(addon.uses))}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4 flex flex-col items-end gap-2">
                  <div>
                    <p className="text-white text-xl font-bold">${addon.price}</p>
                    <p className="text-white/40 text-xs">{t.landingPricing.month}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onLoginClick}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/[0.08] text-white border border-white/[0.1] cursor-pointer transition-opacity hover:opacity-90"
                  >
                    {t.landingPricing.addons.getAddon.replace('{n}', String(addon.uses))}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
