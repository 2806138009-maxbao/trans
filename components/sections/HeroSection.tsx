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
  onGenesis?: () => void;
  onOdyssey?: () => void;
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
  onGenesis,
  onOdyssey,
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
          
          {/* Immersive Experience Entries */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Smith Odyssey - Magnetic Scrollytelling */}
            {onOdyssey && (
              <button
                onClick={onOdyssey}
                className="
                  group flex items-center gap-3 px-5 py-2.5 rounded-full
                  border border-[rgba(255,215,0,0.3)] bg-[rgba(255,215,0,0.05)]
                  text-[11px] uppercase tracking-[0.15em] font-medium
                  transition-all duration-500
                  hover:border-[rgba(255,215,0,0.6)] hover:bg-[rgba(255,215,0,0.1)]
                "
                style={{ 
                  color: 'rgba(255, 215, 0, 0.8)',
                  transitionTimingFunction: THEME.animation.curve,
                }}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full transition-all duration-500 group-hover:scale-150"
                  style={{ 
                    backgroundColor: '#FFD700',
                    boxShadow: '0 0 10px rgba(255, 215, 0, 0.6)',
                  }}
                />
                <span className="group-hover:text-[#FFD700] transition-colors duration-500">
                  {lang === 'zh' ? '「奥德赛」引导模式' : '"Odyssey" Guided Mode'}
                </span>
                <svg 
                  className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            {/* Genesis Experience - Origin Story */}
            {onGenesis && (
              <button
                onClick={onGenesis}
                className="
                  group flex items-center gap-3 px-5 py-2.5 rounded-full
                  border border-white/10 bg-white/[0.02]
                  text-[11px] uppercase tracking-[0.15em] font-medium
                  transition-all duration-500
                  hover:border-white/30 hover:bg-white/[0.05]
                "
                style={{ 
                  color: 'rgba(255, 255, 255, 0.5)',
                  transitionTimingFunction: THEME.animation.curve,
                }}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full transition-all duration-500 group-hover:scale-150"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 0 6px rgba(255, 255, 255, 0.3)',
                  }}
                />
                <span className="group-hover:text-white/80 transition-colors duration-500">
                  {lang === 'zh' ? '「创世纪」起源动画' : '"Genesis" Origin Animation'}
                </span>
                <svg 
                  className="w-3 h-3 opacity-40 group-hover:opacity-80 group-hover:translate-x-1 transition-all duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </Wrapper>
      </div>
    </section>
  );
};
