import React, { useEffect, useState, useRef, useCallback } from 'react';
import { THEME } from '../theme';
import { useExperimentHUD, HudEvent } from '../hooks/useExperimentHUD';

interface OperationGuideCardProps {
  lang: 'en' | 'zh';
  className?: string;
}

/**
 * OperationGuideCard - Live HUD that responds to user actions
 * 
 * A "heads-up display" that shows real-time feedback when users
 * interact with the Smith Chart experiment.
 * 
 * Design principles:
 * - Event-driven: Only animates in response to actual user actions
 * - Restrained: Short, subtle animations that don't distract
 * - Accessible: Respects prefers-reduced-motion
 */
export const OperationGuideCard: React.FC<OperationGuideCardProps> = ({ 
  lang, 
  className = '' 
}) => {
  const { lastEvent, eventTimestamp, hasRecentActivity } = useExperimentHUD();
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Check for reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const items = lang === 'zh' ? [
    { id: 'hover', event: 'pointerHover' as HudEvent, text: '悬停光标 → 实时读数' },
    { id: 'drag', event: 'sliderDrag' as HudEvent, text: '拖动滑块 → 精确控制' },
    { id: 'toggle', event: 'modeToggle' as HudEvent, text: '切换导纳 → 并联视角' },
    { id: 'match', event: 'nearPerfectMatch' as HudEvent, text: '靠近圆心 → 完美匹配' },
  ] : [
    { id: 'hover', event: 'pointerHover' as HudEvent, text: 'Hover cursor → Live readout' },
    { id: 'drag', event: 'sliderDrag' as HudEvent, text: 'Drag slider → Precise control' },
    { id: 'toggle', event: 'modeToggle' as HudEvent, text: 'Toggle admittance → Shunt view' },
    { id: 'match', event: 'nearPerfectMatch' as HudEvent, text: 'Near center → Perfect match' },
  ];

  return (
    <div className={`pl-2 py-2 relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pl-2">
        <div className="flex items-center gap-2.5">
          <span 
            className="w-2.5 h-2.5 rounded-full transition-all"
            style={{ 
              backgroundColor: hasRecentActivity ? THEME.colors.primary : THEME.colors.secondary,
              boxShadow: hasRecentActivity 
                ? `0 0 12px ${THEME.colors.primary}` 
                : `0 0 6px ${THEME.colors.secondary}60`,
              transitionDuration: '300ms',
              transitionTimingFunction: 'var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
            }}
          />
          <h3 
            className="text-sm font-semibold tracking-wide"
            style={{ color: THEME.colors.text.main }}
          >
            {lang === 'zh' ? '操作指南' : 'Operation Guide'}
          </h3>
        </div>
        
        {/* LIVE Badge */}
        <LiveBadge active={hasRecentActivity} reducedMotion={reducedMotion} />
      </div>

      {/* Timeline container */}
      <div className="relative pl-4">
        {/* Vertical timeline line */}
        <div 
          className="absolute left-[7px] top-2 bottom-2 w-px"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        />

        {/* Items */}
        <div className="space-y-1">
          {items.map((item, idx) => (
            <HUDItem
              key={item.id}
              index={idx + 1}
              text={item.text}
              isActive={lastEvent === item.event}
              eventTimestamp={lastEvent === item.event ? eventTimestamp : 0}
              eventType={item.event}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * LIVE Badge - Shows activity status
 */
const LiveBadge: React.FC<{ active: boolean; reducedMotion: boolean }> = ({ 
  active, 
  reducedMotion 
}) => {
  return (
    <div 
      className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all"
      style={{
        backgroundColor: active ? 'rgba(255, 199, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
        color: active ? THEME.colors.primary : 'rgba(255, 255, 255, 0.3)',
        transitionDuration: '300ms',
        transitionTimingFunction: 'var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
      }}
    >
      {/* Pulse dot */}
      <span 
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: active ? THEME.colors.primary : 'rgba(255, 255, 255, 0.3)',
          animation: active && !reducedMotion ? 'hudPulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      LIVE
    </div>
  );
};

/**
 * HUDItem - Individual operation guide item with event-driven animations
 */
interface HUDItemProps {
  index: number;
  text: string;
  isActive: boolean;
  eventTimestamp: number;
  eventType: HudEvent;
  reducedMotion: boolean;
}

const HUDItem: React.FC<HUDItemProps> = ({ 
  index, 
  text, 
  isActive,
  eventTimestamp,
  eventType,
  reducedMotion,
}) => {
  const [animState, setAnimState] = useState<'idle' | 'active'>('idle');
  const timeoutRef = useRef<number>(0);

  // Animation durations per event type
  const durations: Record<HudEvent, number> = {
    pointerHover: 600,
    sliderDrag: 400,
    modeToggle: 300,
    nearPerfectMatch: 800,
  };

  // Trigger animation when this item becomes active
  useEffect(() => {
    if (isActive && eventTimestamp > 0) {
      setAnimState('active');
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Reset to idle after animation duration
      timeoutRef.current = window.setTimeout(() => {
        setAnimState('idle');
      }, durations[eventType]);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, eventTimestamp, eventType]);

  const isAnimating = animState === 'active';

  return (
    <div 
      className="flex items-center gap-3 py-2.5 px-2 rounded-lg relative transition-all"
      style={{
        backgroundColor: isAnimating ? 'rgba(255, 199, 0, 0.06)' : 'transparent',
        transitionDuration: '300ms',
        transitionTimingFunction: 'var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
      }}
    >
      {/* Index circle with event-specific animations */}
      <IndexCircle 
        index={index}
        eventType={eventType}
        isAnimating={isAnimating}
        reducedMotion={reducedMotion}
      />

      {/* Text with data line effect */}
      <div className="flex-1 relative overflow-hidden">
        <span 
          className="text-sm transition-all block"
          style={{
            color: isAnimating 
              ? (eventType === 'nearPerfectMatch' ? THEME.colors.primary : 'rgba(255, 255, 255, 0.9)')
              : 'rgba(255, 255, 255, 0.55)',
            textShadow: isAnimating && eventType === 'nearPerfectMatch' 
              ? `0 0 20px ${THEME.colors.primary}40` 
              : 'none',
            transitionDuration: '300ms',
            transitionTimingFunction: 'var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
          }}
        >
          {text}
        </span>
        
        {/* Data streaming line - only for pointerHover */}
        {eventType === 'pointerHover' && isAnimating && !reducedMotion && (
          <DataLine />
        )}
      </div>
    </div>
  );
};

/**
 * IndexCircle - The numbered indicator with event-specific animations
 */
interface IndexCircleProps {
  index: number;
  eventType: HudEvent;
  isAnimating: boolean;
  reducedMotion: boolean;
}

const IndexCircle: React.FC<IndexCircleProps> = ({ 
  index, 
  eventType, 
  isAnimating,
  reducedMotion,
}) => {
  // Different visual states based on event type
  const getStyles = () => {
    const base = {
      width: '22px',
      height: '22px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: '700' as const,
      transition: 'all 300ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
      position: 'relative' as const,
    };

    if (!isAnimating) {
      return {
        ...base,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: 'rgba(255, 255, 255, 0.4)',
        transform: 'scale(1)',
        boxShadow: 'none',
      };
    }

    // Event-specific active states
    switch (eventType) {
      case 'pointerHover':
        return {
          ...base,
          backgroundColor: 'rgba(255, 199, 0, 0.2)',
          color: THEME.colors.primary,
          transform: 'scale(1)',
          boxShadow: `0 0 15px ${THEME.colors.primary}60`,
        };
      
      case 'sliderDrag':
        return {
          ...base,
          backgroundColor: 'rgba(255, 199, 0, 0.25)',
          color: THEME.colors.primary,
          transform: reducedMotion ? 'scale(1)' : 'scale(1.1)',
          boxShadow: `0 0 12px ${THEME.colors.primary}50`,
        };
      
      case 'modeToggle':
        return {
          ...base,
          backgroundColor: 'rgba(100, 180, 255, 0.2)',
          color: '#64B4FF',
          transform: reducedMotion ? 'scale(1)' : 'rotateY(180deg)',
          boxShadow: '0 0 12px rgba(100, 180, 255, 0.4)',
        };
      
      case 'nearPerfectMatch':
        return {
          ...base,
          backgroundColor: THEME.colors.primary,
          color: '#000',
          transform: 'scale(1)',
          boxShadow: `0 0 20px ${THEME.colors.primary}`,
        };
      
      default:
        return base;
    }
  };

  const styles = getStyles();

  return (
    <div 
      className="flex-shrink-0"
      style={styles}
    >
      {/* For modeToggle, show arrows instead of number */}
      {eventType === 'modeToggle' && isAnimating && !reducedMotion ? (
        <span style={{ transform: 'rotateY(180deg)' }}>⇄</span>
      ) : (
        index
      )}
      
      {/* Glow ring for pointerHover */}
      {eventType === 'pointerHover' && isAnimating && !reducedMotion && (
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            animation: 'hudRingExpand 600ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)) forwards',
            border: `1px solid ${THEME.colors.primary}`,
            opacity: 0,
          }}
        />
      )}
    </div>
  );
};

/**
 * DataLine - Animated data streaming line effect
 */
const DataLine: React.FC = () => {
  return (
    <div 
      className="absolute bottom-0 left-0 h-px overflow-hidden"
      style={{ width: '100%' }}
    >
      <div 
        className="h-full"
        style={{
          width: '40px',
          background: `linear-gradient(90deg, transparent, ${THEME.colors.primary}, transparent)`,
          animation: 'hudDataStream 600ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)) forwards',
        }}
      />
    </div>
  );
};

// Inject keyframe styles
if (typeof document !== 'undefined') {
  const styleId = 'operation-guide-card-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes hudPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
      }
      
      @keyframes hudDataStream {
        0% { transform: translateX(-100%); opacity: 0; }
        20% { opacity: 1; }
        100% { transform: translateX(calc(100vw)); opacity: 0; }
      }
      
      @keyframes hudRingExpand {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(1.8); opacity: 0; }
      }
      
      @keyframes hudScalePop {
        0% { transform: scale(0.9); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
}

export default OperationGuideCard;




import { useExperimentHUD, HudEvent } from '../hooks/useExperimentHUD';

interface OperationGuideCardProps {
  lang: 'en' | 'zh';
  className?: string;
}

/**
 * OperationGuideCard - Live HUD that responds to user actions
 * 
 * A "heads-up display" that shows real-time feedback when users
 * interact with the Smith Chart experiment.
 * 
 * Design principles:
 * - Event-driven: Only animates in response to actual user actions
 * - Restrained: Short, subtle animations that don't distract
 * - Accessible: Respects prefers-reduced-motion
 */
export const OperationGuideCard: React.FC<OperationGuideCardProps> = ({ 
  lang, 
  className = '' 
}) => {
  const { lastEvent, eventTimestamp, hasRecentActivity } = useExperimentHUD();
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Check for reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const items = lang === 'zh' ? [
    { id: 'hover', event: 'pointerHover' as HudEvent, text: '悬停光标 → 实时读数' },
    { id: 'drag', event: 'sliderDrag' as HudEvent, text: '拖动滑块 → 精确控制' },
    { id: 'toggle', event: 'modeToggle' as HudEvent, text: '切换导纳 → 并联视角' },
    { id: 'match', event: 'nearPerfectMatch' as HudEvent, text: '靠近圆心 → 完美匹配' },
  ] : [
    { id: 'hover', event: 'pointerHover' as HudEvent, text: 'Hover cursor → Live readout' },
    { id: 'drag', event: 'sliderDrag' as HudEvent, text: 'Drag slider → Precise control' },
    { id: 'toggle', event: 'modeToggle' as HudEvent, text: 'Toggle admittance → Shunt view' },
    { id: 'match', event: 'nearPerfectMatch' as HudEvent, text: 'Near center → Perfect match' },
  ];

  return (
    <div className={`pl-2 py-2 relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pl-2">
        <div className="flex items-center gap-2.5">
          <span 
            className="w-2.5 h-2.5 rounded-full transition-all"
            style={{ 
              backgroundColor: hasRecentActivity ? THEME.colors.primary : THEME.colors.secondary,
              boxShadow: hasRecentActivity 
                ? `0 0 12px ${THEME.colors.primary}` 
                : `0 0 6px ${THEME.colors.secondary}60`,
              transitionDuration: '300ms',
              transitionTimingFunction: 'var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
            }}
          />
          <h3 
            className="text-sm font-semibold tracking-wide"
            style={{ color: THEME.colors.text.main }}
          >
            {lang === 'zh' ? '操作指南' : 'Operation Guide'}
          </h3>
        </div>
        
        {/* LIVE Badge */}
        <LiveBadge active={hasRecentActivity} reducedMotion={reducedMotion} />
      </div>

      {/* Timeline container */}
      <div className="relative pl-4">
        {/* Vertical timeline line */}
        <div 
          className="absolute left-[7px] top-2 bottom-2 w-px"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        />

        {/* Items */}
        <div className="space-y-1">
          {items.map((item, idx) => (
            <HUDItem
              key={item.id}
              index={idx + 1}
              text={item.text}
              isActive={lastEvent === item.event}
              eventTimestamp={lastEvent === item.event ? eventTimestamp : 0}
              eventType={item.event}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * LIVE Badge - Shows activity status
 */
const LiveBadge: React.FC<{ active: boolean; reducedMotion: boolean }> = ({ 
  active, 
  reducedMotion 
}) => {
  return (
    <div 
      className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all"
      style={{
        backgroundColor: active ? 'rgba(255, 199, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
        color: active ? THEME.colors.primary : 'rgba(255, 255, 255, 0.3)',
        transitionDuration: '300ms',
        transitionTimingFunction: 'var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
      }}
    >
      {/* Pulse dot */}
      <span 
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: active ? THEME.colors.primary : 'rgba(255, 255, 255, 0.3)',
          animation: active && !reducedMotion ? 'hudPulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      LIVE
    </div>
  );
};

/**
 * HUDItem - Individual operation guide item with event-driven animations
 */
interface HUDItemProps {
  index: number;
  text: string;
  isActive: boolean;
  eventTimestamp: number;
  eventType: HudEvent;
  reducedMotion: boolean;
}

const HUDItem: React.FC<HUDItemProps> = ({ 
  index, 
  text, 
  isActive,
  eventTimestamp,
  eventType,
  reducedMotion,
}) => {
  const [animState, setAnimState] = useState<'idle' | 'active'>('idle');
  const timeoutRef = useRef<number>(0);

  // Animation durations per event type
  const durations: Record<HudEvent, number> = {
    pointerHover: 600,
    sliderDrag: 400,
    modeToggle: 300,
    nearPerfectMatch: 800,
  };

  // Trigger animation when this item becomes active
  useEffect(() => {
    if (isActive && eventTimestamp > 0) {
      setAnimState('active');
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Reset to idle after animation duration
      timeoutRef.current = window.setTimeout(() => {
        setAnimState('idle');
      }, durations[eventType]);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, eventTimestamp, eventType]);

  const isAnimating = animState === 'active';

  return (
    <div 
      className="flex items-center gap-3 py-2.5 px-2 rounded-lg relative transition-all"
      style={{
        backgroundColor: isAnimating ? 'rgba(255, 199, 0, 0.06)' : 'transparent',
        transitionDuration: '300ms',
        transitionTimingFunction: 'var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
      }}
    >
      {/* Index circle with event-specific animations */}
      <IndexCircle 
        index={index}
        eventType={eventType}
        isAnimating={isAnimating}
        reducedMotion={reducedMotion}
      />

      {/* Text with data line effect */}
      <div className="flex-1 relative overflow-hidden">
        <span 
          className="text-sm transition-all block"
          style={{
            color: isAnimating 
              ? (eventType === 'nearPerfectMatch' ? THEME.colors.primary : 'rgba(255, 255, 255, 0.9)')
              : 'rgba(255, 255, 255, 0.55)',
            textShadow: isAnimating && eventType === 'nearPerfectMatch' 
              ? `0 0 20px ${THEME.colors.primary}40` 
              : 'none',
            transitionDuration: '300ms',
            transitionTimingFunction: 'var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
          }}
        >
          {text}
        </span>
        
        {/* Data streaming line - only for pointerHover */}
        {eventType === 'pointerHover' && isAnimating && !reducedMotion && (
          <DataLine />
        )}
      </div>
    </div>
  );
};

/**
 * IndexCircle - The numbered indicator with event-specific animations
 */
interface IndexCircleProps {
  index: number;
  eventType: HudEvent;
  isAnimating: boolean;
  reducedMotion: boolean;
}

const IndexCircle: React.FC<IndexCircleProps> = ({ 
  index, 
  eventType, 
  isAnimating,
  reducedMotion,
}) => {
  // Different visual states based on event type
  const getStyles = () => {
    const base = {
      width: '22px',
      height: '22px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: '700' as const,
      transition: 'all 300ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
      position: 'relative' as const,
    };

    if (!isAnimating) {
      return {
        ...base,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: 'rgba(255, 255, 255, 0.4)',
        transform: 'scale(1)',
        boxShadow: 'none',
      };
    }

    // Event-specific active states
    switch (eventType) {
      case 'pointerHover':
        return {
          ...base,
          backgroundColor: 'rgba(255, 199, 0, 0.2)',
          color: THEME.colors.primary,
          transform: 'scale(1)',
          boxShadow: `0 0 15px ${THEME.colors.primary}60`,
        };
      
      case 'sliderDrag':
        return {
          ...base,
          backgroundColor: 'rgba(255, 199, 0, 0.25)',
          color: THEME.colors.primary,
          transform: reducedMotion ? 'scale(1)' : 'scale(1.1)',
          boxShadow: `0 0 12px ${THEME.colors.primary}50`,
        };
      
      case 'modeToggle':
        return {
          ...base,
          backgroundColor: 'rgba(100, 180, 255, 0.2)',
          color: '#64B4FF',
          transform: reducedMotion ? 'scale(1)' : 'rotateY(180deg)',
          boxShadow: '0 0 12px rgba(100, 180, 255, 0.4)',
        };
      
      case 'nearPerfectMatch':
        return {
          ...base,
          backgroundColor: THEME.colors.primary,
          color: '#000',
          transform: 'scale(1)',
          boxShadow: `0 0 20px ${THEME.colors.primary}`,
        };
      
      default:
        return base;
    }
  };

  const styles = getStyles();

  return (
    <div 
      className="flex-shrink-0"
      style={styles}
    >
      {/* For modeToggle, show arrows instead of number */}
      {eventType === 'modeToggle' && isAnimating && !reducedMotion ? (
        <span style={{ transform: 'rotateY(180deg)' }}>⇄</span>
      ) : (
        index
      )}
      
      {/* Glow ring for pointerHover */}
      {eventType === 'pointerHover' && isAnimating && !reducedMotion && (
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            animation: 'hudRingExpand 600ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)) forwards',
            border: `1px solid ${THEME.colors.primary}`,
            opacity: 0,
          }}
        />
      )}
    </div>
  );
};

/**
 * DataLine - Animated data streaming line effect
 */
const DataLine: React.FC = () => {
  return (
    <div 
      className="absolute bottom-0 left-0 h-px overflow-hidden"
      style={{ width: '100%' }}
    >
      <div 
        className="h-full"
        style={{
          width: '40px',
          background: `linear-gradient(90deg, transparent, ${THEME.colors.primary}, transparent)`,
          animation: 'hudDataStream 600ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)) forwards',
        }}
      />
    </div>
  );
};

// Inject keyframe styles
if (typeof document !== 'undefined') {
  const styleId = 'operation-guide-card-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes hudPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
      }
      
      @keyframes hudDataStream {
        0% { transform: translateX(-100%); opacity: 0; }
        20% { opacity: 1; }
        100% { transform: translateX(calc(100vw)); opacity: 0; }
      }
      
      @keyframes hudRingExpand {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(1.8); opacity: 0; }
      }
      
      @keyframes hudScalePop {
        0% { transform: scale(0.9); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
}

export default OperationGuideCard;
