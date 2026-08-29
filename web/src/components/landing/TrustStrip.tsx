import React from 'react';

const stats = [
  { label: 'Pilgrims on route annually', value: '3M+' },
  { label: 'Emergency response stages', value: '6' },
  { label: 'Route kilometers covered', value: '250+' },
];

export const TrustStrip: React.FC = () => {
  return (
    <section className="border-y border-surface-border bg-parchment-light">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-surface-border">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-5 sm:py-6 sm:flex-1 sm:px-10 first:sm:pl-0 last:sm:pr-0">
              <span className="text-sm text-muted">{s.label}</span>
              <span className="text-2xl font-bold text-ink-deep tracking-tight">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
