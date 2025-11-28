import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { GlowDot, GradientText } from './SectionHelpers';
import { AnimateOnScroll } from '../AnimateOnScroll';

interface NextSectionProps {
  lang: Language;
  reducedMotion?: boolean;
}

export const NextSection: React.FC<NextSectionProps> = ({ lang, reducedMotion }) => {
  const t = TRANSLATIONS[lang];

  if (reducedMotion) {
    return (
      <section className="w-full relative px-6">
        <div className="max-w-6xl mx-auto">
          <TiltCard glowColor="rgba(255,255,255,0.25)">
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-3"><GlowDot color="#ffffff" /><h2 className="text-3xl md:text-4xl font-bold"><GradientText>{t.nextSectionTitle}</GradientText></h2></div>
              <p className="text-sm text-[#D0D6E0] leading-relaxed">{t.nextSectionLead}</p>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#D0D6E0]">{t.nextSectionItems.map((line, idx) => (<li key={idx} className="flex gap-2 p-3 rounded-lg bg-white/5 border border-white/5"><span className="text-[#5E6AD2] mt-0.5">•</span><span className="flex-1">{line}</span></li>))}</ul>
            </div>
          </TiltCard>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full relative px-6">
      <div className="max-w-6xl mx-auto">
        <AnimateOnScroll animation="blur">
          <TiltCard glowColor="rgba(255,255,255,0.25)">
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-3">
                <GlowDot color="#ffffff" />
                <h2 className="text-3xl md:text-4xl font-bold">
                  <GradientText>{t.nextSectionTitle}</GradientText>
                </h2>
              </div>
              <p className="text-sm text-[#D0D6E0] leading-relaxed hover-text">{t.nextSectionLead}</p>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#D0D6E0]">
                {t.nextSectionItems.map((line, idx) => (
                  <li key={idx} className="flex gap-2 p-3 rounded-lg bg-white/5 border border-white/5 hover-text-subtle transition-all duration-300 hover:border-[#5E6AD2]/30 hover:bg-white/[0.08]">
                    <span className="text-[#5E6AD2] mt-0.5">•</span>
                    <span className="flex-1">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TiltCard>
        </AnimateOnScroll>
      </div>
    </section>
  );
};
