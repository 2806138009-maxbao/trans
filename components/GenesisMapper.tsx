import React, { useEffect, useRef, useState, useCallback } from 'react';
import { THEME } from '../theme';

/**
 * GenesisMapper - "无限·被收纳" 交互式演变剧本
 * 
 * 四个乐章 (Movements):
 * 1. 线性的荒原 (0-15%) - 单条电阻线
 * 2. 频率的入侵 (15-30%) - 网格浮现
 * 3. 拓扑折纸 (30-90%) - 空间弯曲
 * 4. 圆的诞生 (90-100%) - 史密斯圆图完成
 */

interface GenesisMapperProps {
  onComplete?: () => void;
  lang?: 'zh' | 'en';
  height?: number;
  className?: string;
}

// ========================================
// NARRATIVE CONTENT
// ========================================

const NARRATIVE = {
  zh: {
    movement1: {
      title: '线性的荒原',
      lines: [
        '起初，只有电阻。',
        '在直流电的世界里，能量是线性的，',
        '它通向无穷远处，永不回头。',
      ],
    },
    movement2: {
      title: '频率的入侵',
      lines: [
        '频率引入了电抗。世界变复杂了。',
        '这虽然精确，但它太大了。',
        '我们要如何在一张纸上画出「无限」？',
      ],
    },
    movement3: {
      title: '拓扑折纸',
      lines: [
        '弯曲空间。折叠无限。',
        '我们将整个右半复平面，',
        '卷入一个单位圆中。',
      ],
    },
    movement4: {
      title: '圆的诞生',
      lines: [
        '这，就是史密斯圆图。',
        '一切阻抗，尽在掌控。',
      ],
    },
    hint: '拖动滑块，亲手折叠无限',
    cta: '开始实验',
    resistance: '电阻 R',
    reactance: '电抗 X',
    openCircuit: '开路 ∞',
    shortCircuit: '短路 0',
    matched: '匹配点',
  },
  en: {
    movement1: {
      title: 'The Linear Void',
      lines: [
        'In the beginning, there was only Resistance.',
        'In the world of DC, energy flows linearly,',
        'stretching to infinity, never returning.',
      ],
    },
    movement2: {
      title: 'The Frequency Invasion',
      lines: [
        'Frequency introduced Reactance. Complexity emerged.',
        'This is precise, but it\'s too vast.',
        'How do we draw "infinity" on a single page?',
      ],
    },
    movement3: {
      title: 'Topological Origami',
      lines: [
        'Bend space. Fold infinity.',
        'We collapse the entire right-half complex plane',
        'into a single unit circle.',
      ],
    },
    movement4: {
      title: 'The Circle Born',
      lines: [
        'This is the Smith Chart.',
        'All impedance, under control.',
      ],
    },
    hint: 'Drag to fold infinity with your own hands',
    cta: 'Start Experiment',
    resistance: 'Resistance R',
    reactance: 'Reactance X',
    openCircuit: 'Open ∞',
    shortCircuit: 'Short 0',
    matched: 'Match',
  },
};

// ========================================
// MATH & RENDERING
// ========================================

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);
const easeInOutCubic = (t: number): number => 
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Bilinear transform
const zToGamma = (r: number, x: number): { re: number; im: number } => {
  const denMagSq = (r + 1) * (r + 1) + x * x;
  if (denMagSq < 0.0001) return { re: 1, im: 0 };
  return {
    re: ((r - 1) * (r + 1) + x * x) / denMagSq,
    im: (2 * x) / denMagSq,
  };
};

// Get current movement (1-4) based on progress
const getMovement = (progress: number): number => {
  if (progress < 0.15) return 1;
  if (progress < 0.30) return 2;
  if (progress < 0.90) return 3;
  return 4;
};

// ========================================
// GENESIS RENDERER ENGINE
// ========================================

class GenesisEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private dpr: number;
  
  private progress: number = 0;
  private targetProgress: number = 0;
  private time: number = 0;
  
  // Cursor tracking
  private cursorX: number = 0;
  private cursorY: number = 0;
  private showCursor: boolean = false;
  
  // Grid config - optimized counts
  private readonly R_VALUES = [0, 0.2, 0.5, 1, 2, 5, 10];
  private readonly X_VALUES = [-10, -5, -2, -1, -0.5, 0, 0.5, 1, 2, 5, 10];
  
  // Animation state
  private birthFlash: number = 0;
  private hasTriggeredBirth: boolean = false;
  
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
  
  setProgress(p: number): void {
    this.targetProgress = clamp(p, 0, 1);
    
    // Trigger birth flash when reaching 90%
    if (this.targetProgress >= 0.9 && !this.hasTriggeredBirth) {
      this.birthFlash = 1;
      this.hasTriggeredBirth = true;
    }
    if (this.targetProgress < 0.85) {
      this.hasTriggeredBirth = false;
    }
  }
  
  setCursor(x: number, y: number, show: boolean): void {
    this.cursorX = x;
    this.cursorY = y;
    this.showCursor = show;
  }
  
  private getTransformProgress(): number {
    // Movement 3 is where the actual transform happens (30% - 90%)
    if (this.progress < 0.30) return 0;
    if (this.progress >= 0.90) return 1;
    return (this.progress - 0.30) / 0.60;
  }
  
  private drawLine(points: {x: number; y: number}[], color: string, width: number = 1): void {
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }
  
  render(): void {
    this.time += 0.016;
    
    // Smooth progress interpolation
    const diff = this.targetProgress - this.progress;
    if (Math.abs(diff) > 0.001) {
      this.progress += diff * 0.08;
    } else {
      this.progress = this.targetProgress;
    }
    
    // Decay birth flash
    if (this.birthFlash > 0) {
      this.birthFlash *= 0.95;
      if (this.birthFlash < 0.01) this.birthFlash = 0;
    }
    
    const ctx = this.ctx;
    const { width, height, progress } = this;
    const movement = getMovement(progress);
    const transformT = easeOutQuart(this.getTransformProgress());
    
    const centerX = width / 2;
    const centerY = height / 2;
    const smithRadius = Math.min(width, height) * 0.38;
    const cartesianScale = smithRadius * 0.12;
    
    // ========================================
    // BACKGROUND
    // ========================================
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);
    
    // Birth flash overlay
    if (this.birthFlash > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${this.birthFlash * 0.3})`;
      ctx.fillRect(0, 0, width, height);
    }
    
    // ========================================
    // MOVEMENT 1: THE LINEAR VOID (0-15%)
    // Single glowing resistance line
    // ========================================
    const m1Opacity = progress < 0.15 ? 1 : Math.max(0, 1 - (progress - 0.15) / 0.05);
    
    if (m1Opacity > 0) {
      ctx.save();
      ctx.globalAlpha = m1Opacity;
      
      // The infinite resistance line
      const lineY = centerY;
      
      // Glow effect
      const glowGrad = ctx.createLinearGradient(0, lineY - 20, 0, lineY + 20);
      glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      glowGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, lineY - 20, width, 40);
      
      // The line itself
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(width, lineY);
      ctx.stroke();
      
      // Infinity symbols at edges
      ctx.font = '14px "Space Grotesk", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'left';
      ctx.fillText('0', 20, lineY - 10);
      ctx.textAlign = 'right';
      ctx.fillText('∞', width - 20, lineY - 10);
      
      // Cursor light point (if on line)
      if (this.showCursor && Math.abs(this.cursorY - lineY) < 30) {
        const pulseSize = 6 + Math.sin(this.time * 4) * 2;
        
        // Outer glow
        const pointGlow = ctx.createRadialGradient(
          this.cursorX, lineY, 0,
          this.cursorX, lineY, 30
        );
        pointGlow.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
        pointGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = pointGlow;
        ctx.beginPath();
        ctx.arc(this.cursorX, lineY, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Core point
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.cursorX, lineY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
    
    // ========================================
    // MOVEMENT 2+: GRID EMERGENCE & TRANSFORM
    // ========================================
    const gridOpacity = progress < 0.15 ? 0 : Math.min(1, (progress - 0.15) / 0.1);
    
    if (gridOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = gridOpacity;
      
      // Color transition: White → Gold
      const colorProgress = transformT;
      const r = 255;
      const g = Math.round(lerp(255, 215, colorProgress));
      const b = Math.round(lerp(255, 0, colorProgress));
      const mainColor = `rgb(${r}, ${g}, ${b})`;
      const dimColor = `rgba(${r}, ${g}, ${b}, 0.25)`;
      const veryDimColor = `rgba(${r}, ${g}, ${b}, 0.1)`;
      
      // ========================================
      // Draw Constant-R Lines (Vertical → Circles)
      // ========================================
      for (const rVal of this.R_VALUES) {
        const points: {x: number; y: number}[] = [];
        const numPoints = 50;
        
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          const xVal = lerp(-12, 12, t);
          
          // Cartesian position
          const cartX = centerX + rVal * cartesianScale;
          const cartY = centerY - xVal * cartesianScale;
          
          // Smith position
          const gamma = zToGamma(rVal, xVal);
          const smithX = centerX + gamma.re * smithRadius;
          const smithY = centerY - gamma.im * smithRadius;
          
          points.push({
            x: lerp(cartX, smithX, transformT),
            y: lerp(cartY, smithY, transformT),
          });
        }
        
        const isHighlight = rVal === 1;
        this.drawLine(points, isHighlight ? mainColor : dimColor, isHighlight ? 1.5 : 0.8);
      }
      
      // ========================================
      // Draw Constant-X Lines (Horizontal → Arcs)
      // ========================================
      for (const xVal of this.X_VALUES) {
        const points: {x: number; y: number}[] = [];
        const numPoints = 40;
        
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          const rVal = t * 15; // R from 0 to 15
          
          // Cartesian position
          const cartX = centerX + rVal * cartesianScale;
          const cartY = centerY - xVal * cartesianScale;
          
          // Smith position
          const gamma = zToGamma(rVal, xVal);
          const smithX = centerX + gamma.re * smithRadius;
          const smithY = centerY - gamma.im * smithRadius;
          
          points.push({
            x: lerp(cartX, smithX, transformT),
            y: lerp(cartY, smithY, transformT),
          });
        }
        
        const isHighlight = xVal === 0;
        this.drawLine(points, isHighlight ? mainColor : dimColor, isHighlight ? 1.5 : 0.8);
      }
      
      // ========================================
      // Unit Circle (fades in during transform)
      // ========================================
      if (transformT > 0.3) {
        const circleAlpha = (transformT - 0.3) / 0.7;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${circleAlpha * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, smithRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // ========================================
      // Key Points (Movement 4)
      // ========================================
      if (movement === 4) {
        const pointAlpha = (progress - 0.9) / 0.1;
        
        // Center point (Matched)
        ctx.fillStyle = `rgba(100, 255, 150, ${pointAlpha})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow
        const centerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40);
        centerGlow.addColorStop(0, `rgba(100, 255, 150, ${pointAlpha * 0.4})`);
        centerGlow.addColorStop(1, 'rgba(100, 255, 150, 0)');
        ctx.fillStyle = centerGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Open circuit (right)
        ctx.fillStyle = `rgba(255, 100, 100, ${pointAlpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(centerX + smithRadius, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Short circuit (left)
        ctx.fillStyle = `rgba(100, 150, 255, ${pointAlpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(centerX - smithRadius, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // ========================================
      // Tactical Corner Markers (Movement 4)
      // ========================================
      if (movement === 4) {
        const markerAlpha = (progress - 0.9) / 0.1;
        ctx.strokeStyle = `rgba(255, 215, 0, ${markerAlpha * 0.5})`;
        ctx.lineWidth = 1;
        
        const cornerSize = 20;
        const margin = 30;
        
        // Top-left
        ctx.beginPath();
        ctx.moveTo(margin, margin + cornerSize);
        ctx.lineTo(margin, margin);
        ctx.lineTo(margin + cornerSize, margin);
        ctx.stroke();
        
        // Top-right
        ctx.beginPath();
        ctx.moveTo(width - margin - cornerSize, margin);
        ctx.lineTo(width - margin, margin);
        ctx.lineTo(width - margin, margin + cornerSize);
        ctx.stroke();
        
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(margin, height - margin - cornerSize);
        ctx.lineTo(margin, height - margin);
        ctx.lineTo(margin + cornerSize, height - margin);
        ctx.stroke();
        
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(width - margin - cornerSize, height - margin);
        ctx.lineTo(width - margin, height - margin);
        ctx.lineTo(width - margin, height - margin - cornerSize);
        ctx.stroke();
      }
      
      // ========================================
      // Interactive Cursor Point (Movement 2-3)
      // ========================================
      if (this.showCursor && movement >= 2 && movement <= 3) {
        // Convert cursor to impedance
        const cursorR = (this.cursorX - centerX) / cartesianScale;
        const cursorX_val = -(this.cursorY - centerY) / cartesianScale;
        
        if (cursorR >= 0) {
          // Cartesian position
          const cartPosX = centerX + cursorR * cartesianScale;
          const cartPosY = centerY - cursorX_val * cartesianScale;
          
          // Smith position
          const gamma = zToGamma(cursorR, cursorX_val);
          const smithPosX = centerX + gamma.re * smithRadius;
          const smithPosY = centerY - gamma.im * smithRadius;
          
          // Interpolated position
          const pointX = lerp(cartPosX, smithPosX, transformT);
          const pointY = lerp(cartPosY, smithPosY, transformT);
          
          // Glow
          const pointGlow = ctx.createRadialGradient(pointX, pointY, 0, pointX, pointY, 25);
          pointGlow.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
          pointGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
          ctx.fillStyle = pointGlow;
          ctx.beginPath();
          ctx.arc(pointX, pointY, 25, 0, Math.PI * 2);
          ctx.fill();
          
          // Point
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(pointX, pointY, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      ctx.restore();
    }
  }
  
  destroy(): void {}
}

// ========================================
// REACT COMPONENT
// ========================================

export const GenesisMapper: React.FC<GenesisMapperProps> = ({
  onComplete,
  lang = 'zh',
  height = 450,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GenesisEngine | null>(null);
  const animIdRef = useRef<number>(0);
  
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const movement = getMovement(progress);
  const narrative = NARRATIVE[lang];
  const currentNarrative = movement === 1 ? narrative.movement1 :
                          movement === 2 ? narrative.movement2 :
                          movement === 3 ? narrative.movement3 :
                          narrative.movement4;
  
  // Initialize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    engineRef.current = new GenesisEngine(canvas);
    
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
  
  // Resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !engineRef.current) return;
    
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      engineRef.current?.resize(rect.width, height);
    };
    
    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [height]);
  
  // Update progress
  useEffect(() => {
    engineRef.current?.setProgress(progress);
  }, [progress]);
  
  // Slider handler
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(parseFloat(e.target.value));
  }, []);
  
  // Canvas mouse handlers
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !engineRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    engineRef.current.setCursor(e.clientX - rect.left, e.clientY - rect.top, true);
    
    if (isDragging) {
      const x = (e.clientX - rect.left) / rect.width;
      setProgress(clamp(x, 0, 1));
    }
  }, [isDragging]);
  
  const handleCanvasMouseLeave = useCallback(() => {
    engineRef.current?.setCursor(0, 0, false);
    setIsDragging(false);
  }, []);
  
  const handleCanvasMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);
  
  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // CTA handler
  const handleCTA = useCallback(() => {
    onComplete?.();
  }, [onComplete]);
  
  const progressPercent = Math.round(progress * 100);
  const isComplete = progress >= 0.95;
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Movement Title */}
      <div className="text-center mb-4">
        <div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2"
          style={{ 
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
          }}
        >
          <span 
            className="text-[10px] font-mono uppercase tracking-wider"
            style={{ color: '#FFD700' }}
          >
            Movement {movement}
          </span>
        </div>
        <h3 
          className="text-xl font-semibold transition-all duration-500"
          style={{ 
            color: isComplete ? '#FFD700' : '#FFFFFF',
            textShadow: isComplete ? '0 0 20px rgba(255, 215, 0, 0.5)' : 'none',
          }}
        >
          {currentNarrative.title}
        </h3>
      </div>
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl cursor-crosshair select-none"
        style={{ 
          height: `${height}px`,
          background: '#050505',
          border: `1px solid rgba(255, 215, 0, ${isComplete ? 0.4 : 0.1})`,
          boxShadow: isComplete ? '0 0 30px rgba(255, 215, 0, 0.15)' : 'none',
          transition: 'border-color 0.5s, box-shadow 0.5s',
        }}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
      />
      
      {/* Narrative Text */}
      <div 
        className="mt-4 text-center transition-opacity duration-500"
        style={{ minHeight: '60px' }}
      >
        {currentNarrative.lines.map((line, i) => (
          <p 
            key={i}
            className="text-sm leading-relaxed"
            style={{ 
              color: i === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)',
              fontStyle: i > 0 ? 'italic' : 'normal',
            }}
          >
            {line}
          </p>
        ))}
      </div>
      
      {/* Evolution Slider */}
      <div className="mt-6">
        <div className="flex justify-between text-[10px] uppercase tracking-wider mb-2">
          <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>Genesis</span>
          <span 
            className="font-mono"
            style={{ color: progress > 0.5 ? '#FFD700' : 'rgba(255, 255, 255, 0.5)' }}
          >
            {progressPercent}%
          </span>
          <span style={{ color: isComplete ? '#FFD700' : 'rgba(255, 255, 255, 0.3)' }}>
            Smith Chart
          </span>
        </div>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.005"
          value={progress}
          onChange={handleSliderChange}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, 
              #FFD700 0%, 
              #FFD700 ${progressPercent}%, 
              rgba(255, 255, 255, 0.1) ${progressPercent}%, 
              rgba(255, 255, 255, 0.1) 100%
            )`,
          }}
        />
        
        <p 
          className="text-center text-xs mt-2"
          style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        >
          {narrative.hint}
        </p>
      </div>
      
      {/* CTA Button (Movement 4) */}
      {isComplete && (
        <div className="mt-6 text-center animate-fade-in-up">
          <button
            onClick={handleCTA}
            className="px-8 py-3 rounded-lg font-semibold tracking-wide transition-all duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.15)',
              border: '1px solid rgba(255, 215, 0, 0.6)',
              color: '#FFD700',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)',
            }}
          >
            {narrative.cta}
          </button>
        </div>
      )}
      
      {/* Slider thumb styling */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FFD700;
          cursor: grab;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 25px rgba(255, 215, 0, 0.8);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FFD700;
          cursor: grab;
          border: none;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GenesisMapper;
