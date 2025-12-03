import React, {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useState,
} from "react";
import { THEME } from "../theme";
import { audio } from "../utils/audioEngine";
import { SmithChartSkeleton } from "./SmithChartSkeleton";

interface SmithChartCanvasProps {
  reducedMotion?: boolean;
  overrideImpedance?: { r: number; x: number } | null;
  showAdmittance?: boolean;
  showVSWRCircles?: boolean;
  lang?: "en" | "zh";
  onDirectDrag?: (impedance: { r: number; x: number }) => void;
  allowDirectDrag?: boolean;
  onHoverChange?: (isHovering: boolean) => void;
  onDragChange?: (isDragging: boolean) => void;
  visualMode?: "void" | "genesis" | "impedance" | "reflection" | "lab";
  showVector?: boolean;
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
  add: (a: Complex, b: Complex): Complex => ({
    re: a.re + b.re,
    im: a.im + b.im,
  }),
  sub: (a: Complex, b: Complex): Complex => ({
    re: a.re - b.re,
    im: a.im - b.im,
  }),
  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }),
  div: (a: Complex, b: Complex): Complex => {
    const denom = b.re * b.re + b.im * b.im;
    if (denom === 0) return { re: Infinity, im: Infinity };
    return {
      re: (a.re * b.re + a.im * b.im) / denom,
      im: (a.im * b.re - a.re * b.im) / denom,
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

function gammaToScreen(
  gamma: Complex,
  cx: number,
  cy: number,
  radius: number
): { x: number; y: number } {
  return {
    x: cx + gamma.re * radius,
    y: cy - gamma.im * radius,
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
  const mismatchLoss =
    gammaMag < 0.9999 ? -10 * Math.log10(1 - gammaMag * gammaMag) : Infinity;
  const powerDelivered = (1 - gammaMag * gammaMag) * 100;

  let region: "match" | "inductive" | "capacitive" | "short" | "open" = "match";
  if (gammaMag > 0.95) {
    if (gamma.re < -0.8) region = "short";
    else if (gamma.re > 0.8) region = "open";
    else if (gamma.im > 0) region = "inductive";
    else region = "capacitive";
  } else if (z.x > 0.05) {
    region = "inductive";
  } else if (z.x < -0.05) {
    region = "capacitive";
  } else if (gammaMag < 0.15) {
    region = "match";
  }

  return {
    gamma,
    gammaReal: gamma.re,
    gammaImag: gamma.im,
    gammaMag,
    gammaAngle,
    vswr,
    returnLoss,
    mismatchLoss,
    powerDelivered,
    region,
  };
}

// ========================================
// OPTIMIZED DRAWING HELPERS
// ========================================

const fontTech = "'Space Grotesk', monospace";
const GRID_WHITE_DISTANT = "rgba(255, 255, 255, 0.08)";
const GRID_WHITE_PRIME = "rgba(255, 255, 255, 0.08)";
const GRID_GOLD_ACCENT = "rgba(255, 215, 0, 0.25)";
const GRID_GOLD_FAINT = "rgba(255, 215, 0, 0.08)";
const TEXT_HIGH = "#FFFFFF";
const TEXT_MED = "rgba(255, 255, 255, 0.6)";

// Pre-computed constants
const TWO_PI = Math.PI * 2;
const R_VALUES = [0, 0.2, 0.5, 1, 2, 5];
const X_VALUES = [0.2, 0.5, 1, 2, 5];
const VSWR_VALUES = [1.5, 2, 3, 5];
const G_VALUES = [0.2, 0.5, 1, 2];

// ========================================
// GENESIS ANIMATION - Physics Migration from GenesisIntro
// ========================================

// Helper: zToGamma for Genesis animation (simpler than impedanceToGammaNew)
function zToGammaSimple(r: number, x: number): { re: number; im: number } {
  const denMagSq = (r + 1) * (r + 1) + x * x;
  if (denMagSq < 0.0001) return { re: 1, im: 0 };
  return {
    re: ((r - 1) * (r + 1) + x * x) / denMagSq,
    im: (2 * x) / denMagSq,
  };
}

// Easing function: easeOutExpo for snappy opening
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// Lerp helper
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Clamp helper
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function drawReactanceArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  xVal: number,
  isPositive: boolean,
  color?: string
) {
  const centerU = 1;
  const centerV = isPositive ? 1 / xVal : -1 / xVal;
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

// ========================================
// GENESIS ANIMATION - Animated Grid Drawing
// ========================================

// ========================================
// GENESIS ANIMATION - Geometry Baking (L3 Optimization)
// ========================================

interface CachedGenesisSegment {
  cx0: number;
  cy0: number; // Cartesian offsets (normalized)
  sx0: number;
  sy0: number; // Smith offsets (normalized)
  dir: number; // Arc direction
}

interface CachedGenesisLine {
  colorType: "r" | "x";
  isMain: boolean;
  segments: CachedGenesisSegment[];
}

// Global cache (lazy initialized)
let GENESIS_CACHE: CachedGenesisLine[] | null = null;

function getGenesisCache(): CachedGenesisLine[] {
  if (GENESIS_CACHE) return GENESIS_CACHE;

  GENESIS_CACHE = [];

  // Pre-calculate R lines
  const rSegments = 80;
  for (const rVal of R_VALUES) {
    const isUnity = rVal === 1;
    const segments: CachedGenesisSegment[] = [];

    for (let i = 0; i <= rSegments; i++) {
      const t = i / rSegments;
      const xVal = Math.tan((t - 0.5) * Math.PI * 0.98) * 5;

      // Normalized offsets (independent of screen size/radius)
      // cartScale = smithR * 0.8
      // cartX = cx - cartScale * 0.3 + r * cartScale * 0.12
      // cartX = cx + smithR * (0.8 * (r * 0.12 - 0.3))
      const cx0 = 0.8 * (rVal * 0.12 - 0.3);

      // cartY = cy - x * cartScale * 0.12
      // cartY = cy + smithR * (-x * 0.8 * 0.12)
      const cy0 = -xVal * 0.8 * 0.12;

      const gamma = zToGammaSimple(rVal, xVal);
      const sx0 = gamma.re;
      const sy0 = -gamma.im;

      const dir = xVal === 0 ? 0 : xVal > 0 ? -1 : 1;

      segments.push({ cx0, cy0, sx0, sy0, dir });
    }
    GENESIS_CACHE.push({ colorType: "r", isMain: isUnity, segments });
  }

  // Pre-calculate X lines
  const xSegments = 64;
  for (const xVal of X_VALUES) {
    const isCenter = xVal === 0; // Note: X_VALUES doesn't have 0 usually, but let's check logic
    // X_VALUES in this file: [0.2, 0.5, 1, 2, 5]. No 0.
    // But original code checked `xVal === 1` for center color?
    // Original code: `const isCenter = xVal === 1;`
    const isMain = Math.abs(xVal) === 1;
    const segments: CachedGenesisSegment[] = [];

    for (let i = 0; i <= xSegments; i++) {
      const t = i / xSegments;
      const rVal = Math.pow(t, 1.5) * 30;

      const cx0 = 0.8 * (rVal * 0.12 - 0.3);
      const cy0 = -xVal * 0.8 * 0.12;

      const gamma = zToGammaSimple(rVal, xVal);
      const sx0 = gamma.re;
      const sy0 = -gamma.im;

      const dir = xVal === 0 ? 0 : xVal > 0 ? -1 : 1;

      segments.push({ cx0, cy0, sx0, sy0, dir });
    }
    GENESIS_CACHE.push({ colorType: "x", isMain, segments });
  }

  return GENESIS_CACHE;
}

/**
 * Draw animated grid with Genesis fold effect
 * Uses Geometry Baking for zero-allocation rendering
 */
function drawAnimatedGrid(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  progress: number,
  cachedLines: CachedGenesisLine[],
  showAdmittance: boolean = false,
  showVSWRCircles: boolean = false
) {
  // Apply easeOutExpo for snappy opening
  const easedT = easeOutExpo(progress);

  // L3 Physics: Elastic Impact (The Slam)
  let smithR = radius;
  if (easedT > 0.8) {
    const impactT = (easedT - 0.8) / 0.2;
    const dampedOvershoot =
      Math.exp(-impactT * 3) * Math.sin(impactT * Math.PI * 4) * 0.05;
    smithR = radius * (1 + dampedOvershoot);
  }

  // Thermal color transition
  const hue = lerp(0, 51, easedT);
  const saturation = lerp(0, 100, easedT);
  let lightness: number;
  if (easedT < 0.5) {
    lightness = lerp(100, 85, easedT * 2);
  } else {
    lightness = lerp(85, 50, (easedT - 0.5) * 2);
  }

  // Opacity curve
  const baseOpacity = lerp(0.2, 1.0, easedT * easedT);

  // Pre-calculate physics constants for this frame
  const arcIntensity = smithR * 0.8;
  const arcPhase = Math.sin(easedT * Math.PI);
  const verticalArcFactor = arcPhase * arcIntensity;

  // Background glow
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, smithR);
  gradient.addColorStop(0, `rgba(255, 215, 0, ${0.02 * baseOpacity})`);
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, smithR, 0, TWO_PI);
  ctx.fill();

  // VSWR circles
  if (showVSWRCircles && easedT > 0.5) {
    ctx.setLineDash([4, 6]);
    const vswrAlpha = (easedT - 0.5) * 2;
    for (let i = 0; i < VSWR_VALUES.length; i++) {
      const vswr = VSWR_VALUES[i];
      const gammaMag = (vswr - 1) / (vswr + 1);
      ctx.beginPath();
      ctx.arc(cx, cy, gammaMag * smithR, 0, TWO_PI);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.06 * vswrAlpha})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Unit circle
  if (easedT > 0.2) {
    const circleT = (easedT - 0.2) / 0.8;
    const circleAlpha = Math.min(1, circleT * 1.2);
    ctx.beginPath();
    ctx.arc(cx, cy, smithR, 0, TWO_PI);
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${
      0.3 * circleAlpha * baseOpacity
    })`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Render Cached Lines (Zero Allocation Loop)
  for (const line of cachedLines) {
    const isMain = line.isMain;
    const lineOpacity = baseOpacity * (isMain ? 1.0 : 0.4);

    // Set style once per line
    ctx.strokeStyle = isMain
      ? `hsla(${hue}, ${saturation}%, ${lightness}%, ${lineOpacity})`
      : `hsla(${hue}, ${saturation}%, ${lightness}%, ${lineOpacity * 0.4})`;
    ctx.lineWidth = isMain ? 1 : 0.5;

    ctx.beginPath();
    let first = true;

    // Optimized segment loop
    for (const seg of line.segments) {
      // px = cx + lerp(cx0, sx0, t) * smithR
      const px = cx + (seg.cx0 + (seg.sx0 - seg.cx0) * easedT) * smithR;

      // py = cy + lerp(cy0, sy0, t) * smithR + verticalArc
      const verticalArc = verticalArcFactor * seg.dir;
      const py =
        cy + (seg.cy0 + (seg.sy0 - seg.cy0) * easedT) * smithR + verticalArc;

      // Viewport clipping (simple bounding box check)
      // Assuming canvas size is roughly 2*cx, 2*cy
      if (px > -50 && px < cx * 2 + 50 && py > -50 && py < cy * 2 + 50) {
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      } else {
        first = true; // Lift pen if out of bounds
      }
    }
    ctx.stroke();

    // Mirror for X lines (negative reactance)
    if (line.colorType === "x") {
      ctx.beginPath();
      first = true;
      for (const seg of line.segments) {
        // Mirror Y for negative reactance
        // px is same
        const px = cx + (seg.cx0 + (seg.sx0 - seg.cx0) * easedT) * smithR;

        const verticalArc = verticalArcFactor * seg.dir;
        const dy =
          (seg.cy0 + (seg.sy0 - seg.cy0) * easedT) * smithR + verticalArc;
        const py = cy - dy;

        if (px > -50 && px < cx * 2 + 50 && py > -50 && py < cy * 2 + 50) {
          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }
  }

  // Real axis (horizontal line)
  if (easedT > 0.3) {
    const axisT = (easedT - 0.3) / 0.7;
    const axisAlpha = Math.min(1, axisT * 1.5);
    ctx.beginPath();
    const startX = lerp(cx - smithR * 0.8, cx - smithR, easedT);
    const endX = lerp(cx + smithR * 0.8, cx + smithR, easedT);
    ctx.moveTo(startX, cy);
    ctx.lineTo(endX, cy);
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${
      0.25 * axisAlpha * baseOpacity
    })`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Optimized: Cache static grid to offscreen canvas
function drawSmithChartGrid(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  showAdmittance: boolean = false,
  showVSWRCircles: boolean = false
) {
  ctx.lineWidth = 0.5;

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
      drawReactanceArc(
        ctx,
        cx,
        cy,
        r,
        bVal,
        false,
        "rgba(100, 200, 150, 0.12)"
      );
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

  ctx.fillStyle = "#FFD700";
  ctx.fillText("MATCH", cx, cy - 18);

  ctx.fillStyle = TEXT_HIGH;
  ctx.fillText("+jX", cx, cy - r - 14);
  ctx.fillText("−jX", cx, cy + r + 14);

  // Match point marker (simplified - no shadowBlur)
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, TWO_PI);
  ctx.fillStyle = "#FFD700";
  ctx.fill();
}

// ========================================
// RAUNO-TIER ACTIVE POINT RENDERER
// "Light is not painted. Light is scattered."
// ========================================
function drawActivePoint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  impedance: Impedance,
  posX: number,
  posY: number,
  isHovering: boolean,
  isDragging: boolean,
  isSnapped: boolean = false
) {
  const gamma = impedanceToGamma(impedance);
  const gammaMag = Math.sqrt(gamma.re * gamma.re + gamma.im * gamma.im);

  // Calculate intensity based on match quality
  const vswr = gammaMag < 0.999 ? (1 + gammaMag) / (1 - gammaMag) : 10;
  const matchQuality = Math.max(0, 1 - gammaMag); // 1 = perfect match, 0 = total mismatch
  // L3 Interaction Bloom: When dragging, significantly increase intensity (2.5x) to compensate for hidden cursor
  // 拖拽时亮度提升 2.5 倍，吸附时提升 1.5 倍
  const intensity = isDragging ? 2.5 : isSnapped ? 1.5 : 1.0;

  // ========================================
  // LAYER 0: Ambient Light Scatter
  // The point illuminates nearby grid lines
  // ========================================
  // L3 Interaction Bloom: Wider scatter radius when dragging (plasma effect)
  const scatterRadius = 120 + (isDragging ? 60 : 0);
  const scatterGradient = ctx.createRadialGradient(
    posX,
    posY,
    0,
    posX,
    posY,
    scatterRadius
  );
  scatterGradient.addColorStop(0, `rgba(255, 215, 0, ${0.06 * intensity})`);
  scatterGradient.addColorStop(0.5, `rgba(255, 200, 50, ${0.02 * intensity})`);
  scatterGradient.addColorStop(1, "rgba(255, 215, 0, 0)");
  ctx.fillStyle = scatterGradient;
  ctx.beginPath();
  ctx.arc(posX, posY, scatterRadius, 0, TWO_PI);
  ctx.fill();

  // ========================================
  // LAYER 1: Gamma Vector (Living Light)
  // Three-layer rendering: Bloom → Glow → Core
  // Only show when dragging or hovering (not always visible)
  // ========================================
  if (isDragging || isHovering || isSnapped) {
    drawLivingLight(ctx, cx, cy, posX, posY, intensity * 0.8);
  }

  // ========================================
  // LAYER 2: VSWR Circle (Pulsing if matched)
  // ========================================
  // ========================================
  // LAYER 2: VSWR Circle (Pulsing if matched)
  // ========================================
  // L3 Fix: Smooth opacity transition to prevent flickering near zero
  if (gammaMag < 0.99) {
    const vswrRadius = gammaMag * radius;
    // Fade in smoothly between gamma 0.01 and 0.05
    const fadeOpacity = Math.max(0, Math.min(1, (gammaMag - 0.01) / 0.04));

    if (fadeOpacity > 0) {
      // Outer bloom
      ctx.beginPath();
      ctx.arc(cx, cy, vswrRadius, 0, TWO_PI);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.08 * intensity * fadeOpacity})`;
      ctx.lineWidth = 6;
      ctx.setLineDash([]);
      ctx.stroke();

      // Core line
      ctx.beginPath();
      ctx.arc(cx, cy, vswrRadius, 0, TWO_PI);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.25 * intensity * fadeOpacity})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ========================================
  // LAYER 3: The Point (Living Ember)
  // ========================================
  const baseSize = isDragging ? 10 : isHovering ? 8 : 6;
  const pulseScale = isSnapped ? 1.3 : 1.0;

  // L3.1: Outer bloom (scattered light)
  // L3 Interaction Bloom: Wider bloom radius when dragging (plasma effect)
  const bloomMultiplier = isDragging ? 4.5 : 3;
  ctx.beginPath();
  ctx.arc(posX, posY, baseSize * bloomMultiplier * pulseScale, 0, TWO_PI);
  const bloomGradient = ctx.createRadialGradient(
    posX,
    posY,
    0,
    posX,
    posY,
    baseSize * bloomMultiplier * pulseScale
  );
  bloomGradient.addColorStop(0, `rgba(255, 215, 0, ${0.3 * intensity})`);
  bloomGradient.addColorStop(0.5, `rgba(255, 200, 50, ${0.1 * intensity})`);
  bloomGradient.addColorStop(1, "rgba(255, 215, 0, 0)");
  ctx.fillStyle = bloomGradient;
  ctx.fill();

  // L3.2: Mid glow (warm aura)
  ctx.beginPath();
  ctx.arc(posX, posY, baseSize * 1.5 * pulseScale, 0, TWO_PI);
  ctx.fillStyle = `rgba(255, 200, 50, ${0.5 * intensity})`;
  ctx.fill();

  // L3.3: Core (hot white center)
  // L3 Interaction Bloom: Pure white core when dragging (plasma hot)
  ctx.beginPath();
  ctx.arc(posX, posY, baseSize * pulseScale, 0, TWO_PI);
  const coreGradient = ctx.createRadialGradient(
    posX - baseSize * 0.2,
    posY - baseSize * 0.2,
    0,
    posX,
    posY,
    baseSize * pulseScale
  );
  if (isDragging) {
    // Pure white hot core when dragging
    coreGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    coreGradient.addColorStop(0.3, "rgba(255, 255, 255, 0.98)");
    coreGradient.addColorStop(0.6, "rgba(255, 240, 200, 0.9)");
    coreGradient.addColorStop(1, `rgba(255, 200, 50, ${0.8 * intensity})`);
  } else {
    coreGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    coreGradient.addColorStop(0.4, "rgba(255, 240, 200, 0.95)");
    coreGradient.addColorStop(1, `rgba(255, 200, 50, ${0.8 * intensity})`);
  }
  ctx.fillStyle = coreGradient;
  ctx.fill();

  // L3.4: Specular highlight (glass lens effect)
  ctx.beginPath();
  ctx.arc(
    posX - baseSize * 0.3,
    posY - baseSize * 0.3,
    baseSize * 0.3,
    0,
    TWO_PI
  );
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fill();

  // ========================================
  // LAYER 4: Snap Ring (when magnetically locked)
  // ========================================
  if (isSnapped) {
    ctx.beginPath();
    ctx.arc(posX, posY, baseSize * 2.5, 0, TWO_PI);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner pulse ring
    ctx.beginPath();
    ctx.arc(posX, posY, baseSize * 2, 0, TWO_PI);
    ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ========================================
  // LAYER 5: Data Label (Chromatic Aberration)
  // ========================================
  const labelX = posX + 24;
  const labelY = posY - 24;
  const w = ctx.canvas.width / (window.devicePixelRatio || 1);

  if (labelX < w - 100 && labelY > 30) {
    // Impedance value with chromatic aberration
    const zText = `z = ${impedance.r.toFixed(2)}${
      impedance.x >= 0 ? "+" : ""
    }j${impedance.x.toFixed(2)}`;
    drawChromaticText(
      ctx,
      zText,
      labelX,
      labelY,
      `rgba(255, 215, 0, ${0.9 * intensity})`,
      "bold 11px 'Space Grotesk', monospace"
    );

    // Gamma magnitude
    ctx.font = "9px 'Space Grotesk', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText(`|Γ| = ${gammaMag.toFixed(3)}`, labelX, labelY + 14);

    // VSWR (if not perfect match)
    if (vswr < 50) {
      ctx.fillStyle =
        vswr < 1.5 ? "rgba(100, 255, 150, 0.6)" : "rgba(255, 255, 255, 0.4)";
      ctx.fillText(`VSWR = ${vswr.toFixed(2)}`, labelX, labelY + 26);
    }
  }
}

// ========================================
// RAUNO-TIER PHYSICS ENGINE
// "Pixels are not colors. They are mathematics."
// ========================================

// Magnetic Snap - The Event Horizon
const MAGNETIC_SNAP_THRESHOLD = 0.08;
const MAGNETIC_SNAP_FORCE = 0.25;

// True Spring Physics (F = -kx - cv)
// These are tuned for "mechanical precision" feel
const SPRING_STIFFNESS = 0.12; // k: Spring constant (higher = snappier)
const SPRING_DAMPING = 0.75; // c: Damping ratio (0.7-0.9 = critically damped)
const SPRING_MASS = 1.0; // m: Mass (affects momentum)

// Input Prediction - Kalman-lite
const PREDICTION_FACTOR = 0.15; // How far ahead to predict (0 = none, 0.3 = aggressive)
const VELOCITY_SMOOTHING = 0.3; // Smooth velocity estimation

// Chromatic Aberration
const CHROMATIC_OFFSET = 0.5; // RGB split in pixels (subtle)
const CHROMATIC_OPACITY = 0.15; // Opacity of color fringe

// ========================================
// SNAP POINTS (Pre-allocated)
// ========================================
const SNAP_POINTS: ReadonlyArray<{ z: Impedance; label: string }> = [
  { z: { r: 1, x: 0 }, label: "Match" },
  { z: { r: 0, x: 0 }, label: "Short" },
  { z: { r: 5, x: 0 }, label: "Open" },
  { z: { r: 1, x: 1 }, label: "+jX" },
  { z: { r: 1, x: -1 }, label: "-jX" },
];

// ========================================
// LIVING LIGHT RENDERER
// Three-layer rendering: Bloom → Glow → Hot Core
// ========================================
function drawLivingLight(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  intensity: number = 1.0
) {
  // RAUNO-TIER: Additive Blending for Light
  // Light is additive, not paint. Use 'lighter' mode for Bloom and Glow layers.

  // Save current composite operation
  const originalComposite = ctx.globalCompositeOperation;

  // Layer 1: Bloom (wide, faint, scattered light) - ADDITIVE
  ctx.globalCompositeOperation = "lighter"; // Additive blending
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgba(255, 215, 0, ${0.08 * intensity})`;
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.stroke();

  // Layer 2: Glow (medium, visible aura) - ADDITIVE
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgba(255, 200, 50, ${0.25 * intensity})`;
  ctx.lineWidth = 8;
  ctx.stroke();

  // Layer 3: Hot Core (thin, bright white - true high temperature) - SOLID
  // Core must be solid, not additive
  ctx.globalCompositeOperation = "source-over"; // Restore normal blending for core
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * intensity})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Restore original composite operation
  ctx.globalCompositeOperation = originalComposite;
}

// Chromatic aberration for text/edges
function drawChromaticText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  baseColor: string,
  font: string
) {
  ctx.font = font;
  ctx.textAlign = "left";

  // Red channel (offset left)
  ctx.fillStyle = `rgba(255, 100, 100, ${CHROMATIC_OPACITY})`;
  ctx.fillText(text, x - CHROMATIC_OFFSET, y);

  // Cyan channel (offset right)
  ctx.fillStyle = `rgba(100, 255, 255, ${CHROMATIC_OPACITY})`;
  ctx.fillText(text, x + CHROMATIC_OFFSET, y);

  ctx.fillStyle = baseColor;
  ctx.fillText(text, x, y);
}

// ========================================
// DYNAMIC COORDINATE SYSTEM
// Draws the specific R-circle and X-arc for the current point
// ========================================
function drawDynamicCoordinates(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  r: number,
  x: number
) {
  // 1. Constant Resistance Circle
  // Center: (r/(r+1), 0) in Gamma plane
  const rCenterU = r / (r + 1);
  const rRadius = 1 / (r + 1);
  const screenRCenterX = cx + rCenterU * radius;
  const screenRRadius = rRadius * radius;

  ctx.beginPath();
  ctx.arc(screenRCenterX, cy, screenRRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255, 215, 0, 0.8)"; // Gold (High Visibility)
  ctx.lineWidth = 1.5;
  ctx.setLineDash([2, 4]);
  ctx.stroke();

  // 2. Constant Reactance Arc
  // Center: (1, 1/x) in Gamma plane
  if (Math.abs(x) > 0.01) {
    const xCenterU = 1;
    const xCenterV = 1 / x;
    const xRadius = 1 / Math.abs(x);
    const screenXCenterX = cx + xCenterU * radius;
    const screenXCenterY = cy - xCenterV * radius; // Note: y is inverted in screen coords
    const screenXRadius = xRadius * radius;

    ctx.save();
    // Clip to Smith Chart boundary
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.clip();

    ctx.beginPath();
    ctx.arc(screenXCenterX, screenXCenterY, screenXRadius, 0, 2 * Math.PI);
    ctx.strokeStyle =
      x > 0 ? "rgba(255, 77, 77, 0.8)" : "rgba(77, 148, 255, 0.8)"; // Red/Blue (High Visibility)
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 4]);
    ctx.stroke();

    ctx.restore();
  } else {
    // Pure Resistance (Real Axis)
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

// ========================================
// MAIN COMPONENT - REF-BASED ANIMATION LOOP
// ========================================

export const SmithChartCanvas: React.FC<SmithChartCanvasProps> = ({
  reducedMotion,
  overrideImpedance,
  showAdmittance,
  showVSWRCircles = false,
  lang = "zh",
  onDirectDrag,
  allowDirectDrag = false,
  onHoverChange,
  onDragChange,
  visualMode = "lab",
  showVector = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridCacheRef = useRef<HTMLCanvasElement | null>(null);

  // Derived flags for visual elements
  const shouldShowPoint = useMemo(() => {
    return ["impedance", "reflection", "lab"].includes(visualMode);
  }, [visualMode]);

  const shouldDrawVector = useMemo(() => {
    return ["reflection", "lab"].includes(visualMode) || showVector;
  }, [visualMode, showVector]);

  // L3 UX: Mobile Safety Lock - Prevent gesture conflicts
  const [isMobile, setIsMobile] = useState(false);
  const [isInteractionEnabled, setIsInteractionEnabled] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [circleSize, setCircleSize] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ========================================
  // ALL MUTABLE STATE IN REFS (NO useState for animation)
  // Rauno-tier: True physics simulation state
  // ========================================
  const animationState = useRef({
    // Position state
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    hasPosition: false,

    // TRUE SPRING PHYSICS STATE
    // F = -k(x - target) - c*v
    velocityX: 0,
    velocityY: 0,

    // INPUT PREDICTION STATE
    // Kalman-lite: track mouse velocity for prediction
    prevMouseX: 0,
    prevMouseY: 0,
    mouseVelocityX: 0,
    mouseVelocityY: 0,
    predictedX: 0,
    predictedY: 0,

    // MAGNETIC SNAP STATE
    isSnapped: false,
    snapLockTime: 0,

    // Interaction state
    isDragging: false,
    isHovering: false,

    // L3 Genesis Animation: Opening sequence progress (0 to 1)
    openingProgress: 0,
    openingStartTime: 0,

    // Computed impedance (updated in draw loop)
    impedance: { r: 1, x: 0 } as Impedance,
    hasImpedance: false,

    // Canvas dimensions
    cx: 0,
    cy: 0,
    radius: 0,
    width: 0,
    height: 0,
    rotation: 0,
    vectorX: 0,
    vectorY: 0,
    vectorReady: false,

    // Frame timing (Delta Time for frame independence)
    lastFrameTime: 0,
    deltaTime: 16.67, // ms, default to 60fps

    // Grid cache validity
    gridCacheValid: false,
  });

  // HUD Refs for direct DOM updates (No React Re-renders)
  const hudContainerRef = useRef<HTMLDivElement>(null);
  const hudRegionRef = useRef<HTMLSpanElement>(null);
  const hudRegionDotRef = useRef<HTMLDivElement>(null);
  const hudRRef = useRef<HTMLSpanElement>(null);
  const hudXRef = useRef<HTMLSpanElement>(null);
  const hudXSignRef = useRef<HTMLSpanElement>(null);
  const hudVSWRBarRef = useRef<HTMLDivElement>(null);
  const hudVSWRTextRef = useRef<HTMLSpanElement>(null);

  const lastHudUpdate = useRef(0);

  // Callbacks stored in refs to avoid recreation
  const callbacksRef = useRef({
    onDirectDrag,
    onHoverChange,
    onDragChange,
  });
  callbacksRef.current = { onDirectDrag, onHoverChange, onDragChange };

  // Create cached grid canvas
  const updateGridCache = useCallback(
    (width: number, height: number, dpr: number) => {
      if (!gridCacheRef.current) {
        gridCacheRef.current = document.createElement("canvas");
      }

      const cache = gridCacheRef.current;
      cache.width = width * dpr;
      cache.height = height * dpr;

      const ctx = cache.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.4;

      drawSmithChartGrid(
        ctx,
        centerX,
        centerY,
        radius,
        showAdmittance,
        showVSWRCircles
      );

      animationState.current.gridCacheValid = true;
    },
    [showAdmittance, showVSWRCircles]
  );

  // Invalidate grid cache when options change
  useEffect(() => {
    animationState.current.gridCacheValid = false;
  }, [showAdmittance, showVSWRCircles]);

  // L3 Genesis Animation: Reset opening sequence on mount or when reducedMotion changes
  useEffect(() => {
    if (!reducedMotion) {
      // Reset opening animation
      animationState.current.openingProgress = 0;
      animationState.current.openingStartTime = 0;
    } else {
      // Skip animation if reduced motion
      animationState.current.openingProgress = 1;
    }
  }, [reducedMotion]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
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

        // Update circle size for interaction overlay
        setCircleSize(state.radius * 2);

        // Update grid cache
        updateGridCache(width, height, dpr);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    // Pure draw function - reads from refs only
    // RAUNO-TIER: Frame-independent physics with true spring dynamics
    const draw = (timestamp: number) => {
      // ========================================
      // DELTA TIME CALCULATION (Frame Independence)
      // ========================================
      const rawDelta = timestamp - state.lastFrameTime;
      // Clamp delta to prevent physics explosion on tab switch
      const deltaMs = Math.min(rawDelta, 50); // Cap at 50ms (20fps minimum)
      const dt = deltaMs / 16.67; // Normalize to 60fps baseline
      state.deltaTime = deltaMs;
      state.lastFrameTime = timestamp;

      const { cx, cy, radius, width: w, height: h } = state;
      if (w === 0 || h === 0) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      // Gentle background rotation for perpetual motion
      if (!reducedMotion) {
        state.rotation += 0.005 * dt;
      }

      // ========================================
      // TARGET POSITION UPDATE
      // ========================================
      if (overrideImpedance) {
        const z = overrideImpedance;
        const denom = (z.r + 1) * (z.r + 1) + z.x * z.x;
        const gammaU = (z.r * z.r + z.x * z.x - 1) / denom;
        const gammaV = (2 * z.x) / denom;
        const targetX = cx + gammaU * radius;
        const targetY = cy - gammaV * radius;

        // If direct drag is enabled, treat override as an initial seed only.
        if (!allowDirectDrag) {
          state.targetX = targetX;
          state.targetY = targetY;
          state.hasPosition = true;
          state.currentX = state.targetX;
          state.currentY = state.targetY;
          state.velocityX = 0;
          state.velocityY = 0;
          state.vectorReady = false;
        } else if (!state.hasPosition && !state.isDragging) {
          state.targetX = targetX;
          state.targetY = targetY;
          state.currentX = targetX;
          state.currentY = targetY;
          state.hasPosition = true;
          state.vectorReady = false;
        }
      }

      // ========================================
      // MAGNETIC SNAP DETECTION
      // The Event Horizon: 50Ω has gravity
      // ========================================
      if (state.hasPosition && state.hasImpedance) {
        const distR = Math.abs(state.impedance.r - 1);
        const distX = Math.abs(state.impedance.x);
        const distToMatch = Math.sqrt(distR * distR + distX * distX);

        if (distToMatch < MAGNETIC_SNAP_THRESHOLD && !state.isSnapped) {
          // SNAP! Apply magnetic force
          state.isSnapped = true;
          state.snapLockTime = timestamp;

          // Force target to perfect match
          const matchGamma = impedanceToGammaNew({ r: 1, x: 0 });
          state.targetX = cx + matchGamma.re * radius;
          state.targetY = cy - matchGamma.im * radius;

          // Trigger haptic audio feedback
          audio.playSnap();

          // Add velocity boost toward center (magnetic pull)
          const pullX = state.targetX - state.currentX;
          const pullY = state.targetY - state.currentY;
          state.velocityX += pullX * MAGNETIC_SNAP_FORCE;
          state.velocityY += pullY * MAGNETIC_SNAP_FORCE;
        } else if (distToMatch > MAGNETIC_SNAP_THRESHOLD * 1.5) {
          state.isSnapped = false;
        }
      }

      // ========================================
      // TRUE SPRING PHYSICS (F = -kx - cv)
      // Frame-independent with dt multiplier
      // ========================================
      if (state.hasPosition) {
        if (reducedMotion) {
          // Instant positioning for reduced motion
          state.currentX = state.targetX;
          state.currentY = state.targetY;
          state.velocityX = 0;
          state.velocityY = 0;
        } else {
          // Calculate spring force
          const dx = state.targetX - state.currentX;
          const dy = state.targetY - state.currentY;

          // Direct follow - no spring physics (removed for performance)
          // Simply set current position to target position
          state.currentX = state.targetX;
          state.currentY = state.targetY;
          state.velocityX = 0;
          state.velocityY = 0;
        }
      }

      // Clear with background color (faster than clearRect)
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, w, h);

      // ========================================
      // L3 Genesis Animation: Opening Sequence
      // ========================================
      // Update opening progress (1.2 seconds animation)
      if (state.openingProgress < 1) {
        if (state.openingStartTime === 0) {
          state.openingStartTime = timestamp;
        }
        const elapsed = timestamp - state.openingStartTime;
        const duration = 1200; // 1.2 seconds
        state.openingProgress = Math.min(1, elapsed / duration);
      }

      // Draw grid: animated during opening, cached after
      if (state.openingProgress < 1 && !reducedMotion) {
        // Use animated grid during opening sequence
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(state.rotation);
        ctx.translate(-cx, -cy);
        const cachedLines = getGenesisCache();
        drawAnimatedGrid(
          ctx,
          state.cx,
          state.cy,
          state.radius,
          state.openingProgress,
          cachedLines,
          showAdmittance,
          showVSWRCircles
        );
        ctx.restore();
      } else {
        // Use cached static grid for performance
        if (gridCacheRef.current && state.gridCacheValid) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(state.rotation);
          ctx.translate(-cx, -cy);
          ctx.drawImage(gridCacheRef.current, 0, 0, w, h);
          ctx.restore();
        } else if (!state.gridCacheValid) {
          // Rebuild cache if invalid
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          updateGridCache(w, h, dpr);
          if (gridCacheRef.current) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(state.rotation);
            ctx.translate(-cx, -cy);
            ctx.drawImage(gridCacheRef.current, 0, 0, w, h);
            ctx.restore();
          }
        }
      }

      // ========================================
      // UPDATE CANVAS DATA ATTRIBUTES (for CustomCursor)
      // ========================================
      if (canvas && state.hasImpedance) {
        canvas.dataset.cursorR = state.impedance.r.toFixed(2);
        canvas.dataset.cursorX = state.impedance.x.toFixed(2);
        canvas.dataset.cursorNear = state.isHovering ? "true" : "false";
        canvas.dataset.cursorDragging = state.isDragging ? "true" : "false";
      }

      // ========================================
      // RAUNO-TIER: Interactive Ambient Light
      // The cursor illuminates nearby grid lines
      // ========================================
      if (state.hasPosition && state.hasImpedance) {
        const originalComposite = ctx.globalCompositeOperation;

        // Use 'overlay' mode to brighten the cached grid underneath
        ctx.globalCompositeOperation = "overlay";

        // Create radial gradient "flashlight" effect
        const flashlightRadius = 200;
        const flashlight = ctx.createRadialGradient(
          state.currentX,
          state.currentY,
          0,
          state.currentX,
          state.currentY,
          flashlightRadius
        );

        // Center: bright white (illuminates grid)
        flashlight.addColorStop(0, "rgba(255, 255, 255, 0.12)");
        // Mid: warm gold tint
        flashlight.addColorStop(0.4, "rgba(255, 215, 0, 0.06)");
        // Edge: fade to transparent
        flashlight.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = flashlight;
        ctx.fillRect(0, 0, w, h);

        // Restore composite operation
        ctx.globalCompositeOperation = originalComposite;
      }

      // Draw active point
      if (state.hasPosition) {
        // Calculate impedance from screen position (in-place update)
        // If direct drag is allowed, the physics/screen position is the Source of Truth.
        // Override is only used for initial seeding (handled in Target Position Update).
        const shouldUsePhysics = !overrideImpedance || allowDirectDrag;

        if (shouldUsePhysics) {
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
        } else if (overrideImpedance) {
          state.impedance.r = overrideImpedance.r;
          state.impedance.x = overrideImpedance.x;
          state.hasImpedance = true;
        }

        if (state.hasImpedance) {
          // Draw dynamic coordinate lines (R-circle and X-arc)
          if (shouldShowPoint) {
            drawDynamicCoordinates(
              ctx,
              cx,
              cy,
              radius,
              state.impedance.r,
              state.impedance.x
            );
          }

          if (shouldDrawVector) {
            if (!state.vectorReady) {
              state.vectorX = state.currentX;
              state.vectorY = state.currentY;
              state.vectorReady = true;
            } else {
              const ease = Math.min(1, 0.12 * dt);
              state.vectorX += (state.currentX - state.vectorX) * ease;
              state.vectorY += (state.currentY - state.vectorY) * ease;
            }

            const originalComposite = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = "lighter";
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(state.vectorX, state.vectorY);
            ctx.strokeStyle = "rgba(255, 50, 50, 0.8)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.globalCompositeOperation = originalComposite;
          }

          if (shouldShowPoint) {
            drawActivePoint(
              ctx,
              cx,
              cy,
              radius,
              state.impedance,
              state.currentX,
              state.currentY,
              state.isHovering,
              state.isDragging || !!overrideImpedance, // Show lines when dragging OR using sliders
              state.isSnapped
            );
          }

          // Throttled HUD update (Direct DOM Manipulation)
          if (timestamp - lastHudUpdate.current > 60) {
            lastHudUpdate.current = timestamp;
            const rf = calculateRFParams(state.impedance);

            if (hudContainerRef.current) {
              hudContainerRef.current.style.opacity = "1";

              // Update Region
              if (hudRegionRef.current)
                hudRegionRef.current.textContent = getRegionLabel(
                  rf.region,
                  lang
                );
              if (hudRegionDotRef.current)
                hudRegionDotRef.current.style.backgroundColor = getRegionColor(
                  rf.region
                );
              if (hudRegionRef.current)
                hudRegionRef.current.style.color = getRegionColor(rf.region);

              // Update Impedance
              if (hudRRef.current) {
                hudRRef.current.textContent = state.impedance.r.toFixed(2);
                hudRRef.current.style.color = THEME.colors.primary;
              }
              if (hudXSignRef.current)
                hudXSignRef.current.textContent =
                  state.impedance.x >= 0 ? "+" : "−";
              if (hudXRef.current)
                hudXRef.current.textContent = `j${Math.abs(
                  state.impedance.x
                ).toFixed(2)}`;

              // Update VSWR
              if (hudVSWRBarRef.current) {
                const width = Math.max(
                  5,
                  Math.min(100, (1 - rf.gammaMag) * 100)
                );
                hudVSWRBarRef.current.style.width = `${width}%`;
                hudVSWRBarRef.current.style.backgroundColor = getVSWRColor(
                  rf.vswr
                );
              }
              if (hudVSWRTextRef.current) {
                hudVSWRTextRef.current.textContent = getMatchQuality(
                  rf.vswr,
                  lang
                );
                hudVSWRTextRef.current.style.color = getVSWRColor(rf.vswr);
              }
            }
          }
        }
      }

      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
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

  const screenToImpedance = useCallback(
    (x: number, y: number): Impedance | null => {
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
        if (dr * dr + dx * dx < 0.0225) {
          // 0.15^2
          return { r: snapPoint.z.r, x: snapPoint.z.x };
        }
      }

      return { r: rawR, x: rawX };
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const state = animationState.current;

      // ========================================
      // INPUT PREDICTION (Kalman-lite)
      // Don't render where the mouse IS. Render where it WILL BE.
      // ========================================
      const newVelX = rawX - state.prevMouseX;
      const newVelY = rawY - state.prevMouseY;

      // Smooth velocity estimation (exponential moving average)
      state.mouseVelocityX =
        state.mouseVelocityX * (1 - VELOCITY_SMOOTHING) +
        newVelX * VELOCITY_SMOOTHING;
      state.mouseVelocityY =
        state.mouseVelocityY * (1 - VELOCITY_SMOOTHING) +
        newVelY * VELOCITY_SMOOTHING;

      // Predict future position
      const predictedX = rawX + state.mouseVelocityX * PREDICTION_FACTOR;
      const predictedY = rawY + state.mouseVelocityY * PREDICTION_FACTOR;

      // Store for next frame
      state.prevMouseX = rawX;
      state.prevMouseY = rawY;
      state.predictedX = predictedX;
      state.predictedY = predictedY;

      // Use predicted position for interaction
      const x = predictedX;
      const y = predictedY;

      const wasHovering = state.isHovering;
      state.isHovering = isNearActivePoint(rawX, rawY); // Use raw for hover detection

      if (wasHovering !== state.isHovering) {
        callbacksRef.current.onHoverChange?.(true);
      }

      if (state.isDragging && allowDirectDrag) {
        // When dragging, use predicted position for "mind control" feel
        state.targetX = x;
        state.targetY = y;
        state.hasPosition = true;
        const newZ = screenToImpedance(x, y);
        if (newZ) {
          callbacksRef.current.onDirectDrag?.(newZ);
          // [L3 Synesthesia] Update sound texture based on impedance
          audio.updateSonification(newZ.r, newZ.x);
        }
        return;
      }

      if (overrideImpedance && !allowDirectDrag) return;

      const { cx, cy, radius } = state;
      const u = (x - cx) / radius;
      const v = (cy - y) / radius;

      if (u * u + v * v <= 1.01) {
        state.targetX = x;
        state.targetY = y;
        state.hasPosition = true;

        // Update impedance display even when not dragging (hover mode)
        if (allowDirectDrag) {
          const newZ = screenToImpedance(x, y);
          if (newZ) {
            callbacksRef.current.onDirectDrag?.(newZ);
          }
        }
      } else {
        state.hasPosition = false;
      }
    },
    [allowDirectDrag, overrideImpedance, isNearActivePoint, screenToImpedance]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!allowDirectDrag) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const state = animationState.current;

      // Check if click is within the Smith chart circle
      const { cx, cy, radius } = state;
      const dx = x - cx;
      const dy = y - cy;
      const isInsideCircle = dx * dx + dy * dy <= radius * radius * 1.1;

      if (isInsideCircle) {
        state.isDragging = true;
        callbacksRef.current.onDragChange?.(true);

        // Move point to click position
        state.targetX = x;
        state.targetY = y;
        state.currentX = x;
        state.currentY = y;
        state.hasPosition = true;
        const newZ = screenToImpedance(x, y);
        if (newZ) {
          callbacksRef.current.onDirectDrag?.(newZ);
          // [L3 Synesthesia] Start sonification immediately on drag start
          audio.startSonification();
          audio.updateSonification(newZ.r, newZ.x);
        }
      }
    },
    [allowDirectDrag, screenToImpedance]
  );

  const handleMouseUp = useCallback(() => {
    const state = animationState.current;
    if (state.isDragging) {
      state.isDragging = false;
      callbacksRef.current.onDragChange?.(false);
      // [L3 Synesthesia] Stop sound
      audio.stopSonification();
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const state = animationState.current;
    state.isHovering = false;
    callbacksRef.current.onHoverChange?.(false);

    if (state.isDragging) {
      state.isDragging = false;
      callbacksRef.current.onDragChange?.(false);
      // [L3 Synesthesia] Stop sound
      audio.stopSonification();
    }

    if (!overrideImpedance && !state.isDragging) {
      state.hasPosition = false;
    }
  }, [overrideImpedance]);

  // Cursor style (computed from refs)
  const getCursorStyle = useCallback((): string => {
    const state = animationState.current;
    if (state.isDragging) return "cursor-grabbing";
    if (state.isHovering && allowDirectDrag) return "cursor-grab";
    if (allowDirectDrag) return "cursor-crosshair";
    if (overrideImpedance) return "cursor-default";
    return "cursor-crosshair";
  }, [allowDirectDrag, overrideImpedance]);

  // L3 UX: Mobile detection and safety lock
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      setIsMobile(isTouchDevice);
      if (!isTouchDevice) {
        setIsInteractionEnabled(true); // Desktop: always enabled
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Touch event handlers (mobile safety lock)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobile || !allowDirectDrag || !isInteractionEnabled) {
        // If interaction not enabled, allow scroll to pass through
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      touchStartRef.current = { x, y, time: Date.now() };

      const state = animationState.current;

      // Check if touch is within the Smith chart circle
      const { cx, cy, radius } = state;
      const dx = x - cx;
      const dy = y - cy;
      const isInsideCircle = dx * dx + dy * dy <= radius * radius * 1.1;

      if (isInsideCircle) {
        e.preventDefault(); // Prevent scroll when dragging
        state.isDragging = true;
        callbacksRef.current.onDragChange?.(true);

        // Move point to touch position
        state.targetX = x;
        state.targetY = y;
        state.currentX = x;
        state.currentY = y;
        state.hasPosition = true;
        const newZ = screenToImpedance(x, y);
        if (newZ) {
          callbacksRef.current.onDirectDrag?.(newZ);
          // [L3 Synesthesia] Start sonification
          audio.startSonification();
          audio.updateSonification(newZ.r, newZ.x);
        }
      }
    },
    [isMobile, allowDirectDrag, isInteractionEnabled, screenToImpedance]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobile || !allowDirectDrag || !isInteractionEnabled) return;

      const state = animationState.current;
      if (!state.isDragging) return;

      e.preventDefault(); // Prevent scroll when dragging

      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      state.targetX = x;
      state.targetY = y;
      const newZ = screenToImpedance(x, y);
      if (newZ) {
        callbacksRef.current.onDirectDrag?.(newZ);
        // [L3 Synesthesia] Update sound
        audio.updateSonification(newZ.r, newZ.x);
      }
    },
    [isMobile, allowDirectDrag, isInteractionEnabled, screenToImpedance]
  );

  const handleTouchEnd = useCallback(() => {
    const state = animationState.current;
    if (state.isDragging) {
      state.isDragging = false;
      callbacksRef.current.onDragChange?.(false);
      // [L3 Synesthesia] Stop sound
      audio.stopSonification();
    }
    touchStartRef.current = null;
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden pointer-events-none">
      {/* L3 UX: Mobile Safety Lock - Interaction Toggle */}
      {isMobile && allowDirectDrag && !isInteractionEnabled && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-auto">
          <button
            onClick={() => setIsInteractionEnabled(true)}
            className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 bg-[#FFD70026] border-2 border-[#FFD70080] text-[#FFD700] font-sans"
          >
            {lang === "zh" ? "激活交互" : "Enable Interaction"}
          </button>
        </div>
      )}

      {/* L3 UX: Blueprint Skeleton - Show before Canvas loads */}
      {!isCanvasReady && (
        <div className="absolute inset-0 z-5 flex items-center justify-center">
          <SmithChartSkeleton width={600} height={600} />
        </div>
      )}

      {/* Circular interaction overlay - only covers the Smith chart circle */}
      {allowDirectDrag && circleSize > 0 && (
        <div
          className={`absolute rounded-full z-10 ${getCursorStyle()}`}
          style={{
            left: "50%",
            top: "50%",
            width: `${circleSize}px`,
            height: `${circleSize}px`,
            transform: "translate(-50%, -50%)",
            pointerEvents: "auto",
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {/* L3 Visual De-noising: Removed vignette - Deepen blacks instead */}

      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full smith-canvas pointer-events-none ${
          isMobile && !isInteractionEnabled
            ? "touch-pan-y touch-pinch-zoom"
            : "touch-none"
        }`}
      />

      {/* Simplified HUD - Direct DOM Updates */}
      {!overrideImpedance && (
        <div
          ref={hudContainerRef}
          className="absolute top-4 left-4 pointer-events-none transition-opacity duration-300 opacity-0"
        >
          <div className="py-2">
            <div className="flex items-center gap-3 mb-2">
              <div
                ref={hudRegionDotRef}
                className="w-2 h-2 rounded-full flex-shrink-0"
              />
              <span
                ref={hudRegionRef}
                className="text-[9px] uppercase tracking-[0.15em] font-semibold"
              />
            </div>

            <div className="font-mono text-xl text-white tracking-wide mb-2 tabular-nums">
              <span ref={hudRRef}></span>
              <span ref={hudXSignRef} className="text-white/30 mx-0.5"></span>
              <span ref={hudXRef} className="text-white/60"></span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  ref={hudVSWRBarRef}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>
              <span
                ref={hudVSWRTextRef}
                className="text-[9px] font-medium w-12 text-right"
              />
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
    case "match":
      return THEME.colors.primary;
    case "inductive":
      return "#FFFFFF";
    case "capacitive":
      return "#FFFFFF";
    default:
      return THEME.colors.status.warning;
  }
}

function getRegionLabel(region: string, lang: string): string {
  const labels: Record<string, Record<string, string>> = {
    match: { en: "MATCHED", zh: "匹配" },
    inductive: { en: "INDUCTIVE", zh: "感性区" },
    capacitive: { en: "CAPACITIVE", zh: "容性区" },
    short: { en: "SHORT", zh: "短路" },
    open: { en: "OPEN", zh: "开路" },
  };
  return labels[region]?.[lang] || region;
}

function getVSWRColor(vswr: number): string {
  if (vswr <= 2) return THEME.colors.primary;
  if (vswr <= 5) return THEME.colors.status.warning;
  return THEME.colors.status.poor;
}

function getMatchQuality(vswr: number, lang: string): string {
  if (vswr <= 1.5) return lang === "zh" ? "优秀" : "Excellent";
  if (vswr <= 2) return lang === "zh" ? "良好" : "Good";
  if (vswr <= 3) return lang === "zh" ? "可接受" : "OK";
  return lang === "zh" ? "较差" : "Poor";
}
