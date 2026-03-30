'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#181818',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      {/* Header */}
      <nav className="flex items-center justify-between px-8 h-16 border-b border-white/[0.06]">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Image
            src="/grimbang_logo_dark.webp"
            alt="Grimbang logo"
            width={30}
            height={30}
            className="object-contain"
          />
        </Link>
        <Link
          href="/"
          className="text-white/50 text-sm transition-colors hover:text-white/80"
        >
          Back to Home
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-white text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/30 text-sm mb-12">Last updated: February 22, 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-white/80 text-lg font-semibold mb-3">1. Information We Collect</h2>
            <div className="text-white/40 text-sm leading-relaxed space-y-3">
              <p>
                When you use Grimbang, we collect information necessary to provide and improve our service:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-white/50">Account Information:</strong> Name, email address, and profile picture from your Google account when you sign in.</li>
                <li><strong className="text-white/50">Usage Data:</strong> Prompts you submit, thumbnails you generate, and interaction history within the dashboard.</li>
                <li><strong className="text-white/50">Payment Information:</strong> Subscription plan, transaction history, and billing details processed securely through our payment provider (Polar).</li>
                <li><strong className="text-white/50">Device Information:</strong> Browser type, operating system, and IP address for security and analytics purposes.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-white/80 text-lg font-semibold mb-3">2. How We Use Your Information</h2>
            <div className="text-white/40 text-sm leading-relaxed space-y-3">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To generate AI-powered thumbnails based on your prompts</li>
                <li>To manage your account, subscription, and credit balance</li>
                <li>To improve the quality of our AI generation models and service</li>
                <li>To communicate service updates, billing notices, and support responses</li>
                <li>To detect and prevent fraud, abuse, or unauthorized access</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-white/80 text-lg font-semibold mb-3">3. Data Storage & Security</h2>
            <div className="text-white/40 text-sm leading-relaxed space-y-3">
              <p>
                Your data is stored securely using Supabase infrastructure with encryption at rest and in transit.
                Generated thumbnails are stored in secure cloud storage and are accessible only to your account.
              </p>
              <p>
                We implement industry-standard security measures including SSL/TLS encryption,
                Row Level Security (RLS) policies, and secure authentication via OAuth 2.0.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-white/80 text-lg font-semibold mb-3">4. Third-Party Services</h2>
            <div className="text-white/40 text-sm leading-relaxed space-y-3">
              <p>We use the following third-party services to operate Grimbang:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-white/50">Google (Gemini API):</strong> For AI-powered thumbnail generation. Prompts and attached images are sent to Google&apos;s API for processing.</li>
                <li><strong className="text-white/50">Supabase:</strong> For authentication, database, and file storage.</li>
                <li><strong className="text-white/50">Polar:</strong> For payment processing and subscription management.</li>
              </ul>
              <p>
                Each third-party provider operates under their own privacy policy. We recommend reviewing their policies for details on how they handle data.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-white/80 text-lg font-semibold mb-3">5. Your Rights</h2>
            <div className="text-white/40 text-sm leading-relaxed space-y-3">
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Access the personal information we hold about you</li>
                <li>Request correction or deletion of your data</li>
                <li>Export your generated thumbnails at any time</li>
                <li>Cancel your subscription and delete your account</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at the email address provided below.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-white/80 text-lg font-semibold mb-3">6. Cookies</h2>
            <div className="text-white/40 text-sm leading-relaxed space-y-3">
              <p>
                We use essential cookies to maintain your authentication session and preferences.
                We do not use third-party tracking or advertising cookies.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-white/80 text-lg font-semibold mb-3">7. Changes to This Policy</h2>
            <div className="text-white/40 text-sm leading-relaxed space-y-3">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any significant changes
                by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-white/80 text-lg font-semibold mb-3">8. Contact</h2>
            <div className="text-white/40 text-sm leading-relaxed">
              <p>
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:gogrimbang@gmail.com" className="text-white/60 underline underline-offset-2 transition-colors hover:text-white/80">
                  gogrimbang@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
