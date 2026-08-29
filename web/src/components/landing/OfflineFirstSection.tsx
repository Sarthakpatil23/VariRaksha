import React from 'react';
import { WifiOff, HardDrive, Radio, RefreshCw, CloudUpload, ShieldCheck } from 'lucide-react';

export const OfflineFirstSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Zero Cellular Signal',
      desc: 'Mobile towers drop in ghat sections, dense crowds, or remote rural walking stretches.',
      icon: WifiOff,
    },
    {
      num: '02',
      title: 'Local SQLite Queue',
      desc: 'SOS alerts and vital medical dossiers are instantly stored and encrypted in on-device SQLite.',
      icon: HardDrive,
    },
    {
      num: '03',
      title: 'Device Relay Concept',
      desc: 'Packets relay optimistically between nearby pilgrim devices along the moving Dindi column.',
      icon: Radio,
    },
    {
      num: '04',
      title: 'Connectivity Restored',
      desc: 'The moment any single connected node reaches 2G/3G/4G coverage, buffered events flush immediately.',
      icon: RefreshCw,
    },
    {
      num: '05',
      title: 'Supabase Cloud Sync',
      desc: 'Coordinator dashboards and medical queues update in real time with the original incident timestamp.',
      icon: CloudUpload,
    },
  ];

  return (
    <section id="offline" className="py-24 md:py-32 bg-ink text-parchment-light relative overflow-hidden">
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-maroon/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-white/10 border border-surface-white/15 text-saffron text-xs font-bold uppercase tracking-widest mb-4">
            <span>Offline-First Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-surface-white tracking-tight leading-[1.14] mb-6">
            Engineered for the reality of zero connectivity.
          </h2>
          <p className="text-lg text-parchment/80 leading-relaxed font-normal">
            Digital emergency systems that require constant 4G or 5G coverage fail in the
            densest crowd surges. VariRaksha is built from the ground up to never drop an emergency call.
          </p>
        </div>

        {/* 5-Step Offline Resilience Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-surface-white/5 border border-surface-white/10 rounded-2xl p-6 hover:bg-surface-white/10 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-saffron/20 text-saffron flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-parchment/50">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-surface-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-parchment/70 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-white/10 text-[10px] uppercase tracking-wider text-saffron font-bold">
                  Resilient Layer
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Boundary Clarification */}
        <div className="mt-12 p-6 rounded-2xl bg-surface-white/5 border border-surface-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-saffron shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-surface-white">
                Native Mobile + Web Specialization
              </div>
              <div className="text-xs text-parchment/70 max-w-2xl leading-relaxed mt-1">
                Hardware-level BLE mesh relays and encrypted SQLite storage run natively on
                the mobile app. The Next.js web application provides instant browser-based
                triage dashboards when connected to the shared Supabase cloud.
              </div>
            </div>
          </div>

          <div className="shrink-0 text-xs font-mono text-saffron bg-saffron/10 px-3.5 py-2 rounded-lg border border-saffron/20">
            PostgreSQL · SQLite · BLE Relay
          </div>
        </div>
      </div>
    </section>
  );
};
