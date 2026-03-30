'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import DashboardNavbar from '@/components/dashboard/DashboardNavbar'
import PromptArea from '@/components/dashboard/PromptArea'
import Sidebar from '@/components/dashboard/Sidebar'
import PricingModal from '@/components/dashboard/PricingModal'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/?login=true')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground/80 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div
      className="min-h-screen flex flex-col bg-background dashboard-grid"
    >
      <DashboardNavbar
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onOpenPricing={() => setPricingOpen(true)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-12 lg:ml-72 transition-[margin] duration-300">
        <PromptArea onOpenPricing={() => setPricingOpen(true)} />
      </main>

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </div>
  )
}
