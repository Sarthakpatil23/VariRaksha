import React from 'react';
import { UserCheck, Database, Radio, Stethoscope, Users2, ArrowRight } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      role: '01. Pilgrim / Varkari',
      title: 'Emergency Trigger',
      desc: 'Holds the SOS button for 2 seconds or displays physical QR badge to a bypasser.',
      icon: UserCheck,
      badge: 'Native App or QR Badge',
    },
    {
      role: '02. Supabase Backend',
      title: 'Realtime Routing',
      desc: 'Validates user profile, medical history, and routes live WebSocket payload with GPS.',
      icon: Database,
      badge: 'PostgreSQL + Realtime',
    },
    {
      role: '03. Coordinator',
      title: 'Triage & Dispatch',
      desc: 'Verifies the incident on the live map and dispatches the closest mobile unit.',
      icon: Radio,
      badge: 'Web Command Dashboard',
    },
    {
      role: '04. Medical Responders',
      title: 'Informed Care',
      desc: 'Receives vital allergen warnings, blood group, and past conditions before arrival.',
      icon: Stethoscope,
      badge: 'Mobile Clinic Portal',
    },
    {
      role: '05. Emergency Contacts',
      title: 'Family Notification',
      desc: 'Automatic status updates sent to verified family members to provide peace of mind.',
      icon: Users2,
      badge: 'SMS / Direct Update',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-parchment-light border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 md:mb-20">
          <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-3">
            System Architecture In Action
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-ink tracking-tight leading-[1.14] mb-6">
            One connected safety system across mobile, web, and cloud.
          </h2>
          <p className="text-lg text-ink-soft leading-relaxed font-normal">
            VariRaksha unites every stakeholder in the pilgrimage lifecycle into a
            single, synchronized operational layer so help arrives with full
            medical context.
          </p>
        </div>

        {/* Conceptual Ecosystem Sequence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.role}
                className="relative bg-surface-white border border-surface-border rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group hover:-translate-y-1"
              >
                {/* Step Marker */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-parchment flex items-center justify-center text-saffron group-hover:bg-saffron group-hover:text-surface-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted px-2.5 py-1 rounded-md bg-parchment-light border border-surface-border">
                      Step {idx + 1}
                    </span>
                  </div>

                  <div className="text-xs font-bold uppercase tracking-wider text-saffron-dark mb-1">
                    {step.role}
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-2">{step.title}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed mb-6">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-surface-border/50 text-[11px] font-semibold text-muted">
                  {step.badge}
                </div>
              </div>
            );
          })}
        </div>

        {/* Key Realtime Flow Bar */}
        <div className="mt-12 p-6 rounded-2xl bg-parchment border border-surface-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-semantic-success animate-ping" />
            <div>
              <div className="text-sm font-bold text-ink">
                Bidirectional Realtime Synchronization
              </div>
              <div className="text-xs text-ink-soft">
                Triggered from mobile app → instantaneous alert on web dashboard → status acknowledgment updates back to mobile.
              </div>
            </div>
          </div>
          <a
            href="#emergency-flow"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-saffron-dark hover:text-saffron transition-colors"
          >
            <span>View Full 6-Step Response Lifecycle</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};
