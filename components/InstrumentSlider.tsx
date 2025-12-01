import React, { useState, useRef, useCallback, useEffect } from 'react';
import { THEME } from '../theme';

// ============================================================
// InstrumentSlider - S-Tier Scrubbable Numbers
// 
// Design Reference: Teenage Engineering / Linear
// Features:
// - Drag left/right on the number to adjust value (Scrubbable)
// - Subtle background at 3% white opacity
// - Bottom border lights up Gold #FFD700 on focus
// - Spring physics for value changes
// ============================================================
interface InstrumentSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  accentColor: string;
  highlightValue?: number;
  showSign?: boolean;
  centered?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const InstrumentSlider: React.FC<InstrumentSliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  accentColor,
  highlightValue,
  showSign = false,
  centered = false,
  onDragStart,
  onDragEnd,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrubStartX = useRef(0);
  const scrubStartValue = useRef(0);
  
  // Slider position percentage
  const percentage = ((value - min) / (max - min)) * 100;
  
  // Display formatting
  const displayValue = showSign 
    ? (value >= 0 ? '+' : '') + value.toFixed(2)
    : value.toFixed(2);
  
  // Click-to-edit behavior
  const handleValueClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(value.toFixed(2));
    setTimeout(() => inputRef.current?.select(), 0);
  }, [value]);
  
  // Submit edited value
  const handleEditSubmit = useCallback(() => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
    setIsEditing(false);
  }, [editValue, onChange, min, max]);
  
  // Keyboard interactions for the inline editor
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, [handleEditSubmit]);

  // S-Tier: Scrubbable Number - Drag to adjust
  const handleScrubStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsScrubbing(true);
    scrubStartX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    scrubStartValue.current = value;
    onDragStart?.();
  }, [value, onDragStart]);

  useEffect(() => {
    if (!isScrubbing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const delta = clientX - scrubStartX.current;
      
      // Sensitivity: 1px = 0.01 step, with acceleration
      const sensitivity = Math.abs(delta) > 50 ? 0.02 : 0.01;
      const newValue = scrubStartValue.current + delta * sensitivity * step;
      
      onChange(Math.max(min, Math.min(max, newValue)));
    };

    const handleEnd = () => {
      setIsScrubbing(false);
      onDragEnd?.();
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isScrubbing, step, min, max, onChange, onDragEnd]);

  const isGold = accentColor === THEME.colors.primary;
  
  return (
    <div className="flex-1 group">
      {/* Label Row */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{ 
              backgroundColor: accentColor,
              boxShadow: isFocused ? `0 0 8px ${accentColor}` : 'none'
            }}
          />
          <label 
            className="text-[10px] font-medium uppercase transition-colors duration-300"
            style={{ 
              letterSpacing: '0.1em',
              color: isFocused 
                ? (isGold ? 'rgba(255, 199, 0, 0.8)' : 'rgba(255,255,255,0.6)')
                : (isGold ? 'rgba(255, 199, 0, 0.5)' : 'hsl(40, 5%, 55%)')
            }}
          >
            {label}
          </label>
        </div>
        
        {/* S-Tier: Scrubbable Number Input */}
        <div 
          className={`relative group/input select-none ${isScrubbing ? 'cursor-ew-resize' : 'cursor-pointer'}`}
          onClick={!isScrubbing ? handleValueClick : undefined}
          onMouseDown={handleScrubStart}
          onTouchStart={handleScrubStart}
          onDoubleClick={handleValueClick}
        >
          {/* Background: 3% white opacity */}
          <div 
            className="absolute inset-0 rounded-md transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
            }}
          />
          
          {/* Bottom border that lights up on focus */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-md transition-all duration-200"
            style={{
              backgroundColor: (isEditing || isFocused || isScrubbing) 
                ? '#FFD700' 
                : 'rgba(255, 255, 255, 0.08)',
              boxShadow: (isEditing || isFocused || isScrubbing) 
                ? '0 0 8px rgba(255, 215, 0, 0.5)' 
                : 'none',
            }}
          />
          
          {/* Content Container */}
          <div 
            className="relative z-10 py-2 px-3 transition-all duration-200"
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleEditSubmit}
                onKeyDown={handleKeyDown}
                className="w-16 bg-transparent outline-none font-mono text-base font-semibold text-center tabular-nums"
                style={{ color: '#FFD700' }}
                autoFocus
              />
            ) : (
              <span 
                className={`font-mono text-base font-semibold transition-all duration-150 tabular-nums ${isScrubbing ? 'scale-105' : ''}`}
                style={{ 
                  color: (isFocused || isScrubbing) ? '#FFD700' : '#EAEAEA',
                  textShadow: (isFocused || isScrubbing) ? '0 0 12px rgba(255, 215, 0, 0.4)' : 'none',
                  display: 'inline-block',
                  transform: isScrubbing ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {displayValue}<span className="text-[10px] opacity-40 ml-1">{unit}</span>
              </span>
            )}
          </div>
          
          {/* Scrub hint on hover */}
          <div 
            className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-40 transition-opacity duration-200 pointer-events-none"
            style={{ color: '#FFD700' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 6H11M1 6L3 4M1 6L3 8M11 6L9 4M11 6L9 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* S-Tier: Minimal Slider Track */}
      <div className="relative h-8 flex items-center">
        {/* Track Background */}
        <div className="absolute w-full h-[1px] bg-white/10" />
        
        {/* Progress Fill */}
        <div 
          className="absolute h-[1px] transition-all duration-150"
          style={{ 
            width: centered ? '50%' : `${percentage}%`,
            left: centered ? '50%' : 0,
            transform: centered ? `translateX(-${(1 - value / max) * 100}%)` : 'none',
            background: '#FFD700',
            opacity: 0.6
          }}
        />
        
        {/* Center Mark (for centered sliders) */}
        {centered && (
          <div className="absolute left-1/2 w-[1px] h-2 bg-white/20 -translate-x-1/2" />
        )}

        {/* Thumb */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 -ml-1.5 pointer-events-none transition-all duration-150"
          style={{ 
            left: `${percentage}%`,
            transform: `translateY(-50%) ${isFocused ? 'scale(1.3)' : 'scale(1)'}`,
          }}
        >
          <div 
            className="w-full h-full rounded-full"
            style={{ 
              backgroundColor: '#FFD700',
              boxShadow: isFocused 
                ? '0 0 0 3px rgba(255, 215, 0, 0.15), 0 0 16px rgba(255, 215, 0, 0.5)' 
                : '0 2px 6px rgba(255, 215, 0, 0.3)',
            }}
          />
        </div>
        
        {/* Hidden Range Input */}
        <input 
          type="range" 
          min={min}
          max={max}
          step={step}
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onMouseDown={() => { setIsFocused(true); onDragStart?.(); }}
          onMouseUp={() => { setIsFocused(false); onDragEnd?.(); }}
          onTouchStart={() => { setIsFocused(true); onDragStart?.(); }}
          onTouchEnd={() => { setIsFocused(false); onDragEnd?.(); }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
        />
      </div>
      
      {/* Min/Max Labels */}
      <div className="flex justify-between mt-1 text-[8px] font-mono tabular-nums transition-opacity duration-200" style={{ opacity: isFocused ? 0.4 : 0.2, color: '#EAEAEA' }}>
        <span>{centered ? `-${max}` : min}</span>
        {highlightValue !== undefined && (
          <span style={{ color: '#FFD700', opacity: 0.6 }}>{highlightValue}</span>
        )}
        <span>{centered ? `+${max}` : max}</span>
      </div>
    </div>
  );
};
