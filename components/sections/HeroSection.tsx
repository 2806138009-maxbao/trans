import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { Eyebrow, GlowDot, GradientText } from './SectionHelpers';
import { AnimateOnScroll } from '../AnimateOnScroll';

interface HeroSectionProps {
  lang: Language;
  onStart: () => void;
  onWhy: () => void;
  reducedMotion?: boolean;
}

// 按钮文字悬停放大效果
const HoverButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}> = ({ children, onClick, variant = 'primary' }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-lg transition-all text-sm font-semibold tracking-wide
      group overflow-hidden relative
      ${variant === 'primary' 
        ? 'bg-white/10 border border-white/10 hover:bg-white/15 hover:border-white/30' 
        : 'bg-transparent border border-white/10 hover:border-white/30 hover:bg-white/5'
      }`}
  >
    <span className="inline-block transition-transform duration-300 group-hover:scale-110">
      {children}
    </span>
  </button>
);

export const HeroSection: React.FC<HeroSectionProps> = ({ lang, onStart, onWhy, reducedMotion }) => {
  const t = TRANSLATIONS[lang];

  if (reducedMotion) {
    return (
      <section id="hero" className="w-full min-h-screen relative flex flex-col justify-center items-center gap-10 px-6">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[380px] bg-[#5E6AD2]/20 blur-[140px] rounded-full -z-10" />
        <div className="max-w-6xl w-full text-center space-y-8">
          <div className="flex justify-center"><Eyebrow label={t.heroBadge} /></div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.15]">
            <GradientText>{lang === 'zh' ? <>光之谐波<br /><span className="text-[0.75em]">傅里叶级数实验室</span></> : <>Luminous Harmonics<br /><span className="text-[0.75em]">Fourier Series Lab</span></>}</GradientText>
          </h1>
          <p className="text-lg md:text-xl text-[#C7CBD4] max-w-3xl mx-auto leading-relaxed">{t.heroSubheading}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
            <HoverButton onClick={onStart} variant="primary">{t.heroStart}</HoverButton>
            <HoverButton onClick={onWhy} variant="secondary">{t.heroWhy}</HoverButton>
          </div>
        </div>
        <div className="w-full max-w-4xl">
          <TiltCard glowColor="rgba(71,156,255,0.4)">
            <div className="p-6 md:p-8 text-left space-y-4">
              <div className="flex items-center gap-2"><GlowDot color="#479CFF" /><span className="text-[11px] uppercase tracking-[0.2em] text-[#8A8F98]">{t.description}</span></div>
              <p className="text-lg text-[#D0D6E0] leading-relaxed">{t.heroSubtitle}</p>
            </div>
          </TiltCard>
        </div>
      </section>
    );
  }

  return (
    <section id="hero" className="w-full min-h-screen relative flex flex-col justify-center items-center gap-10 px-6">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[380px] bg-[#5E6AD2]/20 blur-[140px] rounded-full -z-10" />
      
      <div className="max-w-6xl w-full text-center space-y-8">
        <AnimateOnScroll animation="blur" delay={0}>
          <div className="flex justify-center">
            <Eyebrow label={t.heroBadge} />
          </div>
        </AnimateOnScroll>
        
        <AnimateOnScroll animation="fade-up" delay={100}>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.15]">
            <GradientText>
              {lang === 'zh' ? (
                <>
                  光之谐波
                  <br />
                  <span className="text-[0.75em]">傅里叶级数实验室</span>
                </>
              ) : (
                <>
                  Luminous Harmonics
                  <br />
                  <span className="text-[0.75em]">Fourier Series Lab</span>
                </>
              )}
            </GradientText>
          </h1>
        </AnimateOnScroll>
        
        <AnimateOnScroll animation="fade-up" delay={200}>
          <p 
            className="text-lg md:text-xl text-[#C7CBD4] max-w-3xl mx-auto leading-relaxed font-normal
              transition-all duration-300 hover:text-white cursor-default"
            style={{ transition: 'transform 0.3s ease-out, color 0.3s' }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            {t.heroSubheading}
          </p>
        </AnimateOnScroll>
        
        <AnimateOnScroll animation="scale" delay={300}>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
            <HoverButton onClick={onStart} variant="primary">
              {t.heroStart}
            </HoverButton>
            <HoverButton onClick={onWhy} variant="secondary">
              {t.heroWhy}
            </HoverButton>
          </div>
        </AnimateOnScroll>
      </div>

      <AnimateOnScroll animation="slide-right" delay={400}>
        <div className="w-full max-w-4xl">
          <TiltCard glowColor="rgba(71,156,255,0.4)">
            <div className="p-6 md:p-8 text-left space-y-4">
              <div className="flex items-center gap-2">
                <GlowDot color="#479CFF" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#8A8F98]">{t.description}</span>
              </div>
              <p 
                className="text-lg text-[#D0D6E0] leading-relaxed transition-all duration-300 hover:text-white cursor-default"
                style={{ transition: 'transform 0.3s ease-out, color 0.3s' }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1.01)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1)';
                }}
              >
                {t.heroSubtitle}
              </p>
            </div>
          </TiltCard>
        </div>
      </AnimateOnScroll>
    </section>
  );
};
