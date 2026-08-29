import React from 'react';
import { User, Flag, Radio, Stethoscope, ShieldCheck, HeartHandshake } from 'lucide-react';

const roles = [
  {
    key: 'varkari',
    title: 'Varkari / Pilgrim',
    devanagari: 'वारकरी',
    purpose: 'Effortless safety, medical identity, and group connection.',
    icon: User,
    capabilities: [
      '2-Second tactile SOS trigger with accidental cancellation guard',
      'Offline-ready Medical ID card accessible with zero cellular network',
      'AI Voice Assistant in Marathi, Hindi & English for route queries',
      'Real-time distance and proximity to active Dindi flag',
    ],
  },
  {
    key: 'leader',
    title: 'Dindi Leader',
    devanagari: 'दिंडी प्रमुख',
    purpose: 'Full group roster visibility and separation detection.',
    icon: Flag,
    capabilities: [
      'Live roll-call radar and member drift alerts (e.g. 150m behind)',
      'One-tap broadcast announcements via offline BLE mesh relay',
      'Immediate notification when a group member triggers SOS',
    ],
  },
  {
    key: 'coordinator',
    title: 'Coordinator / Volunteer',
    devanagari: 'समन्वयक / स्वयंसेवक',
    purpose: 'Rapid incident triage and volunteer dispatching.',
    icon: Radio,
    capabilities: [
      'Sector-level live map with real-time incoming distress pins',
      'Direct responder dispatch with navigation to pilgrim coordinates',
      'Automated handoff tracking from triage to medical clinic',
    ],
  },
  {
    key: 'medical',
    title: 'Medical Staff',
    devanagari: 'वैद्यकीय पथक',
    purpose: 'Instant access to critical patient allergies and vitals.',
    icon: Stethoscope,
    capabilities: [
      'Instant triage queue filtered by severity (Critical / Moderate)',
      'Pre-arrival visibility of blood groups, cardiac risks, and allergies',
      'Hospital transfer documentation and clinical outcome logging',
    ],
  },
  {
    key: 'contacts',
    title: 'Emergency Contacts',
    devanagari: 'कुटुंब व नातेवाईक',
    purpose: 'Remote peace-of-mind and verifiable safety updates.',
    icon: HeartHandshake,
    capabilities: [
      'Automated SMS / WhatsApp notification on daily camp check-in',
      'Instant alert if pilgrim triggers SOS, with responder notes',
      'Direct contact link accessible to authorized medical staff',
    ],
  },
  {
    key: 'admin',
    title: 'Admin / Organizer',
    devanagari: 'प्रशासक',
    purpose: 'Comprehensive pilgrimage route and resource oversight.',
    icon: ShieldCheck,
    capabilities: [
      'Pilgrimage-wide sector fleet management (ambulances & clinics)',
      'Database administration, RLS audits, and volunteer verification',
      'Aggregate safety analytics across all participating Dindis',
    ],
  },
];

export const RoleEcosystemSection: React.FC = () => {
  return (
    <section id="roles" className="py-24 md:py-32 bg-parchment-light border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Section header */}
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-4">
            Ecosystem Stakeholders
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-ink tracking-tight leading-[1.1] mb-5">
            Purpose-built interfaces for every human in the response chain.
          </h2>
          <p className="text-lg text-ink-soft leading-relaxed max-w-[60ch]">
            Safety isn't a single dashboard. VariRaksha delivers tailored,
            cognitive-load-minimized tools to pilgrims, field responders, doctors,
            and distant family members.
          </p>
        </div>

        {/* Three-column list — exact Sarvam reference pattern */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-0 divide-y md:divide-y-0 divide-surface-border">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div key={role.key} className="group py-8 md:py-0 md:border-t border-surface-border first:border-t-0 md:first:border-t md:border-l first:md:border-l-0 md:pl-10 first:md:pl-0">

                {/* Column heading */}
                <div className="flex items-center gap-3 mb-1">
                  <Icon className="w-4 h-4 text-muted group-hover:text-saffron transition-colors" strokeWidth={1.5} />
                  <span className="text-base font-semibold text-ink">{role.title}</span>
                  <span className="font-devanagari text-xs text-saffron-dark">{role.devanagari}</span>
                </div>
                <p className="text-sm text-muted mb-6 leading-relaxed">{role.purpose}</p>

                {/* Capability list rows — hairline-divided */}
                <div className="flex flex-col divide-y divide-surface-border">
                  {role.capabilities.map((cap) => (
                    <div
                      key={cap}
                      className="group/row flex items-center justify-between py-3.5 first:pt-0 last:pb-0 cursor-default"
                    >
                      <span className="text-xs text-ink-soft leading-relaxed pr-4">{cap}</span>
                      <svg
                        className="w-3.5 h-3.5 text-muted group-hover/row:text-saffron transition-colors shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
