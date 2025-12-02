import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ConformalGrid } from './ConformalGrid';
import { THEME } from '../theme';

/**
 * ConformalHero - The Scrollytelling Hero Section
 * 
 * Combines the ConformalGrid visualization with
 * scroll-controlled text overlays that reveal the
 * mathematical story of the Smith Chart.
 */

interface ConformalHeroProps {
  lang?: 'zh' | 'en';
  onComplete?: () => void;
}

// Text content for each phase
const PHASE_TEXT = {
  zh: {
    phase1: {
      title: '线性是沉默',
      subtitle: '在没有频率的世界里，一切都是直线。',
    },
    phase2: {
      title: '频率入场',
      subtitle: '正弦波打破了平静。复阻抗开始震荡。',
    },
    phase3: {
      title: '无限，被收容',
      subtitle: '双线性变换将无限平面折叠进单位圆。这就是史密斯圆图的数学起源。',
    },
  },
  en: {
    phase1: {
      title: 'Linearity is silence.',
      subtitle: 'In a world without frequency, everything is a straight line.',
    },
    phase2: {
      title: 'Frequency enters.',
      subtitle: 'Sine waves break the calm. Complex impedance begins to oscillate.',
    },
    phase3: {
      title: 'Infinity. Contained.',
      subtitle: 'The bilinear transform folds the infinite plane into a unit circle. This is the mathematical origin of the Smith Chart.',
    },
  },
};

// Scroll indicator component
const ScrollIndicator: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div 
    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    style={{ opacity, transition: 'opacity 0.5s ease' }}
  >
    <span 
      className="text-[10px] uppercase tracking-[0.2em]"
      style={{ color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'Space Grotesk, sans-serif' }}
    >
      Scroll to explore
    </span>
    <svg 
      width="20" height="30" viewBox="0 0 20 30" 
      fill="none" 
      style={{ animation: 'scrollBounce 2s ease-in-out infinite' }}
    >
      <rect x="1" y="1" width="18" height="28" rx="9" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      <circle cx="10" cy="8" r="2" fill="rgba(255,255,255,0.5)">
        <animate attributeName="cy" values="8;18;8" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  </div>
);

// Phase text overlay component
interface PhaseTextProps {
  title: string;
  subtitle: string;
  opacity: number;
  yOffset: number;
}

const PhaseText: React.FC<PhaseTextProps> = ({ title, subtitle, opacity, yOffset }) => (
  <div 
    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8"
    style={{ 
      opacity, 
      transform: `translateY(${yOffset}px)`,
      transition: 'opacity 0.4s ease, transform 0.4s ease',
    }}
  >
    <h2 
      className="text-3xl md:text-5xl lg:text-6xl font-bold text-center mb-4"
      style={{ 
        fontFamily: '"Space Grotesk", sans-serif',
        letterSpacing: '-0.04em',
        color: '#FFFFFF',
        textShadow: '0 0 40px rgba(0,0,0,0.8)',
      }}
    >
      {title}
    </h2>
    <p 
      className="text-sm md:text-base lg:text-lg text-center max-w-xl"
      style={{ 
        fontFamily: '"Space Grotesk", sans-serif',
        letterSpacing: '-0.02em',
        color: 'rgba(255, 255, 255, 0.6)',
      }}
    >
      {subtitle}
    </p>
  </div>
);

// Progress indicator dots
const ProgressDots: React.FC<{ progress: number }> = ({ progress }) => {
  const phases = [0, 0.3, 0.6];
  
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3">
      {phases.map((threshold, i) => {
        const isActive = progress >= threshold;
        const isPast = i < phases.length - 1 && progress >= phases[i + 1];
        
        return (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: isActive 
                ? (isPast ? 'rgba(255, 199, 0, 0.3)' : '#FFD700')
                : 'rgba(255, 255, 255, 0.2)',
              boxShadow: isActive && !isPast ? '0 0 8px #FFD700' : 'none',
              transform: isActive && !isPast ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        );
      })}
    </div>
  );
};

export const ConformalHero: React.FC<ConformalHeroProps> = ({
  lang = 'zh',
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress based on how much of the section has scrolled
      // 0 when top of section is at bottom of viewport
      // 1 when bottom of section is at top of viewport
      const sectionHeight = container.offsetHeight;
      const scrolled = windowHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / sectionHeight));
      
      setScrollProgress(progress);
      
      if (progress >= 0.95 && onComplete) {
        onComplete();
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onComplete]);
  
  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: window.innerHeight,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Calculate phase opacities
  const getPhaseOpacity = (phaseStart: number, phaseEnd: number): number => {
    const fadeInStart = phaseStart;
    const fadeInEnd = phaseStart + 0.1;
    const fadeOutStart = phaseEnd - 0.1;
    const fadeOutEnd = phaseEnd;
    
    if (scrollProgress < fadeInStart) return 0;
    if (scrollProgress < fadeInEnd) return (scrollProgress - fadeInStart) / (fadeInEnd - fadeInStart);
    if (scrollProgress < fadeOutStart) return 1;
    if (scrollProgress < fadeOutEnd) return 1 - (scrollProgress - fadeOutStart) / (fadeOutEnd - fadeOutStart);
    return 0;
  };
  
  const phase1Opacity = getPhaseOpacity(0, 0.3);
  const phase2Opacity = getPhaseOpacity(0.3, 0.6);
  const phase3Opacity = getPhaseOpacity(0.6, 1.0);
  
  const text = PHASE_TEXT[lang];
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full"
      style={{ 
        height: '300vh', // 3 screen heights for scrolling
        background: '#050505',
      }}
    >
      {/* Sticky canvas container */}
      <div 
        className="sticky top-0 left-0 w-full overflow-hidden"
        style={{ height: '100vh' }}
      >
        {/* The conformal grid visualization */}
        <ConformalGrid
          scrollProgress={scrollProgress}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0"
        />
        
        {/* Phase 1 Text */}
        <PhaseText
          title={text.phase1.title}
          subtitle={text.phase1.subtitle}
          opacity={phase1Opacity}
          yOffset={phase1Opacity < 1 ? 20 * (1 - phase1Opacity) : 0}
        />
        
        {/* Phase 2 Text */}
        <PhaseText
          title={text.phase2.title}
          subtitle={text.phase2.subtitle}
          opacity={phase2Opacity}
          yOffset={phase2Opacity < 1 ? 20 * (1 - phase2Opacity) : 0}
        />
        
        {/* Phase 3 Text */}
        <PhaseText
          title={text.phase3.title}
          subtitle={text.phase3.subtitle}
          opacity={phase3Opacity}
          yOffset={phase3Opacity < 1 ? 20 * (1 - phase3Opacity) : 0}
        />
        
        {/* Progress dots */}
        <ProgressDots progress={scrollProgress} />
        
        {/* Scroll indicator (fades out as user scrolls) */}
        <ScrollIndicator opacity={Math.max(0, 1 - scrollProgress * 5)} />
        
        {/* Debug: scroll progress (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div 
            className="absolute top-4 left-4 text-xs font-mono"
            style={{ color: 'rgba(255, 199, 0, 0.5)' }}
          >
            scroll: {(scrollProgress * 100).toFixed(1)}%
          </div>
        )}
      </div>
      
      {/* CSS for scroll indicator animation */}
      <style>{`
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
};

export default ConformalHero;




