import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { Eyebrow, GradientText } from './SectionHelpers';

interface TeacherGuideTeaserSectionProps {
  lang: Language;
  reducedMotion?: boolean;
}

export const TeacherGuideTeaserSection: React.FC<TeacherGuideTeaserSectionProps> = ({ lang, reducedMotion }) => {
  const t = TRANSLATIONS[lang];
  const motionClass = reducedMotion ? '' : 'fade-up delay-2';

  return (
    <section className={`w-full relative px-6 ${motionClass}`}>
      <div className="max-w-6xl mx-auto">
        <TiltCard glowColor="rgba(255,255,255,0.3)">
          <div className="p-8 space-y-4">
            <Eyebrow label={t.teacherTeaserTitle} />
            <h2 className="text-3xl md:text-4xl font-bold">
              <GradientText>{t.teacherTeaserTitle}</GradientText>
            </h2>
            <p className="text-sm text-[#D0D6E0] leading-relaxed">{t.teacherTeaserLead}</p>
            <ul className="space-y-2 text-sm text-[#D0D6E0]">
              {t.teacherTeaserBullets.map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-[#5E6AD2] mt-0.5">•</span>
                  <span className="flex-1">{line}</span>
                </li>
              ))}
            </ul>
            <div className="text-xs uppercase tracking-[0.25em] text-[#8A8F98]">
              {t.ctaEmailLabel}: {t.ctaEmailPlaceholder} (TODO: form/cta)
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  );
};
