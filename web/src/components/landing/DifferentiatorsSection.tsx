import React from 'react';
import {
  Layers,
  Database,
  Zap,
  QrCode,
  WifiOff,
  Users,
  FileHeart,
  HeartHandshake,
} from 'lucide-react';

export const DifferentiatorsSection: React.FC = () => {
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
      desc: 'Sub-second event propagation from the pilgrim’s thumb directly onto the coordinator’s active operational radar.',
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
      desc: 'No confusing all-in-one screens. Varkaris get a single SOS button; doctors get triage queues; leaders get group radars.',
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

  return (
    <section id="platform" className="py-24 md:py-32 bg-parchment-light border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 md:mb-20">
          <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-3">
            Core Differentiators
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-ink tracking-tight leading-[1.14] mb-6">
            Why VariRaksha is different from ordinary safety apps.
          </h2>
          <p className="text-lg text-ink-soft leading-relaxed font-normal">
            Generic safety applications assume high-speed mobile internet, tech-savvy users,
            and app installations. VariRaksha is engineered specifically for the physical, cultural,
            and technological reality of the Wari.
          </p>
        </div>

        {/* 8-Pillar Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-surface-white border border-surface-border rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-parchment flex items-center justify-center text-saffron group-hover:bg-saffron group-hover:text-surface-white transition-colors mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-ink mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-border/40 text-[10px] uppercase font-bold text-muted tracking-wider">
                  VariRaksha Pillar
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
