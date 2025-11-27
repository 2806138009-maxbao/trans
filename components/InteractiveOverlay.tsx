import React, { useState, useEffect, useRef } from 'react';
import { Language, TRANSLATIONS, TooltipContent } from '../types';

interface InteractiveOverlayProps {
  lang: Language;
  externalTooltip: TooltipContent | null;
}

export const InteractiveOverlay: React.FC<InteractiveOverlayProps> = ({ lang, externalTooltip }) => {
  const [activeZone, setActiveZone] = useState<'left' | 'right' | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const container = containerRef.current?.closest('.hud-container');
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (externalTooltip) {
        setActiveZone(null);
        setIsVisible(false);
        return;
      }

      const rect = container.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      
      // Check if within canvas bounds (with some padding)
      if (relY < 50 || relY > rect.height - 50 || relX < 20 || relX > rect.width - 20) {
        // Delay hiding to prevent flicker
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => {
          setActiveZone(null);
          setIsVisible(false);
        }, 200);
        return;
      }

      // Clear hide timeout if mouse is back in valid area
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      const splitX = rect.width * 0.5;
      const newZone = relX < splitX ? 'left' : 'right';
      
      setActiveZone(newZone);
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setActiveZone(null);
        setIsVisible(false);
      }, 300);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [externalTooltip]);

  // Determine what content to show
  let showContent: TooltipContent | null = null;
  if (externalTooltip) {
    showContent = externalTooltip;
  } else if (activeZone && isVisible) {
    const isLeft = activeZone === 'left';
    showContent = {
      title: isLeft ? t.tooltipEpicyclesTitle : t.tooltipWaveformTitle,
      body: isLeft ? t.tooltipEpicyclesBody : t.tooltipWaveformBody
    };
  }

  const isLeft = activeZone === 'left';

  return (
    <div ref={containerRef} className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      {/* Tooltip at bottom center */}
      <div 
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md transition-all duration-300 ease-out ${
          showContent 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="relative p-4 rounded-xl bg-[#0D0E12]/90 backdrop-blur-xl border border-white/10 shadow-2xl">
          {/* Colored accent bar */}
          <div 
            className={`absolute top-0 left-4 right-4 h-px transition-colors duration-300 ${
              isLeft ? 'bg-gradient-to-r from-transparent via-[#5E6AD2] to-transparent' 
                     : 'bg-gradient-to-r from-transparent via-[#479CFF] to-transparent'
            }`}
          />
          
          {showContent && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  isLeft ? 'bg-[#5E6AD2] shadow-[0_0_8px_#5E6AD2]' : 'bg-[#479CFF] shadow-[0_0_8px_#479CFF]'
                }`} />
                <h4 className="text-sm font-semibold text-white tracking-wide">
                  {showContent.title}
                </h4>
              </div>
              <p className="text-[13px] leading-relaxed text-[#B0B5C0]">
                {showContent.body}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
