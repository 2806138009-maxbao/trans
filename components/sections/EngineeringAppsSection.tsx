import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { Eyebrow, GradientText } from './SectionHelpers';

interface EngineeringAppsSectionProps {
  lang: Language;
  reducedMotion?: boolean;
}

export const EngineeringAppsSection = React.forwardRef<HTMLDivElement, EngineeringAppsSectionProps>(({ lang, reducedMotion }, ref) => {
  const t = TRANSLATIONS[lang];
  const motionClass = reducedMotion ? '' : 'fade-up';

  return (
    <section ref={ref} className={`w-full relative px-6 ${motionClass}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <Eyebrow label={t.engineeringTitle} color="#479CFF" />
        <h2 className="text-4xl md:text-5xl font-bold">
          <GradientText>{t.engineeringTitle}</GradientText>
        </h2>
        <p className="text-lg text-[#D0D6E0] leading-relaxed max-w-3xl">{t.engineeringLead}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {t.engineeringItems.map((item, idx) => (
            <TiltCard key={idx} glowColor="rgba(94,106,210,0.4)">
              <div className="p-6 space-y-2">
                <div className="text-sm uppercase tracking-[0.2em] text-[#8A8F98]">{item.title}</div>
                <p className="text-[#D0D6E0] text-sm leading-relaxed">{item.desc}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
});

EngineeringAppsSection.displayName = 'EngineeringAppsSection';
