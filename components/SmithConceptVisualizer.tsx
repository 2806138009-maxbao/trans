import React, { useEffect, useRef } from 'react';
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
  | 'symmetry'
  | 'transmission'
  | 'power';

interface SmithConceptVisualizerProps {
  concept: SmithConcept;
  size?: number;
  className?: string;
}

export const SmithConceptVisualizer: React.FC<SmithConceptVisualizerProps> = ({
  concept,
  size = 200,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.4;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Draw base Smith Chart
    ctx.strokeStyle = 'rgba(255, 199, 0, 0.2)';
    ctx.lineWidth = 1;
    
    // Unit circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Center point
    ctx.fillStyle = 'rgba(255, 199, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal axis
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();

    // Draw concept-specific visualization
    switch (concept) {
      case 'center':
        ctx.fillStyle = THEME.colors.primary;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'edge':
        ctx.strokeStyle = THEME.colors.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'inductive':
        ctx.fillStyle = THEME.colors.primary;
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px "Space Grotesk"';
        ctx.textAlign = 'center';
        ctx.fillText('+jX', cx, cy - r * 0.5 - 12);
        break;

      case 'capacitive':
        ctx.fillStyle = '#64B4FF';
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px "Space Grotesk"';
        ctx.textAlign = 'center';
        ctx.fillText('-jX', cx, cy + r * 0.5 + 18);
        break;

      case 'seriesL':
        // Draw arc along constant R
        ctx.strokeStyle = THEME.colors.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx + r * 0.3, cy, r * 0.5, Math.PI * 0.8, Math.PI * 0.2, true);
        ctx.stroke();
        break;

      case 'symmetry':
        // Draw point and its mirror
        ctx.fillStyle = THEME.colors.primary;
        ctx.beginPath();
        ctx.arc(cx + r * 0.3, cy - r * 0.3, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#64B4FF';
        ctx.beginPath();
        ctx.arc(cx - r * 0.3, cy + r * 0.3, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Dashed line connecting them
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.3, cy - r * 0.3);
        ctx.lineTo(cx - r * 0.3, cy + r * 0.3);
        ctx.stroke();
        ctx.setLineDash([]);
        break;

      default:
        // No specific visualization
        break;
    }
  }, [concept, size]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        borderRadius: '12px',
        background: 'rgba(0, 0, 0, 0.3)',
      }}
    />
  );
};



