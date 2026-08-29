import React from 'react';

export const ProblemSection: React.FC = () => {
  const problems = [
    {
      num: '01',
      title: 'Emergency aid is difficult to locate in massive processions',
      description:
        'Across 250+ km routes with massive crowds, discovering the nearest medical tent or ambulance in real time is nearly impossible without central tracking.',
    },
    {
      num: '02',
      title: 'Critical medical history is missing at the point of distress',
      description:
        'When an elderly pilgrim collapses from heat exhaustion or cardiac stress, responders have zero immediate access to blood group, severe allergies, or medication history.',
    },
    {
      num: '03',
      title: 'Cellular dead zones render traditional digital tools useless',
      description:
        'Crowd surges and remote rural ghats frequently jam mobile towers. Standard cloud-only applications fail right when connectivity is needed most.',
    },
    {
      num: '04',
      title: 'Vulnerable pilgrims need simple, accessible interactions',
      description:
        'Senior Varkaris cannot navigate complex apps or multi-step forms during panic. Safety triggers must be immediate, physical, and intuitive.',
    },
    {
      num: '05',
      title: 'Group separation leaves lost pilgrims isolated for hours',
      description:
        'When an individual drifts away from their Dindi flag, leaders have no real-time separation detection until evening roll call at the distant rest camp.',
    },
  ];

  return (
    <section id="problem" className="py-24 md:py-32 bg-parchment">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Large Editorial Statement */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-saffron mb-4">
              The Reality on the Ground
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-ink tracking-tight leading-[1.12] mb-6 text-balance">
              The Wari moves faster than traditional emergency systems.
            </h2>
            <p className="text-base sm:text-lg text-ink-soft leading-relaxed font-normal mb-8">
              A million pilgrims marching across open highways and rural ghats
              creates an extreme environment. The problem isn’t just medical
              supplies — it’s delivering the right context to the right person
              when seconds count.
            </p>

            <div className="p-6 rounded-2xl bg-parchment-light border border-surface-border">
              <div className="text-xs font-bold uppercase tracking-widest text-muted mb-1">
                Design Requirement
              </div>
              <div className="text-base font-semibold text-ink">
                Zero reliance on constant internet, and zero assumption that
                every rescuer has an app installed.
              </div>
            </div>
          </div>

          {/* Right Column: Numbered Issue Breakdown */}
          <div className="lg:col-span-7 flex flex-col divide-y divide-surface-border">
            {problems.map((prob) => (
              <div key={prob.num} className="py-8 first:pt-0 last:pb-0 group">
                <div className="flex items-start gap-6">
                  <span className="font-mono text-2xl lg:text-3xl font-bold text-saffron/70 group-hover:text-saffron transition-colors">
                    {prob.num}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-ink mb-2 tracking-tight group-hover:text-saffron-dark transition-colors">
                      {prob.title}
                    </h3>
                    <p className="text-base text-ink-soft/90 leading-relaxed">
                      {prob.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
