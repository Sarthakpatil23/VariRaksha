import React from 'react';
import Link from 'next/link';
import { ArrowRight, QrCode, Shield, LogIn } from 'lucide-react';

export const FinalCTASection: React.FC = () => {
  return (
    <section className="py-20 md:py-28 bg-parchment-light border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="relative rounded-3xl bg-surface-white border-2 border-surface-border p-8 sm:p-12 md:p-16 shadow-elevated overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-maroon/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-parchment border border-surface-border text-saffron text-xs font-bold uppercase tracking-widest mb-6">
              <Shield className="w-3.5 h-3.5" />
              <span>Experience The System</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-ink tracking-tightest leading-[1.12] mb-6">
              Explore the VariRaksha emergency safety ecosystem.
            </h2>

            <p className="text-base sm:text-lg text-ink-soft leading-relaxed font-normal mb-10 max-w-2xl">
              From the pilgrim’s physical SOS trigger to the coordinator’s live radar and
              instant QR medical cards, test how VariRaksha safeguards every kilometer of the Wari.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-3 bg-saffron hover:bg-saffron-dark text-surface-white font-semibold text-base px-8 py-4 rounded-xl shadow-saffron transition-all transform hover:-translate-y-0.5"
              >
                <span>Sign In to VariRaksha</span>
                <LogIn className="w-5 h-5" />
              </Link>

              <a
                href="#qr-medical"
                className="inline-flex items-center justify-center gap-2 bg-parchment hover:bg-surface-white text-ink border border-surface-border font-semibold text-base px-7 py-4 rounded-xl transition-all shadow-sm"
              >
                <QrCode className="w-4 h-4 text-saffron" />
                <span>View Emergency ID Demo</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
