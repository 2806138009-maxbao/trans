import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { Eyebrow, GradientText } from './SectionHelpers';

interface ContextSectionProps {
  lang: Language;
  reducedMotion?: boolean;
}

export const ContextSection: React.FC<ContextSectionProps> = ({ lang, reducedMotion }) => {
  const t = TRANSLATIONS[lang];
  const motionClass = reducedMotion ? '' : 'fade-up';

  return (
    <section className={`w-full relative px-6 ${motionClass}`}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-8">
        <TiltCard glowColor="rgba(255,255,255,0.25)">
          <div className="p-8 space-y-4 text-left">
            <Eyebrow label={t.seriesVsTransformTitle} color="#ffffff" />
            <h2 className="text-3xl md:text-4xl font-bold">
              <GradientText>{t.definitionTitle}</GradientText>
            </h2>
            <p className="text-lg text-[#D0D6E0] leading-relaxed">{t.definitionBody}</p>
            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="text-sm uppercase tracking-[0.2em] text-[#8A8F98]">{t.seriesVsTransformTitle}</div>
              <p className="text-sm text-[#C7CBD4] leading-relaxed">{t.seriesVsTransformLead}</p>
              <ul className="space-y-2 text-sm text-[#D0D6E0]">
                {t.seriesVsTransformPoints.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-[#5E6AD2] mt-0.5">•</span>
                    <span className="flex-1">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TiltCard>

        <div className="space-y-4">
          <TiltCard glowColor="rgba(94,106,210,0.35)">
            <div className="p-7 space-y-3">
              <Eyebrow label={t.historyTitle} color="#5E6AD2" />
              <h3 className="text-2xl font-semibold text-white">
                <GradientText>{t.historyTitle}</GradientText>
              </h3>
              <p className="text-sm text-[#D0D6E0] leading-relaxed">{t.historyBody}</p>
            </div>
          </TiltCard>

          <TiltCard glowColor="rgba(71,156,255,0.35)">
            <div className="p-7 space-y-3">
              <Eyebrow label={t.roleTitleShort} color="#479CFF" />
              <h3 className="text-2xl font-semibold text-white">
                <GradientText>{t.roleTitleShort}</GradientText>
              </h3>
              <p className="text-sm text-[#D0D6E0] leading-relaxed">{t.roleBodyShort}</p>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
};
