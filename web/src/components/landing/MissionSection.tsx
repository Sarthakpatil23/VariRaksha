import React from 'react';
import { Shield } from 'lucide-react';

export const MissionSection: React.FC = () => {
  return (
    <section className="py-24 md:py-36 bg-parchment relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-saffron/15 text-saffron-dark mb-8 shadow-sm">
          <Shield className="w-7 h-7" />
        </div>

        <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-6">
          The Purpose Behind The System
        </div>

        <blockquote className="font-serif italic text-2xl sm:text-3xl md:text-4xl lg:text-[42px] text-ink leading-[1.3] mb-10 text-balance">
          “The point isn’t the technology. The point is getting help to the
          person who needs it — across every kilometer of the sacred journey.”
        </blockquote>

        <div className="inline-block px-6 py-2.5 rounded-full bg-parchment-light border border-surface-border text-xs sm:text-sm font-semibold text-ink-soft mb-2 shadow-sm">
          <span className="font-devanagari text-saffron-dark font-bold text-sm sm:text-base mr-2">
            वारी रक्षण, वारकरी रक्षण
          </span>
          — अखंड सेवा, अभंग सुरक्षा
        </div>

        <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto mt-4">
          Dedicated to the millions of devotees, leaders, and responders walking together
          from Alandi and Dehu to the sacred feet of Lord Vitthala in Pandharpur.
        </p>
      </div>
    </section>
  );
};
