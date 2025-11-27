import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { EpicycleDrawing } from '../EpicycleDrawing';
import { HudTiltContainer } from '../HudTiltContainer';
import { GlowDot, GradientText } from './SectionHelpers';
import { AnimateOnScroll } from '../AnimateOnScroll';

interface EpicycleSectionProps {
  lang: Language;
  reducedMotion?: boolean;
}

export const EpicycleSection = React.forwardRef<HTMLDivElement, EpicycleSectionProps>(({ lang, reducedMotion }, ref) => {
  const t = TRANSLATIONS[lang];

  if (reducedMotion) {
    return (
      <section id="epicycle-section" ref={ref} className="w-full relative px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col gap-4 text-left">
            <div className="flex items-center gap-3"><GlowDot color="#5E6AD2" /><h2 className="text-4xl md:text-5xl font-bold"><GradientText>{t.epicycleTitle}</GradientText></h2></div>
            <p className="text-lg text-[#D0D6E0] leading-relaxed">{t.epicycleLead}</p>
          </div>
          <HudTiltContainer className="min-h-[520px]" glowColor="rgba(71, 156, 255, 0.4)"><EpicycleDrawing lang={lang} /></HudTiltContainer>
        </div>
      </section>
    );
  }

  return (
    <section id="epicycle-section" ref={ref} className="w-full relative px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <AnimateOnScroll animation="fade-up">
          <div className="flex flex-col gap-4 text-left">
            <div className="flex items-center gap-3">
              <GlowDot color="#5E6AD2" />
              <h2 className="text-4xl md:text-5xl font-bold">
                <GradientText>{t.epicycleTitle}</GradientText>
              </h2>
            </div>
            <p className="text-lg text-[#D0D6E0] leading-relaxed">{t.epicycleLead}</p>
            <p className="text-sm text-[#8A8F98]">{t.epicycleNote}</p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll animation="scale" delay={150}>
          <HudTiltContainer className="min-h-[520px]" glowColor="rgba(71, 156, 255, 0.4)">
            <EpicycleDrawing lang={lang} />
          </HudTiltContainer>
        </AnimateOnScroll>
      </div>
    </section>
  );
});

EpicycleSection.displayName = 'EpicycleSection';
