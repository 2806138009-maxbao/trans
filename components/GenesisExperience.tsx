import React, { useEffect, useRef, useState, useCallback } from 'react';
import { THEME } from '../theme';

/**
 * GenesisExperience - S+ Tier Immersive Scrollytelling System
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────┐
 * │  THE STAGE (position: fixed, 100vh)                     │
 * │  ┌─────────────────────────────────────────────────┐   │
 * │  │  ConformalCanvas - Math-driven animation        │   │
 * │  │  Bilinear Transform: Γ = (z-1)/(z+1)           │   │
 * │  └─────────────────────────────────────────────────┘   │
 * │  ┌─────────────────────────────────────────────────┐   │
 * │  │  TextOverlay - Phase-synced narrative           │   │
 * │  └─────────────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────────────┘
 * ┌─────────────────────────────────────────────────────────┐
 * │  THE SCRIPT (position: relative, height: 500vh)        │
 * │  Scroll triggers that drive canvas animation           │
 * └─────────────────────────────────────────────────────────┘
 * 
 * Four Movements:
 * 1. The Linear Void (0-15%) - Single resistance line
 * 2. The Frequency Invasion (15-35%) - Grid emergence  
 * 3. Topological Origami (35-85%) - The collapse
 * 4. The Circle Born (85-100%) - Smith Chart complete
 */

interface GenesisExperienceProps {
  onComplete?: () => void;
  lang?: 'zh' | 'en';
}

// ========================================
// NARRATIVE CONTENT
// ========================================

const NARRATIVE = {
  zh: {
    phase1: {
      eyebrow: 'MOVEMENT I',
      title: '线性的荒原',
      lines: [
        '起初，只有电阻。',
        '在直流电的世界里，能量是线性的，',
        '它通向无穷远处，永不回头。',
      ],
    },
    phase2: {
      eyebrow: 'MOVEMENT II', 
      title: '频率的入侵',
      lines: [
        '频率引入了电抗。',
        '世界变复杂了。',
        '这虽然精确，但它太大了——',
        '我们要如何在一张纸上画出「无限」？',
      ],
    },
    phase3: {
      eyebrow: 'MOVEMENT III',
      title: '拓扑折纸',
      lines: [
        '弯曲空间。',
        '折叠无限。',
        '我们将整个右半复平面，',
        '卷入一个单位圆中。',
      ],
    },
    phase4: {
      eyebrow: 'MOVEMENT IV',
      title: '圆的诞生',
      lines: [
        '这，就是史密斯圆图。',
        '一切阻抗，尽在掌控。',
      ],
    },
    cta: '进入实验室',
    scrollHint: '向下滚动',
  },
  en: {
    phase1: {
      eyebrow: 'MOVEMENT I',
      title: 'The Linear Void',
      lines: [
        'In the beginning, there was only Resistance.',
        'In the world of DC, energy flows linearly,',
        'stretching to infinity, never returning.',
      ],
    },
    phase2: {
      eyebrow: 'MOVEMENT II',
      title: 'The Frequency Invasion', 
      lines: [
        'Frequency introduced Reactance.',
        'Complexity emerged.',
        'This is precise, but it\'s too vast—',
        'How do we draw "infinity" on a single page?',
      ],
    },
    phase3: {
      eyebrow: 'MOVEMENT III',
      title: 'Topological Origami',
      lines: [
        'Bend space.',
        'Fold infinity.',
        'We collapse the entire right-half complex plane',
        'into a single unit circle.',
      ],
    },
    phase4: {
      eyebrow: 'MOVEMENT IV',
      title: 'The Circle Born',
      lines: [
        'This is the Smith Chart.',
        'All impedance, under control.',
      ],
    },
    cta: 'Enter the Lab',
    scrollHint: 'Scroll to begin',
  },
};

// ========================================
// MATH UTILITIES
// ========================================

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);
const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInOutCubic = (t: number): number => 
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Bilinear transform: z → Γ
const zToGamma = (r: number, x: number): { re: number; im: number } => {
  const denMagSq = (r + 1) * (r + 1) + x * x;
  if (denMagSq < 0.0001) return { re: 1, im: 0 };
  return {
    re: ((r - 1) * (r + 1) + x * x) / denMagSq,
    im: (2 * x) / denMagSq,
  };
};

// Spring physics for string vibration
interface SpringPoint {
  y: number;
  vy: number;
}

// ========================================
// CONFORMAL CANVAS ENGINE
// ========================================

class ConformalEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private dpr: number;
  
  private progress: number = 0;
  private time: number = 0;
  
  // String physics (Phase 1)
  private stringPoints: SpringPoint[] = [];
  private readonly STRING_COUNT = 80;
  private readonly SPRING_K = 0.12;
  private readonly DAMPING = 0.92;
  
  // Cursor
  private cursorX: number = 0;
  private cursorY: number = 0;
  private showCursor: boolean = false;
  
  // Grid config
  private readonly R_VALUES = [0, 0.2, 0.5, 1, 2, 5, 10];
  private readonly X_VALUES = [-10, -5, -2, -1, -0.5, 0, 0.5, 1, 2, 5, 10];
  
  // Effects
  private birthFlash: number = 0;
  private hasTriggeredBirth: boolean = false;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.initString();
  }
  
  private initString(): void {
    this.stringPoints = [];
    for (let i = 0; i < this.STRING_COUNT; i++) {
      this.stringPoints.push({ y: 0, vy: 0 });
    }
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
  
  setProgress(p: number): void {
    this.progress = clamp(p, 0, 1);
    
    if (this.progress >= 0.85 && !this.hasTriggeredBirth) {
      this.birthFlash = 1;
      this.hasTriggeredBirth = true;
    }
    if (this.progress < 0.80) {
      this.hasTriggeredBirth = false;
    }
  }
  
  setCursor(x: number, y: number, show: boolean): void {
    this.cursorX = x;
    this.cursorY = y;
    this.showCursor = show;
  }
  
  pluckString(normalizedX: number, direction: number): void {
    const idx = Math.floor(normalizedX * this.STRING_COUNT);
    for (let i = 0; i < this.STRING_COUNT; i++) {
      const dist = Math.abs(i - idx);
      if (dist < 12) {
        const falloff = 1 - dist / 12;
        this.stringPoints[i].vy += 40 * falloff * direction;
      }
    }
  }
  
  private updateStringPhysics(): void {
    for (let i = 0; i < this.stringPoints.length; i++) {
      const p = this.stringPoints[i];
      const spring = -this.SPRING_K * p.y;
      let neighbor = 0;
      if (i > 0) neighbor += (this.stringPoints[i-1].y - p.y) * 0.25;
      if (i < this.stringPoints.length - 1) neighbor += (this.stringPoints[i+1].y - p.y) * 0.25;
      p.vy += spring + neighbor;
      p.vy *= this.DAMPING;
      p.y += p.vy;
    }
  }
  
  private getTransformProgress(): number {
    if (this.progress < 0.35) return 0;
    if (this.progress >= 0.85) return 1;
    return (this.progress - 0.35) / 0.50;
  }
  
  render(): void {
    this.time += 0.016;
    this.updateStringPhysics();
    
    if (this.birthFlash > 0) {
      this.birthFlash *= 0.94;
      if (this.birthFlash < 0.01) this.birthFlash = 0;
    }
    
    const ctx = this.ctx;
    const { width, height, progress } = this;
    const transformT = easeOutQuart(this.getTransformProgress());
    
    const cx = width / 2;
    const cy = height / 2;
    const smithR = Math.min(width, height) * 0.36;
    const cartScale = smithR * 0.1;
    
    // ========================================
    // BACKGROUND
    // ========================================
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);
    
    // Birth flash
    if (this.birthFlash > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${this.birthFlash * 0.25})`;
      ctx.fillRect(0, 0, width, height);
    }
    
    // ========================================
    // PHASE 1: THE LINEAR VOID (0-15%)
    // ========================================
    const p1Opacity = progress < 0.15 ? 1 : Math.max(0, 1 - (progress - 0.15) / 0.05);
    
    if (p1Opacity > 0.01) {
      ctx.save();
      ctx.globalAlpha = p1Opacity;
      
      // Glow
      const glow = ctx.createLinearGradient(0, cy - 30, 0, cy + 30);
      glow.addColorStop(0, 'rgba(255, 255, 255, 0)');
      glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, cy - 30, width, 60);
      
      // String with physics
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < this.stringPoints.length; i++) {
        const x = (i / (this.stringPoints.length - 1)) * width;
        const y = cy + this.stringPoints[i].y;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Labels
      ctx.font = '12px "Space Grotesk", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'left';
      ctx.fillText('0', 30, cy - 15);
      ctx.textAlign = 'right';
      ctx.fillText('∞', width - 30, cy - 15);
      
      // Cursor point
      if (this.showCursor && Math.abs(this.cursorY - cy) < 50) {
        const pulse = 5 + Math.sin(this.time * 5) * 2;
        const ptGlow = ctx.createRadialGradient(this.cursorX, cy, 0, this.cursorX, cy, 35);
        ptGlow.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
        ptGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = ptGlow;
        ctx.beginPath();
        ctx.arc(this.cursorX, cy, 35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.cursorX, cy, pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
    
    // ========================================
    // PHASE 2+: GRID & TRANSFORM
    // ========================================
    const gridOpacity = progress < 0.15 ? 0 : Math.min(1, (progress - 0.15) / 0.1);
    
    if (gridOpacity > 0.01) {
      ctx.save();
      ctx.globalAlpha = gridOpacity;
      
      // Color: White → Gold
      const colorT = transformT;
      const r = 255;
      const g = Math.round(lerp(255, 215, colorT));
      const b = Math.round(lerp(255, 0, colorT));
      const mainCol = `rgb(${r}, ${g}, ${b})`;
      const dimCol = `rgba(${r}, ${g}, ${b}, 0.2)`;
      
      // Constant-R lines
      for (const rVal of this.R_VALUES) {
        ctx.strokeStyle = rVal === 1 ? mainCol : dimCol;
        ctx.lineWidth = rVal === 1 ? 1.5 : 0.7;
        ctx.beginPath();
        
        for (let i = 0; i <= 50; i++) {
          const t = i / 50;
          const xVal = lerp(-12, 12, t);
          
          const cartX = cx + rVal * cartScale;
          const cartY = cy - xVal * cartScale;
          
          const gamma = zToGamma(rVal, xVal);
          const smithX = cx + gamma.re * smithR;
          const smithY = cy - gamma.im * smithR;
          
          const px = lerp(cartX, smithX, transformT);
          const py = lerp(cartY, smithY, transformT);
          
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      
      // Constant-X lines
      for (const xVal of this.X_VALUES) {
        ctx.strokeStyle = xVal === 0 ? mainCol : dimCol;
        ctx.lineWidth = xVal === 0 ? 1.5 : 0.7;
        ctx.beginPath();
        
        for (let i = 0; i <= 40; i++) {
          const t = i / 40;
          const rVal = t * 15;
          
          const cartX = cx + rVal * cartScale;
          const cartY = cy - xVal * cartScale;
          
          const gamma = zToGamma(rVal, xVal);
          const smithX = cx + gamma.re * smithR;
          const smithY = cy - gamma.im * smithR;
          
          const px = lerp(cartX, smithX, transformT);
          const py = lerp(cartY, smithY, transformT);
          
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      
      // Unit circle
      if (transformT > 0.3) {
        const circleA = (transformT - 0.3) / 0.7;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${circleA * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, smithR, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Phase 4 elements
      if (progress >= 0.85) {
        const p4Alpha = (progress - 0.85) / 0.15;
        
        // Center glow
        const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
        centerGlow.addColorStop(0, `rgba(100, 255, 150, ${p4Alpha * 0.5})`);
        centerGlow.addColorStop(1, 'rgba(100, 255, 150, 0)');
        ctx.fillStyle = centerGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // Center point
        ctx.fillStyle = `rgba(100, 255, 150, ${p4Alpha})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Open/Short markers
        ctx.fillStyle = `rgba(255, 100, 100, ${p4Alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(cx + smithR, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(100, 150, 255, ${p4Alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(cx - smithR, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Tactical corners
        ctx.strokeStyle = `rgba(255, 215, 0, ${p4Alpha * 0.5})`;
        ctx.lineWidth = 1;
        const cs = 25, m = 40;
        
        ctx.beginPath();
        ctx.moveTo(m, m + cs); ctx.lineTo(m, m); ctx.lineTo(m + cs, m);
        ctx.moveTo(width - m - cs, m); ctx.lineTo(width - m, m); ctx.lineTo(width - m, m + cs);
        ctx.moveTo(m, height - m - cs); ctx.lineTo(m, height - m); ctx.lineTo(m + cs, height - m);
        ctx.moveTo(width - m - cs, height - m); ctx.lineTo(width - m, height - m); ctx.lineTo(width - m, height - m - cs);
        ctx.stroke();
      }
      
      ctx.restore();
    }
  }
  
  destroy(): void {}
}

// ========================================
// TEXT OVERLAY COMPONENT
// ========================================

interface TextOverlayProps {
  progress: number;
  lang: 'zh' | 'en';
}

const TextOverlay: React.FC<TextOverlayProps> = ({ progress, lang }) => {
  const narrative = NARRATIVE[lang];
  
  const getPhase = () => {
    if (progress < 0.15) return narrative.phase1;
    if (progress < 0.35) return narrative.phase2;
    if (progress < 0.85) return narrative.phase3;
    return narrative.phase4;
  };
  
  const getOpacity = () => {
    // Fade in/out at phase boundaries
    const boundaries = [0, 0.15, 0.35, 0.85, 1];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const start = boundaries[i];
      const end = boundaries[i + 1];
      if (progress >= start && progress < end) {
        const fadeIn = Math.min(1, (progress - start) / 0.05);
        const fadeOut = Math.min(1, (end - progress) / 0.05);
        return Math.min(fadeIn, fadeOut);
      }
    }
    return 1;
  };
  
  const phase = getPhase();
  const opacity = getOpacity();
  
  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8"
      style={{ opacity }}
    >
      {/* Eyebrow */}
      <div 
        className="mb-4 px-4 py-1.5 rounded-full"
        style={{ 
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
        }}
      >
        <span 
          className="text-[10px] font-mono tracking-[0.2em]"
          style={{ color: '#FFD700' }}
        >
          {phase.eyebrow}
        </span>
      </div>
      
      {/* Title */}
      <h2 
        className="text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-6"
        style={{ 
          fontFamily: '"Space Grotesk", sans-serif',
          letterSpacing: '-0.04em',
          color: progress >= 0.85 ? '#FFD700' : '#FFFFFF',
          textShadow: progress >= 0.85 
            ? '0 0 40px rgba(255, 215, 0, 0.5)' 
            : '0 0 30px rgba(0, 0, 0, 0.8)',
          transition: 'color 0.5s, text-shadow 0.5s',
        }}
      >
        {phase.title}
      </h2>
      
      {/* Lines */}
      <div className="text-center max-w-xl">
        {phase.lines.map((line, i) => (
          <p 
            key={i}
            className="text-base md:text-lg leading-relaxed"
            style={{ 
              fontFamily: '"Space Grotesk", sans-serif',
              letterSpacing: '-0.02em',
              color: i === 0 ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.5)',
              fontStyle: i > 0 ? 'italic' : 'normal',
            }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};

// ========================================
// SCROLL HINT COMPONENT
// ========================================

const ScrollHint: React.FC<{ opacity: number; text: string }> = ({ opacity, text }) => (
  <div 
    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
    style={{ opacity, transition: 'opacity 0.5s' }}
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
// CTA BUTTON COMPONENT
// ========================================

const CTAButton: React.FC<{ onClick: () => void; text: string; visible: boolean }> = ({ onClick, text, visible }) => (
  <div 
    className="absolute bottom-20 left-1/2 -translate-x-1/2"
    style={{ 
      opacity: visible ? 1 : 0,
      transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      transition: 'opacity 0.5s, transform 0.5s',
      pointerEvents: visible ? 'auto' : 'none',
    }}
  >
    <button
      onClick={onClick}
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
      {text}
    </button>
  </div>
);

// ========================================
// MAIN COMPONENT
// ========================================

export const GenesisExperience: React.FC<GenesisExperienceProps> = ({
  onComplete,
  lang = 'zh',
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ConformalEngine | null>(null);
  const animIdRef = useRef<number>(0);
  const scriptRef = useRef<HTMLDivElement>(null);
  
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const narrative = NARRATIVE[lang];
  
  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    engineRef.current = new ConformalEngine(canvas);
    
    const animate = () => {
      engineRef.current?.render();
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
  
  // Scroll handler
  useEffect(() => {
    const script = scriptRef.current;
    if (!script) return;
    
    const handleScroll = () => {
      const rect = script.getBoundingClientRect();
      const scrollHeight = script.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const p = clamp(scrolled / scrollHeight, 0, 1);
      
      setProgress(p);
      engineRef.current?.setProgress(p);
      
      if (p >= 0.98 && !isComplete) {
        setIsComplete(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isComplete]);
  
  // Mouse handlers for string pluck
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!engineRef.current) return;
    engineRef.current.setCursor(e.clientX, e.clientY, true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    engineRef.current?.setCursor(0, 0, false);
  }, []);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!engineRef.current || progress > 0.15) return;
    const normalizedX = e.clientX / window.innerWidth;
    const direction = e.clientY > window.innerHeight / 2 ? 1 : -1;
    engineRef.current.pluckString(normalizedX, direction);
  }, [progress]);
  
  const handleCTA = useCallback(() => {
    onComplete?.();
  }, [onComplete]);
  
  return (
    <div className="relative">
      {/* THE STAGE - Fixed fullscreen canvas */}
      <div 
        ref={stageRef}
        className="fixed inset-0 z-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: '#050505' }}
        />
        
        {/* Text Overlay */}
        <TextOverlay progress={progress} lang={lang} />
        
        {/* Scroll Hint */}
        <ScrollHint 
          opacity={progress < 0.05 ? 1 : 0} 
          text={narrative.scrollHint} 
        />
        
        {/* CTA Button */}
        <CTAButton 
          onClick={handleCTA}
          text={narrative.cta}
          visible={isComplete}
        />
        
        {/* Progress Indicator */}
        <div className="absolute bottom-6 right-6">
          <div 
            className="text-xs font-mono"
            style={{ color: 'rgba(255, 215, 0, 0.4)' }}
          >
            {Math.round(progress * 100)}%
          </div>
        </div>
      </div>
      
      {/* THE SCRIPT - Scroll trigger area */}
      <div 
        ref={scriptRef}
        className="relative z-10 pointer-events-none"
        style={{ height: '500vh' }}
      >
        {/* Invisible scroll triggers */}
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes scrollPulse {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default GenesisExperience;



