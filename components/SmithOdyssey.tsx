import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { THEME } from '../theme';
import { Language } from '../types';

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
// NARRATIVE CONTENT
// ========================================

const NARRATIVE = {
  zh: {
    section1: {
      hint: '向下滚动',
    },
    section2: {
      eyebrow: '几何直觉',
      title: '无限，折叠',
      subtitle: '整个复平面，压缩成一个圆',
      body: '每个阻抗都有归宿，每个反射都有故事',
      concepts: [
        { title: '1939', desc: '在计算机之前，工程师用手画出答案' },
        { title: '反射即敌人', desc: '反射是幽灵。它不仅偷走能量，还会烧毁你的放大器。消灭回声。' },
        { title: '双视角', desc: 'Z 看串联，Y 看并联。同一个圆，不同视角' },
        { title: '耦合', desc: '两个信号，完美同相。就像我们。', hidden: true },
      ],
    },
    section3: {
      eyebrow: '第一课',
      title: '阻抗',
      subtitle: '这是你电路的心跳',
      instruction: '拖动光点，感受它与网格的关系',
    },
    section4: {
      eyebrow: '第二课',
      title: '反射',
      subtitle: '反射即敌人。消灭回声。',
      instruction: '把红线缩短到 0，杀死反射',
      vswr: '驻波比',
      gamma: '反射系数',
    },
    section5: {
      eyebrow: '舰桥',
      title: '掌控',
      subtitle: '欢迎来到舰桥，指挥官',
      instruction: '所有工具已解锁',
    },
  },
  en: {
    section1: {
      hint: 'Scroll to begin',
    },
    section2: {
      eyebrow: 'GEOMETRIC INTUITION',
      title: 'Infinity, Folded',
      subtitle: 'The entire complex plane, compressed into a circle',
      body: 'Every impedance has a home. Every reflection tells a story.',
      concepts: [
        { title: '1939', desc: 'Before computers, engineers drew their answers' },
        { title: 'The Enemy', desc: 'Reflection is the ghost in the machine. It burns your power and kills your signal. Kill the echo.' },
        { title: 'Two Views', desc: 'Z for series, Y for parallel. Same circle.' },
        { title: 'Coupling', desc: 'Two signals, synced in perfect phase. Just like us.', hidden: true },
      ],
    },
    section3: {
      eyebrow: 'LESSON ONE',
      title: 'Impedance',
      subtitle: 'The heartbeat of your circuit',
      instruction: 'Drag the point. Feel its relationship with the grid.',
    },
    section4: {
      eyebrow: 'LESSON TWO',
      title: 'Reflection',
      subtitle: 'The Reflection is the enemy. Kill the echo.',
      instruction: 'Shrink the red line to zero. Kill the reflection.',
      vswr: 'VSWR',
      gamma: 'Γ',
    },
    section5: {
      eyebrow: 'THE BRIDGE',
      title: 'Control',
      subtitle: 'Welcome to the Bridge, Commander.',
      instruction: 'All tools unlocked',
    },
  },
};

// ========================================
// MATH UTILITIES
// ========================================

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

// Gamma to Z conversion
const gammaToZ = (gammaRe: number, gammaIm: number, z0: number = 50): { r: number; x: number } => {
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
}

class SmithCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private dpr: number;
  
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
  };
  
  // Animation
  private time: number = 0;
  private autoRotate: boolean = true;
  
  // Impedance point (normalized gamma coordinates)
  private gammaRe: number = 0.3;
  private gammaIm: number = 0.2;
  private targetGammaRe: number = 0.3;
  private targetGammaIm: number = 0.2;
  
  // Interaction
  private isDragging: boolean = false;
  private cursorX: number = 0;
  private cursorY: number = 0;
  
  // Grid config
  private readonly R_VALUES = [0, 0.2, 0.5, 1, 2, 5];
  private readonly X_VALUES = [-5, -2, -1, -0.5, -0.2, 0, 0.2, 0.5, 1, 2, 5];
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  }
  
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  
  setState(newState: Partial<CanvasState>): void {
    Object.assign(this.state, newState);
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
      const radius = Math.min(this.width, this.height) * 0.35 * this.state.scale;
      
      const dx = (x - cx) / radius;
      const dy = -(y - cy) / radius;
      
      // Clamp to unit circle
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > 0.98) {
        this.targetGammaRe = dx / mag * 0.98;
        this.targetGammaIm = dy / mag * 0.98;
      } else {
        this.targetGammaRe = dx;
        this.targetGammaIm = dy;
      }
    }
  }
  
  setDragging(dragging: boolean): void {
    this.isDragging = dragging;
  }
  
  getGamma(): { re: number; im: number; mag: number; phase: number } {
    const mag = Math.sqrt(this.gammaRe * this.gammaRe + this.gammaIm * this.gammaIm);
    const phase = Math.atan2(this.gammaIm, this.gammaRe) * 180 / Math.PI;
    return { re: this.gammaRe, im: this.gammaIm, mag, phase };
  }
  
  getImpedance(): { r: number; x: number } {
    return gammaToZ(this.gammaRe, this.gammaIm);
  }
  
  getVSWR(): number {
    const gamma = this.getGamma();
    return gammaToVSWR(gamma.mag);
  }
  
  render(): void {
    this.time += 0.016;
    
    // Smooth gamma interpolation
    this.gammaRe = lerp(this.gammaRe, this.targetGammaRe, 0.15);
    this.gammaIm = lerp(this.gammaIm, this.targetGammaIm, 0.15);
    
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
    
    // ========================================
    // BACKGROUND
    // ========================================
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);
    
    // Breathing glow
    const breathe = 0.5 + Math.sin(this.time * 0.8) * 0.15;
    const glowRadius = radius * 1.5;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    glow.addColorStop(0, `rgba(255, 215, 0, ${0.08 * breathe})`);
    glow.addColorStop(0.5, `rgba(255, 215, 0, ${0.03 * breathe})`);
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // ========================================
    // SMITH CHART GRID
    // ========================================
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(state.rotation);
    ctx.translate(-cx, -cy);
    
    // Apply blur effect via alpha for performance
    const gridAlpha = state.blur > 0 ? Math.max(0.3, 1 - state.blur / 10) : 1;
    
    // Unit circle
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 * gridAlpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Constant R circles
    for (const r of this.R_VALUES) {
      const circleRadius = radius / (1 + r);
      const circleCenterX = cx + radius * r / (1 + r);
      
      ctx.strokeStyle = r === 1 
        ? `rgba(255, 215, 0, ${0.4 * gridAlpha})`
        : `rgba(255, 215, 0, ${0.15 * gridAlpha})`;
      ctx.lineWidth = r === 1 ? 1.5 : 0.8;
      
      ctx.beginPath();
      ctx.arc(circleCenterX, cy, circleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Constant X arcs
    for (const x of this.X_VALUES) {
      if (x === 0) {
        // Horizontal axis
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 * gridAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - radius, cy);
        ctx.lineTo(cx + radius, cy);
        ctx.stroke();
      } else {
        const arcRadius = Math.abs(radius / x);
        const arcCenterY = cy - radius / x;
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.15 * gridAlpha})`;
        ctx.lineWidth = 0.8;
        
        ctx.beginPath();
        // Calculate arc intersection with unit circle
        const startAngle = x > 0 ? Math.PI / 2 : -Math.PI / 2;
        const endAngle = x > 0 
          ? Math.PI / 2 - Math.asin(Math.min(1, radius / arcRadius))
          : -Math.PI / 2 + Math.asin(Math.min(1, radius / arcRadius));
        
        if (Math.abs(arcRadius) > radius * 0.1) {
          ctx.arc(cx + radius, arcCenterY, arcRadius, startAngle, endAngle, x > 0);
          ctx.stroke();
        }
      }
    }
    
    ctx.restore();
    
    // ========================================
    // GAMMA VECTOR (Section 3)
    // ========================================
    if (state.showVector) {
      const pointX = cx + this.gammaRe * radius;
      const pointY = cy - this.gammaIm * radius;
      
      // Vector line
      const vectorGlow = 0.5 + Math.sin(this.time * 3) * 0.3;
      ctx.strokeStyle = `rgba(255, 80, 80, ${0.8 * vectorGlow})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(255, 80, 80, 0.8)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(pointX, pointY);
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Arrowhead
      const angle = Math.atan2(pointY - cy, pointX - cx);
      const arrowLen = 12;
      ctx.fillStyle = 'rgba(255, 80, 80, 0.9)';
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
      const pointX = cx + this.gammaRe * radius;
      const pointY = cy - this.gammaIm * radius;
      
      // Outer glow
      const pulse = 8 + Math.sin(this.time * 4) * 3;
      const pointGlow = ctx.createRadialGradient(pointX, pointY, 0, pointX, pointY, pulse * 3);
      pointGlow.addColorStop(0, 'rgba(100, 255, 180, 0.6)');
      pointGlow.addColorStop(0.5, 'rgba(100, 255, 180, 0.2)');
      pointGlow.addColorStop(1, 'rgba(100, 255, 180, 0)');
      ctx.fillStyle = pointGlow;
      ctx.beginPath();
      ctx.arc(pointX, pointY, pulse * 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Core point
      ctx.fillStyle = '#64FFB4';
      ctx.shadowColor = '#64FFB4';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(pointX, pointY, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Crosshair
      ctx.strokeStyle = 'rgba(100, 255, 180, 0.3)';
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
    // CENTER POINT
    // ========================================
    const centerPulse = 3 + Math.sin(this.time * 2) * 1;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
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
          this.cursorX, this.cursorY, 0,
          this.cursorX, this.cursorY, 80
        );
        cursorGlow.addColorStop(0, `rgba(255, 215, 0, ${0.15 * intensity})`);
        cursorGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.beginPath();
        ctx.arc(this.cursorX, this.cursorY, 80, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  destroy(): void {}
}

// ========================================
// SCROLL HINT COMPONENT
// ========================================

const ScrollHint: React.FC<{ text: string; visible: boolean }> = ({ text, visible }) => (
  <div 
    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-opacity duration-500"
    style={{ opacity: visible ? 1 : 0 }}
  >
    <span 
      className="text-[10px] uppercase tracking-[0.2em]"
      style={{ color: 'rgba(255, 255, 255, 0.4)', fontFamily: '"Space Grotesk", sans-serif' }}
    >
      {text}
    </span>
    <div className="w-5 h-8 rounded-full border border-white/30 flex justify-center pt-2">
      <div 
        className="w-1 h-2 rounded-full bg-white/50"
        style={{ animation: 'scrollPulse 2s ease-in-out infinite' }}
      />
    </div>
  </div>
);

// ========================================
// SECTION TEXT OVERLAY
// ========================================

interface SectionTextProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  instruction?: string;
  visible: boolean;
  position?: 'center' | 'bottom-left';
}

const SectionText: React.FC<SectionTextProps> = ({
  eyebrow,
  title,
  subtitle,
  instruction,
  visible,
  position = 'center',
}) => {
  const positionClasses = position === 'center' 
    ? 'items-center justify-center text-center'
    : 'items-start justify-end pb-24 pl-12 text-left';
  
  return (
    <div 
      className={`absolute inset-0 flex flex-col ${positionClasses} pointer-events-none transition-all duration-700`}
      style={{ 
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : 30}px)`,
      }}
    >
      {eyebrow && (
        <div 
          className="mb-4 px-4 py-1.5 rounded-full"
          style={{ 
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
          }}
        >
          <span 
            className="text-[11px] tracking-[0.15em]"
            style={{ 
              color: '#FFD700',
              fontFamily: '"Space Grotesk", "Noto Sans SC", sans-serif',
              fontWeight: 600,
            }}
          >
            {eyebrow}
          </span>
        </div>
      )}
      
      <h2 
        className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4"
        style={{ 
          fontFamily: '"Space Grotesk", sans-serif',
          letterSpacing: '-0.04em',
          color: '#FFFFFF',
          // L3 Blackout Protocol: Removed text-shadow
        }}
      >
        {title}
      </h2>
      
      {subtitle && (
        <p 
          className="text-lg md:text-xl mb-6"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", "Noto Sans SC", sans-serif',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          {subtitle}
        </p>
      )}
      
      {instruction && (
        <p 
          className="text-sm md:text-base px-4 py-2 rounded-lg"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", "Noto Sans SC", sans-serif',
            color: 'rgba(255, 215, 0, 0.8)',
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
          }}
        >
          {instruction}
        </p>
      )}
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

const DataDisplay: React.FC<DataDisplayProps> = ({ label, value, unit, highlight, visible }) => (
  <div 
    className="flex flex-col items-center transition-all duration-500"
    style={{ 
      opacity: visible ? 1 : 0,
      transform: `translateY(${visible ? 0 : 20}px)`,
    }}
  >
    <span 
      className="text-[10px] uppercase tracking-[0.15em] mb-1"
      style={{ color: 'rgba(255, 255, 255, 0.4)' }}
    >
      {label}
    </span>
    <span 
      className="text-2xl md:text-3xl font-mono font-bold"
      style={{ 
        color: highlight ? '#FF5050' : '#64FFB4',
        // L3 Blackout Protocol: Removed text-shadow - data values should be clear, not glowing
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
  reducedMotion = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SmithCanvasEngine | null>(null);
  const animIdRef = useRef<number>(0);
  
  const [currentSection, setCurrentSection] = useState(0);
  const [impedance, setImpedance] = useState({ r: 50, x: 0 });
  const [vswr, setVswr] = useState(1);
  const [gamma, setGamma] = useState({ mag: 0, phase: 0 });
  
  const narrative = NARRATIVE[lang];
  
  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    engineRef.current = new SmithCanvasEngine(canvas);
    
    const animate = () => {
      if (engineRef.current) {
        engineRef.current.render();
        
        // Update data displays
        const z = engineRef.current.getImpedance();
        const v = engineRef.current.getVSWR();
        const g = engineRef.current.getGamma();
        
        setImpedance({ r: Math.round(z.r * 10) / 10, x: Math.round(z.x * 10) / 10 });
        setVswr(Math.round(v * 100) / 100);
        setGamma({ mag: Math.round(g.mag * 1000) / 1000, phase: Math.round(g.phase) });
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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
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
        });
        engineRef.current.setAutoRotate(true);
        break;
        
      case 1: // Geometric Intuition - Chapter 1
        engineRef.current.setState({
          scale: 1.1,
          blur: 1,
          showPoint: false,
          showVector: false,
          showUI: false,
        });
        engineRef.current.setAutoRotate(true); // Slow rotation for aesthetic
        break;
        
      case 2: // The Point - Impedance
        engineRef.current.setState({
          scale: 1.0,
          blur: 2,
          showPoint: true,
          showVector: false,
          showUI: false,
        });
        engineRef.current.setAutoRotate(false);
        break;
        
      case 3: // The Reflection - VSWR
        engineRef.current.setState({
          scale: 1.0,
          blur: 0,
          showPoint: true,
          showVector: true,
          showUI: false,
        });
        engineRef.current.setAutoRotate(false);
        break;
        
      case 4: // The Control - Full Lab
        engineRef.current.setState({
          scale: 1.0,
          blur: 0,
          showPoint: true,
          showVector: true,
          showUI: true,
        });
        engineRef.current.setAutoRotate(false);
        break;
    }
  }, [currentSection]);
  
  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    engineRef.current?.setCursor(e.clientX, e.clientY);
  }, []);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only allow dragging in sections where point is shown (section 2+)
    if (currentSection >= 2) {
      engineRef.current?.setDragging(true);
    }
  }, [currentSection]);
  
  const handleMouseUp = useCallback(() => {
    engineRef.current?.setDragging(false);
  }, []);
  
  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-y-scroll"
      style={{ 
        scrollSnapType: 'y mandatory',
        backgroundColor: '#050505',
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Fixed Canvas Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0"
        style={{ background: '#050505' }}
      />
      
      {/* Sections */}
        {/* Section 1: The Void - Pure Aesthetics */}
      <section 
        className="relative z-10 h-screen flex items-center justify-center"
        style={{ scrollSnapAlign: 'start' }}
      >
          <ScrollHint text={narrative.section1.hint} visible={currentSection === 0} />
        </section>
      
      {/* Section 2: Geometric Intuition - Chapter 1 Content */}
      <section 
        className="relative z-10 h-screen"
        style={{ scrollSnapAlign: 'start' }}
      >
        {/* L3 Narrative: Golden Flash Effect for "Infinity, Folded" */}
        {currentSection === 1 && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
            style={{
              opacity: currentSection === 1 ? 1 : 0,
              background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.15) 0%, transparent 70%)',
              animation: currentSection === 1 ? 'infinityFlash 2s ease-out' : 'none',
            }}
          />
        )}
        
        <SectionText
          eyebrow={narrative.section2.eyebrow}
          title={narrative.section2.title}
          subtitle={narrative.section2.subtitle}
          visible={currentSection === 1}
          position="center"
        />
        
        {/* Concept Cards */}
        <div 
          className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-6 transition-all duration-700"
          style={{ 
            opacity: currentSection === 1 ? 1 : 0,
            transform: `translateX(-50%) translateY(${currentSection === 1 ? 0 : 30}px)`,
          }}
        >
          {narrative.section2.concepts?.filter(c => !c.hidden).map((concept, idx) => (
            <div 
              key={idx}
              className="px-6 py-4 rounded-xl transition-all duration-500 hover:scale-105"
              style={{
                backgroundColor: 'rgba(255, 215, 0, 0.05)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                backdropFilter: 'blur(10px)',
                animationDelay: `${idx * 150}ms`,
              }}
            >
              <div 
                className="text-sm font-bold mb-1"
                style={{ color: '#FFD700' }}
              >
                {concept.title}
              </div>
              <div 
                className="text-xs max-w-[140px]"
                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                {concept.desc}
              </div>
            </div>
          ))}
        </div>
        
        {/* Body text */}
        <div 
          className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center transition-all duration-500"
          style={{ 
            opacity: currentSection === 1 ? 0.6 : 0,
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", "Noto Sans SC", sans-serif',
            fontSize: '0.9rem',
          }}
        >
          {narrative.section2.body}
        </div>
      </section>
      
      {/* Section 3: The Point - Impedance */}
      <section 
        className="relative z-10 h-screen"
        style={{ scrollSnapAlign: 'start' }}
      >
        <SectionText
          eyebrow={narrative.section3.eyebrow}
          title={narrative.section3.title}
          subtitle={narrative.section3.subtitle}
          instruction={narrative.section3.instruction}
          visible={currentSection === 2}
          position="bottom-left"
        />
        
        {/* Impedance Display */}
        <div 
          className="absolute top-1/4 right-12 flex flex-col gap-6 transition-all duration-500"
          style={{ opacity: currentSection === 2 ? 1 : 0 }}
        >
          <DataDisplay
            label="Resistance"
            value={impedance.r.toFixed(1)}
            unit="Ω"
            visible={currentSection === 2}
          />
          <DataDisplay
            label="Reactance"
            value={`${impedance.x >= 0 ? '+' : ''}${impedance.x.toFixed(1)}`}
            unit="Ω"
            visible={currentSection === 2}
          />
        </div>
      </section>
      
      {/* Section 4: The Reflection - VSWR */}
      <section 
        className="relative z-10 h-screen"
        style={{ scrollSnapAlign: 'start' }}
      >
        <SectionText
          eyebrow={narrative.section4.eyebrow}
          title={narrative.section4.title}
          subtitle={narrative.section4.subtitle}
          instruction={narrative.section4.instruction}
          visible={currentSection === 3}
          position="bottom-left"
        />
        
        {/* VSWR & Gamma Display */}
        <div 
          className="absolute top-1/4 right-12 flex flex-col gap-6 transition-all duration-500"
          style={{ opacity: currentSection === 3 ? 1 : 0 }}
        >
          <DataDisplay
            label={narrative.section4.vswr}
            value={vswr === Infinity ? '∞' : vswr.toFixed(2)}
            highlight={vswr > 2}
            visible={currentSection === 3}
          />
          <DataDisplay
            label={narrative.section4.gamma}
            value={gamma.mag.toFixed(3)}
            visible={currentSection === 3}
          />
        </div>
      </section>
      
      {/* Section 5: The Control - Full Lab */}
      <section 
        className="relative z-10 h-screen"
        style={{ scrollSnapAlign: 'start' }}
      >
        <SectionText
          eyebrow={narrative.section5.eyebrow}
          title={narrative.section5.title}
          subtitle={narrative.section5.subtitle}
          visible={currentSection === 4}
          position="center"
        />
        
        {/* Enter Lab Button */}
        <div 
          className="absolute bottom-24 left-1/2 -translate-x-1/2 transition-all duration-700"
          style={{ 
            opacity: currentSection === 4 ? 1 : 0,
            transform: `translateX(-50%) translateY(${currentSection === 4 ? 0 : 30}px)`,
          }}
        >
          <button
            onClick={handleComplete}
            className="px-10 py-4 rounded-lg font-semibold tracking-wide transition-all duration-300 hover:-translate-y-1 hover:scale-105"
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              backgroundColor: 'rgba(255, 215, 0, 0.15)',
              border: '2px solid rgba(255, 215, 0, 0.8)',
              color: '#FFD700',
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
              fontSize: '1.1rem',
            }}
          >
            {lang === 'zh' ? '进入完整实验室' : 'Enter Full Laboratory'}
          </button>
        </div>
        
        {/* Full Data Panel */}
        <div 
          className="absolute top-1/4 right-12 flex flex-col gap-4 p-6 rounded-xl transition-all duration-700"
          style={{ 
            opacity: currentSection === 4 ? 1 : 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <DataDisplay label="Z" value={`${impedance.r.toFixed(1)} ${impedance.x >= 0 ? '+' : ''}${impedance.x.toFixed(1)}j`} unit="Ω" visible={currentSection === 4} />
          <DataDisplay label="VSWR" value={vswr === Infinity ? '∞' : vswr.toFixed(2)} highlight={vswr > 2} visible={currentSection === 4} />
          <DataDisplay label="|Γ|" value={gamma.mag.toFixed(3)} visible={currentSection === 4} />
          <DataDisplay label="∠Γ" value={`${gamma.phase}°`} visible={currentSection === 4} />
        </div>
      </section>
      
      {/* Section Indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: currentSection === i ? '#FFD700' : 'rgba(255, 255, 255, 0.2)',
              boxShadow: currentSection === i ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
              transform: currentSection === i ? 'scale(1.5)' : 'scale(1)',
            }}
          />
        ))}
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes scrollPulse {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(6px); opacity: 1; }
        }
        
        @keyframes infinityFlash {
          0% { 
            opacity: 0;
            transform: scale(0.8);
          }
          20% { 
            opacity: 1;
            transform: scale(1.1);
          }
          100% { 
            opacity: 0.3;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default SmithOdyssey;



