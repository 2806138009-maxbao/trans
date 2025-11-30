import React, { useRef, useState, MouseEvent } from 'react';
import { Language, TRANSLATIONS } from '../types';
import { ArrowRight, BookOpen, MousePointer, SlidersHorizontal, Grid, Target } from 'lucide-react';
import { THEME } from '../theme';
import { AnimateOnScroll } from './AnimateOnScroll';

interface TiltStepCardProps {
  children: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
  isCompleted: boolean;
  ariaLabel: string;
}

const TiltStepCard: React.FC<TiltStepCardProps> = ({ 
  children, 
  onClick, 
  isActive, 
  isCompleted,
  ariaLabel 
}) => {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const perX = (x / rect.width) * 100;
    const perY = (y / rect.height) * 100;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setRotation({ x: rotateX, y: rotateY });
    setSpotlight({ x: perX, y: perY, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setSpotlight(prev => ({ ...prev, opacity: 0 }));
  };

  const glowColor = isActive 
    ? 'rgba(255, 199, 0, 0.6)' 
    : 'rgba(255, 255, 255, 0.3)';

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative text-left focus:outline-none focus:ring-2 focus:ring-[#FFC700]/50 overflow-hidden"
      style={{
        transform: `perspective(800px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-label={ariaLabel}
    >
      {/* Subtle hover glow - minimal */}
      <div 
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-60 pointer-events-none"
        style={{
          background: `radial-gradient(200px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,199,0,0.08), transparent 60%)`,
          opacity: spotlight.opacity * 0.5,
          transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />

      {/* Card content - Void Style */}
      <div 
        className="relative z-10 w-full h-full p-4 pl-5 flex flex-col items-start gap-3"
        style={{
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Left accent line */}
      <div 
          className="absolute top-0 bottom-0 left-0 w-0.5 transition-all duration-300"
          style={{ 
            backgroundColor: isActive 
              ? THEME.colors.primary 
            : isCompleted
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(255, 255, 255, 0.08)',
            width: isActive ? '3px' : '2px',
            boxShadow: isActive ? `0 0 10px ${THEME.colors.primary}` : 'none',
        }}
        />
        {children}
      </div>
    </button>
  );
};

interface StepTimelineProps {
  lang: Language;
  currentStep?: number;
  onStepClick?: (stepId: string) => void;
  reducedMotion?: boolean;
}

const STEP_ICONS = [
  <BookOpen size={16} />,
  <MousePointer size={16} />,
  <SlidersHorizontal size={16} />,
  <Grid size={16} />,
  <Target size={16} />,
];

export const StepTimeline: React.FC<StepTimelineProps> = ({ 
  lang, 
  currentStep = -1,
  onStepClick,
  reducedMotion = false
}) => {
  const t = TRANSLATIONS[lang];

  const handleClick = (stepId: string) => {
    if (onStepClick) {
      onStepClick(stepId);
    } else {
      const element = document.getElementById(stepId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const Wrapper = reducedMotion ? React.Fragment : AnimateOnScroll;
  // Explicitly cast animation string to any to avoid strict type issues with Wrapper logic
  const getWrapperProps = (animation: string, delay: number = 0) => 
    reducedMotion ? {} : { animation: animation as any, delay };

  return (
    <div className="w-full max-w-5xl mx-auto py-16 md:py-24 px-4 relative">
      {/* Background Glow Effects */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${THEME.colors.primary} 0%, transparent 70%)` }}
      />
      
      {/* Title */}
      <div className="text-center mb-12 md:mb-16 relative z-10">
        <Wrapper {...getWrapperProps('scale')}>
          <div>
            {/* Decorative Lines */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent via-[#FFC700]/50 to-[#FFC700]" />
              <div className="relative">
                {/* Badge with glow ring */}
                <div 
                  className="absolute inset-0 rounded-full blur-md opacity-50"
                  style={{ backgroundColor: THEME.colors.primary }}
                />
                <div className="relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0B0C0E] border border-[#FFC700]/40 backdrop-blur-sm">
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: THEME.colors.primary, 
                      boxShadow: `0 0 12px ${THEME.colors.primary}, 0 0 24px ${THEME.colors.primary}`,
                      animation: 'pulse 2s ease-in-out infinite'
                    }}
                  />
                  <span className="text-xs uppercase tracking-[0.25em] font-bold" style={{ color: THEME.colors.primary }}>
                    {t.roadmapTitle}
          </span>
        </div>
              </div>
              <div className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent via-[#FFC700]/50 to-[#FFC700]" />
            </div>
            
            {/* Main Heading - Big & Bold with multiple layers */}
            <div className="relative inline-block">
              {/* Ghost shadow layer */}
              <h2 
                className="absolute inset-0 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight blur-2xl opacity-30 select-none"
                style={{ color: THEME.colors.primary }}
                aria-hidden="true"
              >
                {t.roadmapSubtitle}
              </h2>
              
              {/* Main text */}
              <h2 
                className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight"
                style={{ 
                  fontFamily: "'Space Grotesk', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif",
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 40%, rgba(255,255,255,0.5) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 40px rgba(255,199,0,0.15))',
                }}
              >
                {t.roadmapSubtitle}
              </h2>
            </div>
            
            {/* Decorative underline */}
            <div className="flex items-center justify-center gap-2 mt-6 mb-8">
              <div className="w-3 h-3 rounded-full border-2 border-[#FFC700]/30" />
              <div className="h-0.5 w-24 md:w-32 bg-gradient-to-r from-[#FFC700] via-[#FFC700]/50 to-transparent rounded-full" />
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: THEME.colors.primary, boxShadow: `0 0 8px ${THEME.colors.primary}` }}
              />
              <div className="h-0.5 w-24 md:w-32 bg-gradient-to-l from-[#FFC700] via-[#FFC700]/50 to-transparent rounded-full" />
              <div className="w-3 h-3 rounded-full border-2 border-[#FFC700]/30" />
            </div>
            
            {/* Subtitle with icon */}
            <div className="flex items-center justify-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-[var(--color-text-muted)]/60">
                <span className="w-1 h-1 rounded-full bg-current" />
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="w-1 h-1 rounded-full bg-current" />
              </div>
              <p className="text-base md:text-lg text-[#A0A5AD] max-w-xl leading-relaxed font-light">
                {t.roadmapLead}
              </p>
              <div className="hidden sm:flex items-center gap-1.5 text-[var(--color-text-muted)]/60">
                <span className="w-1 h-1 rounded-full bg-current" />
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="w-1 h-1 rounded-full bg-current" />
              </div>
            </div>
            
            {/* Step count indicator */}
            <div className="mt-8 flex items-center justify-center gap-2">
              {t.steps.map((_, idx) => (
                <div 
                  key={idx}
                  className="w-8 h-1 rounded-full transition-all duration-500"
                  style={{ 
                    backgroundColor: idx === 0 ? THEME.colors.primary : 'rgba(255,255,255,0.1)',
                    boxShadow: idx === 0 ? `0 0 10px ${THEME.colors.primary}` : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </Wrapper>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {t.steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          
          return (
            <Wrapper key={step.id} {...getWrapperProps('fade-up', idx * 100)}>
              <div>
            <TiltStepCard
              onClick={() => handleClick(step.id)}
              isActive={isActive}
              isCompleted={isCompleted}
                  ariaLabel={`${lang === 'zh' ? '步骤' : 'Step'} ${idx + 1}: ${step.label}`}
            >
              {/* Step Number Badge */}
                  <div className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium ${isActive ? 'text-[#FFC700]' : 'text-[var(--color-text-muted)]'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#FFC700] text-black shadow-[0_0_10px_rgba(255,199,0,0.5)]' 
                    : isCompleted
                      ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-[var(--color-text-muted)] group-hover:bg-white/15'
                    }`}>
                      {isCompleted ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5 L4 7 L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : idx + 1}
                </span>
                <span>{lang === 'zh' ? `第 ${idx + 1} 步` : `Step ${idx + 1}`}</span>
              </div>

              {/* Icon + Label */}
              <div className="flex items-center gap-2">
                    <div className={`transition-colors duration-300 ${isActive ? 'text-[#FFC700]' : 'text-[#D0D6E0] group-hover:text-white'}`}>
                      {STEP_ICONS[idx]}
                </div>
                    <span className={`font-medium text-sm transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#D0D6E0] group-hover:text-white'}`}>
                      {step.label}
                </span>
              </div>

              {/* Description */}
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
                    {step.description}
              </p>

              {/* Hover Arrow */}
              <ArrowRight 
                size={14} 
                    className={`absolute bottom-4 right-4 transition-all duration-300 ${
                      isActive 
                        ? 'text-[#FFC700] opacity-100' 
                        : 'text-[#FFC700] opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0'
                    }`}
              />
            </TiltStepCard>
              </div>
            </Wrapper>
          );
        })}
      </div>

      {/* Start CTA */}
      <div className="mt-8 text-center">
        <Wrapper {...getWrapperProps('fade-up', 600)}>
        <button
            onClick={() => handleClick('experiment')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm shadow-[0_0_20px_rgba(255,199,0,0.3)] hover:shadow-[0_0_40px_rgba(255,199,0,0.5)] hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#FFC700]/50"
            style={{ 
              backgroundColor: THEME.colors.primary, 
              color: '#000',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {t.startStep}
            <ArrowRight size={16} className="group-hover:translate-x-0.5" style={{ transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        </button>
        </Wrapper>
      </div>
    </div>
  );
};

            }}
          >
            {t.startStep}
            <ArrowRight size={16} className="group-hover:translate-x-0.5" style={{ transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        </button>
        </Wrapper>
      </div>
    </div>
  );
};