import React from 'react';

export const MissionSection: React.FC = () => {
  return (
    <section className="py-24 md:py-36 bg-parchment border-t border-surface-border">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">

        <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-8">
          The Purpose Behind The System
        </div>

        <blockquote className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[42px] text-ink leading-[1.3] mb-10 max-w-[28ch]">
          "The point isn't the technology. The point is getting help to the person who needs it — across every kilometer of the sacred journey."
        </blockquote>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-8 border-t border-surface-border">
          <span className="font-devanagari text-saffron-dark font-bold text-base sm:text-lg">
            वारी रक्षण, वारकरी रक्षण
          </span>
          <span className="hidden sm:block text-surface-border">—</span>
          <span className="text-sm text-muted">अखंड सेवा, अभंग सुरक्षा</span>
        </div>

        <p className="text-sm text-muted mt-4 max-w-[60ch] leading-relaxed">
          Dedicated to the millions of devotees, leaders, and responders walking together
          from Alandi and Dehu to the sacred feet of Lord Vitthala in Pandharpur.
        </p>

      </div>
    </section>
  );
};
