import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const FinalCTASection: React.FC = () => {
  return (
    <section className="py-20 md:py-28 bg-parchment-light border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl">

          <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-6">
            Experience The System
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink tracking-tightest leading-[1.1] mb-6">
            Explore the VariRaksha emergency safety ecosystem.
          </h2>

          <p className="text-base sm:text-lg text-ink-soft leading-relaxed mb-10 max-w-[60ch]">
            From the pilgrim's physical SOS trigger to the coordinator's live radar and
            instant QR medical cards, test how VariRaksha safeguards every kilometer of the Wari.
          </p>

          {/* Single primary CTA + one plain text secondary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Link
              href="/auth"
              className="inline-flex items-center gap-3 bg-saffron hover:bg-saffron-dark text-surface-white font-semibold text-base px-7 py-4 rounded-xl shadow-saffron transition-all hover:-translate-y-0.5"
            >
              <span>Sign In to VariRaksha</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#qr-medical"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-saffron transition-colors"
            >
              <span>View Emergency ID demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};
