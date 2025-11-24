import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { EpicycleDrawing } from '../EpicycleDrawing';
import { Eyebrow, GradientText } from './SectionHelpers';

interface EpicycleSectionProps {
  lang: Language;
  reducedMotion?: boolean;
}

export const EpicycleSection = React.forwardRef<HTMLDivElement, EpicycleSectionProps>(({ lang, reducedMotion }, ref) => {
  const t = TRANSLATIONS[lang];
  const motionClass = reducedMotion ? '' : 'fade-up delay-1';

  return (
    <section ref={ref} className={`w-full relative px-6 ${motionClass}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 text-left">
          <Eyebrow label={t.epicycleTitle} color="#5E6AD2" />
          <h2 className="text-4xl md:text-5xl font-bold">
            <GradientText>{t.epicycleTitle}</GradientText>
          </h2>
          <p className="text-lg text-[#D0D6E0] leading-relaxed">{t.epicycleLead}</p>
          <p className="text-sm text-[#8A8F98]">{t.epicycleNote}</p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/5 min-h-[520px]">
          <EpicycleDrawing lang={lang} />
        </div>
      </div>
    </section>
  );
});

EpicycleSection.displayName = 'EpicycleSection';
