import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { polar } from '@/lib/polar'

const PRODUCT_MAP: Record<string, string | undefined> = {
  starter: process.env.POLAR_STARTER_PRODUCT_ID,
  pro: process.env.POLAR_PRO_PRODUCT_ID,
  ultra: process.env.POLAR_ULTRA_PRODUCT_ID,
  precision_30: process.env.POLAR_PRECISION_30_PRODUCT_ID,
  precision_100: process.env.POLAR_PRECISION_100_PRODUCT_ID,
}

const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, ultra: 3 }
const PLAN_PRICE: Record<string, number> = { free: 0, starter: 999, pro: 2499, ultra: 5999 }

const ADDON_PLANS = new Set(['precision_30', 'precision_100'])

function getProductPlan(productId: string): string | null {
  if (productId === process.env.POLAR_STARTER_PRODUCT_ID) return 'starter'
  if (productId === process.env.POLAR_PRO_PRODUCT_ID) return 'pro'
  if (productId === process.env.POLAR_ULTRA_PRODUCT_ID) return 'ultra'
  if (productId === process.env.POLAR_PRECISION_30_PRODUCT_ID) return 'precision_30'
  if (productId === process.env.POLAR_PRECISION_100_PRODUCT_ID) return 'precision_100'
  return null
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const newPlan = body.plan as string
    const productId = PRODUCT_MAP[newPlan]

    if (!productId) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Add-ons: always create a new checkout (independent of base subscription)
    if (ADDON_PLANS.has(newPlan)) {
      const checkout = await polar.checkouts.create({
        products: [productId],
        customerEmail: user.email,
        externalCustomerId: user.id,
        successUrl: `${request.headers.get('origin')}/dashboard?checkout=success`,
      })
      return NextResponse.json({ url: checkout.url })
    }

    // Check if user already has an active subscription
    const subscriptions = await polar.subscriptions.list({
      externalCustomerId: user.id,
      active: true,
      limit: 1,
    })

    const activeSub = subscriptions.result.items[0]

    if (activeSub) {
      const oldPlan = getProductPlan(activeSub.productId) ?? 'free'

      if (oldPlan === newPlan) {
        return NextResponse.json(
          { error: 'Already on this plan' },
          { status: 400 }
        )
      }

      // Update subscription in Polar
      await polar.subscriptions.update({
        id: activeSub.id,
        subscriptionUpdate: { productId },
      })

      const admin = createAdminClient()
      const isUpgrade =
        (PLAN_RANK[newPlan] ?? 0) > (PLAN_RANK[oldPlan] ?? 0)

      // Update user plan immediately
      if (isUpgrade) {
        // Record upgrade payment
        const amount = (PLAN_PRICE[newPlan] ?? 0) - (PLAN_PRICE[oldPlan] ?? 0)
        await admin.from('payments').insert({
          user_id: user.id,
          polar_checkout_id: `upgrade_${activeSub.id}_${Date.now()}`,
          plan: newPlan,
          amount,
          credits: 200,
          status: 'completed',
        })

        // Upgrade: update plan + add 200 bonus credits atomically
        await admin
          .from('users')
          .update({ plan: newPlan, subscription_status: 'active' })
          .eq('id', user.id)
        await admin.rpc('increment_credits', {
          uid: user.id,
          amount: 200,
        })
      } else {
        // Downgrade: update plan only, takes effect next billing cycle
        await admin
          .from('users')
          .update({ plan: newPlan, subscription_status: 'active' })
          .eq('id', user.id)
      }

      return NextResponse.json({ upgraded: true })
    }

    // New subscription: create checkout
    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail: user.email,
      externalCustomerId: user.id,
      successUrl: `${request.headers.get('origin')}/dashboard?checkout=success`,
    })

    return NextResponse.json({ url: checkout.url })
  } catch (error: unknown) {
    console.error('Checkout error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to create checkout session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
