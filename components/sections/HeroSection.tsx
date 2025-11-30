import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { Eyebrow, GlowDot } from './SectionHelpers';
import { AnimateOnScroll } from '../AnimateOnScroll';
import { THEME } from '../../theme';
import { HackerText } from '../HackerText';

interface HeroSectionProps {
  lang: Language;
  onStart: () => void;
  onWhy: () => void;
  reducedMotion?: boolean;
}

/**
 * HoverButton - CTA button with S-Tier glass/gold effect
 */
const HoverButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}> = ({ children, onClick, variant = 'primary' }) => {
  if (variant === 'primary') {
    return (
      <button
        onClick={onClick}
        className="
          px-8 py-4 rounded-lg text-base font-semibold tracking-wide
          border border-[rgba(255,215,0,1)] bg-[rgba(255,215,0,0.1)] text-[rgba(255,215,0,1)]
          shadow-[0_0_15px_rgba(255,215,0,0.2)]
          transition-all duration-300
          hover:-translate-y-[2px] hover:brightness-125 active:scale-[0.98]
        "
        style={{ transitionTimingFunction: THEME.animation.curve }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="
        px-8 py-4 rounded-lg text-base font-medium tracking-wide
        border border-white/20 bg-transparent text-[#AAA]
        transition-all duration-300
        hover:-translate-y-[2px] hover:text-white hover:border-white/40 active:scale-[0.98]
      "
      style={{ transitionTimingFunction: THEME.animation.curve }}
    >
      {children}
    </button>
  );
};

/**
 * HeroSection - Main landing section
 * Refactored for "Cinematic/Industrial" hierarchy
 */
export const HeroSection: React.FC<HeroSectionProps> = ({ 
  lang, 
  onStart, 
  onWhy, 
  reducedMotion = false 
}) => {
  const t = TRANSLATIONS[lang];
  const Wrapper = reducedMotion ? React.Fragment : AnimateOnScroll;
  
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        
        {/* Badge */}
        <Wrapper animation="fade-up">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5">
              <GlowDot color={THEME.colors.primary} />
              <Eyebrow>{t.heroBadge}</Eyebrow>
            </div>
          </div>
        </Wrapper>

        {/* Title Stack */}
        <Wrapper animation="fade-up" delay={100}>
          <div className="flex flex-col items-center">
            {/* Primary Line: Big/Tight/White + Dark Halo for readability */}
            {/* HACKER TEXT EFFECT: Matrix-style scramble on load/hover */}
            <h1 
              className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-white leading-none select-text relative z-10"
              style={{ 
                letterSpacing: '-0.04em',
                // Layered shadow: Tight dark shadow for edge definition + Wide soft shadow for atmosphere
                textShadow: `
                  0 0 10px rgba(0, 0, 0, 0.9),
                  0 0 30px rgba(0, 0, 0, 0.7),
                  0 0 60px rgba(0, 0, 0, 0.5)
                `,
              }}
            >
              <HackerText 
                text={t.heroHeading} 
                duration={600}
                triggerOnHover={false}
              />
            </h1>
            
            {/* Secondary Line: Small/Wide/Gold + Subtle Halo */}
            <div 
              className="text-xl md:text-3xl font-light tracking-[0.2em] mt-4 md:mt-6 select-text relative z-10"
              style={{ 
                color: 'rgba(255, 215, 0, 0.8)',
                textShadow: `
                  0 0 8px rgba(0, 0, 0, 0.8),
                  0 0 20px rgba(0, 0, 0, 0.6)
                `,
              }}
            >
              {t.heroTitleSecondary || "RF IMPEDANCE LAB"}
            </div>

            {/* Description */}
            <p 
              className="text-lg md:text-2xl font-light max-w-2xl mx-auto select-text"
              style={{ 
                color: THEME.colors.text.muted,
                marginTop: '32px' // Task: 32px gap
              }}
            >
              {t.heroSubheading}
            </p>
          </div>
        </Wrapper>

        {/* TiltCard - Kept as subtle detail */}
        <Wrapper animation="scale-in" delay={200}>
          <div className="max-w-md mx-auto mt-8">
            <TiltCard>
              <div className="p-6 text-center space-y-2">
                <p 
                  className="text-sm md:text-base font-light select-text"
                  style={{ color: '#B8BCC6' }}
                >
                  {t.heroSubtitle}
                </p>
              </div>
            </TiltCard>
          </div>
        </Wrapper>

        {/* CTA Buttons */}
        <Wrapper animation="fade-up" delay={300}>
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
            style={{ marginTop: '48px' }} // Task: 48px gap from content above
          >
            <HoverButton onClick={onStart} variant="primary">
              {t.heroStart}
            </HoverButton>
            <HoverButton onClick={onWhy} variant="secondary">
              {t.heroWhy}
            </HoverButton>
          </div>
        </Wrapper>
      </div>
    </section>
  );
};
