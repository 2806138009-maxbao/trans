import React, { useRef, useState, useEffect, MouseEvent, useMemo } from 'react';

interface HudTiltContainerProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  reducedMotion?: boolean;
}

// Inject breathing animation keyframes once
if (typeof document !== 'undefined') {
  const styleId = 'hud-breathe-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes hud-breathe {
        0%, 100% { 
          opacity: 0.3; 
          border-color: rgba(255, 199, 0, 0.2);
        }
        50% { 
          opacity: 0.6; 
          border-color: rgba(255, 199, 0, 0.4);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Corner bracket component to reduce repetition
const CornerBracket: React.FC<{
  position: 'tl' | 'tr' | 'bl' | 'br';
  reducedMotion: boolean;
  delay?: string;
  hover?: boolean;
}> = ({ position, reducedMotion, delay = '0s', hover = false }) => {
  const positionClasses = {
    tl: 'top-3 left-3 border-t border-l rounded-tl-lg',
    tr: 'top-3 right-3 border-t border-r rounded-tr-lg',
    bl: 'bottom-3 left-3 border-b border-l rounded-bl-lg',
    br: 'bottom-3 right-3 border-b border-r rounded-br-lg',
  };

  return (
    <div 
      className={`absolute w-6 h-6 ${positionClasses[position]} pointer-events-none ${hover ? 'transition-[width,height] duration-300 group-hover:w-8 group-hover:h-8' : ''}`}
      style={{
        borderColor: 'rgba(255, 199, 0, 0.3)',
        animation: reducedMotion ? 'none' : 'hud-breathe 5s ease-in-out infinite',
        animationDelay: delay,
      }}
    />
  );
};

/**
 * HUD Container with 3D tilt and glow effects
 * Mobile auto-disables 3D for smooth scrolling
 * Corner brackets have "breathing" animation for alive feel
 */
export const HudTiltContainer: React.FC<HudTiltContainerProps> = ({
  children,
  className = '',
  glowColor = 'rgba(94, 106, 210, 0.4)',
  reducedMotion = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isMobile || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const perX = (x / rect.width) * 100;
    const perY = (y / rect.height) * 100;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setRotation({
      x: ((y - centerY) / centerY) * -3,
      y: ((x - centerX) / centerX) * 3,
    });
    setSpotlight({ x: perX, y: perY, opacity: 1 });
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setRotation({ x: 0, y: 0 });
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  const containerStyle = useMemo(() => ({
    background: 'radial-gradient(circle at 50% 50%, rgba(30, 30, 40, 0.12) 0%, transparent 80%)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.02), 0 16px 48px rgba(0, 0, 0, 0.35)',
  }), []);

  // Mobile simplified version
  if (isMobile) {
    return (
      <div ref={containerRef} className={`relative rounded-3xl ${className}`}>
        <div className="relative z-10 w-full h-full rounded-3xl overflow-hidden" style={containerStyle}>
          {children}
          <CornerBracket position="tl" reducedMotion={reducedMotion} />
          <CornerBracket position="tr" reducedMotion={reducedMotion} delay="1.25s" />
          <CornerBracket position="bl" reducedMotion={reducedMotion} delay="1.25s" />
          <CornerBracket position="br" reducedMotion={reducedMotion} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-3xl group ${className}`}
      style={{
        transform: `perspective(1500px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: 'transform 0.15s ease-out',
        willChange: 'transform',
      }}
    >
      {/* Dynamic Border Gradient */}
      <div
        className="absolute inset-[-1px] rounded-3xl z-0 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, ${glowColor}, transparent 50%)`,
          transition: 'opacity 0.3s ease-out',
        }}
      />

      {/* Glass Surface & Spotlight */}
      <div
        className="absolute inset-0 rounded-3xl z-10 pointer-events-none"
        style={{
          background: `radial-gradient(800px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.03), transparent 40%)`,
          opacity: spotlight.opacity,
          transition: 'opacity 0.3s ease-out',
        }}
      />

      {/* Content Container */}
      <div
        className="relative z-10 w-full h-full rounded-3xl overflow-hidden"
        style={containerStyle}
      >
        {children}
        <CornerBracket position="tl" reducedMotion={reducedMotion} hover />
        <CornerBracket position="tr" reducedMotion={reducedMotion} delay="1.25s" hover />
        <CornerBracket position="bl" reducedMotion={reducedMotion} delay="1.25s" hover />
        <CornerBracket position="br" reducedMotion={reducedMotion} hover />
      </div>
    </div>
  );
};
