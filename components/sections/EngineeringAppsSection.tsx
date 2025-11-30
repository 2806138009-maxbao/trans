import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { AnimateOnScroll } from '../AnimateOnScroll';
import { THEME } from '../../theme';
import { SmithMode, useSmithModeOptional, SMITH_MODE_PRESETS } from '../../state/smithModes';

interface EngineeringAppsSectionProps {
  lang: Language;
  reducedMotion?: boolean;
  id?: string;
  /** Callback when user selects a mode - used when not inside SmithModeProvider */
  onModeSelect?: (mode: SmithMode) => void;
}

// Re-export for backwards compatibility
export type EngineeringMode = SmithMode;

/**
 * Mode item configuration
 */
interface ModeItem {
  id: SmithMode;
  index: number;
}

const MODE_ITEMS: ModeItem[] = [
  { id: 'antenna', index: 1 },
  { id: 'power', index: 2 },
  { id: 'filter', index: 3 },
  { id: 'line', index: 4 },
];

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

/**
 * Professional SVG icons for engineering modes
 */
const ModeIcon: React.FC<{ type: SmithMode; isHighlighted: boolean }> = ({ type, isHighlighted }) => {
  const color = isHighlighted ? THEME.colors.primary : 'rgba(255, 199, 0, 0.6)';
  const size = 16;
  
  switch (type) {
    case 'antenna':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path 
            d="M8 14V6M8 6L4 2M8 6L12 2" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M3 8C3 8 5 7 8 7C11 7 13 8 13 8" 
            stroke={color} 
            strokeWidth="1" 
            strokeLinecap="round"
            opacity="0.6"
          />
          <path 
            d="M1 10C1 10 4 8.5 8 8.5C12 8.5 15 10 15 10" 
            stroke={color} 
            strokeWidth="1" 
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
      );
    
    case 'power':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path 
            d="M2 12V4L12 8L2 12Z" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinejoin="round"
          />
          <path 
            d="M12 8H15" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
        </svg>
      );
    
    case 'filter':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path 
            d="M1 8H3C3.5 8 4 7 4.5 7C5 7 5 9 5.5 9C6 9 6 7 6.5 7C7 7 7.5 8 8 8" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
          <path 
            d="M10 5V11M12 5V11" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
          <path 
            d="M8 8H10M12 8H15" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
        </svg>
      );
    
    case 'line':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path 
            d="M1 5H15M1 11H15" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
          <path 
            d="M4 5V11M8 5V11M12 5V11" 
            stroke={color} 
            strokeWidth="1" 
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      );
    
    default:
      return null;
  }
};

export const EngineeringAppsSection: React.FC<EngineeringAppsSectionProps> = ({ 
  lang, 
  reducedMotion = false, 
  id,
  onModeSelect,
}) => {
  const t = TRANSLATIONS[lang];
  
  // Try to use context if available, otherwise use local state
  const smithModeContext = useSmithModeOptional();
  const [localMode, setLocalMode] = useState<SmithMode | null>(null);
  
  const activeMode = smithModeContext?.mode ?? localMode;
  const setActiveMode = smithModeContext?.setMode ?? setLocalMode;
  
  const [hoveredMode, setHoveredMode] = useState<SmithMode | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Staggered entrance animation on first scroll into view
  useEffect(() => {
    if (reducedMotion || hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [reducedMotion, hasAnimated]);

  const handleModeClick = useCallback((mode: SmithMode) => {
    const newMode = activeMode === mode ? null : mode;
    setActiveMode(newMode);
    if (newMode) {
      onModeSelect?.(newMode);
    }
  }, [activeMode, setActiveMode, onModeSelect]);

  const Wrapper = reducedMotion ? React.Fragment : AnimateOnScroll;
  const getWrapperProps = (animation: string, delay: number = 0) => 
    reducedMotion ? {} : { animation: animation as any, delay };

  return (
    <section ref={sectionRef} id={id} className="w-full relative px-6 py-16">
      <div className="max-w-6xl mx-auto space-y-8">
        <Wrapper {...getWrapperProps('fade-up')}>
          <div className="flex items-center gap-3">
            <GlowDot color={THEME.colors.secondary} />
            <h2 className="text-3xl md:text-4xl font-bold">
              <GradientText>{t.engineeringTitle}</GradientText>
            </h2>
          </div>
        </Wrapper>
        
        <Wrapper {...getWrapperProps('fade-up', 100)}>
          <p className="text-lg text-[#D0D6E0] leading-relaxed max-w-3xl">
            {t.engineeringLead}
          </p>
        </Wrapper>

        {/* Mode Cards - Swiss Army Knife Blades */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODE_ITEMS.map((item, idx) => {
            const isActive = activeMode === item.id;
            const isHovered = hoveredMode === item.id;
            const entranceDelay = hasAnimated ? idx * 70 : 0;
            const engineeringItem = t.engineeringItems[idx];
            
            return (
              <ModeCard
                key={item.id}
                mode={item.id}
                index={item.index}
                title={engineeringItem?.title ?? ''}
                description={engineeringItem?.desc ?? ''}
                isActive={isActive}
                isHovered={isHovered}
                reducedMotion={reducedMotion}
                entranceDelay={entranceDelay}
                shouldAnimate={hasAnimated}
                onHover={(hovered) => setHoveredMode(hovered ? item.id : null)}
                onClick={() => handleModeClick(item.id)}
              />
            );
          })}
        </div>

        {/* Active Mode Indicator */}
        {activeMode && (
          <div 
            className="text-center text-sm"
            style={{
              color: THEME.colors.text.muted,
              opacity: 0.7,
              animation: reducedMotion ? 'none' : 'modeIndicatorFadeIn 300ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)) forwards',
            }}
          >
            {lang === 'zh' 
              ? `当前模式：${SMITH_MODE_PRESETS[activeMode].label}`
              : `Current mode: ${SMITH_MODE_PRESETS[activeMode].label}`
            }
          </div>
        )}
      </div>

      <style>{`
        @keyframes modeIndicatorFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 0.7; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

/**
 * ModeCard - Interactive "blade" of the Swiss Army Knife
 */
interface ModeCardProps {
  mode: SmithMode;
  index: number;
  title: string;
  description: string;
  isActive: boolean;
  isHovered: boolean;
  reducedMotion: boolean;
  entranceDelay: number;
  shouldAnimate: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}

const ModeCard: React.FC<ModeCardProps> = ({
  mode,
  index,
  title,
  description,
  isActive,
  isHovered,
  reducedMotion,
  entranceDelay,
  shouldAnimate,
  onHover,
  onClick,
}) => {
  const [hasEntered, setHasEntered] = useState(false);

  // Trigger entrance animation after delay
  useEffect(() => {
    if (!shouldAnimate || reducedMotion) {
      setHasEntered(true);
      return;
    }

    const timer = setTimeout(() => setHasEntered(true), entranceDelay);
    return () => clearTimeout(timer);
  }, [shouldAnimate, entranceDelay, reducedMotion]);

  const isHighlighted = isActive || isHovered;

  // Compute transform based on state and motion preference
  const getTransform = () => {
    if (reducedMotion) return 'none';
    if (!hasEntered) return 'translateY(20px)';
    if (isHovered && !isActive) return 'translateY(-2px)';
    return 'translateY(0)';
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="w-full text-left relative group pl-6 py-4 focus:outline-none"
      style={{
        transform: getTransform(),
        opacity: hasEntered ? 1 : 0,
        transition: `
          transform 300ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)),
          opacity 300ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))
        `,
        cursor: 'pointer',
      }}
    >
      {/* Left accent line */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-0.5 transition-all duration-300"
        style={{
          backgroundColor: isActive 
            ? THEME.colors.primary 
            : isHovered 
              ? 'rgba(255, 199, 0, 0.3)' 
              : 'rgba(255, 255, 255, 0.1)',
          width: isActive ? '4px' : '2px',
        }}
      />

      <div className="flex items-start gap-4">
        {/* Index Badge - Floating text number */}
        <div 
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-bold tabular-nums"
          style={{ 
            color: isActive 
              ? THEME.colors.primary 
              : 'rgba(255, 255, 255, 0.3)',
            transition: 'color 200ms ease',
          }}
        >
          {index < 10 ? `0${index}` : index}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <ModeIcon type={mode} isHighlighted={isHighlighted} />
            <h3 
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ 
                color: isHighlighted ? '#FFF' : 'rgba(255, 255, 255, 0.7)',
                transition: 'color 200ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
              }}
            >
              {title}
            </h3>
          </div>
          <p 
            className="text-sm leading-relaxed"
            style={{ 
              color: isHighlighted ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.5)',
              transition: 'color 200ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </button>
  );
};

export default EngineeringAppsSection;

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {t.engineeringItems.map((item, idx) => (
            <Wrapper key={idx} {...getWrapperProps('scale', 200 + idx * 100)}>
              <TiltCard glowColor="rgba(255,199,0,0.3)">
                <div className="p-6 space-y-3 group">
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: `${THEME.colors.primary}20`, color: THEME.colors.primary }}
                    >
                      {idx + 1}
                    </span>
                    <div className="text-sm uppercase tracking-[0.2em] text-[var(--color-text-muted)] group-hover:text-white transition-colors duration-300">
                      {item.title}
                    </div>
                  </div>
                  <p className="text-[#D0D6E0] text-sm leading-relaxed group-hover:text-white transition-colors duration-300">
                    {item.desc}
                  </p>
                </div>
              </TiltCard>
            </Wrapper>
          ))}
        </div>
      </div>
    </section>
  );
};
