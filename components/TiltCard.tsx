import React, { useRef, useState, MouseEvent, TouchEvent, useEffect } from 'react';
import { THEME } from '../theme';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  disabled?: boolean; // 禁用 3D 效果
}

export const TiltCard: React.FC<TiltCardProps> = ({ 
  children, 
  className = "", 
  glowColor = "rgba(94, 106, 210, 0.5)",
  disabled = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  // Detect Mobile
  useEffect(() => {
    const checkMobile = () => {
      const isNarrowScreen = window.innerWidth < 768;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isNarrowScreen || isMobileUA);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldDisable = disabled || isMobile;

  // Mobile Touch Feedback
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    setIsTouched(true);
    
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const perX = (x / rect.width) * 100;
      const perY = (y / rect.height) * 100;
      setSpotlight({ x: perX, y: perY, opacity: 0.6 });
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    setIsTouched(false);
    setSpotlight(prev => ({ ...prev, opacity: 0 }));
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (shouldDisable || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const perX = (x / rect.width) * 100;
    const perY = (y / rect.height) * 100;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setRotation({ x: rotateX, y: rotateY });
    setSpotlight({ x: perX, y: perY, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setSpotlight(prev => ({ ...prev, opacity: 0 }));
  };

  const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

  // Mobile Render
  if (shouldDisable) {
    return (
      <div 
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`relative rounded-2xl group transition-all duration-200 ${className} ${
          isTouched ? 'scale-[0.98] brightness-110' : ''
        }`}
      >
        <div 
          className="absolute inset-0 rounded-2xl z-20 pointer-events-none transition-opacity duration-200"
          style={{
            background: `radial-gradient(300px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.1), transparent 50%)`,
            opacity: spotlight.opacity,
          }}
        />
        {/* Mobile - Void Style */}
        <div 
            className="relative z-10 w-full h-full rounded-2xl overflow-hidden"
            style={{ 
                backgroundColor: 'transparent',
                boxShadow: 'none',
            }}
        >
          {children}
          <div 
            className="absolute inset-0 rounded-2xl opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: noiseBg }}
          />
        </div>
      </div>
    );
  }

  // Desktop Render
  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-2xl transition-transform duration-200 ease-out preserve-3d group ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1, 1, 1)`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {/* Dynamic Border Gradient */}
      <div 
        className="absolute inset-[-1px] rounded-2xl z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, ${glowColor}, transparent 60%)`
        }}
      />

      {/* Glass Surface & Spotlight */}
      <div 
        className="absolute inset-0 rounded-2xl z-10 pointer-events-none"
        style={{
          background: `radial-gradient(800px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.08), transparent 40%)`,
          opacity: spotlight.opacity,
          transition: 'opacity 0.5s ease'
        }}
      />

      {/* Content Container - Void Style (De-boxed)
          Removes glass/border/shadow to let content float.
      */}
      <div 
        className="relative z-10 w-full h-full rounded-2xl overflow-hidden"
        style={{ 
            transform: 'translateZ(20px)',
            backgroundColor: 'transparent',
            // Minimal interaction feedback, no heavy box
            boxShadow: 'none',
        }}
      >
        {children}
        
        {/* 噪点纹理 (Optional, maybe keep for texture?) */}
        <div 
            className="absolute inset-0 rounded-2xl opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: noiseBg }}
        />
      </div>
    </div>
  );
};
