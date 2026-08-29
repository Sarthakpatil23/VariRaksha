import React from 'react';
import { QrCode, Heart, AlertTriangle, Phone, ShieldCheck, Smartphone, Globe } from 'lucide-react';

const qrRoutes = [
  {
    icon: Smartphone,
    title: 'App Installed → Native App Opens',
    desc: 'Android App Links and iOS Universal Links open the full authenticated volunteer/doctor profile natively with one tap.',
  },
  {
    icon: Globe,
    title: 'No App → Instant Web Emergency Card',
    desc: (
      <>
        Any nearby citizen or village doctor lands directly on the Next.js public emergency card{' '}
        <span className="font-mono text-xs text-saffron-dark">/p/[id]</span> with zero app installation required.
      </>
    ),
  },
];

const advantages = [
  'Zero app install barrier',
  'One-tap leader calling',
  'Emergency contact relay',
  'Protected by Supabase RLS',
];

export const QRMedicalSection: React.FC = () => {
  return (
    <section id="qr-medical" className="py-24 md:py-32 bg-parchment">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

          {/* Left: Physical ID card mockup — legitimate bordered object */}
          <div className="lg:col-span-5">
            <div className="mx-auto max-w-sm bg-surface-white border border-surface-border rounded-2xl p-6 shadow-card">

              {/* Card header */}
              <div className="flex items-center justify-between pb-5 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-maroon flex items-center justify-center text-surface-white font-bold text-base shadow-sm">
                    B+
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-saffron block">
                      Official Medical ID Card
                    </span>
                    <h4 className="text-lg font-bold text-ink leading-tight">Ramesh Kulkarni</h4>
                    <p className="text-xs text-muted">Male · Age 68 · Dindi #12</p>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-parchment-light border border-surface-border flex items-center justify-center shrink-0">
                  <QrCode className="w-7 h-7 text-ink" />
                </div>
              </div>

              {/* Medical data — plain list rows, no inner cards */}
              <div className="py-4 flex flex-col divide-y divide-surface-border">
                <div className="flex items-center justify-between py-3 first:pt-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider">
                    <Heart className="w-3.5 h-3.5 text-maroon" strokeWidth={1.5} />
                    Blood Group
                  </div>
                  <span className="text-base font-bold text-ink">B Positive (B+)</span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-semantic-critical">
                    <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Severe Allergy
                  </div>
                  <span className="text-base font-bold text-semantic-critical">Penicillin</span>
                </div>

                <div className="py-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                    Chronic Conditions
                  </div>
                  <div className="text-sm font-semibold text-ink">Hypertension · Mild Asthma</div>
                  <div className="text-xs text-ink-soft mt-0.5">Amlodipine 5mg (Morning)</div>
                </div>

                <div className="flex items-center justify-between py-3 last:pb-0">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Dindi Leader
                    </div>
                    <div className="text-sm font-bold text-ink">+91 98765 43210</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-saffron flex items-center justify-center shadow-sm">
                    <Phone className="w-4 h-4 text-surface-white" />
                  </div>
                </div>
              </div>

              {/* Verification footer */}
              <div className="pt-4 border-t border-surface-border flex items-center justify-between text-xs text-muted">
                <div className="flex items-center gap-1.5 text-semantic-success font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Verified Medical Record
                </div>
                <span className="font-mono text-[11px]">VK-9284-MH</span>
              </div>
            </div>
          </div>

          {/* Right: plain list rows — no bordered boxes */}
          <div className="lg:col-span-7">
            <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-4">
              Zero App-Dependency Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-ink tracking-tight leading-[1.1] mb-5">
              One scan. Immediate medical context.
            </h2>
            <p className="text-lg text-ink-soft leading-relaxed mb-10 max-w-[55ch]">
              Every Varkari is equipped with a universal HTTPS QR wristband or badge.
              When scanned by any standard smartphone camera, the system intelligently
              adapts to the rescuer's device.
            </p>

            {/* QR routing — list rows, no card boxes */}
            <div className="flex flex-col divide-y divide-surface-border mb-10">
              {qrRoutes.map((route) => {
                const Icon = route.icon;
                return (
                  <div
                    key={route.title}
                    className="group flex items-start gap-5 py-6 first:pt-0 last:pb-0 hover:bg-parchment-light/40 -mx-3 px-3 rounded-lg transition-colors"
                  >
                    <Icon className="w-5 h-5 text-muted group-hover:text-saffron transition-colors shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <div className="text-sm font-semibold text-ink mb-1">{route.title}</div>
                      <div className="text-sm text-ink-soft leading-relaxed">{route.desc}</div>
                    </div>
                    <svg
                      className="w-4 h-4 text-muted group-hover:text-saffron transition-colors shrink-0 mt-0.5 ml-auto"
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

            {/* Advantage stat rows */}
            <div className="flex flex-col divide-y divide-surface-border border-t border-surface-border">
              {advantages.map((adv) => (
                <div key={adv} className="flex items-center justify-between py-3">
                  <span className="text-sm text-ink-soft">{adv}</span>
                  <svg className="w-4 h-4 text-semantic-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
