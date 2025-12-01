import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { THEME } from '../theme';

interface SmithChartCanvasProps {
  reducedMotion?: boolean;
  overrideImpedance?: { r: number; x: number } | null;
  showAdmittance?: boolean;
  showVSWRCircles?: boolean;
  lang?: 'en' | 'zh';
  onDirectDrag?: (impedance: { r: number; x: number }) => void;
  allowDirectDrag?: boolean;
  onHoverChange?: (isHovering: boolean) => void;
  onDragChange?: (isDragging: boolean) => void;
}

// ========================================
// SMITH ENGINE - Complex Number Mathematics
// ========================================

interface Complex {
  re: number;
  im: number;
}

interface Impedance {
  r: number;
  x: number;
}

// Pre-allocated reusable objects to avoid GC
const _tempComplex: Complex = { re: 0, im: 0 };
const _tempImpedance: Impedance = { r: 0, x: 0 };

const Complex = {
  create: (re: number, im: number): Complex => ({ re, im }),
  add: (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im }),
  sub: (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im }),
  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  }),
  div: (a: Complex, b: Complex): Complex => {
    const denom = b.re * b.re + b.im * b.im;
    if (denom === 0) return { re: Infinity, im: Infinity };
    return {
      re: (a.re * b.re + a.im * b.im) / denom,
      im: (a.im * b.re - a.re * b.im) / denom
    };
  },
  mag: (c: Complex): number => Math.sqrt(c.re * c.re + c.im * c.im),
  phase: (c: Complex): number => Math.atan2(c.im, c.re),
  phaseDeg: (c: Complex): number => Math.atan2(c.im, c.re) * (180 / Math.PI),
  // In-place operations to avoid allocation
  subInto: (a: Complex, b: Complex, out: Complex): void => {
    out.re = a.re - b.re;
    out.im = a.im - b.im;
  },
  addInto: (a: Complex, b: Complex, out: Complex): void => {
    out.re = a.re + b.re;
    out.im = a.im + b.im;
  },
  divInto: (a: Complex, b: Complex, out: Complex): void => {
    const denom = b.re * b.re + b.im * b.im;
    if (denom === 0) {
      out.re = Infinity;
      out.im = Infinity;
    } else {
      out.re = (a.re * b.re + a.im * b.im) / denom;
      out.im = (a.im * b.re - a.re * b.im) / denom;
    }
  },
};

// ========================================
// IMPEDANCE TO GAMMA CONVERSION
// ========================================

// Pre-allocated for impedanceToGamma
const _zComplex: Complex = { re: 0, im: 0 };
const _one: Complex = { re: 1, im: 0 };
const _numerator: Complex = { re: 0, im: 0 };
const _denominator: Complex = { re: 0, im: 0 };
const _gammaResult: Complex = { re: 0, im: 0 };

function impedanceToGamma(z: Impedance): Complex {
  _zComplex.re = z.r;
  _zComplex.im = z.x;
  Complex.subInto(_zComplex, _one, _numerator);
  Complex.addInto(_zComplex, _one, _denominator);
  Complex.divInto(_numerator, _denominator, _gammaResult);
  return _gammaResult;
}

// Allocating version for when we need a new object
function impedanceToGammaNew(z: Impedance): Complex {
  const zComplex: Complex = { re: z.r, im: z.x };
  const one: Complex = { re: 1, im: 0 };
  const numerator = Complex.sub(zComplex, one);
  const denominator = Complex.add(zComplex, one);
  return Complex.div(numerator, denominator);
}

function gammaToScreen(gamma: Complex, cx: number, cy: number, radius: number): { x: number; y: number } {
  return {
    x: cx + gamma.re * radius,
    y: cy - gamma.im * radius
  };
}

// ========================================
// RF PARAMETER CALCULATIONS
// ========================================

function calculateRFParams(z: Impedance) {
  const gamma = impedanceToGammaNew(z);
  const gammaMag = Complex.mag(gamma);
  const gammaAngle = Complex.phaseDeg(gamma);
  const vswr = gammaMag < 0.9999 ? (1 + gammaMag) / (1 - gammaMag) : Infinity;
  const returnLoss = gammaMag > 0.0001 ? -20 * Math.log10(gammaMag) : Infinity;
  const mismatchLoss = gammaMag < 0.9999 ? -10 * Math.log10(1 - gammaMag * gammaMag) : Infinity;
  const powerDelivered = (1 - gammaMag * gammaMag) * 100;
  
  let region: 'match' | 'inductive' | 'capacitive' | 'short' | 'open' = 'match';
  if (gammaMag > 0.95) {
    if (gamma.re < -0.8) region = 'short';
    else if (gamma.re > 0.8) region = 'open';
    else if (gamma.im > 0) region = 'inductive';
    else region = 'capacitive';
  } else if (z.x > 0.05) {
    region = 'inductive';
  } else if (z.x < -0.05) {
    region = 'capacitive';
  } else if (gammaMag < 0.15) {
    region = 'match';
  }
  
  return { gamma, gammaReal: gamma.re, gammaImag: gamma.im, gammaMag, gammaAngle, vswr, returnLoss, mismatchLoss, powerDelivered, region };
}

// ========================================
// OPTIMIZED DRAWING HELPERS
// ========================================

const fontTech = "'Space Grotesk', monospace";
const GRID_WHITE_DISTANT = 'rgba(255, 255, 255, 0.08)';
const GRID_WHITE_PRIME = 'rgba(255, 255, 255, 0.25)';
const GRID_GOLD_ACCENT = 'rgba(255, 215, 0, 0.3)';
const GRID_GOLD_FAINT = 'rgba(255, 215, 0, 0.06)';
const TEXT_HIGH = '#EAEAEA';
const TEXT_MED = 'rgba(234, 234, 234, 0.5)';

// Pre-computed constants
const TWO_PI = Math.PI * 2;
const R_VALUES = [0, 0.2, 0.5, 1, 2, 5];
const X_VALUES = [0.2, 0.5, 1, 2, 5];
const VSWR_VALUES = [1.5, 2, 3, 5];
const G_VALUES = [0.2, 0.5, 1, 2];

function drawReactanceArc(
  ctx: CanvasRenderingContext2D, 
  cx: number, cy: number, scale: number, 
  xVal: number, isPositive: boolean, color?: string
) {
  const centerU = 1;
  const centerV = isPositive ? (1 / xVal) : (-1 / xVal);
  const arcRadius = 1 / xVal;
  const screenCenterX = cx + centerU * scale;
  const screenCenterY = cy - centerV * scale;
  const screenRadius = arcRadius * scale;

  ctx.beginPath();
  ctx.arc(screenCenterX, screenCenterY, screenRadius, 0, TWO_PI);
  
  if (xVal === 1) {
    ctx.strokeStyle = color || GRID_GOLD_ACCENT;
    ctx.lineWidth = 0.8;
  } else {
    ctx.strokeStyle = color || GRID_WHITE_DISTANT;
    ctx.lineWidth = 0.5;
  }
  ctx.stroke();
}

// Optimized: Cache static grid to offscreen canvas
function drawSmithChartGrid(
  ctx: CanvasRenderingContext2D, 
  cx: number, cy: number, r: number, 
  showAdmittance: boolean = false,
  showVSWRCircles: boolean = false
) {
  ctx.lineWidth = 0.5;
  
  // Background glow (simplified)
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.02)');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TWO_PI);
  ctx.fill();
  
  // VSWR circles
  if (showVSWRCircles) {
    ctx.setLineDash([4, 6]);
    for (let i = 0; i < VSWR_VALUES.length; i++) {
      const vswr = VSWR_VALUES[i];
      const gammaMag = (vswr - 1) / (vswr + 1);
      ctx.beginPath();
      ctx.arc(cx, cy, gammaMag * r, 0, TWO_PI);
      ctx.strokeStyle = GRID_GOLD_FAINT;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  
  // Unit circle (simplified glow)
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TWO_PI);
  ctx.strokeStyle = GRID_GOLD_ACCENT;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Constant resistance circles
  for (let i = 0; i < R_VALUES.length; i++) {
    const rVal = R_VALUES[i];
    const centerU = rVal / (rVal + 1);
    const circleRadius = 1 / (rVal + 1);
    const screenCenterX = cx + centerU * r;
    const screenRadius = circleRadius * r;

    ctx.beginPath();
    ctx.arc(screenCenterX, cy, screenRadius, 0, TWO_PI);
    
    if (rVal === 1) {
      ctx.strokeStyle = GRID_GOLD_ACCENT;
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = GRID_WHITE_DISTANT;
      ctx.lineWidth = 0.5;
    }
    ctx.stroke();
  }

  // Constant reactance arcs
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TWO_PI);
  ctx.clip();

  for (let i = 0; i < X_VALUES.length; i++) {
    const xVal = X_VALUES[i];
    drawReactanceArc(ctx, cx, cy, r, xVal, true);
    drawReactanceArc(ctx, cx, cy, r, xVal, false);
  }
  
  // Real axis
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.strokeStyle = GRID_WHITE_PRIME;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Admittance chart
  if (showAdmittance) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI);
    ctx.translate(-cx, -cy);
    
    for (let i = 0; i < G_VALUES.length; i++) {
      const gVal = G_VALUES[i];
      const centerU = gVal / (gVal + 1);
      const circleRadius = 1 / (gVal + 1);
      ctx.beginPath();
      ctx.arc(cx + centerU * r, cy, circleRadius * r, 0, TWO_PI);
      ctx.strokeStyle = "rgba(100, 200, 150, 0.12)";
      ctx.stroke();
    }
    
    for (let i = 0; i < X_VALUES.length; i++) {
      const bVal = X_VALUES[i];
      drawReactanceArc(ctx, cx, cy, r, bVal, true, "rgba(100, 200, 150, 0.12)");
      drawReactanceArc(ctx, cx, cy, r, bVal, false, "rgba(100, 200, 150, 0.12)");
    }
    ctx.restore();
  }

  ctx.restore();

  // Labels (simplified)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 10px ${fontTech}`;
  
  ctx.fillStyle = TEXT_MED;
  ctx.fillText("SHORT", cx - r - 32, cy);
  ctx.fillText("OPEN", cx + r + 30, cy);
  
  ctx.fillStyle = '#FFD700';
  ctx.fillText("MATCH", cx, cy - 18);
  
  ctx.fillStyle = TEXT_HIGH;
  ctx.fillText("+jX", cx, cy - r - 14);
  ctx.fillText("−jX", cx, cy + r + 14);
  
  // Match point marker (simplified - no shadowBlur)
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, TWO_PI);
  ctx.fillStyle = '#FFD700';
  ctx.fill();
}

// Optimized active point drawing (removed expensive shadowBlur)
function drawActivePoint(
  ctx: CanvasRenderingContext2D, 
  cx: number, cy: number, radius: number, 
  impedance: Impedance,
  posX: number, posY: number,
  isHovering: boolean,
  isDragging: boolean
) {
  const gamma = impedanceToGamma(impedance);
  const gammaMag = Math.sqrt(gamma.re * gamma.re + gamma.im * gamma.im);
  
  // Simplified spotlight (no radial gradient spam)
  ctx.fillStyle = 'rgba(255, 215, 0, 0.03)';
  ctx.beginPath();
  ctx.arc(posX, posY, 100, 0, TWO_PI);
  ctx.fill();
  
  // Vector line (simplified - single layer)
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(posX, posY);
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // VSWR circle (simplified)
  if (gammaMag > 0.01 && gammaMag < 0.99) {
    ctx.beginPath();
    ctx.arc(cx, cy, gammaMag * radius, 0, TWO_PI);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  // Active point (simplified glow layers - no shadowBlur)
  const vswr = gammaMag < 0.999 ? (1 + gammaMag) / (1 - gammaMag) : 10;
  const brightness = Math.max(0.5, 1 - (vswr - 1) / 10);
  const r_color = Math.round(255 * brightness);
  const g_color = Math.round(215 * brightness);
  
  const baseSize = isDragging ? 8 : (isHovering ? 7 : 6);
  
  // Outer glow (single layer instead of 3)
  ctx.beginPath();
  ctx.arc(posX, posY, baseSize * 2, 0, TWO_PI);
  ctx.fillStyle = `rgba(${r_color}, ${g_color}, 0, 0.15)`;
  ctx.fill();
  
  // Core point
  ctx.beginPath();
  ctx.arc(posX, posY, baseSize, 0, TWO_PI);
  ctx.fillStyle = `rgb(${r_color}, ${g_color}, 0)`;
  ctx.fill();

  // Center dot
  ctx.beginPath();
  ctx.arc(posX, posY, 2, 0, TWO_PI);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fill();
  
  // Data label (simplified)
  const labelX = posX + 20;
  const labelY = posY - 20;
  const w = ctx.canvas.width / (window.devicePixelRatio || 1);
  
  if (labelX < w - 80 && labelY > 20) {
    ctx.font = "bold 10px 'Space Grotesk', monospace";
    ctx.fillStyle = `rgb(${r_color}, ${g_color}, 0)`;
    ctx.textAlign = "left";
    ctx.fillText(`z = ${impedance.r.toFixed(2)}${impedance.x >= 0 ? '+' : ''}j${impedance.x.toFixed(2)}`, labelX, labelY);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = "9px 'Space Grotesk', monospace";
    ctx.fillText(`|Γ| = ${gammaMag.toFixed(3)}`, labelX, labelY + 12);
  }
}

// ========================================
// SNAP POINTS (Pre-allocated)
// ========================================
const SNAP_POINTS: ReadonlyArray<{ z: Impedance; label: string }> = [
  { z: { r: 1, x: 0 }, label: 'Match' },
  { z: { r: 0, x: 0 }, label: 'Short' },
  { z: { r: 5, x: 0 }, label: 'Open' },
  { z: { r: 1, x: 1 }, label: '+jX' },
  { z: { r: 1, x: -1 }, label: '-jX' },
];

// ========================================
// MAIN COMPONENT - REF-BASED ANIMATION LOOP
// ========================================

export const SmithChartCanvas: React.FC<SmithChartCanvasProps> = ({ 
  reducedMotion, 
  overrideImpedance, 
  showAdmittance,
  showVSWRCircles = false,
  lang = 'zh',
  onDirectDrag,
  allowDirectDrag = false,
  onHoverChange,
  onDragChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridCacheRef = useRef<HTMLCanvasElement | null>(null);
  
  // ========================================
  // ALL MUTABLE STATE IN REFS (NO useState for animation)
  // ========================================
  const animationState = useRef({
    // Position state
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    hasPosition: false,
    
    // Interaction state
    isDragging: false,
    isHovering: false,
    
    // Computed impedance (updated in draw loop)
    impedance: { r: 1, x: 0 } as Impedance,
    hasImpedance: false,
    
    // Canvas dimensions
    cx: 0,
    cy: 0,
    radius: 0,
    width: 0,
    height: 0,
    
    // Frame timing
    lastFrameTime: 0,
    
    // Grid cache validity
    gridCacheValid: false,
  });
  
  // HUD display state (only updated when needed for React render)
  const hudStateRef = useRef({
    impedance: null as Impedance | null,
    rfParams: null as ReturnType<typeof calculateRFParams> | null,
    needsUpdate: false,
  });
  
  // Force update for HUD (throttled)
  const [hudUpdateTrigger, setHudUpdateTrigger] = React.useState(0);
  const lastHudUpdate = useRef(0);
  
  // Callbacks stored in refs to avoid recreation
  const callbacksRef = useRef({
    onDirectDrag,
    onHoverChange,
    onDragChange,
  });
  callbacksRef.current = { onDirectDrag, onHoverChange, onDragChange };

  // Create cached grid canvas
  const updateGridCache = useCallback((width: number, height: number, dpr: number) => {
    if (!gridCacheRef.current) {
      gridCacheRef.current = document.createElement('canvas');
    }
    
    const cache = gridCacheRef.current;
    cache.width = width * dpr;
    cache.height = height * dpr;
    
    const ctx = cache.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(dpr, dpr);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    
    drawSmithChartGrid(ctx, centerX, centerY, radius, showAdmittance, showVSWRCircles);
    
    animationState.current.gridCacheValid = true;
  }, [showAdmittance, showVSWRCircles]);

  // Invalidate grid cache when options change
  useEffect(() => {
    animationState.current.gridCacheValid = false;
  }, [showAdmittance, showVSWRCircles]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let lastWidth = 0;
    let lastHeight = 0;
    const state = animationState.current;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2 for performance
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      
      if (width !== lastWidth || height !== lastHeight) {
        lastWidth = width;
        lastHeight = height;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        
        state.width = width;
        state.height = height;
        state.cx = width / 2;
        state.cy = height / 2;
        state.radius = Math.min(width, height) * 0.4;
        
        // Update grid cache
        updateGridCache(width, height, dpr);
      }
    };
    
    resize();
    window.addEventListener('resize', resize);

    // Pure draw function - reads from refs only
    const draw = (timestamp: number) => {
      // Throttle to ~60fps
      const elapsed = timestamp - state.lastFrameTime;
      if (elapsed < 16) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }
      state.lastFrameTime = timestamp;

      const { cx, cy, radius, width: w, height: h } = state;
      if (w === 0 || h === 0) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      // Update target position from override impedance
      if (overrideImpedance) {
        const z = overrideImpedance;
        const denom = (z.r + 1) * (z.r + 1) + z.x * z.x;
        const gammaU = (z.r * z.r + z.x * z.x - 1) / denom;
        const gammaV = (2 * z.x) / denom;
        state.targetX = cx + gammaU * radius;
        state.targetY = cy - gammaV * radius;
        state.hasPosition = true;
      }

      // Physics lerp for position (smooth animation without React re-render)
      if (state.hasPosition) {
        const lerpFactor = reducedMotion ? 1 : 0.18;
        state.currentX += (state.targetX - state.currentX) * lerpFactor;
        state.currentY += (state.targetY - state.currentY) * lerpFactor;
      }

      // Clear with background color (faster than clearRect)
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, w, h);

      // Draw cached grid
      if (gridCacheRef.current && state.gridCacheValid) {
        ctx.drawImage(gridCacheRef.current, 0, 0, w, h);
      } else if (!state.gridCacheValid) {
        // Rebuild cache if invalid
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        updateGridCache(w, h, dpr);
        if (gridCacheRef.current) {
          ctx.drawImage(gridCacheRef.current, 0, 0, w, h);
        }
      }

      // Draw active point
      if (state.hasPosition) {
        // Calculate impedance from screen position (in-place update)
        if (!overrideImpedance) {
          const u = (state.currentX - cx) / radius;
          const v = (cy - state.currentY) / radius;
          
          if (u * u + v * v <= 1.01) {
            const denom = (1 - u) * (1 - u) + v * v;
            if (denom > 0.0001) {
              state.impedance.r = Math.max(0, (1 - u * u - v * v) / denom);
              state.impedance.x = (2 * v) / denom;
              state.hasImpedance = true;
            }
          }
        } else {
          state.impedance.r = overrideImpedance.r;
          state.impedance.x = overrideImpedance.x;
          state.hasImpedance = true;
        }

        if (state.hasImpedance) {
          drawActivePoint(
            ctx, cx, cy, radius, 
            state.impedance, 
            state.currentX,
            state.currentY,
            state.isHovering,
            state.isDragging
          );
          
          // Throttled HUD update (every 100ms max)
          if (timestamp - lastHudUpdate.current > 100) {
            lastHudUpdate.current = timestamp;
            hudStateRef.current.impedance = { ...state.impedance };
            hudStateRef.current.rfParams = calculateRFParams(state.impedance);
            hudStateRef.current.needsUpdate = true;
            setHudUpdateTrigger(t => t + 1);
          }
        }
      }

      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [reducedMotion, overrideImpedance, updateGridCache]);

  // ========================================
  // EVENT HANDLERS (Update refs directly)
  // ========================================
  
  const isNearActivePoint = useCallback((x: number, y: number): boolean => {
    const state = animationState.current;
    if (!state.hasPosition) return false;
    const dx = x - state.currentX;
    const dy = y - state.currentY;
    return dx * dx + dy * dy < 576; // 24^2
  }, []);
  
  const screenToImpedance = useCallback((x: number, y: number): Impedance | null => {
    const { cx, cy, radius } = animationState.current;
    if (radius === 0) return null;
    
    let u = (x - cx) / radius;
    let v = (cy - y) / radius;
    
    const mag = u * u + v * v;
    if (mag > 1) {
      const scale = 0.99 / Math.sqrt(mag);
      u *= scale;
      v *= scale;
    }
    
    const denom = (1 - u) * (1 - u) + v * v;
    if (denom < 0.0001) return { r: 100, x: 0 };
    
    const rawR = Math.max(0, (1 - u * u - v * v) / denom);
    const rawX = (2 * v) / denom;
    
    // Snap to key points
    for (let i = 0; i < SNAP_POINTS.length; i++) {
      const snapPoint = SNAP_POINTS[i];
      const dr = rawR - snapPoint.z.r;
      const dx = rawX - snapPoint.z.x;
      if (dr * dr + dx * dx < 0.0225) { // 0.15^2
        return { r: snapPoint.z.r, x: snapPoint.z.x };
      }
    }
    
    return { r: rawR, x: rawX };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const state = animationState.current;
    
    const wasHovering = state.isHovering;
    state.isHovering = isNearActivePoint(x, y);
    
    if (wasHovering !== state.isHovering) {
      callbacksRef.current.onHoverChange?.(true);
    }
    
    if (state.isDragging && allowDirectDrag) {
      state.targetX = x;
      state.targetY = y;
      state.hasPosition = true;
      const newZ = screenToImpedance(x, y);
      if (newZ) {
        callbacksRef.current.onDirectDrag?.(newZ);
      }
      return;
    }
    
    if (overrideImpedance) return;

    const { cx, cy, radius } = state;
    const u = (x - cx) / radius;
    const v = (cy - y) / radius;

    if (u * u + v * v <= 1.01) {
      state.targetX = x;
      state.targetY = y;
      state.hasPosition = true;
    } else {
      state.hasPosition = false;
    }
  }, [allowDirectDrag, overrideImpedance, isNearActivePoint, screenToImpedance]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!allowDirectDrag) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const state = animationState.current;
    
    if (isNearActivePoint(x, y) || !state.hasPosition) {
      state.isDragging = true;
      callbacksRef.current.onDragChange?.(true);
      
      if (!state.hasPosition) {
        state.targetX = x;
        state.targetY = y;
        state.currentX = x;
        state.currentY = y;
        state.hasPosition = true;
        const newZ = screenToImpedance(x, y);
        if (newZ) {
          callbacksRef.current.onDirectDrag?.(newZ);
        }
      }
    }
  }, [allowDirectDrag, isNearActivePoint, screenToImpedance]);
  
  const handleMouseUp = useCallback(() => {
    const state = animationState.current;
    if (state.isDragging) {
      state.isDragging = false;
      callbacksRef.current.onDragChange?.(false);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const state = animationState.current;
    state.isHovering = false;
    callbacksRef.current.onHoverChange?.(false);
    
    if (state.isDragging) {
      state.isDragging = false;
      callbacksRef.current.onDragChange?.(false);
    }
    
    if (!overrideImpedance && !state.isDragging) {
      state.hasPosition = false;
    }
  }, [overrideImpedance]);

  // Cursor style (computed from refs)
  const getCursorStyle = useCallback((): string => {
    const state = animationState.current;
    if (state.isDragging) return 'cursor-grabbing';
    if (state.isHovering && allowDirectDrag) return 'cursor-grab';
    if (allowDirectDrag) return 'cursor-crosshair';
    if (overrideImpedance) return 'cursor-default';
    return 'cursor-crosshair';
  }, [allowDirectDrag, overrideImpedance]);

  // Get HUD data from ref
  const hudData = hudStateRef.current;

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-3xl overflow-hidden">
      {/* Simplified vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
        }}
      />
      
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full smith-canvas ${getCursorStyle()}`}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Simplified HUD - only updates when hudUpdateTrigger changes */}
      {!overrideImpedance && hudData.impedance && hudData.rfParams && (
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="py-2">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: getRegionColor(hudData.rfParams.region) }}
              />
              <span className="text-[9px] uppercase tracking-[0.15em] font-semibold" style={{ color: getRegionColor(hudData.rfParams.region) }}>
                {getRegionLabel(hudData.rfParams.region, lang)}
              </span>
            </div>
            
            <div className="font-mono text-xl text-white tracking-wide mb-2 tabular-nums">
              <span style={{ color: THEME.colors.primary }}>{hudData.impedance.r.toFixed(2)}</span>
              <span className="text-white/30 mx-0.5">{hudData.impedance.x >= 0 ? '+' : '−'}</span>
              <span className="text-white/60">j{Math.abs(hudData.impedance.x).toFixed(2)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${Math.max(5, Math.min(100, (1 - hudData.rfParams.gammaMag) * 100))}%`,
                    backgroundColor: getVSWRColor(hudData.rfParams.vswr),
                  }}
                />
              </div>
              <span className="text-[9px] font-medium w-12 text-right" style={{ color: getVSWRColor(hudData.rfParams.vswr) }}>
                {getMatchQuality(hudData.rfParams.vswr, lang)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getRegionColor(region: string): string {
  switch (region) {
    case 'match': return THEME.colors.primary;
    case 'inductive': return '#FFFFFF';
    case 'capacitive': return '#FFFFFF';
    default: return THEME.colors.status.warning;
  }
}

function getRegionLabel(region: string, lang: string): string {
  const labels: Record<string, Record<string, string>> = {
    match: { en: 'MATCHED', zh: '匹配' },
    inductive: { en: 'INDUCTIVE', zh: '感性区' },
    capacitive: { en: 'CAPACITIVE', zh: '容性区' },
    short: { en: 'SHORT', zh: '短路' },
    open: { en: 'OPEN', zh: '开路' },
  };
  return labels[region]?.[lang] || region;
}

function getVSWRColor(vswr: number): string {
  if (vswr <= 2) return THEME.colors.primary;
  if (vswr <= 5) return THEME.colors.status.warning;
  return THEME.colors.status.poor;
}

function getMatchQuality(vswr: number, lang: string): string {
  if (vswr <= 1.5) return lang === 'zh' ? '优秀' : 'Excellent';
  if (vswr <= 2) return lang === 'zh' ? '良好' : 'Good';
  if (vswr <= 3) return lang === 'zh' ? '可接受' : 'OK';
  return lang === 'zh' ? '较差' : 'Poor';
}
