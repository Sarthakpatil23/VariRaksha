import React from 'react';
import {
  User,
  Flag,
  Radio,
  Stethoscope,
  ShieldCheck,
  HeartHandshake,
  CheckCircle,
} from 'lucide-react';

export const RoleEcosystemSection: React.FC = () => {
  const roles = [
    {
      key: 'varkari',
      badge: 'Core User',
      title: 'Varkari / Pilgrim',
      devanagari: 'वारकरी',
      purpose: 'Effortless safety, medical identity, and group connection.',
      icon: User,
      featured: true,
      capabilities: [
        '2-Second tactile SOS trigger with accidental cancellation guard',
        'Offline-ready Medical ID card accessible with zero cellular network',
        'AI Voice Assistant in Marathi, Hindi & English for route queries',
        'Real-time distance and proximity to active Dindi flag',
      ],
    },
    {
      key: 'leader',
      badge: 'Group Guardian',
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
      badge: 'Field Command',
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
      badge: 'Clinical Care',
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
      badge: 'Family Link',
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
      badge: 'System Overseer',
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

  return (
    <section id="roles" className="py-24 md:py-32 bg-parchment-light border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-3">
            Ecosystem Stakeholders
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-ink tracking-tight leading-[1.14] mb-6">
            Purpose-built interfaces for every human in the response chain.
          </h2>
          <p className="text-lg text-ink-soft leading-relaxed font-normal">
            Safety isn’t a single dashboard. VariRaksha delivers tailored,
            cognitive-load-minimized tools to pilgrims, field responders, doctors,
            and distant family members.
          </p>
        </div>

        {/* Asymmetric Role Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.key}
                className={`rounded-2xl p-7 border transition-all flex flex-col justify-between ${
                  role.featured
                    ? 'bg-surface-white border-saffron/40 shadow-elevated ring-1 ring-saffron/30'
                    : 'bg-surface-white border-surface-border shadow-card hover:shadow-elevated'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-parchment flex items-center justify-center text-saffron">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted px-2.5 py-1 rounded-md bg-parchment-light border border-surface-border">
                      {role.badge}
                    </span>
                  </div>

                  {/* Title & Devanagari */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="text-xl font-bold text-ink">{role.title}</h3>
                    <span className="font-devanagari text-xs text-saffron-dark font-medium">
                      {role.devanagari}
                    </span>
                  </div>

                  {/* Purpose */}
                  <p className="text-sm font-medium text-ink-soft mb-6">
                    {role.purpose}
                  </p>

                  {/* Capability List */}
                  <div className="space-y-2.5 pt-4 border-t border-surface-border/60">
                    {role.capabilities.map((cap) => (
                      <div key={cap} className="flex items-start gap-2.5 text-xs text-ink-soft leading-relaxed">
                        <CheckCircle className="w-4 h-4 text-semantic-success shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-surface-border/40 flex items-center justify-between text-[11px] font-semibold text-muted">
                  <span>Role Interface</span>
                  <span className="text-saffron-dark uppercase font-bold tracking-wider">
                    Optimized
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
