'use client';

import React from 'react';
import { ArrowRight, ShieldAlert, Sparkles, Activity, QrCode } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[92vh] flex items-center pt-28 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Cinematic Wari Hero Background Asset */}
      <div
        className="absolute inset-0 bg-cover bg-[position:80%_center] lg:bg-[position:center_right] opacity-95"
        style={{
          backgroundImage: "url('/images/Langing_page.png')",
        }}
      />

      {/* Warm Parchment Editorial Gradient Overlay */}
      <div className="absolute inset-0 hero-parchment-fade pointer-events-none" />

      {/* Subtle bottom section blend */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-parchment to-transparent pointer-events-none" />

      {/* Hero Content Container */}
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full z-10">
        <div className="max-w-2xl lg:max-w-2xl">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-parchment-light/90 border border-surface-border backdrop-blur-sm mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-saffron-dark">
              Built for the Pandharpur Wari
            </span>
            <span className="text-surface-border">|</span>
            <span className="text-[11px] font-medium text-ink-soft">
              वारी रक्षण व्यवस्था
            </span>
          </div>

          {/* Large Editorial Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold text-ink tracking-tightest leading-[1.08] mb-6 text-balance">
            Protection that{' '}
            <span className="font-serif italic font-normal text-saffron-dark tracking-normal">
              reaches you,
            </span>{' '}
            even when the network doesn’t.
          </h1>

          {/* Supporting Copy */}
          <p className="text-lg sm:text-xl text-ink-soft/90 leading-relaxed font-normal mb-8 max-w-xl text-balance">
            A connected emergency safety ecosystem for Varkaris, Dindi leaders,
            coordinators, medical responders, and families across hundreds of
            kilometers of the sacred pilgrimage.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-12">
            <a
              href="#emergency-flow"
              className="inline-flex items-center justify-center gap-3 bg-saffron hover:bg-saffron-dark text-surface-white font-semibold text-base px-7 py-4 rounded-xl shadow-saffron transition-all transform hover:-translate-y-0.5"
            >
              <span>Explore Safety System</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 bg-parchment-light/80 hover:bg-surface-white text-ink border border-surface-border font-semibold text-base px-6 py-4 rounded-xl transition-all shadow-sm"
            >
              <span>How It Works</span>
            </a>
          </div>

          {/* Live System Pillars Overview Pill */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-surface-border/60 max-w-lg">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-saffron font-bold text-xs uppercase tracking-wider mb-0.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>2-Sec SOS</span>
              </div>
              <span className="text-xs text-muted">Zero-confusion trigger</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-saffron font-bold text-xs uppercase tracking-wider mb-0.5">
                <QrCode className="w-3.5 h-3.5" />
                <span>Universal QR</span>
              </div>
              <span className="text-xs text-muted">Instant web medical ID</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-saffron font-bold text-xs uppercase tracking-wider mb-0.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Offline-First</span>
              </div>
              <span className="text-xs text-muted">Resilient local sync</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
