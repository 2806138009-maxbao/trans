import React, { useState, useRef, useCallback, useEffect } from 'react';
import { THEME } from '../theme';

// ============================================================
// S-TIER CONTROL PANEL COMPONENTS
// 
// Design Reference: Teenage Engineering OP-1 / Blender / Linear
// 
// Features:
// - Scrubbable Number Inputs (drag to adjust)
// - Glassmorphism Panel Architecture
// - Recessed Inputs with Inner Shadow
// - Tactile Action Buttons
// ============================================================

// ============================================================
// 1. SCRUBBABLE INPUT (The Magic)
// 
// Click to type. Drag to scrub.
// Cursor becomes ↔ during drag.
// ============================================================

interface ScrubbableInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  precision?: number;
  accentColor?: string;
}

export const ScrubbableInput: React.FC<ScrubbableInputProps> = ({
  label,
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 0.01,
  unit = '',
  precision = 2,
  accentColor = '#FFD700',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrubStartX = useRef(0);
  const scrubStartValue = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTickValue = useRef(Math.floor(value));

  // Format display value
  const displayValue = value.toFixed(precision);

  // Click to edit
  const handleClick = useCallback(() => {
    if (!isScrubbing) {
      setIsEditing(true);
      setEditValue(value.toFixed(precision));
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [value, precision, isScrubbing]);

  // Submit edit
  const handleSubmit = useCallback(() => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
    setIsEditing(false);
  }, [editValue, onChange, min, max]);

  // Keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') setIsEditing(false);
  }, [handleSubmit]);

  // Scrub start
  const handleScrubStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsScrubbing(true);
    scrubStartX.current = e.clientX;
    scrubStartValue.current = value;
    
    // Hide cursor during scrub
    document.body.style.cursor = 'ew-resize';
  }, [value]);

  // Scrub move & end
  useEffect(() => {
    if (!isScrubbing) return;

    const handleMove = (e: MouseEvent) => {
      const delta = e.clientX - scrubStartX.current;
      
      // Sensitivity: accelerate with distance
      const sensitivity = Math.abs(delta) > 100 ? 0.02 : 0.01;
      const newValue = scrubStartValue.current + delta * sensitivity * step * 10;
      const clampedValue = Math.max(min, Math.min(max, newValue));
      
      // Play tick sound when integer value changes
      const currentInt = Math.floor(clampedValue * 10); // Tick every 0.1
      if (currentInt !== lastTickValue.current) {
        // Audio removed
        // audio.playTick();
        lastTickValue.current = currentInt;
      }
      
      onChange(clampedValue);
    };

    const handleEnd = () => {
      setIsScrubbing(false);
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      document.body.style.cursor = '';
    };
  }, [isScrubbing, step, min, max, onChange]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Label - Scrubbable */}
      <div 
        className="flex items-center gap-2 select-none"
        onMouseDown={handleScrubStart}
        style={{ cursor: isScrubbing ? 'ew-resize' : 'ew-resize' }}
      >
        <span 
          className="text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors duration-150"
          style={{ 
            color: (isHovered || isScrubbing) ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)',
          }}
        >
          {label}
        </span>
        
        {/* Scrub indicator */}
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          className={`transition-opacity duration-150 ${(isHovered || isScrubbing) ? 'opacity-40' : 'opacity-0'}`}
          style={{ color: accentColor }}
        >
          <path 
            d="M1 6H11M1 6L3 4M1 6L3 8M11 6L9 4M11 6L9 8" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Value Input - Recessed Style */}
      <div 
        className="relative"
        onClick={handleClick}
      >
        {/* Recessed background */}
        <div 
          className="absolute inset-0 rounded-lg transition-all duration-150"
          style={{
            backgroundColor: '#030303',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
          }}
        />
        
        {/* Focus glow */}
        <div 
          className="absolute inset-0 rounded-lg transition-all duration-200 pointer-events-none"
          style={{
            border: (isEditing || isScrubbing) ? `1px solid ${accentColor}` : '1px solid transparent',
            boxShadow: (isEditing || isScrubbing) ? `0 0 12px rgba(255, 215, 0, 0.25)` : 'none',
          }}
        />
        
        {/* Content */}
        <div className="relative px-4 py-3">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none font-mono text-lg font-semibold tabular-nums"
              style={{ color: '#E0E0E0' }}
              autoFocus
            />
          ) : (
            <div className="flex items-baseline gap-1">
              <span 
                className={`font-mono text-lg font-semibold tabular-nums transition-all duration-150 ${isScrubbing ? 'scale-105' : ''}`}
                style={{ 
                  color: isScrubbing ? accentColor : '#E0E0E0',
                  textShadow: isScrubbing ? `0 0 12px ${accentColor}40` : 'none',
                }}
              >
                {displayValue}
              </span>
              {unit && (
                <span className="text-xs opacity-40 font-mono">
                  {unit}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 2. PANEL CHASSIS (Glassmorphism Container)
// ============================================================

interface PanelChassisProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const PanelChassis: React.FC<PanelChassisProps> = ({
  children,
  title,
  subtitle,
  icon,
}) => {
  return (
    <div 
      className="relative rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Subtle border */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      />
      
      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            {icon && (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}
              >
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-white/60 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
};

// ============================================================
// 3. SECTION HEADER
// ============================================================

interface SectionHeaderProps {
  children: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ children }) => (
  <h4 
    className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-4"
    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
  >
    {children}
  </h4>
);

// ============================================================
// 4. TACTILE BUTTON (Physical Press Feel)
// ============================================================

interface TactileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  children,
  onClick,
  active = false,
  variant = 'default',
  size = 'md',
  icon,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const baseStyles = {
    default: {
      bg: active ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
      bgHover: active ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
      text: active ? '#FFD700' : 'rgba(255, 255, 255, 0.6)',
      textHover: active ? '#FFD700' : '#FFFFFF',
      border: active ? 'rgba(255, 215, 0, 0.3)' : 'transparent',
    },
    primary: {
      bg: 'rgba(255, 215, 0, 0.15)',
      bgHover: 'rgba(255, 215, 0, 0.25)',
      text: '#FFD700',
      textHover: '#FFD700',
      border: 'rgba(255, 215, 0, 0.3)',
    },
    ghost: {
      bg: 'transparent',
      bgHover: 'rgba(255, 255, 255, 0.05)',
      text: 'rgba(255, 255, 255, 0.5)',
      textHover: 'rgba(255, 255, 255, 0.8)',
      border: 'transparent',
    },
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-[10px]',
    md: 'px-4 py-2 text-xs',
  };

  const style = baseStyles[variant];

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`
        relative rounded-lg font-semibold uppercase tracking-wider
        transition-all duration-150 select-none
        flex items-center justify-center gap-2
        ${sizeStyles[size]}
      `}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        boxShadow: isPressed ? 'inset 0 1px 2px rgba(0,0,0,0.3)' : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = style.bgHover;
        e.currentTarget.style.color = style.textHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = style.bg;
        e.currentTarget.style.color = style.text;
        setIsPressed(false);
      }}
    >
      {icon}
      {children}
    </button>
  );
};

// ============================================================
// 5. SEGMENTED CONTROL
// ============================================================

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div 
      className="inline-flex rounded-lg p-1"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            relative px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider
            transition-all duration-200 flex items-center gap-2
          `}
          style={{
            backgroundColor: value === option.value ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
            color: value === option.value ? '#FFD700' : 'rgba(255, 255, 255, 0.5)',
          }}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 6. DIVIDER
// ============================================================

export const PanelDivider: React.FC = () => (
  <div 
    className="my-4"
    style={{ 
      height: '1px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    }}
  />
);

// ============================================================
// 7. VALUE DISPLAY (Read-only Recessed)
// ============================================================

interface ValueDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  accentColor?: string;
}

export const ValueDisplay: React.FC<ValueDisplayProps> = ({
  label,
  value,
  unit,
  accentColor = '#FFD700',
}) => (
  <div className="flex flex-col gap-1">
    <span 
      className="text-[9px] font-semibold uppercase tracking-[0.1em]"
      style={{ color: 'rgba(255, 255, 255, 0.35)' }}
    >
      {label}
    </span>
    <div 
      className="px-3 py-2 rounded-lg"
      style={{
        backgroundColor: '#030303',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
      }}
    >
      <span 
        className="font-mono text-sm font-medium tabular-nums"
        style={{ color: accentColor }}
      >
        {value}
      </span>
      {unit && (
        <span className="text-xs opacity-40 ml-1">{unit}</span>
      )}
    </div>
  </div>
);
