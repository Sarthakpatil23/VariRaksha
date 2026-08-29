'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[92vh] flex items-center pt-28 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Cinematic Wari Hero Background */}
      <div
        className="absolute inset-0 bg-cover bg-[position:80%_center] lg:bg-[position:center_right] opacity-95"
        style={{ backgroundImage: "url('/images/Langing_page.png')" }}
      />
      {/* Warm Parchment Editorial Gradient Overlay */}
      <div className="absolute inset-0 hero-parchment-fade pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-parchment to-transparent pointer-events-none" />

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full z-10">
        <div className="max-w-2xl">

          {/* Single legitimate eyebrow pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8"
            style={{ backgroundColor: '#FCE7D2', color: '#D97732' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
            <span className="text-[11px] font-bold uppercase tracking-widest">
              Built for the Pandharpur Wari · वारी रक्षण व्यवस्था
            </span>
          </div>

          {/* Large confident headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[68px] font-bold text-ink tracking-tightest leading-[1.06] mb-6">
            Protection by your side,<br />
            every step of the<br />
            sacred journey.
          </h1>

          {/* Supporting copy */}
          <p className="text-lg sm:text-xl text-ink-soft leading-relaxed font-normal mb-10 max-w-[60ch]">
            A connected emergency safety ecosystem for Varkaris, Dindi leaders,
            coordinators, and medical responders across hundreds of kilometers
            of the sacred pilgrimage.
          </p>

          {/* Single primary CTA + one plain text link */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Link
              href="/auth"
              className="inline-flex items-center gap-3 bg-saffron hover:bg-saffron-dark text-surface-white font-semibold text-base px-7 py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-saffron"
            >
              <span>Open VariRaksha</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-saffron transition-colors"
            >
              <span>Explore the safety flow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Stat row strip instead of icon-chip grid */}
          <div className="mt-12 pt-8 border-t border-surface-border flex flex-col sm:flex-row gap-0 max-w-lg divide-y sm:divide-y-0 sm:divide-x divide-surface-border">
            <div className="flex flex-col py-3 sm:py-0 sm:pr-8">
              <span className="text-2xl font-bold text-ink-deep tracking-tight">2 sec</span>
              <span className="text-xs text-muted mt-0.5">SOS trigger latency</span>
            </div>
            <div className="flex flex-col py-3 sm:py-0 sm:px-8">
              <span className="text-2xl font-bold text-ink-deep tracking-tight">Zero</span>
              <span className="text-xs text-muted mt-0.5">app install to scan QR</span>
            </div>
            <div className="flex flex-col py-3 sm:py-0 sm:pl-8">
              <span className="text-2xl font-bold text-ink-deep tracking-tight">100%</span>
              <span className="text-xs text-muted mt-0.5">offline medical ID access</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
