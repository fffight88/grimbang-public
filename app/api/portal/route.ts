import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { polar } from '@/lib/polar'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find Polar customer by external ID (Supabase user ID)
    const customer = await polar.customers.getExternal({
      externalId: user.id,
    })

    // Create authenticated customer portal session
    const session = await polar.customerSessions.create({
      customerId: customer.id,
    })

    return NextResponse.json({ url: session.customerPortalUrl })
  } catch (error: unknown) {
    console.error('Portal error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to create portal session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
