import React from 'react';

/**
 * L3 UX: Blueprint Skeleton
 * 
 * Instead of a generic spinner, show a "dead blueprint" of the Smith Chart
 * that "comes alive" when the Canvas loads.
 * 
 * This creates a "from blueprint to instrument" transition.
 */
interface SmithChartSkeletonProps {
  width?: number;
  height?: number;
}

export const SmithChartSkeleton: React.FC<SmithChartSkeletonProps> = ({ 
  width = 600, 
  height = 600 
}) => {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.4;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0"
      style={{ opacity: 0.3 }}
    >
      {/* Unit circle (faint outline) */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth="1"
      />
      
      {/* Horizontal axis */}
      <line
        x1={cx - r}
        y1={cy}
        x2={cx + r}
        y2={cy}
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth="0.5"
      />
      
      {/* Vertical axis */}
      <line
        x1={cx}
        y1={cy - r}
        x2={cx}
        y2={cy + r}
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth="0.5"
      />
      
      {/* Sample resistance circles (faint) */}
      {[0.5, 1, 2, 5].map((rVal, i) => {
        const centerU = rVal / (rVal + 1);
        const circleRadius = 1 / (rVal + 1);
        const screenCenterX = cx + centerU * r;
        const screenRadius = circleRadius * r;
        
        return (
          <circle
            key={`r-${i}`}
            cx={screenCenterX}
            cy={cy}
            r={screenRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="0.5"
          />
        );
      })}
      
      {/* Sample reactance arcs (faint) */}
      {[-1, -0.5, 0.5, 1].map((xVal, i) => {
        const centerU = 1;
        const centerV = 1 / xVal;
        const radius = Math.abs(centerV);
        const screenCenterY = cy - centerV * r;
        
        return (
          <path
            key={`x-${i}`}
            d={`M ${cx - r} ${screenCenterY} A ${radius * r} ${radius * r} 0 0 ${xVal > 0 ? 1 : 0} ${cx + r} ${screenCenterY}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="0.5"
          />
        );
      })}
      
      {/* Center point (faint) */}
      <circle
        cx={cx}
        cy={cy}
        r="2"
        fill="rgba(255, 255, 255, 0.1)"
      />
    </svg>
  );
};

