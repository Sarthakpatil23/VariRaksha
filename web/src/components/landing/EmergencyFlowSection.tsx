import React from 'react';
import { AlertCircle, Radio, MapPin, UserCheck, Stethoscope, CheckCircle2 } from 'lucide-react';

export const EmergencyFlowSection: React.FC = () => {
  const lifecycle = [
    {
      step: '01',
      title: 'SOS Triggered',
      subtitle: 'Physical or Vocal Intent',
      desc: 'Pilgrim presses and holds the mobile SOS button for 2 seconds (with haptic feedback) or a bystander scans their QR wristband.',
      status: 'CRITICAL',
      statusColor: 'bg-semantic-critical/10 text-semantic-critical border-semantic-critical/20',
      icon: AlertCircle,
    },
    {
      step: '02',
      title: 'Alert Received',
      subtitle: 'Realtime WebSocket Push',
      desc: 'Supabase routes the event instantly to the active sector queue with exact latitude, longitude, and dindi association.',
      status: 'ACTIVE',
      statusColor: 'bg-saffron/10 text-saffron-dark border-saffron/20',
      icon: Radio,
    },
    {
      step: '03',
      title: 'Context Identified',
      subtitle: 'Instant Medical Dossier',
      desc: 'The coordinator screen immediately populates the pilgrim’s blood group, known allergies, chronic cardiac/asthma history, and emergency contact.',
      status: 'TRIAGED',
      statusColor: 'bg-semantic-info/10 text-semantic-info border-semantic-info/20',
      icon: MapPin,
    },
    {
      step: '04',
      title: 'Coordinator Responds',
      subtitle: 'Targeted Field Dispatch',
      desc: 'Coordinator acknowledges the alert, dispatches the nearest field volunteer with sector navigation, and alerts the Dindi leader.',
      status: 'IN RESPONSE',
      statusColor: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20',
      icon: UserCheck,
    },
    {
      step: '05',
      title: 'Medical Handover',
      subtitle: 'Mobile Clinic Arrival',
      desc: 'Paramedics and mobile clinic staff take over patient care equipped with full drug-allergy warnings and emergency notes.',
      status: 'MEDICAL CARE',
      statusColor: 'bg-maroon/10 text-maroon border-maroon/20',
      icon: Stethoscope,
    },
    {
      step: '06',
      title: 'Case Resolution',
      subtitle: 'Verified Safety & Family Loop',
      desc: 'Incident is marked resolved in the shared database. The pilgrim’s mobile status updates, and family contacts receive automated peace-of-mind confirmation.',
      status: 'RESOLVED',
      statusColor: 'bg-semantic-success/10 text-semantic-success border-semantic-success/20',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="emergency-flow" className="py-24 md:py-32 bg-parchment">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-saffron mb-3">
            Mission-Critical Lifecycle
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-ink tracking-tight leading-[1.14] mb-6">
            From distress to resolution in six coordinated stages.
          </h2>
          <p className="text-lg text-ink-soft leading-relaxed font-normal">
            Every emergency follows an immutable, coordinated protocol ensuring
            no call for help is lost in the crowd.
          </p>
        </div>

        {/* 6-Step Response Lifecycle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {lifecycle.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-surface-white border border-surface-border rounded-2xl p-7 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xl font-bold text-saffron">
                        {item.step}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-parchment-light border border-surface-border flex items-center justify-center text-ink">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${item.statusColor}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-ink mb-1">{item.title}</h3>
                  <div className="text-xs font-semibold text-saffron-dark uppercase tracking-wider mb-3">
                    {item.subtitle}
                  </div>
                  <p className="text-sm text-ink-soft leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-border/50 text-[11px] text-muted flex items-center justify-between">
                  <span>Standard Protocol</span>
                  <span className="font-mono font-medium">Stage {item.step}/06</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
