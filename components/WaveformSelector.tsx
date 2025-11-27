import React, { useRef, useEffect, useState } from 'react';
import { Language, WaveformType } from '../types';

interface WaveformSelectorProps {
  selected: WaveformType;
  onChange: (type: WaveformType) => void;
  lang: Language;
}

const WAVEFORM_OPTIONS: { type: WaveformType; labelEn: string; labelZh: string; icon: string }[] = [
  { type: 'square', labelEn: 'Square', labelZh: '方波', icon: '⊓' },
  { type: 'triangle', labelEn: 'Triangle', labelZh: '三角', icon: '△' },
  { type: 'sawtooth', labelEn: 'Sawtooth', labelZh: '锯齿', icon: '⋰' },
];

export const WaveformSelector: React.FC<WaveformSelectorProps> = ({
  selected,
  onChange,
  lang,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  // Update slider position when selection changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const selectedIndex = WAVEFORM_OPTIONS.findIndex(opt => opt.type === selected);
    const buttons = containerRef.current.querySelectorAll('button');
    
    if (buttons[selectedIndex]) {
      const button = buttons[selectedIndex] as HTMLButtonElement;
      setSliderStyle({
        left: button.offsetLeft,
        width: button.offsetWidth,
      });
    }
  }, [selected]);

  // Initial measurement after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const selectedIndex = WAVEFORM_OPTIONS.findIndex(opt => opt.type === selected);
      const buttons = containerRef.current.querySelectorAll('button');
      
      if (buttons[selectedIndex]) {
        const button = buttons[selectedIndex] as HTMLButtonElement;
        setSliderStyle({
          left: button.offsetLeft,
          width: button.offsetWidth,
        });
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {/* Container with glass effect */}
      <div 
        ref={containerRef}
        className="relative flex items-center p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
      >
        {/* Sliding background indicator */}
        <div
          className="absolute top-1 bottom-1 rounded-lg bg-[#5E6AD2] transition-all duration-300 ease-out"
          style={{
            left: sliderStyle.left,
            width: sliderStyle.width,
            boxShadow: '0 0 20px rgba(94, 106, 210, 0.4)',
          }}
        />

        {/* Buttons */}
        {WAVEFORM_OPTIONS.map((option) => {
          const isSelected = selected === option.type;
          const label = lang === 'zh' ? option.labelZh : option.labelEn;

          return (
            <button
              key={option.type}
              onClick={() => onChange(option.type)}
              className={`
                relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-lg
                text-xs font-medium tracking-wide
                transition-colors duration-300
                ${isSelected 
                  ? 'text-white' 
                  : 'text-[#8A8F98] hover:text-white/80'
                }
              `}
            >
              <span className="text-sm opacity-80">{option.icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtle glow under the selector */}
      <div 
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(94, 106, 210, 0.5) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />
    </div>
  );
};
