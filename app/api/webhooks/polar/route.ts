import { Webhook, WebhookVerificationError } from 'standardwebhooks'
import { createAdminClient } from '@/lib/supabase/admin'

function getProductPlan(productId: string): string | null {
  if (productId === process.env.POLAR_STARTER_PRODUCT_ID) return 'starter'
  if (productId === process.env.POLAR_PRO_PRODUCT_ID) return 'pro'
  if (productId === process.env.POLAR_ULTRA_PRODUCT_ID) return 'ultra'
  if (productId === process.env.POLAR_PRECISION_30_PRODUCT_ID) return 'precision_30'
  if (productId === process.env.POLAR_PRECISION_100_PRODUCT_ID) return 'precision_100'
  return null
}

const PLAN_CREDITS: Record<string, number> = { starter: 30, pro: 100, ultra: 300 }
const ADDON_PRECISION_CREDITS: Record<string, number> = { precision_30: 30, precision_100: 100 }

export async function POST(request: Request) {
  const body = await request.text()
  const headers = Object.fromEntries(request.headers.entries())

  // Verify signature only — parse event ourselves to avoid SDK type validation errors
  const secret = Buffer.from(
    process.env.POLAR_WEBHOOK_SECRET!,
    'utf-8'
  ).toString('base64')
  const wh = new Webhook(secret)

  try {
    wh.verify(body, headers)
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return new Response('Invalid signature', { status: 403 })
    }
    throw e
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event: { type: string; data: any } = JSON.parse(body)
  console.log(`Webhook received: ${event.type}`)

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'order.paid':
        await handleOrderPaid(supabase, event.data)
        break
      case 'subscription.active':
        await handleSubscriptionActive(supabase, event.data)
        break
      case 'subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data)
        break
      case 'subscription.canceled':
        await handleSubscriptionCanceled(supabase, event.data)
        break
      case 'subscription.revoked':
        await handleSubscriptionRevoked(supabase, event.data)
        break
      case 'subscription.uncanceled':
        await handleSubscriptionUncanceled(supabase, event.data)
        break
    }
  } catch (error) {
    console.error(`Webhook error [${event.type}]:`, error)
    return new Response('Webhook handler error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = ReturnType<typeof createAdminClient>

/* ─── 1. 결제 완료 → payments 기록 + 크레딧 충전 ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderPaid(supabase: SupabaseAdmin, data: any) {
  const userId = data.customer?.external_id
  if (!userId) return

  const productId = data.product?.id
  const plan = productId ? getProductPlan(productId) : null
  if (!plan) return

  const orderId = data.id as string

  // Idempotency: skip if this order was already recorded
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('polar_checkout_id', orderId)
    .maybeSingle()

  if (existing) return

  const isAddon = plan.startsWith('precision_')
  const creditAmount = isAddon
    ? ADDON_PRECISION_CREDITS[plan]
    : PLAN_CREDITS[plan]

  // Insert payment record
  const { error: paymentError } = await supabase.from('payments').insert({
    user_id: userId,
    polar_checkout_id: orderId,
    plan,
    amount: data.amount ?? 0,
    credits: creditAmount,
    status: 'completed',
  })

  if (paymentError) {
    console.error('Failed to insert payment:', paymentError)
    throw paymentError
  }

  if (isAddon) {
    // Add-on: increment precision_credits
    const { error: creditError } = await supabase.rpc('increment_precision_credits', {
      uid: userId,
      amount: creditAmount,
    })
    if (creditError) {
      console.error('Failed to increment precision credits:', creditError)
      throw creditError
    }
  } else {
    // Base plan: increment regular credits
    const { error: creditError } = await supabase.rpc('increment_credits', {
      uid: userId,
      amount: creditAmount,
    })
    if (creditError) {
      console.error('Failed to increment credits:', creditError)
      throw creditError
    }
  }
}

/* ─── 2. 구독 활성화 → plan + status 업데이트 ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionActive(supabase: SupabaseAdmin, data: any) {
  const userId = data.customer?.external_id
  if (!userId) return

  const productId = data.product?.id
  const plan = productId ? getProductPlan(productId) : null
  if (!plan) return

  await supabase
    .from('users')
    .update({ plan, subscription_status: 'active' })
    .eq('id', userId)
}

/* ─── 3. 구독 변경 → plan/status 동기화만 (크레딧은 checkout API에서 처리) ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(supabase: SupabaseAdmin, data: any) {
  const userId = data.customer?.external_id
  if (!userId) return

  const productId = data.product?.id
  const newPlan = productId ? getProductPlan(productId) : null
  if (!newPlan) return

  await supabase
    .from('users')
    .update({ plan: newPlan, subscription_status: 'active' })
    .eq('id', userId)
}

/* ─── 4. 구독 취소 (기간 만료 전까지 유지) ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCanceled(supabase: SupabaseAdmin, data: any) {
  const userId = data.customer?.external_id
  if (!userId) return

  await supabase
    .from('users')
    .update({ subscription_status: 'canceled' })
    .eq('id', userId)
}

/* ─── 5. 구독 만료/해지 → free 플랜으로 전환 ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionRevoked(supabase: SupabaseAdmin, data: any) {
  const userId = data.customer?.external_id
  if (!userId) return

  await supabase
    .from('users')
    .update({ plan: 'free', subscription_status: 'inactive' })
    .eq('id', userId)
}

/* ─── 6. 구독 취소 철회 → 다시 active ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUncanceled(
  supabase: SupabaseAdmin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
) {
  const userId = data.customer?.external_id
  if (!userId) return

  await supabase
    .from('users')
    .update({ subscription_status: 'active' })
    .eq('id', userId)
}
