import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Language } from '../../types';
import { THEME } from '../../theme';

interface ImpedanceLabReadySectionProps {
  lang: Language;
  reducedMotion?: boolean;
  id?: string;
  onLaunchConsole?: () => void;
}

/**
 * MiniSmithPreviewOptimized - Static SVG instead of Canvas for better performance
 */
interface MiniSmithPreviewProps {
  isHovered: boolean;
  reducedMotion: boolean;
}

const MiniSmithPreviewOptimized: React.FC<MiniSmithPreviewProps> = memo(({ 
  isHovered, 
  reducedMotion,
}) => {
  // Use CSS animation instead of RAF for the path
  const pathProgress = isHovered && !reducedMotion ? 1 : 0;

  return (
    <div 
      className="relative overflow-hidden"
      style={{
        // L3 Blackout Protocol: Reduced glow intensity - only subtle feedback on hover
        boxShadow: isHovered ? '0 0 20px rgba(255, 199, 0, 0.08)' : 'none',
        transition: 'box-shadow 300ms',
      }}
    >
      <svg 
        width="200" 
        height="200" 
        viewBox="0 0 200 200"
        style={{ display: 'block' }}
      >
        {/* Unit circle */}
        <circle 
          cx="100" 
          cy="100" 
          r="84" 
          fill="none" 
          stroke="rgba(255, 199, 0, 0.3)" 
          strokeWidth="1.5"
        />
        
        {/* Inner circles (constant R) */}
        <circle cx="108" cy="100" r="76" fill="none" stroke="rgba(255, 199, 0, 0.1)" strokeWidth="0.5" />
        <circle cx="113" cy="100" r="71" fill="none" stroke="rgba(255, 199, 0, 0.1)" strokeWidth="0.5" />
        <circle cx="118" cy="100" r="66" fill="none" stroke="rgba(255, 199, 0, 0.1)" strokeWidth="0.5" />
        
        {/* Horizontal axis */}
        <line x1="16" y1="100" x2="184" y2="100" stroke="rgba(255, 199, 0, 0.1)" strokeWidth="0.5" />
        
        {/* Center point (Γ = 0) */}
        <circle cx="100" cy="100" r="3" fill="rgba(100, 255, 150, 0.5)" />
        
        {/* Path arc - faint background */}
        <path
          d="M 145 60 A 50 50 0 0 0 75 130"
          fill="none"
          stroke="rgba(255, 199, 0, 0.15)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Path arc - animated portion */}
        <path
          d="M 145 60 A 50 50 0 0 0 75 130"
          fill="none"
          stroke="rgba(255, 199, 0, 0.6)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="120"
          strokeDashoffset={reducedMotion ? 80 : (isHovered ? 0 : 80)}
          style={{
            transition: reducedMotion ? 'none' : 'stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
        
        {/* Current point - uses CSS transform for animation */}
        <g 
          style={{
            transform: `translate(${isHovered && !reducedMotion ? -35 : 0}px, ${isHovered && !reducedMotion ? 35 : 0}px)`,
            transition: reducedMotion ? 'none' : 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Point glow */}
          <circle 
            cx="145" 
            cy="60" 
            r="12" 
            fill="url(#pointGlow)"
          />
          {/* Point core */}
          <circle 
            cx="145" 
            cy="60" 
            r="4" 
            fill={THEME.colors.primary}
          />
        </g>
        
        {/* Gradient definition */}
        <defs>
          <radialGradient id="pointGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 199, 0, 0.8)" />
            <stop offset="100%" stopColor="rgba(255, 199, 0, 0)" />
          </radialGradient>
        </defs>
      </svg>
      
      {/* Corner label */}
      <div 
        className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-wider"
        style={{ color: 'rgba(255, 199, 0, 0.5)' }}
      >
        Preview
      </div>
    </div>
  );
});

MiniSmithPreviewOptimized.displayName = 'MiniSmithPreviewOptimized';

/**
 * CtaPanelOptimized - Memoized CTA panel
 */
interface CtaPanelProps {
  title: string;
  description: string;
  buttonText: string;
  reducedMotion: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}

const CtaPanelOptimized: React.FC<CtaPanelProps> = memo(({
  title,
  description,
  buttonText,
  reducedMotion,
  onHover,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHover(true);
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHover(false);
  }, [onHover]);

  const handleClick = useCallback(() => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    onClick();
  }, [onClick]);

  return (
    <div className="text-left max-w-xs space-y-4">
      <h3 
        className="text-lg font-semibold select-text"
        style={{ color: '#FFFFFF' }}
      >
        {title}
      </h3>

      <p 
        className="text-sm leading-relaxed select-text"
        style={{ color: THEME.colors.text.muted }}
      >
        {description}
      </p>

      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="relative flex items-center gap-3 pl-5 pr-6 py-3 font-semibold text-sm"
        style={{
          color: isHovered ? '#FFFFFF' : THEME.colors.primary,
          transform: isPressed && !reducedMotion ? 'scale(0.98)' : 'scale(1)',
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Left accent line */}
        <div 
          className="absolute top-0 bottom-0 left-0 transition-all duration-300"
          style={{
            width: isHovered ? '3px' : '2px',
            backgroundColor: THEME.colors.primary,
            boxShadow: isHovered ? `0 0 10px ${THEME.colors.primary}` : 'none',
          }}
        />
        <span>{buttonText}</span>
        
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
          style={{
            transform: isPressed && !reducedMotion
              ? 'rotate(90deg)' 
              : isHovered && !reducedMotion
                ? 'translateX(3px)' 
                : 'translateX(0)',
            transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <path 
            d="M3 8H13M13 8L9 4M13 8L9 12" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
});

CtaPanelOptimized.displayName = 'CtaPanelOptimized';

/**
 * ImpedanceLabReadySection - Final CTA section
 * 
 * Performance optimized:
 * - Canvas only redraws when necessary
 * - No continuous RAF loops
 * - Memoized child components
 */
export const ImpedanceLabReadySection: React.FC<ImpedanceLabReadySectionProps> = ({
  lang,
  reducedMotion = false,
  id = 'impedance-lab-ready',
  onLaunchConsole,
}) => {
  const [hasEntered, setHasEntered] = useState(false);
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Intersection Observer - only runs once
  useEffect(() => {
    if (reducedMotion) {
      setHasEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasEntered(true);
          observer.disconnect(); // Stop observing after first trigger
        }
      },
      { threshold: 0.3 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => observer.disconnect();
  }, [reducedMotion]);

  const handleLaunch = useCallback(() => {
    if (onLaunchConsole) {
      onLaunchConsole();
    } else {
      const experimentSection = document.getElementById('experiment');
      if (experimentSection) {
        experimentSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [onLaunchConsole]);

  const t = lang === 'zh' ? {
    badge: 'Impedance Lab · Deployment',
    title: '你已掌控圆环。现在，去连接孤岛。',
    subtitle: '匹配、反射、VSWR 已在你掌控之中。现在，用真实电路征服世界。',
    consoleTitle: 'Impedance Lab 控制台',
    consoleDesc: '输入阻抗、频段、目标 VSWR，系统帮你画出路径。',
    ctaButton: '开始实验',
    altLink: '或：看看 Fourier 实验室',
  } : {
    badge: 'Impedance Lab · Deployment',
    title: 'You have mastered the circle. Now, go connect the world.',
    subtitle: 'Matching, reflection, VSWR — all under your control. Now deploy with real circuits.',
    consoleTitle: 'Impedance Lab Console',
    consoleDesc: 'Enter impedance, frequency, target VSWR — the system draws the path.',
    ctaButton: 'Launch Console',
    altLink: 'Or: Explore Fourier Lab',
  };

  // Pre-compute styles to avoid recalculation
  const baseTransition = 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)';

  return (
    <section 
      ref={sectionRef}
      id={id} 
      className="w-full relative px-6 py-24 md:py-32"
    >
      {/* Subtle gradient background - static, no animation */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255, 199, 0, 0.03) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center space-y-8">
        {/* HUD Badge - Void Style */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-2"
          style={{
            opacity: hasEntered ? 1 : 0,
            transform: hasEntered ? 'translateY(0)' : 'translateY(-8px)',
            transition: baseTransition,
          }}
        >
          <span 
            className="w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: THEME.colors.primary,
              boxShadow: `0 0 8px ${THEME.colors.primary}`,
            }}
          />
          <span 
            className="text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: THEME.colors.primary }}
          >
            {t.badge}
          </span>
        </div>

        {/* Main Title */}
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight select-text"
          style={{
            color: '#FFFFFF',
            opacity: hasEntered ? 1 : 0,
            transform: hasEntered ? 'translateY(0)' : 'translateY(12px)',
            transition: `${baseTransition}`,
            transitionDelay: '50ms',
          }}
        >
          {t.title}
        </h2>

        {/* Subtitle */}
        <p 
          className="text-base md:text-lg max-w-xl mx-auto select-text"
          style={{
            color: THEME.colors.text.muted,
            opacity: hasEntered ? 1 : 0,
            transform: hasEntered ? 'translateY(0)' : 'translateY(8px)',
            transition: baseTransition,
            transitionDelay: '100ms',
          }}
        >
          {t.subtitle}
        </p>

        {/* Main Content: Mini Smith + CTA Panel */}
        <div 
          className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 pt-8"
          style={{
            opacity: hasEntered ? 1 : 0,
            transform: hasEntered ? 'translateY(0)' : 'translateY(16px)',
            transition: baseTransition,
            transitionDelay: '150ms',
          }}
        >
          <MiniSmithPreviewOptimized 
            isHovered={isCtaHovered} 
            reducedMotion={reducedMotion}
          />

          <CtaPanelOptimized
            title={t.consoleTitle}
            description={t.consoleDesc}
            buttonText={t.ctaButton}
            reducedMotion={reducedMotion}
            onHover={setIsCtaHovered}
            onClick={handleLaunch}
          />
        </div>

        {/* Alternative Link */}
        <div 
          className="pt-8"
          style={{
            opacity: hasEntered ? 0.5 : 0,
            transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: '250ms',
          }}
        >
          <a
            href="https://fourier.luminouszao.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:opacity-100"
            style={{ 
              color: THEME.colors.text.muted,
              transition: 'opacity 200ms',
            }}
          >
            {t.altLink}
            <span className="ml-1 inline-block">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default ImpedanceLabReadySection;
