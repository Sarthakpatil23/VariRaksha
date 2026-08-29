import React from 'react';
import { UserCheck, Database, Radio, Stethoscope, Users2 } from 'lucide-react';

const steps = [
  {
    role: 'Pilgrim / Varkari',
    title: 'Emergency Trigger',
    desc: 'Holds the SOS button for 2 seconds or displays physical QR badge to a bypasser.',
    icon: UserCheck,
    via: 'Native App or QR Badge',
  },
  {
    role: 'Supabase Backend',
    title: 'Realtime Routing',
    desc: 'Validates user profile, medical history, and routes live WebSocket payload with GPS.',
    icon: Database,
    via: 'PostgreSQL + Realtime',
  },
  {
    role: 'Coordinator',
    title: 'Triage & Dispatch',
    desc: 'Verifies the incident on the live map and dispatches the closest mobile unit.',
    icon: Radio,
    via: 'Web Command Dashboard',
  },
  {
    role: 'Medical Responders',
    title: 'Informed Care',
    desc: 'Receives vital allergen warnings, blood group, and past conditions before arrival.',
    icon: Stethoscope,
    via: 'Mobile Clinic Portal',
  },
  {
    role: 'Emergency Contacts',
    title: 'Family Notification',
    desc: 'Automatic status updates sent to verified family members to provide peace of mind.',
    icon: Users2,
    via: 'SMS / Direct Update',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-parchment-light border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Section header */}
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-4">
            System Architecture In Action
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-ink tracking-tight leading-[1.1] mb-5">
            One connected safety system across mobile, web, and cloud.
          </h2>
          <p className="text-lg text-ink-soft leading-relaxed max-w-[60ch]">
            VariRaksha unites every stakeholder in the pilgrimage lifecycle into a
            single, synchronized operational layer so help arrives with full medical context.
          </p>
        </div>

        {/* List-row steps — no card boxes */}
        <div className="flex flex-col divide-y divide-surface-border">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.role}
                className="group flex items-start gap-6 py-6 first:pt-0 last:pb-0 hover:bg-parchment/60 transition-colors -mx-3 px-3 rounded-lg"
              >
                {/* Stroke icon — no tinted background square */}
                <div className="shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-muted group-hover:text-saffron transition-colors" strokeWidth={1.5} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-muted mb-0.5">
                    {step.role}
                  </div>
                  <div className="text-base font-semibold text-ink mb-1">{step.title}</div>
                  <div className="text-sm text-ink-soft leading-relaxed max-w-[60ch]">{step.desc}</div>
                </div>

                {/* Right-aligned via label + arrow */}
                <div className="shrink-0 flex items-center gap-3 text-right">
                  <span className="hidden md:block text-[11px] font-medium text-muted">{step.via}</span>
                  <svg
                    className="w-4 h-4 text-muted group-hover:text-saffron transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* Realtime note — plain text, no card chrome */}
        <div className="mt-12 pt-8 border-t border-surface-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-semantic-success shrink-0" />
            <span className="text-sm font-semibold text-ink">Bidirectional Realtime Synchronization</span>
            <span className="hidden md:inline text-sm text-ink-soft">
              — Mobile SOS → web dashboard → mobile status, all in under a second.
            </span>
          </div>
          <a
            href="#emergency-flow"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-saffron hover:text-saffron-dark transition-colors"
          >
            View full 6-stage lifecycle
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
};
