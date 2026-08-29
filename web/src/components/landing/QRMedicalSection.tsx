import React from 'react';
import { QrCode, Heart, AlertTriangle, Phone, ShieldCheck, Check, Smartphone, Globe } from 'lucide-react';

export const QRMedicalSection: React.FC = () => {
  return (
    <section id="qr-medical" className="py-24 md:py-32 bg-parchment">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Realistic Interactive Emergency Medical Card Mockup */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-md bg-surface-white border-2 border-surface-border rounded-3xl p-6 sm:p-8 shadow-elevated">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-6 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-maroon flex items-center justify-center text-surface-white font-bold text-lg shadow-sm">
                    B+
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-saffron">
                      Official Medical ID Card
                    </span>
                    <h4 className="text-xl font-bold text-ink">Ramesh Kulkarni</h4>
                    <p className="text-xs text-muted font-medium">
                      Male · Age 68 · Dindi #12 (Sant Tukaram)
                    </p>
                  </div>
                </div>

                <div className="w-14 h-14 p-1.5 rounded-xl bg-parchment-light border border-surface-border flex items-center justify-center">
                  <QrCode className="w-full h-full text-ink" />
                </div>
              </div>

              {/* Critical Medical Parameters */}
              <div className="py-5 space-y-4">
                {/* Blood & Critical Alert */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-parchment-light border border-surface-border">
                    <div className="flex items-center gap-1.5 text-maroon text-xs font-bold uppercase tracking-wider mb-1">
                      <Heart className="w-3.5 h-3.5" />
                      <span>Blood Group</span>
                    </div>
                    <div className="text-lg font-extrabold text-ink">B Positive (B+)</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-semantic-critical/10 border border-semantic-critical/20">
                    <div className="flex items-center gap-1.5 text-semantic-critical text-xs font-bold uppercase tracking-wider mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Severe Allergy</span>
                    </div>
                    <div className="text-base font-extrabold text-semantic-critical">Penicillin</div>
                  </div>
                </div>

                {/* Chronic Conditions & Medications */}
                <div className="p-3.5 rounded-xl bg-parchment-light border border-surface-border">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                    Chronic Conditions & Medications
                  </div>
                  <div className="text-sm font-semibold text-ink mb-1">
                    Hypertension (High BP) · Mild Asthma
                  </div>
                  <div className="text-xs text-ink-soft">
                    Daily Medication: Amlodipine 5mg (Morning)
                  </div>
                </div>

                {/* Dindi Leader & Family Contacts */}
                <div className="p-3.5 rounded-xl bg-parchment-light border border-surface-border flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Dindi Leader (ह.भ.प. सोपानराव महाराज)
                    </div>
                    <div className="text-sm font-bold text-ink">+91 98765 43210</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-saffron text-surface-white flex items-center justify-center shadow-sm">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Verification Stamp */}
              <div className="pt-4 border-t border-surface-border flex items-center justify-between text-xs text-muted">
                <div className="flex items-center gap-1.5 text-semantic-success font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Medical Record</span>
                </div>
                <span className="font-mono text-[11px]">ID: VK-9284-MH</span>
              </div>
            </div>
          </div>

          {/* Right Column: Universal QR Routing Explanation */}
          <div className="lg:col-span-6">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-saffron mb-3">
              Zero App-Dependency Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-ink tracking-tight leading-[1.14] mb-6">
              One scan. Immediate medical context.
            </h2>
            <p className="text-lg text-ink-soft leading-relaxed font-normal mb-8">
              Every Varkari is equipped with a universal HTTPS QR wristband or badge.
              When scanned by any standard smartphone camera, the system intelligently
              adapts to the rescuer’s device.
            </p>

            {/* Universal Flow Cards */}
            <div className="space-y-4 mb-8">
              <div className="p-5 rounded-2xl bg-surface-white border border-surface-border flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink mb-1">
                    App Installed → Native App Opens
                  </h3>
                  <p className="text-sm text-ink-soft leading-relaxed">
                    Android App Links and iOS Universal Links open the full authenticated
                    volunteer/doctor profile natively with one tap.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-surface-white border border-surface-border flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-semantic-info/10 text-semantic-info flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink mb-1">
                    No App Installed → Instant Web Card
                  </h3>
                  <p className="text-sm text-ink-soft leading-relaxed">
                    Any nearby citizen or village doctor lands directly on the Next.js
                    public emergency card (<span className="font-mono text-xs text-saffron-dark">/p/[id]</span>)
                    with zero app installation required.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Advantages */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-ink-soft">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-semantic-success" />
                <span>Zero app install barrier</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-semantic-success" />
                <span>One-tap leader calling</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-semantic-success" />
                <span>Emergency contact relay</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-semantic-success" />
                <span>Protected by Supabase RLS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
