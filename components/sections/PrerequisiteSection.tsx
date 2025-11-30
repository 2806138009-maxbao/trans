import React, { useState } from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { AnimateOnScroll } from '../AnimateOnScroll';
import { THEME } from '../../theme';
import { TiltCard } from '../TiltCard';
import { Zap, Target, RotateCcw } from 'lucide-react';
import { TransmissionLineSim, ReflectionPointSim } from '../TransmissionLineSim';
import { ImpedanceWidget } from '../ImpedanceWidget';

interface PrerequisiteSectionProps {
  lang: Language;
  reducedMotion?: boolean;
  id?: string;
}

/**
 * 前置知识模块 - Level 1: Remember (Bloom's Taxonomy)
 * 
 * 在用户看到史密斯圆图之前，先建立这些基础概念:
 * 1. 什么是阻抗？
 * 2. 为什么要匹配？
 * 3. 什么是反射？
 */
export const PrerequisiteSection: React.FC<PrerequisiteSectionProps> = ({ 
  lang, 
  reducedMotion,
  id
}) => {
  const t = TRANSLATIONS[lang];
  const Wrapper = reducedMotion ? React.Fragment : AnimateOnScroll;
  
  // Q2 和 Q3 联动的匹配状态
  const [matchMode, setMatchMode] = useState<'matched' | 'mismatched'>('mismatched');
  const getWrapperProps = (animation: string, delay: number = 0) => 
    reducedMotion ? {} : { animation: animation as any, delay };

  // 图标组件映射
  const IconComponents = {
    impedance: Zap,
    matching: Target,
    reflection: RotateCcw,
  };

  // 前置知识内容
  const prerequisites = lang === 'zh' ? [
    {
      id: 'impedance' as const,
      question: '什么是阻抗？',
      answer: '阻抗 Z = R + jX，是电阻 (R) 和电抗 (X) 的组合。',
      details: [
        '电阻 R：消耗能量，产生热量',
        '电抗 X：储存能量，不消耗',
        '电感：X = +jωL（正电抗）',
        '电容：X = -j/ωC（负电抗）',
      ],
      visual: 'R ─── Z ─── jX',
      color: THEME.colors.primary,
    },
    {
      id: 'matching' as const,
      question: '为什么要匹配？',
      answer: '当源阻抗 = 负载阻抗时，功率传输最大化。',
      details: [
        '不匹配 → 能量反射回源',
        '反射 → 功率浪费 + 设备损坏风险',
        '标准阻抗：50Ω（射频）、75Ω（视频）',
        '匹配目标：让负载「看起来像」50Ω',
      ],
      visual: 'Source ═══ Line ═══ Load',
      color: THEME.colors.secondary,
    },
    {
      id: 'reflection' as const,
      question: '什么是反射？',
      answer: '当阻抗不连续时，部分能量会「弹回」。',
      details: [
        '反射系数 Γ = (Z_L − Z_0) / (Z_L + Z_0)',
        'Γ = 0 → 完美匹配，无反射',
        '|Γ| = 1 → 全反射（短路或开路）',
        'Γ 是复数，包含幅度和相位',
      ],
      visual: '──→ │ ←──',
      color: 'hsl(40, 5%, 55%)',
    },
  ] : [
    {
      id: 'impedance' as const,
      question: 'What is Impedance?',
      answer: 'Impedance Z = R + jX combines resistance (R) and reactance (X).',
      details: [
        'Resistance R: Dissipates energy as heat',
        'Reactance X: Stores energy, no dissipation',
        'Inductor: X = +jωL (positive reactance)',
        'Capacitor: X = -j/ωC (negative reactance)',
      ],
      visual: 'R ─── Z ─── jX',
      color: THEME.colors.primary,
    },
    {
      id: 'matching' as const,
      question: 'Why Match Impedance?',
      answer: 'Maximum power transfer when source impedance = load impedance.',
      details: [
        'Mismatch → Energy reflects back to source',
        'Reflection → Power waste + equipment damage risk',
        'Standard: 50Ω (RF), 75Ω (video)',
        'Goal: Make load "look like" 50Ω',
      ],
      visual: 'Source ═══ Line ═══ Load',
      color: THEME.colors.secondary,
    },
    {
      id: 'reflection' as const,
      question: 'What is Reflection?',
      answer: 'When impedance is discontinuous, part of the energy "bounces back".',
      details: [
        'Reflection coefficient Γ = (Z_L − Z_0) / (Z_L + Z_0)',
        'Γ = 0 → Perfect match, no reflection',
        '|Γ| = 1 → Total reflection (short/open)',
        'Γ is complex: magnitude + phase',
      ],
      visual: '──→ │ ←──',
      color: 'hsl(40, 5%, 55%)',
    },
  ];

  return (
    <section id={id} className="w-full relative px-4 sm:px-6 py-16">
      <div className="relative max-w-4xl mx-auto">
        {/* Section Header */}
        <Wrapper {...getWrapperProps('fade-up')}>
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 hover:bg-white/5 transition-all duration-300">
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: THEME.colors.primary, boxShadow: `0 0 8px ${THEME.colors.primary}` }}
              />
              <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: THEME.colors.text.muted }}>
                {lang === 'zh' ? '第零章 · 基础' : 'Chapter 0 · Foundations'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                {lang === 'zh' ? '先修知识' : 'Prerequisites'}
              </span>
            </h2>
            <p className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto" style={{ color: THEME.colors.text.muted }}>
              {lang === 'zh' 
                ? '在探索史密斯圆图之前，让我们先建立三个核心概念。'
                : 'Before exploring the Smith Chart, let\'s establish three core concepts.'
              }
            </p>
          </div>
        </Wrapper>

        {/* Prerequisite Cards - Void Style */}
        <div className="space-y-8">
          {prerequisites.map((prereq, index) => {
            const IconComponent = IconComponents[prereq.id];
            return (
            <Wrapper key={prereq.id} {...getWrapperProps('fade-up', index * 150)}>
              <div className="relative pl-6 py-6 group">
                {/* Left accent line */}
                <div 
                  className="absolute top-0 bottom-0 left-0 w-0.5 transition-all duration-300 group-hover:w-1"
                  style={{ backgroundColor: prereq.color }}
                />
                  {/* Question Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div 
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ 
                        backgroundColor: `${prereq.color}15`,
                        border: `1px solid ${prereq.color}30`,
                      }}
                    >
                      <IconComponent size={24} style={{ color: prereq.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: prereq.color }}
                        >
                          Q{index + 1}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {prereq.question}
                      </h3>
                      <p className="text-base" style={{ color: THEME.colors.text.body }}>
                        {prereq.answer}
                      </p>
                    </div>
                  </div>

                  {/* Visual Representation - Interactive for ALL questions now */}
                  {prereq.id === 'impedance' ? (
                    <div className="mb-6">
                      <ImpedanceWidget lang={lang} />
                    </div>
                  ) : prereq.id === 'matching' ? (
                    <div className="mb-6">
                      <TransmissionLineSim 
                        mode={matchMode}
                        onModeChange={setMatchMode}
                        reducedMotion={reducedMotion}
                        height={90}
                        showTabs={true}
                      />
                    </div>
                  ) : (
                    <div className="mb-6">
                      <ReflectionPointSim 
                        reflectionRatio={matchMode === 'mismatched' ? 0.5 : 0.05}
                        reducedMotion={reducedMotion}
                        height={100}
                      />
                    </div>
                  )}

                  {/* Details List */}
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {prereq.details.map((detail, idx) => (
                      <li 
                        key={idx}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span 
                          className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                          style={{ backgroundColor: prereq.color }}
                        />
                        <span style={{ color: THEME.colors.text.muted }}>
                          {detail}
                        </span>
                      </li>
                    ))}
                  </ul>
              </div>
            </Wrapper>
          );
          })}
        </div>

        {/* Transition to Smith Chart */}
        <Wrapper {...getWrapperProps('fade-up', 500)}>
          <div className="mt-12 text-center">
            <div 
              className="inline-flex items-center gap-3 px-6 py-3"
            >
              <div 
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: THEME.colors.primary, boxShadow: `0 0 6px ${THEME.colors.primary}` }}
              />
              <span className="text-sm" style={{ color: THEME.colors.text.body }}>
                {lang === 'zh' 
                  ? '有了这些基础，我们来看史密斯圆图如何将它们可视化。'
                  : 'With these foundations, let\'s see how the Smith Chart visualizes them.'
                }
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" style={{ color: THEME.colors.primary }}>
                <path d="M6 2 L6 10 M3 7 L6 10 L9 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </Wrapper>
      </div>
    </section>
  );
};

