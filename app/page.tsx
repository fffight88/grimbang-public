'use client'

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/main/Navbar';
import { AnimatedMarqueeHero } from '@/components/main/hero/AnimatedMarqueeHero';
import Features from '@/components/main/Features';
import Comparison from '@/components/main/Comparison';
import Pricing from '@/components/main/Pricing';
import CTA from '@/components/main/CTA';
import Footer from '@/components/main/Footer';
import LoginModal from '@/components/main/LoginModal';
import { useLocale } from '@/lib/i18n';

const HERO_IMAGES = [
  '/main/1.png',
  '/main/2-1.png',
  '/main/3.png',
  '/main/4.png',
  '/main/5-1.png',
];

function HomeContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      setLoginOpen(true);
    }
  }, [searchParams]);

  const handleLoginClick = () => setLoginOpen(true);

  return (
    <main className="dark bg-black">
      <Navbar onLoginClick={handleLoginClick} />
      <AnimatedMarqueeHero
        tagline={t.hero.subtitle}
        title={t.hero.title}
        description={t.hero.description}
        ctaText={t.hero.cta}
        onCtaClick={handleLoginClick}
        images={HERO_IMAGES}
      />
      <Features />
      <Comparison />
      <Pricing onLoginClick={handleLoginClick} />
      <CTA onLoginClick={handleLoginClick} />
      <Footer />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
