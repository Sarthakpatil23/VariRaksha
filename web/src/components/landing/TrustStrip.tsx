import React from 'react';
import { WifiOff, Zap, FileText, QrCode, Users, HeartPulse } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  const capabilities = [
    { label: 'OFFLINE-FIRST MESH', icon: WifiOff },
    { label: 'REALTIME DISPATCH', icon: Zap },
    { label: 'INSTANT MEDICAL ID', icon: FileText },
    { label: 'UNIVERSAL QR ACCESS', icon: QrCode },
    { label: 'DINDI RADAR SAFETY', icon: Users },
    { label: 'ROLE-BASED RESPONSE', icon: HeartPulse },
  ];

  return (
    <section className="border-y border-surface-border bg-parchment-light/80 py-5">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-6 text-ink-soft">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.label}
                className="flex items-center gap-2.5 text-[11px] sm:text-xs font-bold tracking-widest uppercase"
              >
                <Icon className="w-3.5 h-3.5 text-saffron" />
                <span>{cap.label}</span>
                {idx < capabilities.length - 1 && (
                  <span className="hidden lg:inline-block ml-6 text-surface-border font-light">
                    /
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
