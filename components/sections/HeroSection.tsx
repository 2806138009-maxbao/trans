import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { Eyebrow, GradientText } from './SectionHelpers';

interface HeroSectionProps {
  lang: Language;
  onStart: () => void;
  onWhy: () => void;
  reducedMotion?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ lang, onStart, onWhy, reducedMotion }) => {
  const t = TRANSLATIONS[lang];
  const motionClass = reducedMotion ? '' : 'fade-up';

  return (
    <section className={`w-full min-h-screen relative flex flex-col justify-center items-center gap-10 px-6 ${motionClass}`}>
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[380px] bg-[#5E6AD2]/20 blur-[140px] rounded-full -z-10" />
      <div className="max-w-6xl w-full text-center space-y-8">
        <div className="flex justify-center">
          <Eyebrow label={t.heroBadge} />
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.02]">
          <GradientText>{t.heroHeading}</GradientText>
        </h1>
        <p className="text-lg md:text-xl text-[#C7CBD4] max-w-3xl mx-auto leading-relaxed font-normal">
          {t.heroSubheading}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <button
            onClick={onStart}
            className="px-6 py-3 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all text-sm font-semibold tracking-wide"
          >
            {t.heroStart}
          </button>
          <button
            onClick={onWhy}
            className="px-6 py-3 rounded-lg bg-transparent border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all text-sm font-semibold tracking-wide"
          >
            {t.heroWhy}
          </button>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <TiltCard glowColor="rgba(71,156,255,0.4)">
          <div className="p-6 md:p-8 text-left space-y-4">
            <Eyebrow label={t.description} color="#479CFF" />
            <p className="text-lg text-[#D0D6E0] leading-relaxed">
              {t.heroSubtitle}
            </p>
          </div>
        </TiltCard>
      </div>
    </section>
  );
};
