import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { Eyebrow, GradientText } from './SectionHelpers';

interface NextSectionProps {
  lang: Language;
  reducedMotion?: boolean;
}

export const NextSection: React.FC<NextSectionProps> = ({ lang, reducedMotion }) => {
  const t = TRANSLATIONS[lang];
  const motionClass = reducedMotion ? '' : 'fade-up';

  return (
    <section className={`w-full relative px-6 ${motionClass}`}>
      <div className="max-w-6xl mx-auto">
        <TiltCard glowColor="rgba(255,255,255,0.25)">
          <div className="p-8 space-y-4">
            <Eyebrow label={t.nextSectionTitle} color="#ffffff" />
            <h2 className="text-3xl md:text-4xl font-bold">
              <GradientText>{t.nextSectionTitle}</GradientText>
            </h2>
            <p className="text-sm text-[#D0D6E0] leading-relaxed">{t.nextSectionLead}</p>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#D0D6E0]">
              {t.nextSectionItems.map((line, idx) => (
                <li key={idx} className="flex gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[#5E6AD2] mt-0.5">•</span>
                  <span className="flex-1">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </TiltCard>
      </div>
    </section>
  );
};
