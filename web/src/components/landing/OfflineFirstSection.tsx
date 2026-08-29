import React from 'react';
import { WifiOff, HardDrive, Radio, RefreshCw, CloudUpload } from 'lucide-react';

const steps = [
  {
    num: '01',
    title: 'Zero Cellular Signal',
    desc: 'Mobile towers drop in ghat sections, dense crowds, or remote rural walking stretches.',
    icon: WifiOff,
    stat: { label: 'tower blackout zones on route', value: '40+' },
  },
  {
    num: '02',
    title: 'Local SQLite Queue',
    desc: 'SOS alerts and vital medical dossiers are instantly stored and encrypted in on-device SQLite.',
    icon: HardDrive,
    stat: { label: 'data stored offline per pilgrim', value: '<4 KB' },
  },
  {
    num: '03',
    title: 'Device Relay Concept',
    desc: 'Packets relay optimistically between nearby pilgrim devices along the moving Dindi column.',
    icon: Radio,
    stat: { label: 'relay range per node', value: '~150 m' },
  },
  {
    num: '04',
    title: 'Connectivity Restored',
    desc: 'The moment any single connected node reaches 2G/3G/4G, buffered events flush immediately.',
    icon: RefreshCw,
    stat: { label: 'sync latency on reconnect', value: '<1 sec' },
  },
  {
    num: '05',
    title: 'Supabase Cloud Sync',
    desc: 'Coordinator dashboards and medical queues update in real time with the original incident timestamp.',
    icon: CloudUpload,
    stat: { label: 'single source of truth', value: 'PostgreSQL' },
  },
];

export const OfflineFirstSection: React.FC = () => {
  return (
    <section id="offline" className="py-24 md:py-32 bg-parchment border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Section header */}
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-4">
            Offline-First Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-ink tracking-tight leading-[1.1] mb-5">
            Engineered for the reality of zero connectivity.
          </h2>
          <p className="text-lg text-ink-soft leading-relaxed max-w-[60ch]">
            Digital emergency systems that require constant 4G or 5G coverage fail in
            the densest crowd surges. VariRaksha is built from the ground up to never
            drop an emergency call.
          </p>
        </div>

        {/* List-row steps — same grammar as the rest of the page */}
        <div className="flex flex-col divide-y divide-surface-border">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="group flex items-start gap-6 py-6 first:pt-0 last:pb-0 hover:bg-parchment-light/40 transition-colors -mx-3 px-3 rounded-lg"
              >
                <Icon className="w-5 h-5 text-muted group-hover:text-saffron transition-colors shrink-0 mt-0.5" strokeWidth={1.5} />

                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-muted mb-0.5">
                    Layer {step.num}
                  </div>
                  <div className="text-base font-semibold text-ink mb-1">{step.title}</div>
                  <div className="text-sm text-ink-soft leading-relaxed max-w-[60ch]">{step.desc}</div>
                </div>

                {/* Right: stat value */}
                <div className="shrink-0 text-right hidden sm:block">
                  <div className="text-xl font-bold text-ink-deep">{step.stat.value}</div>
                  <div className="text-[11px] text-muted mt-0.5 max-w-[12ch] text-right leading-tight">
                    {step.stat.label}
                  </div>
                </div>

                <svg
                  className="w-4 h-4 text-muted group-hover:text-saffron transition-colors shrink-0 mt-0.5 sm:hidden"
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

        {/* Technical note — plain borderless, no card chrome */}
        <div className="mt-12 pt-8 border-t border-surface-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-sm text-ink-soft max-w-[65ch] leading-relaxed">
            Hardware-level BLE mesh relays and encrypted SQLite storage run natively on
            the mobile app. The Next.js web application provides instant browser-based
            triage dashboards when connected to the shared Supabase cloud.
          </p>
          <span className="shrink-0 text-xs font-mono text-saffron-dark font-semibold tracking-wide">
            PostgreSQL · SQLite · BLE Relay
          </span>
        </div>

      </div>
    </section>
  );
};
