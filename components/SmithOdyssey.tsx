import React, { useEffect, useRef, useState, useCallback } from "react";

import { Language } from "../types";

/**
 * SmithOdyssey - Magnetic Scrollytelling Smith Chart Experience
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────┐
 * │  FIXED CANVAS (z-index: 0)                              │
 * │  Smith Chart that transforms based on scroll position   │
 * └─────────────────────────────────────────────────────────┘
 * ┌─────────────────────────────────────────────────────────┐
 * │  SCROLL SNAP SECTIONS (100vh each)                      │
 * │  Section 1: The Void (Pure Aesthetics)                  │
 * │  Section 2: The Point (Impedance)                       │
 * │  Section 3: The Reflection (VSWR)                       │
 * │  Section 4: The Control (Full Lab)                      │
 * └─────────────────────────────────────────────────────────┘
 *
 * Journey: Aesthetics → Concept → Physics → Tool
 */

interface SmithOdysseyProps {
  lang: Language;
  onComplete?: () => void;
  reducedMotion?: boolean;
}

// ========================================
// UTILS: SCRAMBLE TEXT (Entropy Decode)
// ========================================

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

const ScrambleText: React.FC<{
  text: string;
  trigger: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ text, trigger, className, style }) => {
  const [display, setDisplay] = useState(text);
  const frameRef = useRef(0);
  const iterationsRef = useRef(0);

  useEffect(() => {
    if (!trigger) return;

    const animate = () => {
      setDisplay((prev) =>
        text
          .split("")
          .map((char, index) => {
            if (index < iterationsRef.current) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (iterationsRef.current < text.length) {
        iterationsRef.current += 1 / 3; // Speed of decode
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    iterationsRef.current = 0;
    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [text, trigger]);

  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
};

// ========================================
// UTILS: INTERACTIVE TERM (Semantic Haptics)
// ========================================

interface InteractiveTermProps {
  children: React.ReactNode;
  onHover?: (isHovering: boolean) => void;
  onClick?: () => void;
  highlightColor?: string;
}

const InteractiveTerm: React.FC<InteractiveTermProps> = ({
  children,
  onHover,
  onClick,
  highlightColor = "#FFC700",
}) => {
  return (
    <span
      className="relative inline-block cursor-pointer group"
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onClick={onClick}
    >
      <span
        className="relative z-10 transition-colors duration-300 group-hover:text-black font-semibold"
        style={{ textShadow: "0 0 10px rgba(255,255,255,0.5)" }}
      >
        {children}
      </span>
      <span
        className="absolute inset-0 -inset-x-1 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-0 rounded-sm"
        style={{ backgroundColor: highlightColor }}
      />
    </span>
  );
};

// ========================================
// MATH UTILITIES & PHYSICS KERNEL
// ========================================

// Spring Physics Class
class Spring {
  private position: number;
  private target: number;
  private velocity: number = 0;

  // Physics constants (Rauno-tier snappy)
  private k: number = 170; // Stiffness
  private d: number = 26; // Damping
  private mass: number = 1;

  constructor(initial: number) {
    this.position = initial;
    this.target = initial;
  }

  setTarget(t: number) {
    this.target = t;
  }

  update(dt: number): number {
    const force = -this.k * (this.position - this.target);
    const accel = force / this.mass;

    this.velocity += (accel - this.d * this.velocity) * dt;
    this.position += this.velocity * dt;

    return this.position;
  }

  get() {
    return this.position;
  }

  // Force set for instant teleport
  reset(v: number) {
    this.position = v;
    this.target = v;
    this.velocity = 0;
  }
}

// Gamma to Z conversion
const gammaToZ = (
  gammaRe: number,
  gammaIm: number,
  z0: number = 50
): { r: number; x: number } => {
  const gammaMagSq = gammaRe * gammaRe + gammaIm * gammaIm;
  if (gammaMagSq >= 0.9999) return { r: 1e6, x: 0 };

  const denom = (1 - gammaRe) * (1 - gammaRe) + gammaIm * gammaIm;
  const zNormRe = (1 - gammaMagSq) / denom;
  const zNormIm = (2 * gammaIm) / denom;

  return { r: zNormRe * z0, x: zNormIm * z0 };
};

// Calculate VSWR from gamma magnitude
const gammaToVSWR = (gammaMag: number): number => {
  if (gammaMag >= 0.9999) return Infinity;
  return (1 + gammaMag) / (1 - gammaMag);
};

// ========================================
// SMITH CHART CANVAS ENGINE
// ========================================

interface CanvasState {
  scale: number;
  blur: number;
  rotation: number;
  showPoint: boolean;
  showVector: boolean;
  showUI: boolean;
  pointGlow: number;
  vectorGlow: number;
  highlightMode: "none" | "vswr" | "center" | "z" | "y";
}

class SmithCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private dpr: number;

  private gridCanvas: HTMLCanvasElement;
  private gridCtx: CanvasRenderingContext2D;
  private needsGridUpdate: boolean = true;

  // State
  private state: CanvasState = {
    scale: 1.2,
    blur: 0,
    rotation: 0,
    showPoint: false,
    showVector: false,
    showUI: false,
    pointGlow: 0,
    vectorGlow: 0,
    highlightMode: "none",
  };

  // Animation
  private time: number = 0;
  private autoRotate: boolean = true;

  // Physics State (Springs)
  private gammaReSpring = new Spring(0.3);
  private gammaImSpring = new Spring(0.2);

  // Interaction
  private isDragging: boolean = false;
  private cursorX: number = 0;
  private cursorY: number = 0;

  // Grid config
  private readonly R_VALUES = [0, 0.2, 0.5, 1, 2, 5];
  private readonly X_VALUES = [-5, -2, -1, -0.5, -0.2, 0, 0.2, 0.5, 1, 2, 5];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // Initialize offscreen buffer
    this.gridCanvas = document.createElement('canvas');
    this.gridCtx = this.gridCanvas.getContext('2d', { alpha: true })!;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    // Resize main canvas
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    
    // Resize grid buffer
    this.gridCanvas.width = width * this.dpr;
    this.gridCanvas.height = height * this.dpr;
    this.gridCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    
    this.needsGridUpdate = true;
  }

  setState(newState: Partial<CanvasState>): void {
    if (newState.scale !== undefined || newState.blur !== undefined) {
      this.needsGridUpdate = true;
    }
    Object.assign(this.state, newState);
  }

  setHighlight(mode: CanvasState["highlightMode"]): void {
    this.state.highlightMode = mode;
  }

  snapToCenter(): void {
    this.gammaReSpring.setTarget(0);
    this.gammaImSpring.setTarget(0);
  }

  setAutoRotate(rotate: boolean): void {
    this.autoRotate = rotate;
  }

  setCursor(x: number, y: number): void {
    this.cursorX = x;
    this.cursorY = y;

    if (this.isDragging) {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const radius =
        Math.min(this.width, this.height) * 0.35 * this.state.scale;

      const dx = (x - cx) / radius;
      const dy = -(y - cy) / radius;

      // Magnetic Snap to Center (50 Ohm)
      // If close to center, snap gravity well
      let targetRe = dx;
      let targetIm = dy;

      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      if (distToCenter < 0.1) {
        targetRe = 0;
        targetIm = 0;
      }

      // Clamp to unit circle
      const mag = Math.sqrt(targetRe * targetRe + targetIm * targetIm);
      if (mag > 0.98) {
        targetRe = (targetRe / mag) * 0.98;
        targetIm = (targetIm / mag) * 0.98;
      }

      // Update spring targets
      this.gammaReSpring.setTarget(targetRe);
      this.gammaImSpring.setTarget(targetIm);
    }
  }

  setDragging(dragging: boolean): void {
    this.isDragging = dragging;
  }

  getGamma(): { re: number; im: number; mag: number; phase: number } {
    const re = this.gammaReSpring.get();
    const im = this.gammaImSpring.get();
    const mag = Math.sqrt(re * re + im * im);
    const phase = (Math.atan2(im, re) * 180) / Math.PI;
    return { re, im, mag, phase };
  }

  getImpedance(): { r: number; x: number } {
    return gammaToZ(this.gammaReSpring.get(), this.gammaImSpring.get());
  }

  getVSWR(): number {
    const gamma = this.getGamma();
    return gammaToVSWR(gamma.mag);
  }

  private renderGridToCache(): void {
    const ctx = this.gridCtx;
    const { width, height, state } = this;
    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) * 0.35;
    const radius = baseRadius * state.scale;

    // Clear buffer
    ctx.clearRect(0, 0, width, height);

    // Apply blur effect via alpha for performance
    const gridAlpha = state.blur > 0 ? Math.max(0.3, 1 - state.blur / 10) : 1;

    // Unit circle
    ctx.strokeStyle = `rgba(255, 199, 0, ${0.6 * gridAlpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Constant R circles
    for (const r of this.R_VALUES) {
      const circleRadius = radius / (1 + r);
      const circleCenterX = cx + (radius * r) / (1 + r);

      ctx.strokeStyle =
        r === 1
          ? `rgba(255, 199, 0, ${0.4 * gridAlpha})`
          : `rgba(255, 199, 0, ${0.15 * gridAlpha})`;
      ctx.lineWidth = r === 1 ? 1.5 : 0.8;

      ctx.beginPath();
      ctx.arc(circleCenterX, cy, circleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Constant X arcs
    for (const x of this.X_VALUES) {
      if (x === 0) {
        // Horizontal axis
        ctx.strokeStyle = `rgba(255, 199, 0, ${0.4 * gridAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - radius, cy);
        ctx.lineTo(cx + radius, cy);
        ctx.stroke();
      } else {
        const arcRadius = Math.abs(radius / x);
        const arcCenterY = cy - radius / x;

        ctx.strokeStyle = `rgba(255, 199, 0, ${0.15 * gridAlpha})`;
        ctx.lineWidth = 0.8;

        ctx.beginPath();
        // Calculate arc intersection with unit circle
        const startAngle = x > 0 ? Math.PI / 2 : -Math.PI / 2;
        const endAngle =
          x > 0
            ? Math.PI / 2 - Math.asin(Math.min(1, radius / arcRadius))
            : -Math.PI / 2 + Math.asin(Math.min(1, radius / arcRadius));

        if (Math.abs(arcRadius) > radius * 0.1) {
          ctx.arc(
            cx + radius,
            arcCenterY,
            arcRadius,
            startAngle,
            endAngle,
            x > 0
          );
          ctx.stroke();
        }
      }
    }
  }

  render(): void {
    const dt = 0.016; // Fixed timestep approximation
    this.time += dt;

    // Physics Update
    this.gammaReSpring.update(dt);
    this.gammaImSpring.update(dt);

    // Auto rotation
    if (this.autoRotate) {
      this.state.rotation += 0.001;
    }

    const ctx = this.ctx;
    const { width, height, state } = this;

    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) * 0.35;
    const radius = baseRadius * state.scale;

    // Update grid cache if needed
    if (this.needsGridUpdate) {
      this.renderGridToCache();
      this.needsGridUpdate = false;
    }

    // ========================================
    // BACKGROUND - Deep Dark
    // ========================================
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, width, height);

    // Breathing glow (Electric Gold)
    const breathe = 0.5 + Math.sin(this.time * 0.8) * 0.15;
    const glowRadius = radius * 1.5;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    glow.addColorStop(0, `rgba(255, 199, 0, ${0.08 * breathe})`);
    glow.addColorStop(0.5, `rgba(255, 199, 0, ${0.03 * breathe})`);
    glow.addColorStop(1, "rgba(255, 199, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // ========================================
    // SMITH CHART GRID - Cached & Rotated
    // ========================================
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(state.rotation);
    ctx.translate(-cx, -cy);

    // Use Additive Blending for "Light" look
    ctx.globalCompositeOperation = "lighter";
    
    // Draw cached grid
    ctx.drawImage(this.gridCanvas, 0, 0, width, height);

    ctx.restore();

    // ========================================
    // HIGHLIGHT OVERLAYS (Semantic Haptics)
    // ========================================
    if (state.highlightMode === "vswr") {
      const gamma = this.getGamma();
      const vswrRadius = gamma.mag * radius;

      ctx.beginPath();
      ctx.arc(cx, cy, vswrRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "#FFC700";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255, 199, 0, 0.1)";
      ctx.fill();
    }

    if (state.highlightMode === "center") {
      const pulse = 10 + Math.sin(this.time * 10) * 5;
      ctx.beginPath();
      ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
      ctx.fillStyle = "#FFC700";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, pulse * 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 199, 0, 0.5)";
      ctx.stroke();
    }

    // ========================================
    // GAMMA VECTOR (Section 3)
    // ========================================
    const gammaRe = this.gammaReSpring.get();
    const gammaIm = this.gammaImSpring.get();

    if (state.showVector) {
      const pointX = cx + gammaRe * radius;
      const pointY = cy - gammaIm * radius;

      // Vector line - Red for Reflection (The Enemy)
      const vectorGlow = 0.5 + Math.sin(this.time * 3) * 0.3;
      ctx.strokeStyle = `rgba(255, 80, 80, ${0.8 * vectorGlow})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(255, 80, 80, 0.8)";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(pointX, pointY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Arrowhead
      const angle = Math.atan2(pointY - cy, pointX - cx);
      const arrowLen = 12;
      ctx.fillStyle = "rgba(255, 80, 80, 0.9)";
      ctx.beginPath();
      ctx.moveTo(pointX, pointY);
      ctx.lineTo(
        pointX - arrowLen * Math.cos(angle - Math.PI / 6),
        pointY - arrowLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        pointX - arrowLen * Math.cos(angle + Math.PI / 6),
        pointY - arrowLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    // ========================================
    // IMPEDANCE POINT (Section 2+)
    // ========================================
    if (state.showPoint) {
      const pointX = cx + gammaRe * radius;
      const pointY = cy - gammaIm * radius;

      // Outer glow - Electric Gold
      const pulse = 8 + Math.sin(this.time * 4) * 3;
      const pointGlow = ctx.createRadialGradient(
        pointX,
        pointY,
        0,
        pointX,
        pointY,
        pulse * 3
      );
      pointGlow.addColorStop(0, "rgba(255, 199, 0, 0.6)");
      pointGlow.addColorStop(0.5, "rgba(255, 199, 0, 0.2)");
      pointGlow.addColorStop(1, "rgba(255, 199, 0, 0)");
      ctx.fillStyle = pointGlow;
      ctx.beginPath();
      ctx.arc(pointX, pointY, pulse * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core point
      ctx.fillStyle = "#FFC700";
      ctx.shadowColor = "#FFC700";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(pointX, pointY, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Crosshair
      ctx.strokeStyle = "rgba(255, 199, 0, 0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pointX - 30, pointY);
      ctx.lineTo(pointX + 30, pointY);
      ctx.moveTo(pointX, pointY - 30);
      ctx.lineTo(pointX, pointY + 30);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ========================================
    // CENTER POINT (50 Ohm)
    // ========================================
    const centerPulse = 3 + Math.sin(this.time * 2) * 1;
    ctx.fillStyle = "rgba(255, 199, 0, 0.8)";
    ctx.beginPath();
    ctx.arc(cx, cy, centerPulse, 0, Math.PI * 2);
    ctx.fill();

    // ========================================
    // CURSOR GLOW (Section 1)
    // ========================================
    if (!state.showPoint && this.cursorX > 0) {
      const dist = Math.sqrt(
        Math.pow(this.cursorX - cx, 2) + Math.pow(this.cursorY - cy, 2)
      );
      if (dist < radius * 1.5) {
        const intensity = 1 - dist / (radius * 1.5);
        const cursorGlow = ctx.createRadialGradient(
          this.cursorX,
          this.cursorY,
          0,
          this.cursorX,
          this.cursorY,
          80
        );
        cursorGlow.addColorStop(0, `rgba(255, 199, 0, ${0.15 * intensity})`);
        cursorGlow.addColorStop(1, "rgba(255, 199, 0, 0)");
        ctx.fillStyle = cursorGlow;
        ctx.beginPath();
        ctx.arc(this.cursorX, this.cursorY, 80, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Reset Composite
    ctx.globalCompositeOperation = "source-over";
  }

  destroy(): void {}
}

// ========================================
// SCROLL HINT COMPONENT
// ========================================

const ScrollHint: React.FC<{ text: string; visible: boolean }> = ({
  text,
  visible,
}) => (
  <div
    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-opacity duration-500"
    style={{ opacity: visible ? 1 : 0 }}
  >
    <span
      className="text-[10px] uppercase tracking-[0.2em]"
      style={{
        color: "rgba(255, 255, 255, 0.4)",
        fontFamily: '"Space Grotesk", sans-serif',
      }}
    >
      {text}
    </span>
    <div className="w-5 h-8 rounded-full border border-white/30 flex justify-center pt-2">
      <div
        className="w-1 h-2 rounded-full bg-white/50"
        style={{ animation: "scrollPulse 2s ease-in-out infinite" }}
      />
    </div>
  </div>
);

// ========================================
// SECTION TEXT OVERLAY
// ========================================

interface SectionTextProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  instruction?: React.ReactNode;
  visible: boolean;
  position?: "center" | "bottom-left";
  children?: React.ReactNode;
}

const SectionText: React.FC<SectionTextProps> = ({
  eyebrow,
  title,
  subtitle,
  instruction,
  visible,
  position = "center",
  children,
}) => {
  const isBottomLeft = position === "bottom-left";
  const positionClasses =
    position === "center"
      ? "items-center justify-center text-center"
      : "items-start justify-end pb-24 pl-12";

  return (
    <div
      className={`absolute inset-0 flex flex-col ${positionClasses} pointer-events-none transition-all duration-700`}
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : 30}px)`,
      }}
    >
      <div
        className={`flex flex-col ${
          isBottomLeft ? "items-start text-left" : "items-center text-center"
        }`}
      >
        {eyebrow && (
          <div
            className="mb-4 px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(255, 199, 0, 0.1)",
              border: "1px solid rgba(255, 199, 0, 0.3)",
            }}
          >
            <span
              className="text-[11px] tracking-[0.15em]"
              style={{
                color: "#FFC700",
                fontFamily: '"Space Grotesk", "Noto Sans SC", sans-serif',
                fontWeight: 600,
              }}
            >
              {eyebrow}
            </span>
          </div>
        )}

        <h2
          className={`text-5xl md:text-7xl lg:text-8xl font-bold mb-4 ${
            isBottomLeft ? "text-left" : ""
          }`}
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            letterSpacing: "-0.04em",
            color: "#FFFFFF",
          }}
        >
          {title}
        </h2>

        {subtitle && (
          <p
            className={`text-lg md:text-xl mb-6 ${
              isBottomLeft ? "text-left" : ""
            }`}
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", "Noto Sans SC", sans-serif',
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            {subtitle}
          </p>
        )}

        {instruction && (
          <p
            className={`text-sm md:text-base px-4 py-2 rounded-lg ${
              isBottomLeft ? "text-left" : ""
            }`}
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", "Noto Sans SC", sans-serif',
              color: "rgba(255, 215, 0, 0.8)",
              backgroundColor: "rgba(255, 215, 0, 0.1)",
              border: "1px solid rgba(255, 215, 0, 0.2)",
            }}
          >
            {instruction}
          </p>
        )}

        {children}
      </div>
    </div>
  );
};

// ========================================
// DATA DISPLAY COMPONENT
// ========================================

interface DataDisplayProps {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  visible: boolean;
}

const DataDisplay: React.FC<DataDisplayProps> = ({
  label,
  value,
  unit,
  highlight,
  visible,
}) => (
  <div
    className="flex flex-col items-center transition-all duration-500"
    style={{
      opacity: visible ? 1 : 0,
      transform: `translateY(${visible ? 0 : 20}px)`,
    }}
  >
    <span
      className="text-[10px] uppercase tracking-[0.15em] mb-1"
      style={{ color: "rgba(255, 255, 255, 0.4)" }}
    >
      {label}
    </span>
    <span
      className="text-2xl md:text-3xl font-mono font-bold"
      style={{
        color: highlight ? "#FF5050" : "#FFC700",
      }}
    >
      {value}
      {unit && <span className="text-lg ml-1 opacity-60">{unit}</span>}
    </span>
  </div>
);

// ========================================
// MAIN COMPONENT
// ========================================

export const SmithOdyssey: React.FC<SmithOdysseyProps> = ({
  lang,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SmithCanvasEngine | null>(null);
  const animIdRef = useRef<number>(0);
  const lastHudUpdate = useRef<number>(0);

  const [currentSection, setCurrentSection] = useState(0);
  const [impedance, setImpedance] = useState({ r: 50, x: 0 });
  const [vswr, setVswr] = useState(1);
  const [gamma, setGamma] = useState({ mag: 0, phase: 0 });

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    engineRef.current = new SmithCanvasEngine(canvas);

    const animate = (timestamp: number) => {
      if (engineRef.current) {
        engineRef.current.render();

        // Throttle HUD updates to 10fps (100ms) to avoid React re-render spam
        if (timestamp - lastHudUpdate.current > 100) {
          lastHudUpdate.current = timestamp;
          
          const z = engineRef.current.getImpedance();
          const v = engineRef.current.getVSWR();
          const g = engineRef.current.getGamma();

          setImpedance({
            r: Math.round(z.r * 10) / 10,
            x: Math.round(z.x * 10) / 10,
          });
          setVswr(Math.round(v * 100) / 100);
          setGamma({
            mag: Math.round(g.mag * 1000) / 1000,
            phase: Math.round(g.phase),
          });
        }
      }
      animIdRef.current = requestAnimationFrame(animate);
    };
    animIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      engineRef.current?.destroy();
    };
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current) {
        engineRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll handler for section detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const sectionHeight = window.innerHeight;
      const section = Math.round(scrollTop / sectionHeight);

      if (section !== currentSection) {
        setCurrentSection(section);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentSection]);

  // Update canvas state based on section
  useEffect(() => {
    if (!engineRef.current) return;

    switch (currentSection) {
      case 0: // The Void - Pure Aesthetics
        engineRef.current.setState({
          scale: 1.2,
          blur: 0,
          showPoint: false,
          showVector: false,
          showUI: false,
          highlightMode: "none",
        });
        engineRef.current.setAutoRotate(true);
        break;

      case 1: // Geometric Intuition - Chapter 1
        engineRef.current.setState({
          scale: 1.2,
          blur: 1,
          showPoint: false,
          showVector: false,
          showUI: false,
          highlightMode: "none",
        });
        engineRef.current.setAutoRotate(true); // Slow rotation for aesthetic
        break;

      case 2: // The Point - Impedance
        engineRef.current.setState({
          scale: 1.2,
          blur: 2,
          showPoint: true,
          showVector: false,
          showUI: false,
          highlightMode: "none",
        });
        engineRef.current.setAutoRotate(true); // Continue rotation
        break;

      case 3: // The Reflection - VSWR
        engineRef.current.setState({
          scale: 1.2,
          blur: 0,
          showPoint: true,
          showVector: true,
          showUI: false,
          highlightMode: "none",
        });
        engineRef.current.setAutoRotate(true); // Continue rotation
        break;

      case 4: // The Control - Full Lab
        engineRef.current.setState({
          scale: 1.2,
          blur: 0,
          showPoint: false,
          showVector: false,
          showUI: false,
          highlightMode: "none",
        });
        engineRef.current.setAutoRotate(true); // Continue rotation
        break;
    }
  }, [currentSection]);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    engineRef.current?.setCursor(e.clientX, e.clientY);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only allow dragging in sections where point is shown (section 2+)
      if (currentSection >= 2) {
        engineRef.current?.setDragging(true);
      }
    },
    [currentSection]
  );

  const handleMouseUp = useCallback(() => {
    engineRef.current?.setDragging(false);
  }, []);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  // Semantic Haptics Handlers
  const handleHighlight = (mode: "vswr" | "center" | "none") => {
    engineRef.current?.setHighlight(mode);
  };

  const handleSnap = () => {
    engineRef.current?.snapToCenter();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-y-scroll"
      style={{
        scrollSnapType: "y mandatory",
        backgroundColor: "#050505",
        cursor: currentSection >= 2 ? "crosshair" : "default",
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* FIXED CANVAS LAYER */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none transition-all duration-1000 ease-out"
        style={{
          transform: currentSection === 4 ? "scale(0.6)" : "scale(1)",
          // L3 Optimization: Removed expensive CSS blur filter
          // filter: currentSection === 4 ? "blur(12px)" : "blur(0px)",
        }}
      />

      {/* SECTION 1: THE VOID */}
      <section className="relative w-full h-screen flex items-center justify-center snap-start">
        <ScrollHint
          text={lang === "zh" ? "初始化系统" : "INITIALIZING SYSTEM"}
          visible={currentSection === 0}
        />
      </section>

      {/* SECTION 2: GEOMETRIC INTUITION */}
      <section className="relative w-full h-screen flex items-center justify-center snap-start">
        <SectionText
          eyebrow={lang === "zh" ? "几何直觉" : "GEOMETRIC INTUITION"}
          title={
            <ScrambleText
              text={lang === "zh" ? "无限，折叠" : "Infinity, Folded"}
              trigger={currentSection === 1}
            />
          }
          subtitle={
            lang === "zh"
              ? "整个复平面，被引力捕获进一个圆。"
              : "The entire complex plane, captured by gravity into a circle."
          }
          visible={currentSection === 1}
        >
          {/* Concept Cards - Now inside SectionText for proper stacking */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto px-8 transition-all duration-700 delay-300 pointer-events-auto"
            style={{
              opacity: currentSection === 1 ? 1 : 0,
              transform: `translateY(${currentSection === 1 ? 0 : 40}px)`,
            }}
          >
            {/* L3 Optimization: Removed backdrop-blur-md for performance */}
            <div className="p-6 rounded-2xl border border-white/10 bg-[#16140F]/95 text-left hover:border-[#FFC700]/50 transition-colors">
              <h3 className="text-[#FFC700] font-mono text-xs uppercase tracking-widest mb-2">
                1939
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {lang === "zh"
                  ? "在硅基芯片诞生前，工程师用纸笔计算宇宙。"
                  : "Before silicon, engineers calculated the universe with pen and paper."}
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-[#16140F]/95 text-left hover:border-[#FFC700]/50 transition-colors">
              <h3 className="text-[#FFC700] font-mono text-xs uppercase tracking-widest mb-2">
                {lang === "zh" ? "幽灵" : "GHOST"}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {lang === "zh"
                  ? "反射是信号的幽灵。它偷走能量，烧毁功放。必须消灭。"
                  : "Reflection is the ghost of the signal. It steals energy, burns amps. It must be destroyed."}
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-[#16140F]/95 text-left hover:border-[#FFC700]/50 transition-colors">
              <h3 className="text-[#FFC700] font-mono text-xs uppercase tracking-widest mb-2">
                {lang === "zh" ? "视角" : "PERSPECTIVE"}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {lang === "zh"
                  ? "Z 是串联的秩序，Y 是并联的自由。殊途同归。"
                  : "Z is the order of series. Y is the freedom of parallel. All roads lead home."}
              </p>
            </div>
          </div>
        </SectionText>
      </section>

      {/* SECTION 3: IMPEDANCE */}
      <section className="relative w-full h-screen snap-start">
        <SectionText
          eyebrow={lang === "zh" ? "相位 1.0" : "PHASE 1.0"}
          title={
            <ScrambleText
              text={lang === "zh" ? "阻抗" : "Impedance"}
              trigger={currentSection === 2}
            />
          }
          subtitle={
            lang === "zh" ? "电路的心跳。" : "The heartbeat of the circuit."
          }
          instruction={
            lang === "zh" ? (
              <span>
                移动光点。
                <InteractiveTerm
                  onHover={(h) => handleHighlight(h ? "center" : "none")}
                  onClick={handleSnap}
                >
                  建立连接
                </InteractiveTerm>
                。
              </span>
            ) : (
              <span>
                Move the point.{" "}
                <InteractiveTerm
                  onHover={(h) => handleHighlight(h ? "center" : "none")}
                  onClick={handleSnap}
                >
                  Establish connection
                </InteractiveTerm>
                .
              </span>
            )
          }
          visible={currentSection === 2}
          position="bottom-left"
        >
          {/* Live Data - positioned below the text in bottom-left */}
          <div className="mt-8 flex gap-8 pointer-events-none">
            <DataDisplay
              label="Resistance (R)"
              value={impedance.r.toFixed(1)}
              unit="Ω"
              visible={currentSection === 2}
            />
            <DataDisplay
              label="Reactance (X)"
              value={impedance.x.toFixed(1)}
              unit="jΩ"
              visible={currentSection === 2}
            />
          </div>
        </SectionText>
      </section>

      {/* SECTION 4: REFLECTION */}
      <section className="relative w-full h-screen snap-start">
        <SectionText
          eyebrow={lang === "zh" ? "相位 2.0" : "PHASE 2.0"}
          title={
            <ScrambleText
              text={lang === "zh" ? "驻波" : "Standing Wave"}
              trigger={currentSection === 3}
            />
          }
          subtitle={
            lang === "zh" ? (
              <span>
                反射即敌人。
                <InteractiveTerm
                  onHover={(h) => handleHighlight(h ? "vswr" : "none")}
                >
                  沉默是金
                </InteractiveTerm>
                。
              </span>
            ) : (
              <span>
                Reflection is the enemy.{" "}
                <InteractiveTerm
                  onHover={(h) => handleHighlight(h ? "vswr" : "none")}
                >
                  Silence is golden
                </InteractiveTerm>
                .
              </span>
            )
          }
          instruction={
            lang === "zh" ? (
              <span>
                收缩红线。
                <InteractiveTerm
                  onClick={handleSnap}
                  onHover={(h) => handleHighlight(h ? "center" : "none")}
                >
                  归零
                </InteractiveTerm>
                。
              </span>
            ) : (
              <span>
                Shrink the red line.{" "}
                <InteractiveTerm
                  onClick={handleSnap}
                  onHover={(h) => handleHighlight(h ? "center" : "none")}
                >
                  Return to zero
                </InteractiveTerm>
                .
              </span>
            )
          }
          visible={currentSection === 3}
          position="bottom-left"
        />

        {/* Live Data */}
        <div className="absolute top-1/2 right-12 -translate-y-1/2 space-y-8 pointer-events-none">
          <DataDisplay
            label={lang === "zh" ? "驻波比" : "VSWR"}
            value={vswr >= 100 ? "∞" : vswr.toFixed(2)}
            highlight={vswr > 1.5}
            visible={currentSection === 3}
          />
          <DataDisplay
            label={lang === "zh" ? "反射系数" : "Γ"}
            value={gamma.mag.toFixed(3)}
            highlight={gamma.mag > 0.2}
            visible={currentSection === 3}
          />
        </div>
      </section>

      {/* SECTION 5: THE BRIDGE */}
      <section className="relative w-full h-screen flex items-center justify-center snap-start">
        <div className="text-center">
          <SectionText
            eyebrow={lang === "zh" ? "终端" : "TERMINAL"}
            title={
              <ScrambleText
                text={lang === "zh" ? "完全控制" : "Full Control"}
                trigger={currentSection === 4}
              />
            }
            subtitle={
              lang === "zh"
                ? "Luminous 实验室准备就绪。"
                : "Luminous Lab is ready."
            }
            instruction={lang === "zh" ? "仪器已校准" : "Instrument Calibrated"}
            visible={currentSection === 4}
          >
            <button
              onClick={handleComplete}
              className="mt-6 px-8 py-4 rounded-full bg-[#FFC700] text-black font-bold tracking-widest uppercase hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(255,199,0,0.4)]"
              style={{
                opacity: currentSection === 4 ? 1 : 0,
                pointerEvents: currentSection === 4 ? "auto" : "none",
                transitionDelay: "500ms",
              }}
            >
              {lang === "zh" ? "进入实验室" : "ENTER LAB"}
            </button>
          </SectionText>
        </div>
      </section>
    </div>
  );
};
