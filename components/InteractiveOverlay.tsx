
import React, { useState, useEffect } from 'react';
import { Language, TRANSLATIONS, TooltipContent, COLORS } from '../types';
import { TiltCard } from './TiltCard';

interface InteractiveOverlayProps {
  lang: Language;
  externalTooltip: TooltipContent | null;
}

export const InteractiveOverlay: React.FC<InteractiveOverlayProps> = ({ lang, externalTooltip }) => {
  const [activeZone, setActiveZone] = useState<'left' | 'right' | null>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (externalTooltip) {
        setActiveZone(null); 
        return;
      }

      const target = e.target as HTMLElement;
      if (target.closest('#control-panel-container')) {
        setActiveZone(null);
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const splitX = width * 0.55;
      
      if (e.clientY < 80 || e.clientY > height - 80) {
        setActiveZone(null);
        return;
      }

      if (e.clientX < splitX - 50 && e.clientX > 20) {
        setActiveZone('left');
      } else if (e.clientX > splitX - 20) {
        setActiveZone('right');
      } else {
        setActiveZone(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [externalTooltip]);
  
  let showContent: TooltipContent | null = null;
  let boxStyle = "";

  if (externalTooltip) {
    showContent = externalTooltip;
    boxStyle = "bottom-48 left-1/2 transform -translate-x-1/2";
  } else if (activeZone) {
    const isLeft = activeZone === 'left';
    showContent = {
      title: isLeft ? t.tooltipEpicyclesTitle : t.tooltipWaveformTitle,
      body: isLeft ? t.tooltipEpicyclesBody : t.tooltipWaveformBody
    };
    boxStyle = isLeft ? "bottom-40 left-10" : "bottom-40 right-10";
  }

  if (!showContent) return null;

  return (
    <div className={`fixed ${boxStyle} z-30 w-72 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pointer-events-none`}>
       <TiltCard className="p-5" glowColor={activeZone === 'left' ? "rgba(94, 106, 210, 0.6)" : "rgba(71, 156, 255, 0.6)"}>
        <h3 className="font-semibold text-white text-sm mb-2 flex items-center gap-2 tracking-wide transition-all duration-300 origin-left">
            <span className="w-1.5 h-1.5 rounded-full bg-[#479CFF] animate-pulse shadow-[0_0_8px_#479CFF]" />
            <span className="inline-block transition-transform hover:scale-105">{showContent.title}</span>
        </h3>
        <div className="overflow-hidden">
            <p className="text-sm leading-relaxed text-[#d1d1d6] animate-[slideUpFade_0.4s_ease-out_0.1s_both]">
                {showContent.body}
            </p>
        </div>
      </TiltCard>
    </div>
  );
};
