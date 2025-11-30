import React, { memo } from 'react';
import { THEME } from '../theme';

export type SmithConcept = 
  | 'none' 
  | 'center' 
  | 'edge' 
  | 'inductive' 
  | 'capacitive' 
  | 'seriesL' 
  | 'seriesC'
  | 'shuntL'
  | 'shuntC'
  | 'transmission' 
  | 'symmetry'
  | 'power';

interface SmithConceptVisualizerProps {
  concept: SmithConcept;
  size?: number;
  className?: string;
}

export const SmithConceptVisualizer: React.FC<SmithConceptVisualizerProps> = memo(({ 
  concept, 
  size = 200,
  className = ''
}) => {
  // Base grid styles
  const gridColor = 'rgba(255, 255, 255, 0.1)';
  const gridHighlight = 'rgba(255, 255, 255, 0.3)';
  
  // Concept colors
  const highlightColor = THEME.colors.primary; // Gold
  const secondaryColor = '#479CFF'; // Blue for Y/Shunt
  const regionColor = 'rgba(255, 199, 0, 0.15)';

  const cx = 100;
  const cy = 100;
  const r = 90;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full overflow-visible"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* === BASE GRID (Always visible, faint) === */}
        {/* Unit Circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={gridColor} strokeWidth="1" />
        {/* Horizontal Axis */}
        <line x1={cx-r} y1={cy} x2={cx+r} y2={cy} stroke={gridColor} strokeWidth="1" />
        {/* Constant R circles */}
        <circle cx={cx + r*0.33} cy={cy} r={r*0.66} fill="none" stroke={gridColor} strokeWidth="0.5" />
        <circle cx={cx + r*0.6} cy={cy} r={r*0.4} fill="none" stroke={gridColor} strokeWidth="0.5" />
        
        {/* === HIGHLIGHT LAYERS === */}

        {/* 1. Center (Match) */}
        <g style={{ opacity: concept === 'center' ? 1 : 0, transition: 'opacity 0.3s' }}>
          <circle cx={cx} cy={cy} r={4} fill={highlightColor} filter="url(#glow)" />
          <circle cx={cx} cy={cy} r={15} fill="none" stroke={highlightColor} strokeWidth="1.5" className="animate-pulse" />
        </g>

        {/* 2. Edge (Total Reflection) */}
        <g style={{ opacity: concept === 'edge' ? 1 : 0, transition: 'opacity 0.3s' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={highlightColor} strokeWidth="3" filter="url(#glow)" />
        </g>

        {/* 3. Inductive Region (Top Half) */}
        <g style={{ opacity: concept === 'inductive' ? 1 : 0, transition: 'opacity 0.3s' }}>
          <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy} Z`} fill={regionColor} />
          <text x={cx} y={cy - 40} textAnchor="middle" fill="#FFF" fontSize="12" fontWeight="bold">+jX Inductive</text>
        </g>

        {/* 4. Capacitive Region (Bottom Half) */}
        <g style={{ opacity: concept === 'capacitive' ? 1 : 0, transition: 'opacity 0.3s' }}>
          <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 0 ${cx+r} ${cy} Z`} fill={regionColor} />
          <text x={cx} y={cy + 50} textAnchor="middle" fill="#FFF" fontSize="12" fontWeight="bold">-jX Capacitive</text>
        </g>

        {/* 5. Series L (Clockwise on Constant R) */}
        <g style={{ opacity: concept === 'seriesL' ? 1 : 0, transition: 'opacity 0.3s' }}>
          {/* Path */}
          <path 
            d={`M ${cx - r*0.2} ${cy + r*0.4} A ${r*0.6} ${r*0.6} 0 0 1 ${cx - r*0.2} ${cy - r*0.4}`}
            fill="none" 
            stroke={highlightColor} 
            strokeWidth="3" 
            strokeDasharray="100"
            className="animate-[dash-draw_1s_infinite]"
          />
          {/* Arrow */}
          <path d={`M ${cx - r*0.2 - 5} ${cy - r*0.4 + 5} L ${cx - r*0.2} ${cy - r*0.4} L ${cx - r*0.2 + 5} ${cy - r*0.4 + 5}`} fill="none" stroke={highlightColor} strokeWidth="2" />
        </g>

        {/* 6. Shunt C (Clockwise on Constant G - Y Chart) */}
        <g style={{ opacity: concept === 'shuntC' ? 1 : 0, transition: 'opacity 0.3s' }}>
          {/* Dashed Y-chart circles for context */}
          <circle cx={cx - r*0.33} cy={cy} r={r*0.66} fill="none" stroke={secondaryColor} strokeWidth="0.5" strokeDasharray="2 2" />
          {/* Path (Approximated arc on Y chart) */}
          <path 
            d={`M ${cx + r*0.2} ${cy + r*0.4} A ${r*0.6} ${r*0.6} 0 0 0 ${cx + r*0.2} ${cy - r*0.4}`}
            fill="none" 
            stroke={secondaryColor} 
            strokeWidth="3"
            className="animate-[dash-draw_1s_infinite_reverse]"
          />
        </g>

        {/* 7. Transmission Line (Circle around center) */}
        <g style={{ opacity: concept === 'transmission' ? 1 : 0, transition: 'opacity 0.3s' }}>
          <circle cx={cx} cy={cy} r={r*0.6} fill="none" stroke={highlightColor} strokeWidth="2" strokeDasharray="8 4" className="animate-[spin_4s_linear_infinite]" />
          <circle cx={cx + r*0.6} cy={cy} r={4} fill={highlightColor} className="animate-[spin_4s_linear_infinite]" style={{ transformOrigin: `${cx}px ${cy}px` }} />
        </g>

        {/* 8. Symmetry (Z and Y points) */}
        <g style={{ opacity: concept === 'symmetry' ? 1 : 0, transition: 'opacity 0.3s' }}>
          <line x1={cx - 40} y1={cy - 40} x2={cx + 40} y2={cy + 40} stroke="rgba(255,255,255,0.3)" strokeDasharray="4" />
          <circle cx={cx - 40} cy={cy - 40} r={5} fill={highlightColor} />
          <text x={cx - 50} y={cy - 50} fill={highlightColor} fontSize="10">Z</text>
          <circle cx={cx + 40} cy={cy + 40} r={5} fill={secondaryColor} />
          <text x={cx + 50} y={cy + 50} fill={secondaryColor} fontSize="10">Y</text>
        </g>

        {/* 9. Power Efficiency (Fill center area) */}
        <g style={{ opacity: concept === 'power' ? 1 : 0, transition: 'opacity 0.3s' }}>
          <circle cx={cx} cy={cy} r={r*0.5} fill={highlightColor} fillOpacity="0.2" />
          <text x={cx} y={cy} textAnchor="middle" dy="4" fill="#FFF" fontSize="10" fontWeight="bold">High Efficiency</text>
        </g>

      </svg>
    </div>
  );
});

SmithConceptVisualizer.displayName = 'SmithConceptVisualizer';

