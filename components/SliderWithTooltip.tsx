import React, { useState, useRef, useCallback } from 'react';

interface SliderWithTooltipProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  formatValue?: (value: number) => string;
  className?: string;
  ariaLabel?: string;
}

export const SliderWithTooltip: React.FC<SliderWithTooltipProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  label,
  formatValue = (v) => `${v}`,
  className = '',
  ariaLabel,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const sliderRef = useRef<HTMLInputElement>(null);

  const updateTooltipPosition = useCallback(() => {
    if (!sliderRef.current) return;
    const slider = sliderRef.current;
    const percent = (value - min) / (max - min);
    const thumbWidth = 16; // 滑块拇指宽度
    const sliderWidth = slider.offsetWidth - thumbWidth;
    setTooltipPosition(percent * sliderWidth + thumbWidth / 2);
  }, [value, min, max]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
    updateTooltipPosition();
  };

  const handleMouseDown = () => {
    setIsDragging(true);
    updateTooltipPosition();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 计算进度条百分比
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={`relative flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-[11px] font-medium tracking-wider uppercase text-[#8A8F98] whitespace-nowrap hover:text-white transition-colors cursor-default">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Tooltip */}
        <div
          className={`absolute -top-10 px-2.5 py-1.5 rounded-lg bg-[#5E6AD2] text-white text-xs font-medium
            transform -translate-x-1/2 transition-all duration-150 pointer-events-none z-20
            ${isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ left: tooltipPosition }}
        >
          {formatValue(value)}
          {/* Tooltip Arrow */}
          <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-[#5E6AD2] transform -translate-x-1/2 rotate-45" />
        </div>

        {/* Custom Slider Track */}
        <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
          {/* Progress Fill */}
          <div 
            className="absolute h-full rounded-full bg-gradient-to-r from-[#5E6AD2] to-[#7B8AE6] transition-all duration-75"
            style={{ width: `${percent}%` }}
          />
          
          {/* Glow Effect */}
          <div 
            className="absolute h-full rounded-full bg-[#5E6AD2] blur-sm opacity-50 transition-all duration-75"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Native Input (invisible but functional) */}
        <input
          ref={sliderRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label={ariaLabel || label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />

        {/* Custom Thumb */}
        <div 
          className={`absolute top-1/2 w-4 h-4 -mt-2 rounded-full bg-white border-2 border-[#5E6AD2]
            transform -translate-x-1/2 transition-all duration-75 pointer-events-none
            ${isDragging ? 'scale-125 shadow-[0_0_12px_rgba(94,106,210,0.6)]' : 'shadow-lg'}`}
          style={{ left: `${percent}%` }}
        />
      </div>
    </div>
  );
};

/**
 * 谐波数量专用滑块
 */
interface HarmonicsSliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  lang: 'zh' | 'en';
}

export const HarmonicsSlider: React.FC<HarmonicsSliderProps> = ({
  value,
  onChange,
  label,
  lang,
}) => {
  return (
    <div className="flex items-center gap-4 w-full sm:w-auto">
      <SliderWithTooltip
        min={1}
        max={50}
        step={1}
        value={value}
        onChange={onChange}
        label={label}
        formatValue={(v) => `N = ${v}`}
        className="flex-1 sm:w-32"
        ariaLabel={lang === 'zh' ? '谐波数量' : 'Number of harmonics'}
      />
      <span className="font-mono text-sm text-white bg-white/5 px-2.5 py-1 rounded-md border border-white/10 min-w-[52px] text-center">
        N={value}
      </span>
    </div>
  );
};


