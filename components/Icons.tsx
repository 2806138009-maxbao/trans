import React from 'react';

/**
 * Professional SVG Icons
 * Replacing lucide-react with custom geometric symbols
 * All icons follow a consistent 16x16 viewBox design
 */

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Grid icon - for slider control mode
export const GridIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <rect x="2" y="2" width="4" height="4" stroke={color} strokeWidth="1.5" rx="0.5" />
    <rect x="10" y="2" width="4" height="4" stroke={color} strokeWidth="1.5" rx="0.5" />
    <rect x="2" y="10" width="4" height="4" stroke={color} strokeWidth="1.5" rx="0.5" />
    <rect x="10" y="10" width="4" height="4" stroke={color} strokeWidth="1.5" rx="0.5" />
  </svg>
);

// Circle icon - for VSWR circles
export const CircleIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
    <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1" opacity="0.5" />
  </svg>
);

// RotateCcw icon - for Y-chart toggle
export const RotateCcwIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M2 8C2 4.686 4.686 2 8 2C10.21 2 12.117 3.214 13.2 5" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M14 8C14 11.314 11.314 14 8 14C5.79 14 3.883 12.786 2.8 11" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M10 5H13.5V1.5" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Crosshair icon - for mouse control mode
export const CrosshairIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <circle cx="8" cy="8" r="5" stroke={color} strokeWidth="1.5" />
    <path d="M8 1V4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 12V15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M1 8H4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 8H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Cable icon - for transmission line
export const CableIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M2 8H14" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M2 5H14" 
      stroke={color} 
      strokeWidth="1" 
      strokeLinecap="round"
      opacity="0.5"
    />
    <path 
      d="M2 11H14" 
      stroke={color} 
      strokeWidth="1" 
      strokeLinecap="round"
      opacity="0.5"
    />
    <circle cx="5" cy="8" r="1" fill={color} opacity="0.6" />
    <circle cx="11" cy="8" r="1" fill={color} opacity="0.6" />
  </svg>
);

// Zap icon - for power/energy
export const ZapIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M9 1L3 9H8L7 15L13 7H8L9 1Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Target icon - for matching/goal
export const TargetIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
    <circle cx="8" cy="8" r="3.5" stroke={color} strokeWidth="1" opacity="0.6" />
    <circle cx="8" cy="8" r="1.5" fill={color} />
  </svg>
);

// ArrowRight icon
export const ArrowRightIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M3 8H13M13 8L9 4M13 8L9 12" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// ArrowDown icon
export const ArrowDownIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M8 3V13M8 13L4 9M8 13L12 9" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// BookOpen icon - for learning/reading
export const BookOpenIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M8 3C8 3 6.5 2 4 2C2.5 2 1 2.5 1 2.5V13C1 13 2.5 12.5 4 12.5C6.5 12.5 8 13.5 8 13.5" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M8 3C8 3 9.5 2 12 2C13.5 2 15 2.5 15 2.5V13C15 13 13.5 12.5 12 12.5C9.5 12.5 8 13.5 8 13.5" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path d="M8 3V13.5" stroke={color} strokeWidth="1.5" />
  </svg>
);

// MousePointer icon
export const MousePointerIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M2 2L7 14L9 9L14 7L2 2Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// SlidersHorizontal icon
export const SlidersIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <path d="M2 4H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2 8H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2 12H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="5" cy="4" r="1.5" fill={color} />
    <circle cx="11" cy="8" r="1.5" fill={color} />
    <circle cx="7" cy="12" r="1.5" fill={color} />
  </svg>
);

// Info icon
export const InfoIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
    <path d="M8 7V11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="5" r="0.75" fill={color} />
  </svg>
);

// Checkmark icon
export const CheckIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className = '',
  style,
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M3 8L6.5 11.5L13 4.5" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default {
  Grid: GridIcon,
  Circle: CircleIcon,
  RotateCcw: RotateCcwIcon,
  Crosshair: CrosshairIcon,
  Cable: CableIcon,
  Zap: ZapIcon,
  Target: TargetIcon,
  ArrowRight: ArrowRightIcon,
  ArrowDown: ArrowDownIcon,
  BookOpen: BookOpenIcon,
  MousePointer: MousePointerIcon,
  Sliders: SlidersIcon,
  Info: InfoIcon,
  Check: CheckIcon,
};

