import React, { useEffect, useRef } from 'react';
import { THEME } from '../theme';

interface TransmissionLineSimProps {
  reducedMotion?: boolean;
  mode?: 'matched' | 'mismatched';
  onModeChange?: (mode: 'matched' | 'mismatched') => void;
  showTabs?: boolean;
  lang?: 'en' | 'zh';
  height?: number;
  className?: string;
}

export const TransmissionLineSim: React.FC<TransmissionLineSimProps> = ({
  reducedMotion = false,
  mode = 'mismatched',
  onModeChange,
  showTabs = false,
  lang = 'zh',
  height = 200,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // RAUNO-TIER: Use Ref for physics state, not React State
  // This prevents React re-renders on every frame
  const timeRef = useRef(0);
  const frameIdRef = useRef<number>(0);
  const lastWidthRef = useRef(0);

  // RAUNO-TIER: Independent render loop, completely outside React's render cycle
  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Update physics state (no React re-render)
      timeRef.current += 0.02;

      // Handle canvas resize
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;

      if (width !== lastWidthRef.current || canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        lastWidthRef.current = width;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw transmission line
      const lineY = height / 2;
      const startX = 50;
      const endX = width - 50;
      const time = timeRef.current;

      // Line
      ctx.strokeStyle = 'rgba(255, 199, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, lineY);
      ctx.lineTo(endX, lineY);
      ctx.stroke();

      // Wave
      ctx.strokeStyle = THEME.colors.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = startX; x <= endX; x++) {
        const phase = (x - startX) / 30 - time * 2;
        const y = lineY + Math.sin(phase) * 20;
        if (x === startX) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Calculate endpoint positions
      const startPhase = -time * 2;
      const endPhase = (endX - startX) / 30 - time * 2;
      const startY = lineY + Math.sin(startPhase) * 20;
      const endY = lineY + Math.sin(endPhase) * 20;

      // Source (follows wave)
      // Vertical connector
      ctx.strokeStyle = THEME.colors.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, lineY);
      ctx.lineTo(startX, startY);
      ctx.stroke();
      
      // Dot
      ctx.fillStyle = THEME.colors.primary;
      ctx.beginPath();
      ctx.arc(startX, startY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Load (follows wave)
      // Vertical connector
      ctx.strokeStyle = '#64B4FF';
      ctx.beginPath();
      ctx.moveTo(endX, lineY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Dot
      ctx.fillStyle = '#64B4FF';
      ctx.beginPath();
      ctx.arc(endX, endY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px "Space Grotesk"';
      ctx.textAlign = 'center';
      ctx.fillText(lang === 'zh' ? '源' : 'Source', startX, lineY + 30);
      ctx.fillText(lang === 'zh' ? '负载' : 'Load', endX, lineY + 30);

      // Continue animation loop
      frameIdRef.current = requestAnimationFrame(render);
    };

    // Start render loop
    render();

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [reducedMotion, height, lang]); // Empty deps - component only mounts once

  return (
    <div className={className}>
      {showTabs && (
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => onModeChange?.('mismatched')}
            className={`px-3 py-1 rounded text-xs transition-all ${
              mode === 'mismatched' 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' 
                : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            {lang === 'zh' ? '失配' : 'Mismatch'}
          </button>
          <button
            onClick={() => onModeChange?.('matched')}
            className={`px-3 py-1 rounded text-xs transition-all ${
              mode === 'matched' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            {lang === 'zh' ? '匹配' : 'Match'}
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: `${height}px`,
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.3)',
        }}
      />
    </div>
  );
};

interface ReflectionPointSimProps {
  reducedMotion?: boolean;
  lang?: 'en' | 'zh';
  height?: number;
  className?: string;
  reflectionRatio?: number; // |Γ| magnitude
}

export const ReflectionPointSim: React.FC<ReflectionPointSimProps> = ({
  reducedMotion = false,
  lang = 'zh',
  height = 200,
  className = '',
  reflectionRatio = 0.6,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(Math.PI / 4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      
      // Only set dimensions if they changed to avoid clearing canvas unnecessarily
      // but here we clear every frame anyway
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      
      // Explicitly set style
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Update state
      if (!reducedMotion) {
        angleRef.current = (angleRef.current - 0.02) % (Math.PI * 2);
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) * 0.35;

      // Unit circle
      ctx.strokeStyle = 'rgba(255, 199, 0, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Center
      ctx.fillStyle = 'rgba(100, 255, 150, 0.5)';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic Point
      const mag = reflectionRatio;
      const angle = angleRef.current;
      const px = cx + Math.cos(angle) * mag * r;
      const py = cy - Math.sin(angle) * mag * r; // Canvas Y is inverted

      // Vector line
      ctx.strokeStyle = 'rgba(255, 199, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Point
      ctx.fillStyle = THEME.colors.primary;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // Glow effect for the point
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, 15);
      gradient.addColorStop(0, 'rgba(255, 199, 0, 0.4)');
      gradient.addColorStop(1, 'rgba(255, 199, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, 15, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '10px "Space Grotesk"';
      ctx.textAlign = 'center';
      ctx.fillText('Γ', px + 20, py - 10);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(
        `|Γ| = ${mag.toFixed(2)}`, 
        cx, 
        cy + r + 25
      );

      if (!reducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };

  }, [height, reducedMotion, lang, reflectionRatio]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: `${height}px`,
        borderRadius: '12px',
        background: 'rgba(0, 0, 0, 0.3)',
      }}
    />
  );
};
