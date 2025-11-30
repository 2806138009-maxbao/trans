import React, { useEffect, useRef, useState, useCallback } from 'react';
import { THEME } from '../theme';

interface ComplexFoldSimProps {
  reducedMotion?: boolean;
  lang?: 'en' | 'zh';
  height?: number;
  className?: string;
}

interface GridPoint {
  // Z-plane coordinates (normalized, z0 = 1)
  r: number;  // resistance
  x: number;  // reactance
  // Gamma-plane coordinates (computed)
  gammaRe: number;
  gammaIm: number;
}

/**
 * ComplexFoldSim - Visualizes the Z-plane to Γ-plane mapping
 * 
 * The core insight of the Smith Chart:
 * The infinite complex impedance plane gets "folded" into a unit circle.
 * 
 * Γ = (Z - Z₀) / (Z + Z₀)
 * 
 * Where Z = R + jX (complex impedance) and Z₀ = 50Ω (characteristic impedance)
 */
export const ComplexFoldSim: React.FC<ComplexFoldSimProps> = ({
  reducedMotion = false,
  lang = 'zh',
  height = 280,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [foldProgress, setFoldProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(false);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Grid points in Z-plane (normalized to Z₀ = 1)
  const rValues = [0, 0.2, 0.5, 1, 2, 5];
  const xValues = [-5, -2, -1, -0.5, 0, 0.5, 1, 2, 5];

  // Compute Γ from Z (normalized)
  const zToGamma = useCallback((r: number, x: number): { re: number; im: number } => {
    // Γ = (Z - 1) / (Z + 1) where Z = r + jx
    // Γ = ((r-1) + jx) / ((r+1) + jx)
    const denomReal = r + 1;
    const denomImag = x;
    const denomMagSq = denomReal * denomReal + denomImag * denomImag;
    
    if (denomMagSq < 0.0001) {
      return { re: 1, im: 0 }; // Edge case: Z = -1 (short circuit)
    }
    
    const numReal = r - 1;
    const numImag = x;
    
    // Complex division: (a + bi) / (c + di) = ((ac + bd) + (bc - ad)i) / (c² + d²)
    const gammaRe = (numReal * denomReal + numImag * denomImag) / denomMagSq;
    const gammaIm = (numImag * denomReal - numReal * denomImag) / denomMagSq;
    
    return { re: gammaRe, im: gammaIm };
  }, []);

  // Generate grid points
  const gridPoints: GridPoint[] = [];
  for (const r of rValues) {
    for (const x of xValues) {
      const gamma = zToGamma(r, x);
      gridPoints.push({
        r, x,
        gammaRe: gamma.re,
        gammaIm: gamma.im,
      });
    }
  }

  // Easing function
  const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };

  // Linear interpolation
  const lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
  };

  // Start animation
  const playAnimation = useCallback(() => {
    if (reducedMotion) return;
    
    setIsPlaying(true);
    setFoldProgress(0);
    startTimeRef.current = performance.now();
    
    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current;
      const duration = 3000; // 3 seconds
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(rawProgress);
      
      setFoldProgress(easedProgress);
      
      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [reducedMotion]);

  // Reset animation
  const resetAnimation = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    setFoldProgress(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  // Track canvas width for resize handling
  const [canvasWidth, setCanvasWidth] = useState(0);

  // Handle resize with ResizeObserver (doesn't affect other components)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || canvasWidth;
    if (width === 0) return; // Skip if not yet measured
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const t = foldProgress;
      const centerY = height / 2;
      
      // Layout: Z-plane on left, Γ-plane on right
      const zPlaneCenter = width * 0.25;
      const gammaPlaneCenter = width * 0.75;
      const planeRadius = Math.min(width * 0.2, height * 0.4);

      // Fade based on progress
      const zPlaneAlpha = 1 - t * 0.7;
      const gammaPlaneAlpha = 0.3 + t * 0.7;

      // === LEFT: Z-Plane ===
      ctx.save();
      ctx.globalAlpha = zPlaneAlpha;
      
      // Z-plane axes
      ctx.strokeStyle = 'rgba(255, 199, 0, 0.3)';
      ctx.lineWidth = 1;
      
      // Horizontal axis (R)
      ctx.beginPath();
      ctx.moveTo(zPlaneCenter - planeRadius * 1.2, centerY);
      ctx.lineTo(zPlaneCenter + planeRadius * 1.2, centerY);
      ctx.stroke();
      
      // Vertical axis (jX)
      ctx.beginPath();
      ctx.moveTo(zPlaneCenter, centerY - planeRadius * 1.2);
      ctx.lineTo(zPlaneCenter, centerY + planeRadius * 1.2);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = 'rgba(255, 199, 0, 0.5)';
      ctx.font = '10px "Space Grotesk", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('R', zPlaneCenter + planeRadius * 1.1, centerY + 15);
      ctx.fillText('jX', zPlaneCenter + 12, centerY - planeRadius * 1.05);

      // Z-plane grid lines (constant R circles become vertical lines in simplified view)
      ctx.strokeStyle = 'rgba(255, 199, 0, 0.15)';
      ctx.setLineDash([4, 4]);
      for (const r of [0.5, 1, 2]) {
        const xPos = zPlaneCenter + (r / 5) * planeRadius;
        ctx.beginPath();
        ctx.moveTo(xPos, centerY - planeRadius);
        ctx.lineTo(xPos, centerY + planeRadius);
        ctx.stroke();
      }
      for (const x of [-2, -1, 1, 2]) {
        const yPos = centerY - (x / 5) * planeRadius;
        ctx.beginPath();
        ctx.moveTo(zPlaneCenter, yPos);
        ctx.lineTo(zPlaneCenter + planeRadius, yPos);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.restore();

      // === RIGHT: Γ-Plane (Unit Circle) ===
      ctx.save();
      ctx.globalAlpha = gammaPlaneAlpha;

      // Unit circle
      ctx.strokeStyle = `rgba(255, 199, 0, ${0.3 + t * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(gammaPlaneCenter, centerY, planeRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot (Γ = 0, perfect match)
      ctx.fillStyle = `rgba(100, 255, 150, ${0.5 + t * 0.5})`;
      ctx.beginPath();
      ctx.arc(gammaPlaneCenter, centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Γ-plane label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px "Space Grotesk", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Γ = 0', gammaPlaneCenter, centerY + planeRadius + 20);
      ctx.fillText('|Γ| = 1', gammaPlaneCenter + planeRadius + 5, centerY);

      ctx.restore();

      // === MAPPING ARROW ===
      const arrowY = centerY;
      const arrowStartX = zPlaneCenter + planeRadius * 1.3;
      const arrowEndX = gammaPlaneCenter - planeRadius * 1.3;
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + t * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(arrowStartX, arrowY);
      ctx.lineTo(arrowEndX, arrowY);
      ctx.stroke();
      
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(arrowEndX - 8, arrowY - 4);
      ctx.lineTo(arrowEndX, arrowY);
      ctx.lineTo(arrowEndX - 8, arrowY + 4);
      ctx.stroke();

      // Mapping formula
      ctx.fillStyle = `rgba(255, 199, 0, ${0.4 + t * 0.4})`;
      ctx.font = '11px "Space Grotesk", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Γ = (Z − Z₀) / (Z + Z₀)', (arrowStartX + arrowEndX) / 2, arrowY - 12);

      // === ANIMATED GRID POINTS ===
      gridPoints.forEach((point, idx) => {
        // Z-plane position
        const zX = zPlaneCenter + (point.r / 5) * planeRadius;
        const zY = centerY - (point.x / 5) * planeRadius;
        
        // Γ-plane position
        const gX = gammaPlaneCenter + point.gammaRe * planeRadius;
        const gY = centerY - point.gammaIm * planeRadius;
        
        // Interpolated position
        const currentX = lerp(zX, gX, t);
        const currentY = lerp(zY, gY, t);

        // Point color based on position
        const isMatched = Math.abs(point.r - 1) < 0.1 && Math.abs(point.x) < 0.1;
        const hue = isMatched ? 120 : 45; // Green for matched, gold for others
        const saturation = 80;
        const lightness = 50 + (1 - t) * 20;
        
        // Glow
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.3 + t * 0.4})`;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness + 20}%, ${0.6 + t * 0.4})`;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Show trajectory line for this point
        if (showTrajectory && t > 0.1) {
          ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.15)`;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(zX, zY);
          ctx.lineTo(gX, gY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // === STATUS TEXT ===
      ctx.font = '12px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      
      let statusText = '';
      let statusAlpha = 0;
      
      if (t < 0.2) {
        statusText = lang === 'zh' ? '这是 Z 平面' : 'This is the Z-plane';
        statusAlpha = 1 - t * 5;
      } else if (t < 0.7) {
        statusText = lang === 'zh' ? '映射中...' : 'Mapping...';
        statusAlpha = Math.min((t - 0.2) * 4, 1) * Math.min((0.7 - t) * 4, 1);
      } else {
        statusText = lang === 'zh' ? '答案，现在在一个有限的圆里' : 'The answer is now in a finite circle';
        statusAlpha = Math.min((t - 0.7) * 3, 1);
      }
      
      ctx.fillStyle = `rgba(255, 255, 255, ${statusAlpha * 0.7})`;
      ctx.fillText(statusText, width / 2, height - 20);

      // === 1939 LABEL ===
      if (t > 0.8) {
        const labelAlpha = (t - 0.8) * 5;
        ctx.fillStyle = `rgba(255, 199, 0, ${labelAlpha * 0.6})`;
        ctx.font = '9px "Space Grotesk", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('1939 · Analog Computing', 10, 20);
      }
    };

    draw();
  }, [foldProgress, gridPoints, lang, height, showTrajectory, lerp]);

  return (
    <div className={`relative ${className}`}>
      {/* Control bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          {!reducedMotion && (
            <button
              onClick={isPlaying ? resetAnimation : playAnimation}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
              style={{
                backgroundColor: isPlaying ? 'rgba(255, 100, 100, 0.2)' : 'rgba(255, 199, 0, 0.15)',
                color: isPlaying ? 'rgba(255, 150, 150, 1)' : 'rgba(255, 199, 0, 0.9)',
                border: `1px solid ${isPlaying ? 'rgba(255, 100, 100, 0.3)' : 'rgba(255, 199, 0, 0.3)'}`,
              }}
            >
              {isPlaying ? (
                <>
                  <span className="w-2 h-2 rounded-sm bg-current" />
                  {lang === 'zh' ? '重置' : 'Reset'}
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M2 1 L8 5 L2 9 Z" />
                  </svg>
                  {lang === 'zh' ? '播放折叠' : 'Play Fold'}
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => setShowTrajectory(!showTrajectory)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: showTrajectory ? 'rgba(100, 180, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: showTrajectory ? 'rgba(150, 200, 255, 1)' : 'rgba(255, 255, 255, 0.5)',
              border: `1px solid ${showTrajectory ? 'rgba(100, 180, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            }}
          >
            {lang === 'zh' ? '显示轨迹' : 'Show Trajectory'}
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 font-mono">
            t = {foldProgress.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Slider for manual control */}
      <div className="mb-3 px-1">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={foldProgress}
          onChange={(e) => {
            cancelAnimationFrame(animationRef.current);
            setIsPlaying(false);
            setFoldProgress(parseFloat(e.target.value));
          }}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, rgba(255, 199, 0, 0.6) ${foldProgress * 100}%, rgba(255, 255, 255, 0.1) ${foldProgress * 100}%)`,
          }}
        />
        <div className="flex justify-between mt-1 text-[9px] text-white/30 font-mono">
          <span>Z-plane</span>
          <span>Γ-plane</span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: `${height}px`,
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 199, 0, 0.1)',
        }}
      />

      {/* Caption */}
      <div className="mt-3 text-center">
        <p className="text-xs text-white/40">
          {lang === 'zh' 
            ? '拖动滑块，亲眼看「无限」如何变成「有限」'
            : 'Drag the slider to see how "infinite" becomes "finite"'
          }
        </p>
      </div>
    </div>
  );
};

