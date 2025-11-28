import React from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { GradientText, HoverText, HoverListItem } from './SectionHelpers';
import { StepTimeline } from '../StepTimeline';
import { AnimateOnScroll } from '../AnimateOnScroll';

interface IntroNarrativeSectionProps {
  lang: Language;
  reducedMotion?: boolean;
  id?: string;
}

/**
 * 长文式叙事区：合并 Context/Signal/Lego 的核心内容
 * 保持背景动画可见，统一交互动效
 */
export const IntroNarrativeSection: React.FC<IntroNarrativeSectionProps> = ({ 
  lang, 
  reducedMotion,
  id
}) => {
  const t = TRANSLATIONS[lang];
  const motionClass = reducedMotion ? '' : 'fade-up';

  // 三个核心概念块
  const narrativeBlocks = [
    {
      id: 'definition',
      eyebrow: lang === 'zh' ? '核心概念' : 'Core Concept',
      title: t.definitionTitle,
      body: t.definitionBody,
      accent: '#5E6AD2',
    },
    {
      id: 'history',
      eyebrow: t.historyTitle,
      title: t.historyTitle,
      body: t.historyBody,
      accent: '#479CFF',
    },
    {
      id: 'role',
      eyebrow: t.roleTitleShort,
      title: t.roleTitleShort,
      body: t.roleBodyShort,
      accent: '#8A8F98',
    },
  ];

  // Series vs Transform 的要点
  const seriesVsTransformPoints = t.seriesVsTransformPoints || [];

  // Skip animations if reduced motion is preferred
  if (reducedMotion) {
    return (
      <section id={id} className="w-full relative px-6 py-16">
        <div className="relative max-w-3xl mx-auto">
          {/* 章节标题 */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] shadow-[0_0_8px_#5E6AD2]" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8A8F98]">
                {lang === 'zh' ? '第一章 · 直觉' : 'Chapter 1 · Intuition'}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              <GradientText>{lang === 'zh' ? '理解傅里叶级数' : 'Understanding Fourier Series'}</GradientText>
            </h2>
            <p className="text-[#8A8F98] text-base leading-relaxed max-w-xl mx-auto">{t.seriesVsTransformLead}</p>
          </div>
          <div className="space-y-10">
            {narrativeBlocks.map((block) => (
              <article key={block.id} className="group relative pl-6 border-l-2" style={{ borderColor: `${block.accent}40` }}>
                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 bg-[#0B0C0E]" style={{ borderColor: block.accent }} />
                <div className="text-[11px] uppercase tracking-[0.15em] mb-2 font-medium" style={{ color: block.accent }}>{block.eyebrow}</div>
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3"><GradientText>{block.title}</GradientText></h3>
                <p className="text-[#C7CBD4] text-base leading-[1.8] font-normal">{block.body}</p>
              </article>
            ))}
          </div>
          <div className="my-12 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#5E6AD2]">{t.seriesVsTransformTitle}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <ul className="space-y-3">
            {seriesVsTransformPoints.map((point, idx) => (
              <HoverListItem key={idx}>
                <span className="text-[#D0D6E0] text-sm leading-relaxed whitespace-normal select-text selection:bg-[#5E6AD2]/50 selection:text-white">{point}</span>
              </HoverListItem>
            ))}
          </ul>
          <div className="mt-20 pt-12 border-t border-white/5">
            <StepTimeline lang={lang} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="w-full relative px-4 sm:px-6 py-10 sm:py-16">
      <div className="relative max-w-3xl mx-auto">
        {/* 章节标题 */}
        <AnimateOnScroll animation="fade-up">
          <div className="mb-8 sm:mb-12 text-center">
            <div 
              className="inline-flex items-center gap-2 mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full 
                bg-white/5 border border-white/10 backdrop-blur-sm
                transition-all duration-300 hover:bg-white/10 hover:border-white/20"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] shadow-[0_0_8px_#5E6AD2]" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#8A8F98]">
                {lang === 'zh' ? '第一章 · 直觉' : 'Chapter 1 · Intuition'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 sm:mb-4">
              <GradientText>
                {lang === 'zh' ? '理解傅里叶级数' : 'Understanding Fourier Series'}
              </GradientText>
            </h2>
            <HoverText as="p" className="text-[#8A8F98] text-sm sm:text-base leading-relaxed max-w-xl mx-auto px-2">
              {t.seriesVsTransformLead}
            </HoverText>
          </div>
        </AnimateOnScroll>

        {/* 叙事块 - 带交互效果和出场动画 */}
        <div className="space-y-6 sm:space-y-10">
          {narrativeBlocks.map((block, idx) => (
            <AnimateOnScroll key={block.id} animation="slide-left" delay={idx * 150}>
              <article 
                className="group relative pl-4 sm:pl-6 border-l-2 transition-all duration-300 hover:pl-5 sm:hover:pl-8"
                style={{ borderColor: `${block.accent}40` }}
              >
              {/* 时间线节点 */}
              <div 
                className="absolute -left-[6px] sm:-left-[7px] top-1 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full border-2 bg-[#0B0C0E] 
                  transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg"
                style={{ 
                  borderColor: block.accent,
                  boxShadow: `0 0 0 0 ${block.accent}`,
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.boxShadow = `0 0 12px ${block.accent}`;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.boxShadow = `0 0 0 0 ${block.accent}`;
                }}
              />
              
              {/* Eyebrow */}
              <div 
                className="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 font-medium 
                  transition-all duration-300 group-hover:tracking-[0.2em]"
                style={{ color: block.accent }}
              >
                {block.eyebrow}
              </div>
              
              {/* Title */}
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-2 sm:mb-3 
                transition-all duration-300 group-hover:translate-x-1">
                <GradientText>{block.title}</GradientText>
              </h3>
              
              {/* Body */}
              <HoverText as="p" className="text-[#C7CBD4] text-sm sm:text-base leading-[1.7] sm:leading-[1.8] font-normal">
                {block.body}
              </HoverText>
            </article>
          </AnimateOnScroll>
          ))}
        </div>

        {/* 分隔线 */}
        <AnimateOnScroll animation="scale" delay={200}>
          <div className="my-12 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#5E6AD2] 
              transition-all duration-300 hover:text-white hover:tracking-[0.25em]">
              {t.seriesVsTransformTitle}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </AnimateOnScroll>

        {/* Series vs Transform 要点列表 */}
        <ul className="space-y-3">
          {seriesVsTransformPoints.map((point, idx) => (
            <AnimateOnScroll key={idx} animation="fade-up" delay={idx * 100}>
              <HoverListItem>
                <span className="text-[#D0D6E0] text-sm leading-relaxed whitespace-normal select-text selection:bg-[#5E6AD2]/50 selection:text-white">{point}</span>
              </HoverListItem>
            </AnimateOnScroll>
          ))}
        </ul>

        {/* 实验路线图 - Step Timeline */}
        <AnimateOnScroll animation="fade-up" delay={300}>
          <div className="mt-20 pt-12 border-t border-white/5">
            <StepTimeline lang={lang} />
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
};
