import React from 'react';
import { AlertCircle, Radio, MapPin, UserCheck, Stethoscope, CheckCircle2 } from 'lucide-react';

const lifecycle = [
  {
    step: '01',
    title: 'SOS Triggered',
    subtitle: 'Physical or Vocal Intent',
    desc: 'Pilgrim presses and holds the mobile SOS button for 2 seconds (with haptic feedback) or a bystander scans their QR wristband.',
    status: 'CRITICAL',
    statusColor: 'text-semantic-critical',
    icon: AlertCircle,
  },
  {
    step: '02',
    title: 'Alert Received',
    subtitle: 'Realtime WebSocket Push',
    desc: 'Supabase routes the event instantly to the active sector queue with exact latitude, longitude, and dindi association.',
    status: 'ACTIVE',
    statusColor: 'text-saffron-dark',
    icon: Radio,
  },
  {
    step: '03',
    title: 'Context Identified',
    subtitle: 'Instant Medical Dossier',
    desc: "The coordinator screen immediately populates the pilgrim's blood group, known allergies, chronic cardiac/asthma history, and emergency contact.",
    status: 'TRIAGED',
    statusColor: 'text-semantic-info',
    icon: MapPin,
  },
  {
    step: '04',
    title: 'Coordinator Responds',
    subtitle: 'Targeted Field Dispatch',
    desc: 'Coordinator acknowledges the alert, dispatches the nearest field volunteer with sector navigation, and alerts the Dindi leader.',
    status: 'IN RESPONSE',
    statusColor: 'text-semantic-warning',
    icon: UserCheck,
  },
  {
    step: '05',
    title: 'Medical Handover',
    subtitle: 'Mobile Clinic Arrival',
    desc: 'Paramedics and mobile clinic staff take over patient care equipped with full drug-allergy warnings and emergency notes.',
    status: 'MEDICAL CARE',
    statusColor: 'text-maroon',
    icon: Stethoscope,
  },
  {
    step: '06',
    title: 'Case Resolution',
    subtitle: 'Verified Safety & Family Loop',
    desc: "Incident is marked resolved in the shared database. The pilgrim's mobile status updates, and family contacts receive automated peace-of-mind confirmation.",
    status: 'RESOLVED',
    statusColor: 'text-semantic-success',
    icon: CheckCircle2,
  },
];

export const EmergencyFlowSection: React.FC = () => {
  return (
    <section id="emergency-flow" className="py-24 md:py-32 bg-parchment">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Section header */}
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-4">
            Mission-Critical Lifecycle
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-ink tracking-tight leading-[1.1] mb-5">
            From distress to resolution in six coordinated stages.
          </h2>
          <p className="text-lg text-ink-soft leading-relaxed max-w-[60ch]">
            Every emergency follows an immutable, coordinated protocol ensuring
            no call for help is lost in the crowd.
          </p>
        </div>

        {/* Vertical list with left-spine border — no card boxes */}
        <div className="relative">
          {/* Left spine line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-px bg-surface-border" aria-hidden="true" />

          <div className="flex flex-col gap-0">
            {lifecycle.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="group relative flex items-start gap-6 py-7 first:pt-0 last:pb-0">

                  {/* Icon dot on spine */}
                  <div className="shrink-0 w-11 flex items-center justify-center relative z-10">
                    <div className="w-9 h-9 rounded-full bg-parchment border border-surface-border flex items-center justify-center group-hover:border-saffron transition-colors">
                      <Icon className="w-4 h-4 text-muted group-hover:text-saffron transition-colors" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-7 border-b border-surface-border last:border-b-0 group-last:pb-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-muted mr-3">Stage {item.step}</span>
                        <h3 className="inline text-base font-semibold text-ink">{item.title}</h3>
                      </div>
                      {/* Status as plain colored text — no pill background */}
                      <span className={`shrink-0 text-[11px] font-bold uppercase tracking-wider ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                      {item.subtitle}
                    </div>
                    <p className="text-sm text-ink-soft leading-relaxed max-w-[65ch]">{item.desc}</p>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
