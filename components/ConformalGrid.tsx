import React, { useEffect, useRef, useCallback } from 'react';

/**
 * ConformalGrid - The Mathematical Heart of Smith Chart
 * 
 * OPTIMIZED VERSION:
 * - Reduced grid point count
 * - Throttled physics updates
 * - Cached color calculations
 * - Skip frames when idle
 */

interface ConformalGridProps {
  scrollProgress: number;
  width?: number;
  height?: number;
  className?: string;
}

interface SpringPoint {
  y: number;
  vy: number;
  targetY: number;
}

interface GridPoint {
  zRe: number;
  zIm: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
}

// Simplified noise
const noise2D = (x: number, y: number, seed: number = 0): number => {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
};

// Easing
const easeOutElastic = (t: number): number => {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// Bilinear transform
const bilinearTransform = (zRe: number, zIm: number): { re: number; im: number } => {
  const numRe = zRe - 1;
  const numIm = zIm;
  const denRe = zRe + 1;
  const denIm = zIm;
  const denMagSq = denRe * denRe + denIm * denIm;
  
  if (denMagSq < 0.0001) return { re: 1, im: 0 };
  
  return {
    re: (numRe * denRe + numIm * denIm) / denMagSq,
    im: (numIm * denRe - numRe * denIm) / denMagSq,
  };
};

// ========================================
// OPTIMIZED ENGINE
// ========================================

class ConformalGridEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private dpr: number;
  
  private time: number = 0;
  private scrollProgress: number = 0;
  private lastScrollProgress: number = -1;
  
  // Phase 1: String - REDUCED point count
  private stringPoints: SpringPoint[] = [];
  private readonly STRING_POINT_COUNT = 50; // Was 100
  
  // Phase 2 & 3: Grid - REDUCED density
  private gridPointsH: GridPoint[][] = [];
  private gridPointsV: GridPoint[][] = [];
  
  // Physics
  private readonly SPRING_K = 0.12;
  private readonly DAMPING = 0.9;
  
  // Performance
  private frameSkip = 0;
  private isIdle = false;
  
  // Cached colors
  private cachedGridColor: string = '#FFFFFF';
  private lastColorProgress: number = -1;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    this.initStringPoints();
    this.initGridPoints();
  }
  
  private initStringPoints(): void {
    this.stringPoints = [];
    for (let i = 0; i < this.STRING_POINT_COUNT; i++) {
      this.stringPoints.push({ y: 0, vy: 0, targetY: 0 });
    }
  }
  
  private initGridPoints(): void {
    // REDUCED: fewer R and X values
    const rValues = [0, 0.5, 1, 2, 5];
    const xValues = [-5, -2, -1, 0, 1, 2, 5];
    
    // Vertical lines: constant R - REDUCED points per line
    this.gridPointsV = rValues.map(r => {
      const line: GridPoint[] = [];
      for (let i = 0; i <= 30; i++) { // Was 60
        const t = i / 30;
        const x = (t - 0.5) * 16;
        line.push({
          zRe: r, zIm: x,
          x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0,
        });
      }
      return line;
    });
    
    // Horizontal lines: constant X - REDUCED
    this.gridPointsH = xValues.map(x => {
      const line: GridPoint[] = [];
      for (let i = 0; i <= 20; i++) { // Was 40
        const t = i / 20;
        const r = t * 8;
        line.push({
          zRe: r, zIm: x,
          x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0,
        });
      }
      return line;
    });
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
  
  setScrollProgress(progress: number): void {
    const newProgress = Math.max(0, Math.min(1, progress));
    // Only update if changed significantly
    if (Math.abs(newProgress - this.scrollProgress) > 0.001) {
      this.scrollProgress = newProgress;
      this.isIdle = false;
    }
  }
  
  handleMouseMove(mouseX: number, mouseY: number): void {
    if (this.scrollProgress >= 0.3) return;
    
    const centerY = this.height / 2;
    const distToString = Math.abs(mouseY - centerY);
    
    if (distToString < 40) {
      const normalizedX = mouseX / this.width;
      const pointIndex = Math.floor(normalizedX * this.STRING_POINT_COUNT);
      const pluckDirection = mouseY > centerY ? 1 : -1;
      
      for (let i = 0; i < this.STRING_POINT_COUNT; i++) {
        const dist = Math.abs(i - pointIndex);
        if (dist < 8) {
          const falloff = 1 - dist / 8;
          this.stringPoints[i].vy += 20 * falloff * pluckDirection;
        }
      }
      this.isIdle = false;
    }
  }
  
  private updatePhysics(): void {
    // String physics
    for (let i = 0; i < this.stringPoints.length; i++) {
      const point = this.stringPoints[i];
      const springForce = -this.SPRING_K * point.y;
      
      let neighborForce = 0;
      if (i > 0) neighborForce += (this.stringPoints[i - 1].y - point.y) * 0.25;
      if (i < this.stringPoints.length - 1) neighborForce += (this.stringPoints[i + 1].y - point.y) * 0.25;
      
      point.vy += springForce + neighborForce;
      point.vy *= this.DAMPING;
      point.y += point.vy;
    }
    
    // Grid physics - simplified
    const allLines = [...this.gridPointsV, ...this.gridPointsH];
    for (const line of allLines) {
      for (const point of line) {
        const dx = point.targetX - point.x;
        const dy = point.targetY - point.y;
        
        point.vx = (point.vx + dx * 0.06) * 0.88;
        point.vy = (point.vy + dy * 0.06) * 0.88;
        
        point.x += point.vx;
        point.y += point.vy;
      }
    }
  }
  
  private updateTargets(): void {
    // Skip if progress hasn't changed
    if (Math.abs(this.scrollProgress - this.lastScrollProgress) < 0.001) return;
    this.lastScrollProgress = this.scrollProgress;
    
    const progress = this.scrollProgress;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const chartRadius = Math.min(this.width, this.height) * 0.35;
    
    const phase2Progress = progress < 0.3 ? 0 : progress > 0.6 ? 1 : (progress - 0.3) / 0.3;
    const phase3Progress = progress < 0.6 ? 0 : (progress - 0.6) / 0.4;
    const elasticProgress = easeOutElastic(phase3Progress);
    
    const updateLine = (line: GridPoint[]) => {
      for (const point of line) {
        const gridScale = 35;
        const linearX = centerX + point.zRe * gridScale;
        const linearY = centerY - point.zIm * gridScale;
        
        // Simplified wave
        const waveAmp = 15 * phase2Progress * (1 - phase3Progress);
        const waveX = Math.sin(point.zIm * 0.4 + this.time * 1.5) * waveAmp;
        const waveY = Math.sin(point.zRe * 0.4 + this.time * 2) * waveAmp;
        
        const distortedX = linearX + waveX;
        const distortedY = linearY + waveY;
        
        const gamma = bilinearTransform(point.zRe, point.zIm);
        const smithX = centerX + gamma.re * chartRadius;
        const smithY = centerY - gamma.im * chartRadius;
        
        point.targetX = lerp(distortedX, smithX, elasticProgress);
        point.targetY = lerp(distortedY, smithY, elasticProgress);
      }
    };
    
    this.gridPointsV.forEach(updateLine);
    this.gridPointsH.forEach(updateLine);
  }
  
  private updateCachedColor(): void {
    const colorProgress = this.scrollProgress < 0.3 ? 0 : (this.scrollProgress - 0.3) / 0.7;
    if (Math.abs(colorProgress - this.lastColorProgress) < 0.01) return;
    this.lastColorProgress = colorProgress;
    
    const r = Math.round(255);
    const g = Math.round(lerp(255, 215, colorProgress));
    const b = Math.round(lerp(255, 0, colorProgress));
    this.cachedGridColor = `rgb(${r}, ${g}, ${b})`;
  }
  
  render(): void {
    const ctx = this.ctx;
    const progress = this.scrollProgress;
    
    // Clear
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, this.width, this.height);
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    const phase1Opacity = progress < 0.3 ? 1 : Math.max(0, 1 - (progress - 0.3) / 0.1);
    const gridOpacity = progress < 0.25 ? 0 : Math.min(1, (progress - 0.25) / 0.1);
    const phase3Opacity = progress < 0.6 ? 0 : Math.min(1, (progress - 0.6) / 0.1);
    
    // Phase 1: String
    if (phase1Opacity > 0.01) {
      ctx.globalAlpha = phase1Opacity;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      
      const step = Math.max(1, Math.floor(this.stringPoints.length / 50));
      for (let i = 0; i < this.stringPoints.length; i += step) {
        const x = (i / (this.stringPoints.length - 1)) * this.width;
        const y = centerY + this.stringPoints[i].y;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    
    // Phase 2 & 3: Grid
    if (gridOpacity > 0.01) {
      ctx.globalAlpha = gridOpacity * 0.5;
      ctx.strokeStyle = this.cachedGridColor;
      ctx.lineWidth = 1;
      
      // Draw lines with path batching
      ctx.beginPath();
      for (const line of this.gridPointsV) {
        for (let i = 0; i < line.length; i++) {
          const point = line[i];
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
      }
      ctx.stroke();
      
      ctx.beginPath();
      for (const line of this.gridPointsH) {
        for (let i = 0; i < line.length; i++) {
          const point = line[i];
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      
      // Unit circle in Phase 3
      if (phase3Opacity > 0.3) {
        const chartRadius = Math.min(this.width, this.height) * 0.35;
        ctx.globalAlpha = (phase3Opacity - 0.3) * 1.4;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, chartRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(100, 255, 150, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }
  
  tick(dt: number): void {
    this.time += dt;
    
    // Skip frames when idle
    if (this.isIdle) {
      this.frameSkip++;
      if (this.frameSkip < 3) return;
      this.frameSkip = 0;
    }
    
    this.updateCachedColor();
    this.updateTargets();
    this.updatePhysics();
    this.render();
    
    // Check if we can go idle
    let totalVelocity = 0;
    for (const p of this.stringPoints) totalVelocity += Math.abs(p.vy);
    if (totalVelocity < 0.1 && Math.abs(this.scrollProgress - this.lastScrollProgress) < 0.001) {
      this.isIdle = true;
    }
  }
  
  destroy(): void {}
}

// ========================================
// REACT COMPONENT
// ========================================

export const ConformalGrid: React.FC<ConformalGridProps> = ({
  scrollProgress,
  width,
  height,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ConformalGridEngine | null>(null);
  const lastTimeRef = useRef<number>(0);
  const animIdRef = useRef<number>(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    engineRef.current = new ConformalGridEngine(canvas);
    
    const animate = (timestamp: number) => {
      const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = timestamp;
      
      engineRef.current?.tick(Math.min(dt, 0.033));
      animIdRef.current = requestAnimationFrame(animate);
    };
    
    animIdRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animIdRef.current);
      engineRef.current?.destroy();
    };
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;
    
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = width ?? rect.width;
      const h = height ?? rect.height;
      engineRef.current?.resize(w, h);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);
  
  useEffect(() => {
    engineRef.current?.setScrollProgress(scrollProgress);
  }, [scrollProgress]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    engineRef.current.handleMouseMove(e.clientX - rect.left, e.clientY - rect.top);
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className={className}
      onMouseMove={handleMouseMove}
      style={{
        display: 'block',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        background: '#050505',
      }}
    />
  );
};

export default ConformalGrid;
