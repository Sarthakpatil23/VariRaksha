import React from 'react';
import { Layers, Database, Zap, QrCode, WifiOff, Users, FileHeart, HeartHandshake } from 'lucide-react';

const pillars = [
  {
    title: 'Native + Web Ecosystem',
    desc: 'Mobile handles native offline storage and sensors; web provides browser-based triage and instant QR fallback.',
    icon: Layers,
  },
  {
    title: 'Single Source of Truth',
    desc: 'A unified Supabase PostgreSQL backend ensures zero data fragmentation between mobile responders and web coordinators.',
    icon: Database,
  },
  {
    title: 'Realtime WebSocket Dispatch',
    desc: "Sub-second event propagation from the pilgrim's thumb directly onto the coordinator's active operational radar.",
    icon: Zap,
  },
  {
    title: 'Universal QR Interoperability',
    desc: 'Every badge points to a universal HTTPS route that opens native apps if installed or responsive web cards if not.',
    icon: QrCode,
  },
  {
    title: 'Offline SQLite Caching',
    desc: 'Critical medical dossiers and Dindi member rosters remain 100% accessible with zero internet access.',
    icon: WifiOff,
  },
  {
    title: 'Tailored Cognitive Roles',
    desc: "No confusing all-in-one screens. Varkaris get a single SOS button; doctors get triage queues; leaders get group radars.",
    icon: Users,
  },
  {
    title: 'Immediate Clinical Context',
    desc: 'Blood groups, critical drug allergies, and daily medications appear before paramedics reach the patient.',
    icon: FileHeart,
  },
  {
    title: 'Family Peace-of-Mind',
    desc: 'Automated verification updates sent to distant emergency contacts as pilgrims check into daily rest camps.',
    icon: HeartHandshake,
  },
];

export const DifferentiatorsSection: React.FC = () => {
  return (
    <section id="platform" className="py-24 md:py-32 bg-parchment-light border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Section header */}
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-4">
            Core Differentiators
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-ink tracking-tight leading-[1.1] mb-5">
            Why VariRaksha is different from ordinary safety apps.
          </h2>
          <p className="text-lg text-ink-soft leading-relaxed max-w-[60ch]">
            Generic safety applications assume high-speed mobile internet, tech-savvy users,
            and app installations. VariRaksha is engineered specifically for the physical, cultural,
            and technological reality of the Wari.
          </p>
        </div>

        {/* Two-column list rows — no card chrome */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
          <div className="flex flex-col divide-y divide-surface-border">
            {pillars.slice(0, 4).map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="group flex items-start gap-5 py-6 first:pt-0 last:pb-0 hover:bg-parchment/40 transition-colors -mx-3 px-3 rounded-lg"
                >
                  <Icon className="w-5 h-5 text-muted group-hover:text-saffron transition-colors shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink mb-1">{pillar.title}</div>
                    <div className="text-sm text-ink-soft leading-relaxed">{pillar.desc}</div>
                  </div>
                  <svg
                    className="w-4 h-4 text-muted group-hover:text-saffron transition-colors shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col divide-y divide-surface-border border-t md:border-t-0 border-surface-border">
            {pillars.slice(4).map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="group flex items-start gap-5 py-6 first:pt-4 md:first:pt-0 last:pb-0 hover:bg-parchment/40 transition-colors -mx-3 px-3 rounded-lg"
                >
                  <Icon className="w-5 h-5 text-muted group-hover:text-saffron transition-colors shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink mb-1">{pillar.title}</div>
                    <div className="text-sm text-ink-soft leading-relaxed">{pillar.desc}</div>
                  </div>
                  <svg
                    className="w-4 h-4 text-muted group-hover:text-saffron transition-colors shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
