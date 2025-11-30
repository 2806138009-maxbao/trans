import React, { useEffect, useRef, useState, useCallback } from 'react';
import { THEME } from '../theme';

type StepId = 1 | 2 | 3 | 4;
type ChartMode = 'impedance' | 'admittance';

interface MatchingStepsSimProps {
  activeStep: StepId;
  onStepChange?: (step: StepId) => void;
  reducedMotion?: boolean;
  lang?: 'en' | 'zh';
  height?: number;
  className?: string;
}

interface Complex {
  re: number;
  im: number;
}

interface PathPoint {
  gamma: Complex;
  mode: ChartMode;
  isActive?: boolean;
}

/**
 * MatchingStepsSim - Interactive L-section matching network visualization
 * 
 * Four steps that build a complete matching trajectory:
 * 1. Series L: Move along constant-R circle (clockwise) on Z-chart
 * 2. Shunt C: Move along constant-G circle (clockwise) on Y-chart  
 * 3. Full path: Combine steps 1+2 to reach the center
 * 4. Y = 1/Z: Demonstrate the point-symmetric relationship
 */
export const MatchingStepsSim: React.FC<MatchingStepsSimProps> = ({
  activeStep,
  onStepChange,
  reducedMotion = false,
  lang = 'zh',
  height = 350,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartMode, setChartMode] = useState<ChartMode>('impedance');
  const [animProgress, setAnimProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Starting impedance point (normalized to Z0 = 1)
  const startZ: Complex = { re: 0.5, im: 1.5 }; // R=0.5, X=1.5 (inductive load)

  // Convert impedance to reflection coefficient
  const zToGamma = useCallback((z: Complex): Complex => {
    const denomRe = z.re + 1;
    const denomIm = z.im;
    const denomMagSq = denomRe * denomRe + denomIm * denomIm;
    if (denomMagSq < 0.0001) return { re: 1, im: 0 };
    
    const numRe = z.re - 1;
    const numIm = z.im;
    
    return {
      re: (numRe * denomRe + numIm * denomIm) / denomMagSq,
      im: (numIm * denomRe - numRe * denomIm) / denomMagSq,
    };
  }, []);

  // Convert admittance to reflection coefficient (Y-chart is Z-chart mirrored)
  const yToGamma = useCallback((y: Complex): Complex => {
    // For Y-chart, Γ_y = -Γ_z (point symmetric about origin)
    const z = { re: y.re, im: -y.im }; // Y = 1/Z approximation for display
    const gamma = zToGamma(z);
    return { re: -gamma.re, im: -gamma.im };
  }, [zToGamma]);

  // Mirror point about origin (Z ↔ Y transformation)
  const mirrorPoint = useCallback((gamma: Complex): Complex => {
    return { re: -gamma.re, im: -gamma.im };
  }, []);

  // Generate arc points along constant-R circle
  const generateConstantRArc = useCallback((
    startGamma: Complex,
    arcAngle: number, // radians, positive = clockwise (adding inductance)
    numPoints: number = 30
  ): Complex[] => {
    const points: Complex[] = [];
    
    // Find the center and radius of the constant-R circle passing through startGamma
    // For Smith chart, constant-R circles have center at (r/(r+1), 0) and radius 1/(r+1)
    // We'll approximate by rotating around the current position
    
    const startAngle = Math.atan2(startGamma.im, startGamma.re - 0.3); // Approximate center
    const radius = Math.sqrt(Math.pow(startGamma.re - 0.3, 2) + Math.pow(startGamma.im, 2));
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const angle = startAngle - arcAngle * t; // Clockwise
      points.push({
        re: 0.3 + radius * Math.cos(angle),
        im: radius * Math.sin(angle),
      });
    }
    
    return points;
  }, []);

  // Generate arc points along constant-G circle (on Y-chart)
  const generateConstantGArc = useCallback((
    startGamma: Complex,
    arcAngle: number,
    numPoints: number = 30
  ): Complex[] => {
    const points: Complex[] = [];
    
    const startAngle = Math.atan2(startGamma.im, startGamma.re + 0.2);
    const radius = Math.sqrt(Math.pow(startGamma.re + 0.2, 2) + Math.pow(startGamma.im, 2));
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const angle = startAngle - arcAngle * t;
      points.push({
        re: -0.2 + radius * Math.cos(angle),
        im: radius * Math.sin(angle),
      });
    }
    
    return points;
  }, []);

  // Easing
  const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const easeInOutCubic = (t: number): number => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // Start animation for current step
  const playStep = useCallback(() => {
    if (reducedMotion) {
      setAnimProgress(1);
      return;
    }

    setIsPlaying(true);
    setAnimProgress(0);
    startTimeRef.current = performance.now();

    const durations: Record<StepId, number> = {
      1: 2000,
      2: 2500,
      3: 4000,
      4: 2000,
    };

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current;
      const duration = durations[activeStep];
      const rawProgress = Math.min(elapsed / duration, 1);
      
      setAnimProgress(easeOutExpo(rawProgress));

      if (rawProgress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [activeStep, reducedMotion]);

  // Reset and play when step changes
  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    setAnimProgress(0);
    
    // Set initial chart mode based on step
    if (activeStep === 1 || activeStep === 4) {
      setChartMode('impedance');
    } else if (activeStep === 2) {
      setChartMode('admittance');
    }

    // Auto-play after a short delay
    const timer = setTimeout(() => playStep(), 300);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animRef.current);
    };
  }, [activeStep, playStep]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.38;

      const t = animProgress;

      // Determine effective chart mode based on step and progress
      let effectiveMode = chartMode;
      let modeTransition = 0; // 0 = Z, 1 = Y

      if (activeStep === 2) {
        // Step 2: Transition from Z to Y in first 30%
        if (t < 0.3) {
          modeTransition = easeInOutCubic(t / 0.3);
          effectiveMode = modeTransition > 0.5 ? 'admittance' : 'impedance';
        } else {
          modeTransition = 1;
          effectiveMode = 'admittance';
        }
      } else if (activeStep === 3) {
        // Step 3: Z (0-0.4) → transition (0.4-0.5) → Y (0.5-1)
        if (t < 0.4) {
          modeTransition = 0;
          effectiveMode = 'impedance';
        } else if (t < 0.5) {
          modeTransition = easeInOutCubic((t - 0.4) / 0.1);
          effectiveMode = modeTransition > 0.5 ? 'admittance' : 'impedance';
        } else {
          modeTransition = 1;
          effectiveMode = 'admittance';
        }
      } else if (activeStep === 4) {
        // Step 4: Show mirror relationship
        if (t > 0.5) {
          modeTransition = easeInOutCubic((t - 0.5) / 0.5);
        }
      }

      // === Draw Smith Chart Grid ===
      const gridAlpha = 0.15;
      
      // Unit circle
      ctx.strokeStyle = `rgba(255, 199, 0, ${gridAlpha + 0.1})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Constant R circles (simplified)
      ctx.strokeStyle = `rgba(255, 199, 0, ${gridAlpha})`;
      ctx.lineWidth = 0.5;
      const rCircles = [0.2, 0.5, 1, 2];
      rCircles.forEach(r => {
        const cx = centerX + (r / (r + 1)) * radius;
        const cr = (1 / (r + 1)) * radius;
        ctx.beginPath();
        ctx.arc(cx, centerY, cr, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Horizontal axis
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.stroke();

      // Center point (Γ = 0)
      ctx.fillStyle = 'rgba(100, 255, 150, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Chart mode label
      ctx.fillStyle = effectiveMode === 'impedance' 
        ? 'rgba(255, 199, 0, 0.7)' 
        : 'rgba(100, 180, 255, 0.7)';
      ctx.font = 'bold 14px "Space Grotesk", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        effectiveMode === 'impedance' ? 'Z Chart' : 'Y Chart',
        centerX,
        centerY - radius - 15
      );

      // === Draw Step-specific content ===
      const startGamma = zToGamma(startZ);

      const toCanvas = (gamma: Complex, mirror: boolean = false): { x: number; y: number } => {
        let g = mirror ? mirrorPoint(gamma) : gamma;
        // Apply mode transition rotation for smooth Z↔Y switch
        if (modeTransition > 0 && modeTransition < 1) {
          const angle = modeTransition * Math.PI;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          g = {
            re: g.re * cos - g.im * sin,
            im: g.re * sin + g.im * cos,
          };
        }
        return {
          x: centerX + g.re * radius,
          y: centerY - g.im * radius,
        };
      };

      // Draw based on active step
      if (activeStep === 1) {
        // Step 1: Series L - move along constant R circle
        const arcPoints = generateConstantRArc(startGamma, 0.8);
        const visibleCount = Math.floor(t * arcPoints.length);

        // Draw arc path
        if (visibleCount > 1) {
          ctx.strokeStyle = 'rgba(255, 199, 0, 0.6)';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          
          const start = toCanvas(arcPoints[0]);
          ctx.moveTo(start.x, start.y);
          
          for (let i = 1; i < visibleCount; i++) {
            const pt = toCanvas(arcPoints[i]);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }

        // Draw current point
        if (visibleCount > 0) {
          const current = toCanvas(arcPoints[Math.min(visibleCount, arcPoints.length - 1)]);
          
          // Glow
          const glow = ctx.createRadialGradient(current.x, current.y, 0, current.x, current.y, 20);
          glow.addColorStop(0, 'rgba(255, 199, 0, 0.8)');
          glow.addColorStop(1, 'rgba(255, 199, 0, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(current.x, current.y, 20, 0, Math.PI * 2);
          ctx.fill();

          // Core
          ctx.fillStyle = '#FFC700';
          ctx.beginPath();
          ctx.arc(current.x, current.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw start point
        const startPt = toCanvas(startGamma);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(startPt.x, startPt.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // +jX indicator
        ctx.fillStyle = 'rgba(255, 199, 0, 0.8)';
        ctx.font = '12px "Space Grotesk", monospace';
        ctx.textAlign = 'left';
        const jxValue = (t * 0.8).toFixed(2);
        ctx.fillText(`+jX: ${jxValue}`, centerX + radius + 10, centerY - 20);

      } else if (activeStep === 2) {
        // Step 2: Shunt C - move along constant G circle on Y chart
        const zEndStep1 = { re: startZ.re, im: startZ.im - 0.8 };
        const gammaEndStep1 = zToGamma(zEndStep1);
        const yStart = mirrorPoint(gammaEndStep1);

        // Show previous path (dimmed)
        const prevArc = generateConstantRArc(startGamma, 0.8);
        ctx.strokeStyle = 'rgba(255, 199, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const prevStart = toCanvas(prevArc[0]);
        ctx.moveTo(prevStart.x, prevStart.y);
        prevArc.forEach(pt => {
          const p = toCanvas(pt);
          ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Current step arc (on Y chart)
        if (t > 0.3) {
          const yProgress = (t - 0.3) / 0.7;
          const yArcPoints = generateConstantGArc(yStart, 0.6);
          const visibleCount = Math.floor(yProgress * yArcPoints.length);

          if (visibleCount > 1) {
            ctx.strokeStyle = 'rgba(100, 180, 255, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            const start = toCanvas(yArcPoints[0], true);
            ctx.moveTo(start.x, start.y);
            
            for (let i = 1; i < visibleCount; i++) {
              const pt = toCanvas(yArcPoints[i], true);
              ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
          }

          // Current point
          if (visibleCount > 0) {
            const current = toCanvas(yArcPoints[Math.min(visibleCount, yArcPoints.length - 1)], true);
            
            const glow = ctx.createRadialGradient(current.x, current.y, 0, current.x, current.y, 20);
            glow.addColorStop(0, 'rgba(100, 180, 255, 0.8)');
            glow.addColorStop(1, 'rgba(100, 180, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(current.x, current.y, 20, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#64B4FF';
            ctx.beginPath();
            ctx.arc(current.x, current.y, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }

      } else if (activeStep === 3) {
        // Step 3: Full matching path
        const arcZ = generateConstantRArc(startGamma, 0.8);
        const zEnd = arcZ[arcZ.length - 1];
        const yStart = mirrorPoint(zEnd);
        const arcY = generateConstantGArc(yStart, 0.6);

        // Phase 1: Z chart arc (t: 0-0.4)
        if (t > 0) {
          const zProgress = Math.min(t / 0.4, 1);
          const visibleZ = Math.floor(zProgress * arcZ.length);

          ctx.strokeStyle = 'rgba(255, 199, 0, 0.6)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          const zStart = toCanvas(arcZ[0]);
          ctx.moveTo(zStart.x, zStart.y);
          for (let i = 1; i < visibleZ; i++) {
            const pt = toCanvas(arcZ[i]);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }

        // Phase 2: Y chart arc (t: 0.5-1)
        if (t > 0.5) {
          const yProgress = (t - 0.5) / 0.5;
          const visibleY = Math.floor(yProgress * arcY.length);

          ctx.strokeStyle = 'rgba(100, 180, 255, 0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          const yStartPt = toCanvas(arcY[0], true);
          ctx.moveTo(yStartPt.x, yStartPt.y);
          for (let i = 1; i < visibleY; i++) {
            const pt = toCanvas(arcY[i], true);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();

          // Show "已匹配" label when complete
          if (t > 0.95) {
            ctx.fillStyle = 'rgba(100, 255, 150, 0.9)';
            ctx.font = 'bold 12px "Space Grotesk", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              lang === 'zh' ? '已匹配！' : 'Matched!',
              centerX,
              centerY + radius + 25
            );
          }
        }

      } else if (activeStep === 4) {
        // Step 4: Y = 1/Z symmetry demonstration
        const point = zToGamma(startZ);
        const mirroredPoint = mirrorPoint(point);

        // Draw both points
        const pZ = toCanvas(point);
        const pY = toCanvas(mirroredPoint);

        // Connecting line through origin
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pZ.x, pZ.y);
        ctx.lineTo(pY.x, pY.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Z point
        const zAlpha = 1 - t * 0.5;
        ctx.fillStyle = `rgba(255, 199, 0, ${zAlpha})`;
        ctx.beginPath();
        ctx.arc(pZ.x, pZ.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 199, 0, ${zAlpha * 0.7})`;
        ctx.font = '11px "Space Grotesk", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Z', pZ.x, pZ.y - 15);

        // Y point (appears with animation)
        const yAlpha = t;
        ctx.fillStyle = `rgba(100, 180, 255, ${yAlpha})`;
        ctx.beginPath();
        ctx.arc(pY.x, pY.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(100, 180, 255, ${yAlpha * 0.7})`;
        ctx.fillText('Y = 1/Z', pY.x, pY.y + 20);

        // Formula
        if (t > 0.7) {
          const formulaAlpha = (t - 0.7) / 0.3;
          ctx.fillStyle = `rgba(255, 255, 255, ${formulaAlpha * 0.6})`;
          ctx.font = '13px "Space Grotesk", sans-serif';
          ctx.fillText(
            lang === 'zh' ? '这一翻，就是 Y = 1/Z' : 'This flip is Y = 1/Z',
            centerX,
            centerY + radius + 25
          );
        }
      }
    };

    resize();
    draw();

    // Use ResizeObserver instead of global resize event to avoid affecting other components
    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [activeStep, animProgress, chartMode, zToGamma, mirrorPoint, generateConstantRArc, generateConstantGArc, height, lang]);

  // Step definitions
  const steps = lang === 'zh' ? [
    { id: 1 as StepId, title: '串联电感 +jωL', desc: '沿恒 R 圆顺时针' },
    { id: 2 as StepId, title: '并联电容 +jωC', desc: '切换 Y 图，沿恒 G 圆' },
    { id: 3 as StepId, title: '完整匹配路径', desc: '先串后并，到达圆心' },
    { id: 4 as StepId, title: 'Y = 1/Z 对称', desc: '导纳图是阻抗图的镜像' },
  ] : [
    { id: 1 as StepId, title: 'Series L +jωL', desc: 'Along constant-R circle' },
    { id: 2 as StepId, title: 'Shunt C +jωC', desc: 'Switch to Y, along constant-G' },
    { id: 3 as StepId, title: 'Full Match Path', desc: 'Series then shunt to center' },
    { id: 4 as StepId, title: 'Y = 1/Z Symmetry', desc: 'Admittance mirrors impedance' },
  ];

  return (
    <div className={`${className}`}>
      {/* Step selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => onStepChange?.(step.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: activeStep === step.id 
                ? 'rgba(255, 199, 0, 0.15)' 
                : 'rgba(255, 255, 255, 0.03)',
              border: activeStep === step.id
                ? '1px solid rgba(255, 199, 0, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: activeStep === step.id 
                  ? 'rgba(255, 199, 0, 0.3)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: activeStep === step.id ? '#FFC700' : 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {step.id}
            </span>
            <div className="text-left">
              <div 
                className="text-xs font-medium"
                style={{ color: activeStep === step.id ? '#FFC700' : 'rgba(255, 255, 255, 0.7)' }}
              >
                {step.title}
              </div>
              <div className="text-[10px] text-white/40">{step.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Replay button */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={playStep}
          disabled={isPlaying}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
          style={{
            backgroundColor: 'rgba(255, 199, 0, 0.1)',
            border: '1px solid rgba(255, 199, 0, 0.3)',
            color: '#FFC700',
            opacity: isPlaying ? 0.5 : 1,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M1 0 L1 10 L3 10 L3 0 Z M5 0 L10 5 L5 10 Z" />
          </svg>
          {lang === 'zh' ? '重播' : 'Replay'}
        </button>
        
        <div className="text-[10px] text-white/30 font-mono">
          t = {animProgress.toFixed(2)}
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
    </div>
  );
};





type StepId = 1 | 2 | 3 | 4;
type ChartMode = 'impedance' | 'admittance';

interface MatchingStepsSimProps {
  activeStep: StepId;
  onStepChange?: (step: StepId) => void;
  reducedMotion?: boolean;
  lang?: 'en' | 'zh';
  height?: number;
  className?: string;
}

interface Complex {
  re: number;
  im: number;
}

interface PathPoint {
  gamma: Complex;
  mode: ChartMode;
  isActive?: boolean;
}

/**
 * MatchingStepsSim - Interactive L-section matching network visualization
 * 
 * Four steps that build a complete matching trajectory:
 * 1. Series L: Move along constant-R circle (clockwise) on Z-chart
 * 2. Shunt C: Move along constant-G circle (clockwise) on Y-chart  
 * 3. Full path: Combine steps 1+2 to reach the center
 * 4. Y = 1/Z: Demonstrate the point-symmetric relationship
 */
export const MatchingStepsSim: React.FC<MatchingStepsSimProps> = ({
  activeStep,
  onStepChange,
  reducedMotion = false,
  lang = 'zh',
  height = 350,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartMode, setChartMode] = useState<ChartMode>('impedance');
  const [animProgress, setAnimProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Starting impedance point (normalized to Z0 = 1)
  const startZ: Complex = { re: 0.5, im: 1.5 }; // R=0.5, X=1.5 (inductive load)

  // Convert impedance to reflection coefficient
  const zToGamma = useCallback((z: Complex): Complex => {
    const denomRe = z.re + 1;
    const denomIm = z.im;
    const denomMagSq = denomRe * denomRe + denomIm * denomIm;
    if (denomMagSq < 0.0001) return { re: 1, im: 0 };
    
    const numRe = z.re - 1;
    const numIm = z.im;
    
    return {
      re: (numRe * denomRe + numIm * denomIm) / denomMagSq,
      im: (numIm * denomRe - numRe * denomIm) / denomMagSq,
    };
  }, []);

  // Convert admittance to reflection coefficient (Y-chart is Z-chart mirrored)
  const yToGamma = useCallback((y: Complex): Complex => {
    // For Y-chart, Γ_y = -Γ_z (point symmetric about origin)
    const z = { re: y.re, im: -y.im }; // Y = 1/Z approximation for display
    const gamma = zToGamma(z);
    return { re: -gamma.re, im: -gamma.im };
  }, [zToGamma]);

  // Mirror point about origin (Z ↔ Y transformation)
  const mirrorPoint = useCallback((gamma: Complex): Complex => {
    return { re: -gamma.re, im: -gamma.im };
  }, []);

  // Generate arc points along constant-R circle
  const generateConstantRArc = useCallback((
    startGamma: Complex,
    arcAngle: number, // radians, positive = clockwise (adding inductance)
    numPoints: number = 30
  ): Complex[] => {
    const points: Complex[] = [];
    
    // Find the center and radius of the constant-R circle passing through startGamma
    // For Smith chart, constant-R circles have center at (r/(r+1), 0) and radius 1/(r+1)
    // We'll approximate by rotating around the current position
    
    const startAngle = Math.atan2(startGamma.im, startGamma.re - 0.3); // Approximate center
    const radius = Math.sqrt(Math.pow(startGamma.re - 0.3, 2) + Math.pow(startGamma.im, 2));
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const angle = startAngle - arcAngle * t; // Clockwise
      points.push({
        re: 0.3 + radius * Math.cos(angle),
        im: radius * Math.sin(angle),
      });
    }
    
    return points;
  }, []);

  // Generate arc points along constant-G circle (on Y-chart)
  const generateConstantGArc = useCallback((
    startGamma: Complex,
    arcAngle: number,
    numPoints: number = 30
  ): Complex[] => {
    const points: Complex[] = [];
    
    const startAngle = Math.atan2(startGamma.im, startGamma.re + 0.2);
    const radius = Math.sqrt(Math.pow(startGamma.re + 0.2, 2) + Math.pow(startGamma.im, 2));
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const angle = startAngle - arcAngle * t;
      points.push({
        re: -0.2 + radius * Math.cos(angle),
        im: radius * Math.sin(angle),
      });
    }
    
    return points;
  }, []);

  // Easing
  const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const easeInOutCubic = (t: number): number => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // Start animation for current step
  const playStep = useCallback(() => {
    if (reducedMotion) {
      setAnimProgress(1);
      return;
    }

    setIsPlaying(true);
    setAnimProgress(0);
    startTimeRef.current = performance.now();

    const durations: Record<StepId, number> = {
      1: 2000,
      2: 2500,
      3: 4000,
      4: 2000,
    };

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current;
      const duration = durations[activeStep];
      const rawProgress = Math.min(elapsed / duration, 1);
      
      setAnimProgress(easeOutExpo(rawProgress));

      if (rawProgress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [activeStep, reducedMotion]);

  // Reset and play when step changes
  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    setAnimProgress(0);
    
    // Set initial chart mode based on step
    if (activeStep === 1 || activeStep === 4) {
      setChartMode('impedance');
    } else if (activeStep === 2) {
      setChartMode('admittance');
    }

    // Auto-play after a short delay
    const timer = setTimeout(() => playStep(), 300);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animRef.current);
    };
  }, [activeStep, playStep]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.38;

      const t = animProgress;

      // Determine effective chart mode based on step and progress
      let effectiveMode = chartMode;
      let modeTransition = 0; // 0 = Z, 1 = Y

      if (activeStep === 2) {
        // Step 2: Transition from Z to Y in first 30%
        if (t < 0.3) {
          modeTransition = easeInOutCubic(t / 0.3);
          effectiveMode = modeTransition > 0.5 ? 'admittance' : 'impedance';
        } else {
          modeTransition = 1;
          effectiveMode = 'admittance';
        }
      } else if (activeStep === 3) {
        // Step 3: Z (0-0.4) → transition (0.4-0.5) → Y (0.5-1)
        if (t < 0.4) {
          modeTransition = 0;
          effectiveMode = 'impedance';
        } else if (t < 0.5) {
          modeTransition = easeInOutCubic((t - 0.4) / 0.1);
          effectiveMode = modeTransition > 0.5 ? 'admittance' : 'impedance';
        } else {
          modeTransition = 1;
          effectiveMode = 'admittance';
        }
      } else if (activeStep === 4) {
        // Step 4: Show mirror relationship
        if (t > 0.5) {
          modeTransition = easeInOutCubic((t - 0.5) / 0.5);
        }
      }

      // === Draw Smith Chart Grid ===
      const gridAlpha = 0.15;
      
      // Unit circle
      ctx.strokeStyle = `rgba(255, 199, 0, ${gridAlpha + 0.1})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Constant R circles (simplified)
      ctx.strokeStyle = `rgba(255, 199, 0, ${gridAlpha})`;
      ctx.lineWidth = 0.5;
      const rCircles = [0.2, 0.5, 1, 2];
      rCircles.forEach(r => {
        const cx = centerX + (r / (r + 1)) * radius;
        const cr = (1 / (r + 1)) * radius;
        ctx.beginPath();
        ctx.arc(cx, centerY, cr, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Horizontal axis
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.stroke();

      // Center point (Γ = 0)
      ctx.fillStyle = 'rgba(100, 255, 150, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Chart mode label
      ctx.fillStyle = effectiveMode === 'impedance' 
        ? 'rgba(255, 199, 0, 0.7)' 
        : 'rgba(100, 180, 255, 0.7)';
      ctx.font = 'bold 14px "Space Grotesk", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        effectiveMode === 'impedance' ? 'Z Chart' : 'Y Chart',
        centerX,
        centerY - radius - 15
      );

      // === Draw Step-specific content ===
      const startGamma = zToGamma(startZ);

      const toCanvas = (gamma: Complex, mirror: boolean = false): { x: number; y: number } => {
        let g = mirror ? mirrorPoint(gamma) : gamma;
        // Apply mode transition rotation for smooth Z↔Y switch
        if (modeTransition > 0 && modeTransition < 1) {
          const angle = modeTransition * Math.PI;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          g = {
            re: g.re * cos - g.im * sin,
            im: g.re * sin + g.im * cos,
          };
        }
        return {
          x: centerX + g.re * radius,
          y: centerY - g.im * radius,
        };
      };

      // Draw based on active step
      if (activeStep === 1) {
        // Step 1: Series L - move along constant R circle
        const arcPoints = generateConstantRArc(startGamma, 0.8);
        const visibleCount = Math.floor(t * arcPoints.length);

        // Draw arc path
        if (visibleCount > 1) {
          ctx.strokeStyle = 'rgba(255, 199, 0, 0.6)';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          
          const start = toCanvas(arcPoints[0]);
          ctx.moveTo(start.x, start.y);
          
          for (let i = 1; i < visibleCount; i++) {
            const pt = toCanvas(arcPoints[i]);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }

        // Draw current point
        if (visibleCount > 0) {
          const current = toCanvas(arcPoints[Math.min(visibleCount, arcPoints.length - 1)]);
          
          // Glow
          const glow = ctx.createRadialGradient(current.x, current.y, 0, current.x, current.y, 20);
          glow.addColorStop(0, 'rgba(255, 199, 0, 0.8)');
          glow.addColorStop(1, 'rgba(255, 199, 0, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(current.x, current.y, 20, 0, Math.PI * 2);
          ctx.fill();

          // Core
          ctx.fillStyle = '#FFC700';
          ctx.beginPath();
          ctx.arc(current.x, current.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw start point
        const startPt = toCanvas(startGamma);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(startPt.x, startPt.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // +jX indicator
        ctx.fillStyle = 'rgba(255, 199, 0, 0.8)';
        ctx.font = '12px "Space Grotesk", monospace';
        ctx.textAlign = 'left';
        const jxValue = (t * 0.8).toFixed(2);
        ctx.fillText(`+jX: ${jxValue}`, centerX + radius + 10, centerY - 20);

      } else if (activeStep === 2) {
        // Step 2: Shunt C - move along constant G circle on Y chart
        const zEndStep1 = { re: startZ.re, im: startZ.im - 0.8 };
        const gammaEndStep1 = zToGamma(zEndStep1);
        const yStart = mirrorPoint(gammaEndStep1);

        // Show previous path (dimmed)
        const prevArc = generateConstantRArc(startGamma, 0.8);
        ctx.strokeStyle = 'rgba(255, 199, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const prevStart = toCanvas(prevArc[0]);
        ctx.moveTo(prevStart.x, prevStart.y);
        prevArc.forEach(pt => {
          const p = toCanvas(pt);
          ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Current step arc (on Y chart)
        if (t > 0.3) {
          const yProgress = (t - 0.3) / 0.7;
          const yArcPoints = generateConstantGArc(yStart, 0.6);
          const visibleCount = Math.floor(yProgress * yArcPoints.length);

          if (visibleCount > 1) {
            ctx.strokeStyle = 'rgba(100, 180, 255, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            const start = toCanvas(yArcPoints[0], true);
            ctx.moveTo(start.x, start.y);
            
            for (let i = 1; i < visibleCount; i++) {
              const pt = toCanvas(yArcPoints[i], true);
              ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
          }

          // Current point
          if (visibleCount > 0) {
            const current = toCanvas(yArcPoints[Math.min(visibleCount, yArcPoints.length - 1)], true);
            
            const glow = ctx.createRadialGradient(current.x, current.y, 0, current.x, current.y, 20);
            glow.addColorStop(0, 'rgba(100, 180, 255, 0.8)');
            glow.addColorStop(1, 'rgba(100, 180, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(current.x, current.y, 20, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#64B4FF';
            ctx.beginPath();
            ctx.arc(current.x, current.y, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }

      } else if (activeStep === 3) {
        // Step 3: Full matching path
        const arcZ = generateConstantRArc(startGamma, 0.8);
        const zEnd = arcZ[arcZ.length - 1];
        const yStart = mirrorPoint(zEnd);
        const arcY = generateConstantGArc(yStart, 0.6);

        // Phase 1: Z chart arc (t: 0-0.4)
        if (t > 0) {
          const zProgress = Math.min(t / 0.4, 1);
          const visibleZ = Math.floor(zProgress * arcZ.length);

          ctx.strokeStyle = 'rgba(255, 199, 0, 0.6)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          const zStart = toCanvas(arcZ[0]);
          ctx.moveTo(zStart.x, zStart.y);
          for (let i = 1; i < visibleZ; i++) {
            const pt = toCanvas(arcZ[i]);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }

        // Phase 2: Y chart arc (t: 0.5-1)
        if (t > 0.5) {
          const yProgress = (t - 0.5) / 0.5;
          const visibleY = Math.floor(yProgress * arcY.length);

          ctx.strokeStyle = 'rgba(100, 180, 255, 0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          const yStartPt = toCanvas(arcY[0], true);
          ctx.moveTo(yStartPt.x, yStartPt.y);
          for (let i = 1; i < visibleY; i++) {
            const pt = toCanvas(arcY[i], true);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();

          // Show "已匹配" label when complete
          if (t > 0.95) {
            ctx.fillStyle = 'rgba(100, 255, 150, 0.9)';
            ctx.font = 'bold 12px "Space Grotesk", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              lang === 'zh' ? '已匹配！' : 'Matched!',
              centerX,
              centerY + radius + 25
            );
          }
        }

      } else if (activeStep === 4) {
        // Step 4: Y = 1/Z symmetry demonstration
        const point = zToGamma(startZ);
        const mirroredPoint = mirrorPoint(point);

        // Draw both points
        const pZ = toCanvas(point);
        const pY = toCanvas(mirroredPoint);

        // Connecting line through origin
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pZ.x, pZ.y);
        ctx.lineTo(pY.x, pY.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Z point
        const zAlpha = 1 - t * 0.5;
        ctx.fillStyle = `rgba(255, 199, 0, ${zAlpha})`;
        ctx.beginPath();
        ctx.arc(pZ.x, pZ.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 199, 0, ${zAlpha * 0.7})`;
        ctx.font = '11px "Space Grotesk", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Z', pZ.x, pZ.y - 15);

        // Y point (appears with animation)
        const yAlpha = t;
        ctx.fillStyle = `rgba(100, 180, 255, ${yAlpha})`;
        ctx.beginPath();
        ctx.arc(pY.x, pY.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(100, 180, 255, ${yAlpha * 0.7})`;
        ctx.fillText('Y = 1/Z', pY.x, pY.y + 20);

        // Formula
        if (t > 0.7) {
          const formulaAlpha = (t - 0.7) / 0.3;
          ctx.fillStyle = `rgba(255, 255, 255, ${formulaAlpha * 0.6})`;
          ctx.font = '13px "Space Grotesk", sans-serif';
          ctx.fillText(
            lang === 'zh' ? '这一翻，就是 Y = 1/Z' : 'This flip is Y = 1/Z',
            centerX,
            centerY + radius + 25
          );
        }
      }
    };

    resize();
    draw();

    // Use ResizeObserver instead of global resize event to avoid affecting other components
    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [activeStep, animProgress, chartMode, zToGamma, mirrorPoint, generateConstantRArc, generateConstantGArc, height, lang]);

  // Step definitions
  const steps = lang === 'zh' ? [
    { id: 1 as StepId, title: '串联电感 +jωL', desc: '沿恒 R 圆顺时针' },
    { id: 2 as StepId, title: '并联电容 +jωC', desc: '切换 Y 图，沿恒 G 圆' },
    { id: 3 as StepId, title: '完整匹配路径', desc: '先串后并，到达圆心' },
    { id: 4 as StepId, title: 'Y = 1/Z 对称', desc: '导纳图是阻抗图的镜像' },
  ] : [
    { id: 1 as StepId, title: 'Series L +jωL', desc: 'Along constant-R circle' },
    { id: 2 as StepId, title: 'Shunt C +jωC', desc: 'Switch to Y, along constant-G' },
    { id: 3 as StepId, title: 'Full Match Path', desc: 'Series then shunt to center' },
    { id: 4 as StepId, title: 'Y = 1/Z Symmetry', desc: 'Admittance mirrors impedance' },
  ];

  return (
    <div className={`${className}`}>
      {/* Step selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => onStepChange?.(step.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: activeStep === step.id 
                ? 'rgba(255, 199, 0, 0.15)' 
                : 'rgba(255, 255, 255, 0.03)',
              border: activeStep === step.id
                ? '1px solid rgba(255, 199, 0, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: activeStep === step.id 
                  ? 'rgba(255, 199, 0, 0.3)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: activeStep === step.id ? '#FFC700' : 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {step.id}
            </span>
            <div className="text-left">
              <div 
                className="text-xs font-medium"
                style={{ color: activeStep === step.id ? '#FFC700' : 'rgba(255, 255, 255, 0.7)' }}
              >
                {step.title}
              </div>
              <div className="text-[10px] text-white/40">{step.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Replay button */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={playStep}
          disabled={isPlaying}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
          style={{
            backgroundColor: 'rgba(255, 199, 0, 0.1)',
            border: '1px solid rgba(255, 199, 0, 0.3)',
            color: '#FFC700',
            opacity: isPlaying ? 0.5 : 1,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M1 0 L1 10 L3 10 L3 0 Z M5 0 L10 5 L5 10 Z" />
          </svg>
          {lang === 'zh' ? '重播' : 'Replay'}
        </button>
        
        <div className="text-[10px] text-white/30 font-mono">
          t = {animProgress.toFixed(2)}
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
    </div>
  );
};
