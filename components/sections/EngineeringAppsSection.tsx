import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { GlowDot, GradientText, HoverText } from './SectionHelpers';
import { AnimateOnScroll } from '../AnimateOnScroll';

interface EngineeringAppsSectionProps {
  lang: Language;
  reducedMotion?: boolean;
  id?: string;
}

export const EngineeringAppsSection = React.forwardRef<HTMLDivElement, EngineeringAppsSectionProps>(({ lang, reducedMotion, id }, ref) => {
  const t = TRANSLATIONS[lang];

  if (reducedMotion) {
    return (
      <section id={id} ref={ref} className="w-full relative px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <GlowDot color="#479CFF" />
            <h2 className="text-4xl md:text-5xl font-bold">
              <GradientText>{t.engineeringTitle}</GradientText>
            </h2>
          </div>
          <p className="text-lg text-[#D0D6E0] leading-relaxed max-w-3xl hover-text">{t.engineeringLead}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.engineeringItems.map((item, idx) => (
              <TiltCard key={idx} glowColor="rgba(94,106,210,0.4)">
                <div className="p-6 space-y-2 group">
                  <div className="text-sm uppercase tracking-[0.2em] text-[#8A8F98] hover-text-subtle">{item.title}</div>
                  <p className="text-[#D0D6E0] text-sm leading-relaxed hover-text">{item.desc}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={id} ref={ref} className="w-full relative px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <AnimateOnScroll animation="fade-up">
          <div className="flex items-center gap-3">
            <GlowDot color="#479CFF" />
            <h2 className="text-4xl md:text-5xl font-bold">
              <GradientText>{t.engineeringTitle}</GradientText>
            </h2>
          </div>
        </AnimateOnScroll>
        
        <AnimateOnScroll animation="fade-up" delay={100}>
          <HoverText as="p" className="text-lg text-[#D0D6E0] leading-relaxed max-w-3xl">
            {t.engineeringLead}
          </HoverText>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {t.engineeringItems.map((item, idx) => (
            <AnimateOnScroll key={idx} animation="scale" delay={200 + idx * 100}>
              <TiltCard glowColor="rgba(94,106,210,0.4)">
                <div className="p-6 space-y-2 group">
                  <div className="text-sm uppercase tracking-[0.2em] text-[#8A8F98] transition-all duration-300 group-hover:text-white group-hover:tracking-[0.25em]">
                    {item.title}
                  </div>
                  <p className="text-[#D0D6E0] text-sm leading-relaxed transition-colors duration-300 group-hover:text-white">
                    {item.desc}
                  </p>
                </div>
              </TiltCard>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
});

EngineeringAppsSection.displayName = 'EngineeringAppsSection';
