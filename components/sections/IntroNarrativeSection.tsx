import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { AnimateOnScroll } from '../AnimateOnScroll';
import { THEME } from '../../theme';
import { ComplexFoldSim } from '../ComplexFoldSim';
import { InteractiveRecap } from '../InteractiveRecap';
import { GridIcon } from '../Icons';
import { Zap, History } from 'lucide-react';

interface IntroNarrativeSectionProps {
  lang: Language;
  reducedMotion?: boolean;
  id?: string;
}

// Reusable Components
const GlowDot: React.FC<{ color: string }> = ({ color }) => (
  <span 
    className="w-2 h-2 rounded-full"
    style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
  />
);

const GradientText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span 
    className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent select-text"
    style={{ WebkitBackgroundClip: 'text' }}
  >
    {children}
  </span>
);

export const IntroNarrativeSection: React.FC<IntroNarrativeSectionProps> = ({ 
  lang, 
  reducedMotion,
  id
}) => {
  const t = TRANSLATIONS[lang];

  const narrativeBlocks = [
    {
      id: 'definition',
      eyebrow: lang === 'zh' ? '核心概念' : 'Core Concept',
      title: t.definitionTitle,
      body: t.definitionBody,
      accent: THEME.colors.primary,
      Icon: GridIcon,
    },
    {
      id: 'history',
      eyebrow: t.historyTitle,
      title: t.historyTitle,
      body: t.historyBody,
      accent: THEME.colors.secondary,
      Icon: History,
    },
    {
      id: 'role',
      eyebrow: t.roleTitleShort,
      title: t.roleTitleShort,
      body: t.roleBodyShort,
      accent: 'var(--color-text-muted)',
      Icon: Zap,
    },
  ];

  const Wrapper = reducedMotion ? React.Fragment : AnimateOnScroll;
  const getWrapperProps = (animation: string, delay: number = 0) => 
    reducedMotion ? {} : { animation: animation as any, delay };

  return (
    <section id={id} className="w-full relative px-4 sm:px-6 py-16">
      <div className="relative max-w-3xl mx-auto">
        {/* Chapter Badge */}
        <Wrapper {...getWrapperProps('fade-up')}>
          <div className="mb-8 sm:mb-12 text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full hover:bg-white/5 transition-all duration-300">
              <GlowDot color={THEME.colors.primary} />
              <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                {t.chapterTitle}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4">
              <GradientText>{t.introTitle}</GradientText>
            </h2>
            <p className="text-[var(--color-text-muted)] text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              {t.introLead}
            </p>
          </div>
        </Wrapper>

        {/* Narrative Blocks - Void Style (De-boxed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {narrativeBlocks.map((block, idx) => (
            <Wrapper key={block.id} {...getWrapperProps('fade-up', idx * 150)}>
              <article 
                className="group relative flex flex-col h-full pl-5 py-4 transition-all duration-500"
              >
                {/* Left Accent Line - Swiss Style */}
                <div 
                  className="absolute top-0 bottom-0 left-0 w-0.5 transition-all duration-300 group-hover:w-1"
                  style={{ backgroundColor: block.accent }}
                />

                {/* Icon + Eyebrow Row */}
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ 
                      backgroundColor: `${block.accent}15`,
                      color: block.accent 
                    }}
                  >
                    <block.Icon size={16} />
                  </div>
                  
                  <span 
                    className="text-[10px] uppercase tracking-[0.15em] font-medium"
                    style={{ color: block.accent, opacity: 0.8 }}
                  >
                    {block.eyebrow}
                  </span>
                </div>
              
                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-3 transition-colors duration-300 group-hover:text-[#FFC700]">
                  {block.title}
                </h3>
              
                {/* Body */}
                <p className="text-[#888] text-sm leading-relaxed font-normal flex-1">
                  {block.body}
                </p>
              </article>
            </Wrapper>
          ))}
        </div>

        {/* ★ Complex Fold Simulation - The Core Visual */}
        <Wrapper {...getWrapperProps('fade-up', 400)}>
          <div className="mt-12 mb-8">
            <div className="mb-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                <GradientText>
                  {lang === 'zh' ? '亲眼看「折叠」' : 'Watch the "Fold"'}
                </GradientText>
              </h3>
              <p className="text-sm text-white/50">
                {lang === 'zh' 
                  ? '无限的复阻抗平面 → 有限的单位圆' 
                  : 'Infinite complex impedance plane → Finite unit circle'
                }
              </p>
            </div>
            <ComplexFoldSim 
              reducedMotion={reducedMotion} 
              lang={lang}
              height={300}
            />
          </div>
        </Wrapper>

        {/* Divider */}
        <Wrapper {...getWrapperProps('scale', 200)}>
          <div className="my-12 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#FFC700] hover:text-white transition-colors duration-300">
              {t.seriesVsTransformTitle}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </Wrapper>

        {/* Key Points - Interactive */}
        <Wrapper {...getWrapperProps('fade-up', 300)}>
          <div className="mt-8">
            <InteractiveRecap 
              bullets={t.seriesVsTransformPoints} 
              conceptMap={['seriesL', 'shuntC', 'center', 'symmetry']} 
            />
          </div>
        </Wrapper>
      </div>
    </section>
  );
};
