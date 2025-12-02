import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import { THEME } from '../theme';
import { Language } from '../types';
import { audio } from '../utils/audioEngine';

/**
 * GenesisIntro - Unified Immersive Intro Experience
 * 
 * TWO-STAGE ARCHITECTURE:
 * 
 * STAGE 1: CINEMATIC SPLASH (Auto-play, ~4.5s)
 * ┌─────────────────────────────────────────────────────────┐
 * │  "INITIALIZING RF MODULE..." → Laser → Grid Formation   │
 * │  → Flash → Title Reveal → "Scroll to Enter"             │
 * └─────────────────────────────────────────────────────────┘
 * 
 * STAGE 2: GENESIS SCROLLYTELLING (Scroll-controlled)
 * ┌─────────────────────────────────────────────────────────┐
 * │  Phase 1: The Linear Void (0-25%)                       │
 * │  Single resistance line + "阻抗"                         │
 * ├─────────────────────────────────────────────────────────┤
 * │  Phase 2: The Frequency Invasion (25-50%)               │
 * │  Grid emergence (1D→2D) + "匹配"                         │
 * ├─────────────────────────────────────────────────────────┤
 * │  Phase 3: Topological Origami (50-85%)                  │
 * │  The collapse + "反射"                                   │
 * ├─────────────────────────────────────────────────────────┤
 * │  Phase 4: The Circle Born (85-100%)                     │
 * │  Smith Chart complete + "圆图" + CTA                     │
 * └─────────────────────────────────────────────────────────┘
 */

interface GenesisIntroProps {
  lang: Language;
  onComplete: () => void;
  reducedMotion?: boolean;
}

// ========================================
// NARRATIVE CONTENT
// ========================================

const NARRATIVE = {
  zh: {
    splash: {
      init: 'INITIALIZING RF MODULE...',
      title: '史密斯圆图',
      subtitle: 'Impedance Lab',
      scroll: '向下滚动进入',
    },
    phase1: {
      bgText: '阻抗',
      formula: 'Z = R + jX',
      subtitle: '电阻与电抗的组合',
    },
    phase2: {
      bgText: '匹配',
      formula: 'Z_s = Z_L*',
      subtitle: '消除反射 · 最大功率传输',
    },
    phase3: {
      bgText: '反射',
      formula: 'Γ = (Z − Z₀) / (Z + Z₀)',
      subtitle: '将无限折叠进有限',
    },
    phase4: {
      bgText: '圆图',
      formula: '∞ → ○',
      subtitle: '一切阻抗，尽在掌控',
      cta: '开始实验',
    },
  },
  en: {
    splash: {
      init: 'INITIALIZING RF MODULE...',
      title: 'Smith Chart',
      subtitle: 'Impedance Lab',
      scroll: 'SCROLL TO ENTER',
    },
    phase1: {
      bgText: 'IMPEDANCE',
      formula: 'Z = R + jX',
      subtitle: 'Resistance + Reactance',
    },
    phase2: {
      bgText: 'MATCH',
      formula: 'Z_s = Z_L*',
      subtitle: 'Eliminate Reflection · Maximum Power',
    },
    phase3: {
      bgText: 'REFLECTION',
      formula: 'Γ = (Z − Z₀) / (Z + Z₀)',
      subtitle: 'Fold infinity into finite',
    },
    phase4: {
      bgText: 'CHART',
      formula: '∞ → ○',
      subtitle: 'All impedance, under control',
      cta: 'Begin Experiment',
    },
  },
};

// ========================================
// MATH UTILITIES
// ========================================

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

// Bilinear transform: z → Γ
const zToGamma = (r: number, x: number): { re: number; im: number } => {
  const denMagSq = (r + 1) * (r + 1) + x * x;
  if (denMagSq < 0.0001) return { re: 1, im: 0 };
  return {
    re: ((r - 1) * (r + 1) + x * x) / denMagSq,
    im: (2 * x) / denMagSq,
  };
};

// Spring physics
interface SpringPoint {
  y: number;
  vy: number;
}

// ========================================
// CANVAS ENGINE
// ========================================

class GenesisCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private dpr: number;
  
  private progress: number = 0;
  private time: number = 0;
  
  // Grid config
  private readonly R_VALUES = [0, 0.2, 0.5, 1, 2, 5, 10];
  private readonly X_VALUES = [-10, -5, -2, -1, -0.5, 0, 0.5, 1, 2, 5, 10];
  
  // Effects
  private birthFlash: number = 0;
  private hasTriggeredBirth: boolean = false;
  
  // Laser injection animation
  private injectionProgress: number = 0;
  private injectionStarted: boolean = false;
  
  // X-axis laser injection
  private xAxisInjectionProgress: number = 0;
  private xAxisInjectionStarted: boolean = false;
  
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
    this.progress = clamp(p, 0, 1);
    
    if (this.progress >= 0.85 && !this.hasTriggeredBirth) {
      this.birthFlash = 1;
      this.hasTriggeredBirth = true;
    }
    if (this.progress < 0.80) {
      this.hasTriggeredBirth = false;
    }
  }
  
  private getTransformProgress(): number {
    // Transform starts at 50% (phase 3) and completes at 85%
    if (this.progress < 0.50) return 0;
    if (this.progress >= 0.85) return 1;
    return (this.progress - 0.50) / 0.35;
  }
  
  render(): void {
    this.time += 0.016;
    
    const ctx = this.ctx;
    const { width, height, progress } = this;
    const transformT = easeOutQuart(this.getTransformProgress());
    
    const cx = width / 2;
    const cy = height / 2;
    const smithR = Math.min(width, height) * 0.32;
    const cartScale = smithR * 0.1;
    
    // ========================================
    // BACKGROUND - Deep Dark
    // ========================================
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, width, height);
    
    // ========================================
    // PHASE 0: LASER INJECTION (0-8%)
    // A beam of light shoots across the screen
    // ========================================
    if (progress > 0.01 && !this.injectionStarted) {
      this.injectionStarted = true;
      this.injectionProgress = 0;
    }
    
    if (this.injectionStarted && this.injectionProgress < 1) {
      this.injectionProgress += 0.06; // Complete in ~16 frames
      if (this.injectionProgress > 1) this.injectionProgress = 1;
    }
    
    // Draw the laser beam during early phase
    if (this.injectionStarted && progress < 0.15) {
      ctx.save();
      
      // Calculate beam head position with cubic easing
      const t = this.injectionProgress;
      const eased = t < 0.5 
        ? 4 * t * t * t  // Fast acceleration
        : 1 - Math.pow(-2 * t + 2, 3) / 2; // Deceleration
      
      const beamHeadX = eased * (width + 50);
      
      // Beam glow (wide, soft)
      const glowGradient = ctx.createLinearGradient(0, cy - 60, 0, cy + 60);
      glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
      glowGradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.15 * (1 - Math.max(0, this.injectionProgress - 0.8) * 5)})`);
      glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, cy - 60, beamHeadX, 120);
      
      // Main beam (bright core)
      const coreGradient = ctx.createLinearGradient(
        Math.max(0, beamHeadX - 200), cy, 
        beamHeadX, cy
      );
      coreGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
      coreGradient.addColorStop(0.7, 'rgba(255, 215, 0, 1)');
      coreGradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
      
      ctx.strokeStyle = coreGradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-50, cy);
      ctx.lineTo(beamHeadX, cy);
      ctx.stroke();
      
      // Beam head (intense point) - only while moving
      if (this.injectionProgress < 0.95) {
        const headGlow = ctx.createRadialGradient(beamHeadX, cy, 0, beamHeadX, cy, 25);
        headGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
        headGlow.addColorStop(0.3, 'rgba(255, 215, 0, 0.8)');
        headGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(beamHeadX, cy, 25, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
    
    // Skip grid drawing until injection is mostly complete
    if (progress < 0.05 || (this.injectionStarted && this.injectionProgress < 0.9)) {
      return;
    }
    
    // ========================================
    // ANIMATION PHASES
    // 0% - 25%: Single horizontal line (R axis only)
    // 25% - 50%: X axis appears (2D Cartesian plane)
    // 50% - 100%: Transform to Smith Chart
    // ========================================
    const phase2Progress = progress < 0.25 ? 0 : 
      progress < 0.50 ? easeOutQuart((progress - 0.25) / 0.25) : 1;
    
    // Color transition: White → Gold (during Smith transform phase)
    const colorT = transformT;
    const lineR = 255;
    const lineG = Math.round(lerp(255, 215, colorT));
    const lineB = Math.round(lerp(255, 0, colorT));
    const mainColor = `rgb(${lineR}, ${lineG}, ${lineB})`;
    
    // Cartesian coordinate system size
    const axisLength = smithR * 1.2;
    
    ctx.save();
    
    // ========================================
    // PHASE 1 & 2: CARTESIAN COORDINATE SYSTEM
    // ========================================
    if (transformT < 1) {
      const cartOpacity = 1 - transformT;
      
      // R axis (horizontal) - always visible after injection
      ctx.strokeStyle = `rgba(${lineR}, ${lineG}, ${lineB}, ${cartOpacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - axisLength, cy);
      ctx.lineTo(cx + axisLength, cy);
      ctx.stroke();
      
      // R axis arrow (right)
      ctx.fillStyle = `rgba(${lineR}, ${lineG}, ${lineB}, ${cartOpacity})`;
      ctx.beginPath();
      ctx.moveTo(cx + axisLength, cy);
      ctx.lineTo(cx + axisLength - 10, cy - 5);
      ctx.lineTo(cx + axisLength - 10, cy + 5);
      ctx.closePath();
      ctx.fill();
      
      // ========================================
      // X AXIS LASER INJECTION (Phase 2)
      // ========================================
      if (phase2Progress > 0 && !this.xAxisInjectionStarted) {
        this.xAxisInjectionStarted = true;
        this.xAxisInjectionProgress = 0;
      }
      
      if (this.xAxisInjectionStarted && this.xAxisInjectionProgress < 1) {
        this.xAxisInjectionProgress += 0.05;
        if (this.xAxisInjectionProgress > 1) this.xAxisInjectionProgress = 1;
      }
      
      // Draw X axis laser effect during phase 2
      if (this.xAxisInjectionStarted && phase2Progress < 0.8) {
        ctx.save();
        
        const t = this.xAxisInjectionProgress;
        const eased = t < 0.5 
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        // Laser shoots from center both up and down
        const beamLength = eased * axisLength;
        
        // Glow effect (vertical)
        const glowGradient = ctx.createLinearGradient(cx - 40, cy, cx + 40, cy);
        glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
        glowGradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.12 * (1 - Math.max(0, this.xAxisInjectionProgress - 0.8) * 5)})`);
        glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(cx - 40, cy - beamLength, 80, beamLength * 2);
        
        // Main beam (up)
        const coreGradientUp = ctx.createLinearGradient(cx, cy, cx, cy - beamLength);
        coreGradientUp.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
        coreGradientUp.addColorStop(0.7, 'rgba(255, 215, 0, 1)');
        coreGradientUp.addColorStop(1, 'rgba(255, 255, 255, 1)');
        
        ctx.strokeStyle = coreGradientUp;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy - beamLength);
        ctx.stroke();
        
        // Main beam (down)
        const coreGradientDown = ctx.createLinearGradient(cx, cy, cx, cy + beamLength);
        coreGradientDown.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
        coreGradientDown.addColorStop(0.7, 'rgba(255, 215, 0, 1)');
        coreGradientDown.addColorStop(1, 'rgba(255, 255, 255, 1)');
        
        ctx.strokeStyle = coreGradientDown;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + beamLength);
        ctx.stroke();
        
        // Beam heads (intense points)
        if (this.xAxisInjectionProgress < 0.95) {
          // Top head
          const headGlowUp = ctx.createRadialGradient(cx, cy - beamLength, 0, cx, cy - beamLength, 20);
          headGlowUp.addColorStop(0, 'rgba(255, 255, 255, 1)');
          headGlowUp.addColorStop(0.3, 'rgba(255, 215, 0, 0.8)');
          headGlowUp.addColorStop(1, 'rgba(255, 215, 0, 0)');
          ctx.fillStyle = headGlowUp;
          ctx.beginPath();
          ctx.arc(cx, cy - beamLength, 20, 0, Math.PI * 2);
          ctx.fill();
          
          // Bottom head
          const headGlowDown = ctx.createRadialGradient(cx, cy + beamLength, 0, cx, cy + beamLength, 20);
          headGlowDown.addColorStop(0, 'rgba(255, 255, 255, 1)');
          headGlowDown.addColorStop(0.3, 'rgba(255, 215, 0, 0.8)');
          headGlowDown.addColorStop(1, 'rgba(255, 215, 0, 0)');
          ctx.fillStyle = headGlowDown;
          ctx.beginPath();
          ctx.arc(cx, cy + beamLength, 20, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }
      
      // X axis (vertical) - visible after laser injection
      if (this.xAxisInjectionProgress >= 0.9) {
        const xAxisOpacity = Math.min(1, (this.xAxisInjectionProgress - 0.9) * 10) * cartOpacity;
        ctx.strokeStyle = `rgba(${lineR}, ${lineG}, ${lineB}, ${xAxisOpacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - axisLength);
        ctx.lineTo(cx, cy + axisLength);
        ctx.stroke();
        
        // X axis arrow (up)
        ctx.fillStyle = `rgba(${lineR}, ${lineG}, ${lineB}, ${xAxisOpacity})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy - axisLength);
        ctx.lineTo(cx - 5, cy - axisLength + 10);
        ctx.lineTo(cx + 5, cy - axisLength + 10);
        ctx.closePath();
        ctx.fill();
        
        // Axis tick marks
        ctx.strokeStyle = `rgba(${lineR}, ${lineG}, ${lineB}, ${xAxisOpacity * 0.6})`;
        ctx.lineWidth = 1;
        const tickSize = 8;
        const tickValues = [0.5, 1, 2];
        
        // R axis ticks
        for (const r of tickValues) {
          const tickX = cx + r * axisLength * 0.4;
          ctx.beginPath();
          ctx.moveTo(tickX, cy - tickSize);
          ctx.lineTo(tickX, cy + tickSize);
          ctx.stroke();
        }
        
        // X axis ticks (positive and negative)
        for (const x of tickValues) {
          const tickYPos = cy - x * axisLength * 0.4;
          const tickYNeg = cy + x * axisLength * 0.4;
          ctx.beginPath();
          ctx.moveTo(cx - tickSize, tickYPos);
          ctx.lineTo(cx + tickSize, tickYPos);
          ctx.moveTo(cx - tickSize, tickYNeg);
          ctx.lineTo(cx + tickSize, tickYNeg);
          ctx.stroke();
        }
      }
    }
    
    // ========================================
    // PHASE 3: CONFORMAL MAPPING ANIMATION
    // Continuous transformation from Cartesian to Smith Chart
    // Using high-resolution polylines and bilinear transform
    // ========================================
    
    // easeInOutExpo for dramatic "warp drive" effect
    const easeInOutExpo = (t: number): number => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
      return (2 - Math.pow(2, -20 * t + 10)) / 2;
    };
    
    // mapPoint: Core transformation function
    // z = r + jx (complex impedance)
    // t = 0: Cartesian position
    // t = 1: Smith Chart position (Γ = (z-1)/(z+1))
    const mapPoint = (r: number, x: number, t: number): { px: number; py: number } => {
      // Cartesian coordinates (impedance plane)
      // R axis horizontal, X axis vertical
      const cartScale = smithR * 0.8;
      const cartX = cx - cartScale * 0.3 + r * cartScale * 0.12;
      const cartY = cy - x * cartScale * 0.12;
      
      // Smith Chart coordinates via bilinear transform
      const gamma = zToGamma(r, x);
      const smithX = cx + gamma.re * smithR;
      const smithY = cy - gamma.im * smithR;
      
      // Apply easeInOutExpo for dramatic warp effect
      const easedT = easeInOutExpo(t);
      
      return {
        px: lerp(cartX, smithX, easedT),
        py: lerp(cartY, smithY, easedT)
      };
    };
    
    // ========================================
    // THERMAL ENERGY COLOR TRANSITION
    // HSL interpolation: White Heat → Electric Gold
    // Start: hsl(0, 0%, 100%) - White
    // End: hsl(51, 100%, 50%) - Electric Gold
    // ========================================
    
    // easeInQuad for opacity ramp
    const easeInQuad = (t: number): number => t * t;
    
    // HSL interpolation with "white heat" effect
    // Keep Lightness high (near 100%) for first 50%, then drop to 50%
    const hue = lerp(0, 51, transformT); // 0 → 51 (gold hue)
    const saturation = lerp(0, 100, transformT); // 0% → 100%
    
    // Non-linear lightness: stays white-hot, then drops
    let lightness: number;
    if (transformT < 0.5) {
      // First 50%: Keep near white (100% → 85%)
      lightness = lerp(100, 85, transformT * 2);
    } else {
      // Last 50%: Drop to gold (85% → 50%)
      lightness = lerp(85, 50, (transformT - 0.5) * 2);
    }
    
    const thermalColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    // Bloom effect: shadowBlur 0 → 20
    const bloomIntensity = transformT * 20;
    
    // Opacity curve: easeInQuad from 0.2 → 1.0
    const baseOpacity = lerp(0.2, 1.0, easeInQuad(transformT));
    
    // Draw the gravity point (attractor at Open Circuit, R=∞)
    if (transformT > 0.1 && transformT < 0.9) {
      const gravityAlpha = Math.sin((transformT - 0.1) / 0.8 * Math.PI) * 0.5;
      const pulseSize = 12 + Math.sin(this.time * 6) * 4;
      
      const gravityX = cx + smithR;
      const gravityGlow = ctx.createRadialGradient(gravityX, cy, 0, gravityX, cy, pulseSize * 4);
      gravityGlow.addColorStop(0, `hsla(${hue}, 100%, 70%, ${gravityAlpha})`);
      gravityGlow.addColorStop(0.4, `hsla(${hue}, 100%, 50%, ${gravityAlpha * 0.4})`);
      gravityGlow.addColorStop(1, `hsla(${hue}, 100%, 30%, 0)`);
      ctx.fillStyle = gravityGlow;
      ctx.beginPath();
      ctx.arc(gravityX, cy, pulseSize * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Only draw grid when phase 2 is mostly complete or transform has started
    const gridVisible = phase2Progress > 0.7 || transformT > 0;
    
    if (gridVisible) {
      // Apply bloom effect
      ctx.shadowColor = thermalColor;
      ctx.shadowBlur = bloomIntensity;
      
      // ========================================
      // CONSTANT R LINES (vertical in Cartesian → circles in Smith)
      // High-resolution polylines for smooth bending
      // ========================================
      const rValues = [0, 0.2, 0.5, 1, 2, 5, 10];
      
      for (const rVal of rValues) {
        const isUnity = rVal === 1;
        const lineOpacity = baseOpacity * (isUnity ? 1.0 : 0.4);
        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${lineOpacity})`;
        ctx.lineWidth = isUnity ? 2 : 1;
        ctx.beginPath();
        
        // High resolution: 120 segments per line
        const segments = 120;
        let started = false;
        
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          // Map t to X value: -∞ to +∞, using tan for natural distribution
          const xVal = Math.tan((t - 0.5) * Math.PI * 0.98) * 5;
          
          const { px, py } = mapPoint(rVal, xVal, transformT);
          
          // Clip to viewport with margin
          if (py < -50 || py > height + 50 || px < -50 || px > width + 50) {
            started = false;
            continue;
          }
          
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }
      
      // ========================================
      // CONSTANT X LINES (horizontal in Cartesian → arcs in Smith)
      // These bend and converge at the Open Circuit point
      // ========================================
      const xValues = [-10, -5, -2, -1, -0.5, 0, 0.5, 1, 2, 5, 10];
      
      for (const xVal of xValues) {
        const isCenter = xVal === 0;
        const lineOpacity = baseOpacity * (isCenter ? 1.0 : 0.4);
        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${lineOpacity})`;
        ctx.lineWidth = isCenter ? 2 : 1;
        ctx.beginPath();
        
        // High resolution: 100 segments per line
        const segments = 100;
        let started = false;
        
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          // Map t to R value: 0 to ∞, using exponential for natural distribution
          const rVal = Math.pow(t, 1.5) * 30;
          
          const { px, py } = mapPoint(rVal, xVal, transformT);
          
          // Clip to viewport
          if (py < -50 || py > height + 50 || px < -50 || px > width + 50) {
            started = false;
            continue;
          }
          
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }
      
      // Reset bloom effect
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
    
    ctx.restore();
    
    // ========================================
    // LABELS
    // ========================================
    ctx.save();
    
    // Phase 1 labels (R axis only)
    if (phase2Progress < 0.3 && progress > 0.08) {
      const fadeIn = Math.min(1, (progress - 0.08) / 0.05);
      const labelOpacity = fadeIn * (1 - phase2Progress / 0.3);
      ctx.font = '14px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      
      ctx.fillStyle = `rgba(255, 255, 255, ${labelOpacity * 0.6})`;
      ctx.fillText('R (电阻)', cx + axisLength + 30, cy + 5);
      ctx.font = '11px "Space Grotesk", sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${labelOpacity * 0.4})`;
      ctx.fillText('纯电阻 · 一维', cx, cy + 50);
    }
    
    // Phase 2 labels (Cartesian plane)
    if (phase2Progress > 0.5 && transformT < 0.3) {
      const labelOpacity = Math.min(1, (phase2Progress - 0.5) / 0.3) * (1 - transformT / 0.3);
      ctx.font = '14px "Space Grotesk", sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${labelOpacity * 0.7})`;
      
      // R axis label (right side)
      ctx.textAlign = 'left';
      ctx.fillText('R (电阻)', cx + axisLength + 15, cy + 5);
      
      // X axis label (top)
      ctx.textAlign = 'center';
      ctx.fillText('jX (电抗)', cx, cy - axisLength - 15);
      
      ctx.font = '11px "Space Grotesk", sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${labelOpacity * 0.5})`;
      ctx.textAlign = 'left';
      ctx.fillText('+jX 感性', cx + 15, cy - axisLength * 0.5);
      ctx.fillText('−jX 容性', cx + 15, cy + axisLength * 0.5);
      
      ctx.font = '12px "Space Grotesk", sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${labelOpacity * 0.4})`;
      ctx.textAlign = 'center';
      ctx.fillText('阻抗平面 Z = R + jX', cx, cy + axisLength + 40);
    }
    
    ctx.restore();
    
    // ========================================
    // UNIT CIRCLE - Ripple expansion from center
    // The boundary of the finite world emerges
    // ========================================
    if (transformT > 0.2) {
      const rippleT = (transformT - 0.2) / 0.8;
      
      // Multiple ripple rings expanding outward
      const numRipples = 3;
      for (let r = 0; r < numRipples; r++) {
        const rippleDelay = r * 0.15;
        const rippleProgress = clamp((rippleT - rippleDelay) / (1 - rippleDelay), 0, 1);
        
        if (rippleProgress > 0) {
          const currentRadius = rippleProgress * smithR;
          const rippleAlpha = r === numRipples - 1 
            ? rippleProgress * 0.9  // Final ring stays
            : Math.sin(rippleProgress * Math.PI) * 0.4; // Others fade
          
          ctx.strokeStyle = `rgba(${lineR}, ${lineG}, ${lineB}, ${rippleAlpha})`;
          ctx.lineWidth = r === numRipples - 1 ? 2.5 : 1;
          ctx.beginPath();
          ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      
      // Center flash when transformation completes
      if (transformT > 0.85) {
        const flashT = (transformT - 0.85) / 0.15;
        const flashAlpha = Math.sin(flashT * Math.PI) * 0.3;
        const flashGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, smithR);
        flashGlow.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
        flashGlow.addColorStop(0.3, `rgba(255, 215, 0, ${flashAlpha * 0.5})`);
        flashGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = flashGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, smithR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // ========================================
    // PHASE 4: Final Smith Chart elements (85%+)
    // ========================================
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
        
        // Center point (50Ω)
        ctx.fillStyle = `rgba(100, 255, 150, ${p4Alpha})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Open circuit marker
        ctx.fillStyle = `rgba(255, 100, 100, ${p4Alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(cx + smithR, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Short circuit marker
        ctx.fillStyle = `rgba(100, 150, 255, ${p4Alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(cx - smithR, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Corner brackets
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
  }
  
  destroy(): void {}
}

// ========================================
// GENESIS PHASE OVERLAY (for scroll-controlled stage)
// ========================================

interface GenesisPhaseOverlayProps {
  phase: number;
  progress: number;
  narrative: typeof NARRATIVE.zh;
}

const GenesisPhaseOverlay: React.FC<GenesisPhaseOverlayProps> = ({ phase, progress, narrative }) => {
  // Phase boundaries for Genesis stage (no splash phase)
  const getPhaseOpacity = (targetPhase: number) => {
    const boundaries: Record<number, [number, number]> = {
      1: [0, 0.25],     // Phase 1: Impedance
      2: [0.25, 0.50],  // Phase 2: Matching
      3: [0.50, 0.85],  // Phase 3: Reflection
      4: [0.85, 1.00],  // Phase 4: Chart
    };
    
    const bounds = boundaries[targetPhase];
    if (!bounds) return 0;
    
    const [start, end] = bounds;
    if (progress < start || progress >= end) return 0;
    
    const fadeIn = Math.min(1, (progress - start) / 0.05);
    const fadeOut = Math.min(1, (end - progress) / 0.05);
    return Math.min(fadeIn, fadeOut);
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      
      {/* Phase 1: Impedance */}
      <BgTextOverlay
        opacity={getPhaseOpacity(1)}
        bgText={narrative.phase1.bgText}
        formula={narrative.phase1.formula}
        subtitle={narrative.phase1.subtitle}
      />
      
      {/* Phase 2: Matching */}
      <BgTextOverlay
        opacity={getPhaseOpacity(2)}
        bgText={narrative.phase2.bgText}
        formula={narrative.phase2.formula}
        subtitle={narrative.phase2.subtitle}
      />
      
      {/* Phase 3: Reflection */}
      <BgTextOverlay
        opacity={getPhaseOpacity(3)}
        bgText={narrative.phase3.bgText}
        formula={narrative.phase3.formula}
        subtitle={narrative.phase3.subtitle}
      />
      
      {/* Phase 4: Revelation - Smith Chart */}
      {(() => {
        const phase4Opacity = getPhaseOpacity(4);
        return (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ 
              opacity: phase4Opacity,
              transition: 'opacity 0.5s ease-out',
            }}
          >
            {/* Giant background text - golden glow */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden select-none">
              {/* Glow layer */}
              <span 
                className="absolute text-[24vw] md:text-[30vw] font-black uppercase whitespace-nowrap"
                style={{ 
                  fontFamily: '"Space Grotesk", sans-serif',
                  letterSpacing: '-0.05em',
                  color: 'transparent',
                  WebkitTextStroke: '4px rgba(255, 215, 0, 0.08)',
                  filter: 'blur(20px)',
                  transform: `scale(${0.95 + phase4Opacity * 0.05})`,
                  transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {narrative.phase4.bgText}
              </span>
              
              {/* Main text */}
              <span 
                className="text-[24vw] md:text-[30vw] font-black uppercase whitespace-nowrap"
                style={{ 
                  fontFamily: '"Space Grotesk", sans-serif',
                  letterSpacing: '-0.05em',
                  color: 'transparent',
                  WebkitTextStroke: '2px rgba(255, 215, 0, 0.2)',
                  textShadow: `
                    0 0 80px rgba(255, 215, 0, 0.15),
                    0 0 160px rgba(255, 215, 0, 0.08)
                  `,
                  transform: `translateY(${(1 - phase4Opacity) * 40}px) scale(${0.98 + phase4Opacity * 0.02})`,
                  transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {narrative.phase4.bgText}
              </span>
            </div>
            
            {/* Foreground content */}
            <div 
              className="relative z-10 flex flex-col items-center text-center px-8"
              style={{
                transform: `translateY(${(1 - phase4Opacity) * 30}px)`,
                transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Decorative top line */}
              <div 
                className="w-24 h-0.5 mb-6"
                style={{ 
                  background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                }}
              />
              
              {/* Formula */}
              <p 
                className="text-5xl md:text-7xl font-light mb-4"
                style={{ 
                  fontFamily: '"Times New Roman", Georgia, serif',
                  fontStyle: 'italic',
                  color: '#FFD700',
                  textShadow: `
                    0 0 30px rgba(255, 215, 0, 0.6),
                    0 0 60px rgba(255, 215, 0, 0.3)
                  `,
                }}
              >
                {narrative.phase4.formula}
              </p>
              
              {/* Subtitle */}
              <p 
                className="text-xl md:text-2xl font-light"
                style={{ 
                  fontFamily: '"Noto Sans SC", "Space Grotesk", sans-serif',
                  color: 'rgba(255, 255, 255, 0.8)',
                  letterSpacing: '0.1em',
                }}
              >
                {narrative.phase4.subtitle}
              </p>
              
              {/* Decorative bottom line */}
              <div 
                className="w-24 h-0.5"
                style={{ 
                  background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                }}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ========================================
// BACKGROUND TEXT OVERLAY (Large transparent text)
// ========================================

interface BgTextOverlayProps {
  opacity: number;
  bgText: string;
  formula: string;
  subtitle: string;
}

const BgTextOverlay: React.FC<BgTextOverlayProps> = ({
  opacity,
  bgText,
  formula,
  subtitle,
}) => (
  <div 
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
    style={{ 
      opacity,
      transition: 'opacity 0.5s ease-out',
    }}
  >
    {/* Giant background text - visible but behind grid */}
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden select-none">
      {/* Soft glow layer */}
      <span 
        className="absolute text-[28vw] md:text-[35vw] font-black uppercase whitespace-nowrap"
        style={{ 
          fontFamily: '"Space Grotesk", "Noto Sans SC", sans-serif',
          letterSpacing: '-0.04em',
          color: 'rgba(255, 215, 0, 0.03)',
          filter: 'blur(20px)',
          transform: `translateY(${(1 - opacity) * 30}px)`,
          transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {bgText}
      </span>
      {/* Main text - stroke style */}
      <span 
        className="text-[28vw] md:text-[35vw] font-black uppercase whitespace-nowrap"
        style={{ 
          fontFamily: '"Space Grotesk", "Noto Sans SC", sans-serif',
          letterSpacing: '-0.04em',
          color: 'transparent',
          WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.08)',
          transform: `translateY(${(1 - opacity) * 30}px)`,
          transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {bgText}
      </span>
    </div>
    
    {/* Foreground content - centered */}
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
      style={{
        transform: `translateY(${(1 - opacity) * 20}px)`,
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Formula - pure math, elegant font */}
      <p 
        className="text-4xl md:text-6xl font-light mb-4"
        style={{ 
          fontFamily: '"Times New Roman", "Noto Serif SC", Georgia, serif',
          fontStyle: 'italic',
          color: '#FFFFFF',
          textShadow: `
            0 0 40px rgba(255, 215, 0, 0.4),
            0 2px 10px rgba(0, 0, 0, 0.8)
          `,
          letterSpacing: '0.05em',
        }}
      >
        {formula}
      </p>
      
      {/* Subtitle - clean sans-serif */}
      <p 
        className="text-sm md:text-base font-light"
        style={{ 
          color: 'rgba(255, 255, 255, 0.5)',
          fontFamily: '"Noto Sans SC", "Space Grotesk", sans-serif',
          letterSpacing: '0.1em',
        }}
      >
        {subtitle}
      </p>
    </div>
  </div>
);

// ========================================
// SCROLL HINT
// ========================================

const ScrollHint: React.FC<{ text: string; visible: boolean }> = ({ text, visible }) => (
  <div 
    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-500"
    style={{ opacity: visible ? 1 : 0 }}
  >
    <span 
      className="text-[10px] uppercase tracking-[0.2em]"
      style={{ color: 'rgba(255, 255, 255, 0.4)' }}
    >
      {text}
    </span>
    <div className="w-5 h-8 rounded-full border border-white/20 flex justify-center pt-2">
      <div 
        className="w-1 h-2 rounded-full bg-white/40"
        style={{ animation: 'scrollPulse 2s ease-in-out infinite' }}
      />
    </div>
  </div>
);

// ========================================
// CTA BUTTON
// ========================================

const CTAButton: React.FC<{ onClick: () => void; text: string; visible: boolean }> = ({ onClick, text, visible }) => (
  <div 
    className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto"
    style={{ 
      opacity: visible ? 1 : 0,
      transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      transition: 'opacity 0.5s, transform 0.5s',
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

export const GenesisIntro: React.FC<GenesisIntroProps> = ({
  lang,
  onComplete,
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GenesisCanvasEngine | null>(null);
  const animIdRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Stage management: 'genesis' (scroll-controlled) → 'splash' (auto-play celebration)
  const [stage, setStage] = useState<'genesis' | 'splash'>('genesis');
  
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  
  const narrative = NARRATIVE[lang];
  
  // ========================================
  // When Genesis completes (progress >= 100%), transition to Splash
  // ========================================
  useEffect(() => {
    if (stage === 'genesis' && progress >= 0.98) {
      // Small delay before showing splash celebration
      const timer = setTimeout(() => {
        setStage('splash');
        // Play intro audio for the celebration
        try {
          audio.playIntro();
        } catch (e) {
          // Audio might not be available
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [stage, progress]);
  
  // Splash auto-complete after 4.5s
  const [splashComplete, setSplashComplete] = useState(false);
  useEffect(() => {
    if (stage !== 'splash') return;
    
    const timer = setTimeout(() => {
      setSplashComplete(true);
    }, 4500);
    
    return () => clearTimeout(timer);
  }, [stage]);
  
  // Handle scroll/click to complete after splash finishes
  useEffect(() => {
    if (!splashComplete || stage !== 'splash') return;
    
    const handleComplete = () => {
      onComplete();
    };
    
    window.addEventListener('wheel', handleComplete, { passive: false, once: true });
    window.addEventListener('click', handleComplete, { once: true });
    
    return () => {
      window.removeEventListener('wheel', handleComplete);
      window.removeEventListener('click', handleComplete);
    };
  }, [splashComplete, stage, onComplete]);
  
  // ========================================
  // STAGE 2: GENESIS ENGINE (Scroll-controlled)
  // ========================================
  
  // Initialize engine only when entering genesis stage
  useEffect(() => {
    if (stage !== 'genesis') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    engineRef.current = new GenesisCanvasEngine(canvas);
    
    const animate = () => {
      engineRef.current?.render();
      animIdRef.current = requestAnimationFrame(animate);
    };
    animIdRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animIdRef.current);
      engineRef.current?.destroy();
    };
  }, [stage]);
  
  // Resize handler
  useEffect(() => {
    if (stage !== 'genesis') return;
    
    const handleResize = () => {
      if (engineRef.current) {
        engineRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [stage]);
  
  // Scroll accumulator (persists across renders)
  const scrollAccumulatorRef = useRef(0);
  const touchStartYRef = useRef(0);
  const maxScroll = 3000;
  const sensitivity = 1.5;
  
  // Wheel-controlled progress (no native scroll)
  useEffect(() => {
    if (stage !== 'genesis') return;
    
    const container = scrollRef.current;
    if (!container) return;
    
    const updateProgress = (p: number) => {
      setProgress(p);
      engineRef.current?.setProgress(p);
      
      // Determine phase (1-4, no phase 0 in genesis)
      if (p < 0.25) setPhase(1);
      else if (p < 0.50) setPhase(2);
      else if (p < 0.85) setPhase(3);
      else setPhase(4);
    };
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      scrollAccumulatorRef.current += e.deltaY * sensitivity;
      scrollAccumulatorRef.current = clamp(scrollAccumulatorRef.current, 0, maxScroll);
      
      const p = scrollAccumulatorRef.current / maxScroll;
      updateProgress(p);
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const deltaY = (touchStartYRef.current - touchY) * 3;
      touchStartYRef.current = touchY;
      
      scrollAccumulatorRef.current += deltaY;
      scrollAccumulatorRef.current = clamp(scrollAccumulatorRef.current, 0, maxScroll);
      
      const p = scrollAccumulatorRef.current / maxScroll;
      updateProgress(p);
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [stage]);
  
  // ========================================
  // RENDER: GENESIS STAGE (scroll-controlled, comes first)
  // ========================================
  if (stage === 'genesis') {
  return (
    <div 
      ref={scrollRef}
      className="fixed inset-0 z-[10000] overflow-hidden"
      style={{ backgroundColor: '#050505' }}
    >
      {/* Fixed Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0"
        style={{ background: '#050505' }}
      />
      
      {/* Phase Overlay (Genesis phases 1-4) */}
      <GenesisPhaseOverlay phase={phase} progress={progress} narrative={narrative} />
      
      {/* CTA Button */}
      <CTAButton 
        onClick={onComplete}
        text={narrative.phase4.cta}
        visible={progress >= 0.92}
      />
      
      {/* Progress Indicator */}
      <div className="fixed bottom-6 right-6 z-20">
        <div 
          className="text-xs font-mono"
          style={{ color: 'rgba(255, 215, 0, 0.4)' }}
        >
          {Math.round(progress * 100)}%
        </div>
      </div>
      
      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="fixed top-5 right-6 z-20 text-[10px] font-mono uppercase tracking-widest px-4 py-2 rounded-lg transition-all hover:bg-white/10"
        style={{ 
          color: 'rgba(255, 255, 255, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {lang === 'zh' ? '跳过' : 'Skip'}
      </button>
      
      {/* Animations */}
      <style>{`
        @keyframes scrollPulse {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
  }
  
  // ========================================
  // RENDER: SPLASH STAGE (celebration after Genesis completes)
  // ========================================
  return (
    <div className="splash-container fixed inset-0 z-[10000]" style={{ backgroundColor: '#050505' }}>
      {/* Phase 1: Init Text */}
      <div className="splash-init-text">
        {narrative.splash.init}
      </div>

      {/* Phase 2: Laser Injection */}
      <div className="splash-laser" />

      {/* Phase 3: Grid Formation */}
      <div className="splash-grid-container smith-chart-container">
        <svg viewBox="-1.1 -1.1 2.2 2.2" className="splash-grid-svg">
          <defs>
            <clipPath id="splash-clip">
              <circle cx="0" cy="0" r="1" />
            </clipPath>
          </defs>

          {/* Unit Circle */}
          <circle 
            cx="0" cy="0" r="1" 
            fill="none" 
            stroke="#FFC700" 
            strokeWidth="0.005"
            className="splash-unit-circle"
          />

          {/* Grid Lines */}
          <g clipPath="url(#splash-clip)" className="splash-grid-lines">
            {/* Resistance Circles */}
            {[0.2, 0.5, 1, 2, 5].map((r, i) => {
              const circleCenter = r / (r + 1);
              const circleRadius = 1 / (r + 1);
              const d = `M ${circleCenter + circleRadius} 0 A ${circleRadius} ${circleRadius} 0 1 0 ${circleCenter - circleRadius} 0 A ${circleRadius} ${circleRadius} 0 1 0 ${circleCenter + circleRadius} 0`;
              return (
                <path 
                  key={`r-${i}`} 
                  d={d} 
                  fill="none" 
                  stroke="#FFC700" 
                  strokeWidth="0.008"
                  style={{ animationDelay: `${1.5 + i * 0.08}s` }}
                  className="splash-path-draw"
                />
              );
            })}

            {/* Reactance Arcs */}
            {[0.5, 1, 2, 5].flatMap((x, xi) => {
              const arcRadius = 1 / x;
              return [
                <circle 
                  key={`x-${xi}-pos`} 
                  cx={1} cy={1 / x} r={arcRadius} 
                  fill="none" stroke="#FFC700" strokeWidth="0.008"
                  style={{ animationDelay: `${1.9 + xi * 0.12}s` }}
                  className="splash-path-draw"
                />,
                <circle 
                  key={`x-${xi}-neg`} 
                  cx={1} cy={-1 / x} r={arcRadius} 
                  fill="none" stroke="#FFC700" strokeWidth="0.008"
                  style={{ animationDelay: `${1.9 + xi * 0.12 + 0.06}s` }}
                  className="splash-path-draw"
                />
              ];
            })}
            
            {/* Horizon Line */}
            <line 
              x1="-1" y1="0" x2="1" y2="0" 
              stroke="#FFC700" 
              strokeWidth="0.008" 
              className="splash-path-draw"
              style={{ animationDelay: '1.5s' }}
            />
          </g>
        </svg>
      </div>

      {/* Phase 4: Flash Effect */}
      <div className="splash-flash" />

      {/* Phase 5: Title Reveal */}
      <div className="splash-title-container">
        <h1 className="splash-title">
          {narrative.splash.title}
        </h1>
        <p className="splash-subtitle">
          {narrative.splash.subtitle}
        </p>
      </div>

      {/* Phase 6: Scroll Prompt */}
      <div 
        className="splash-scroll-prompt"
        style={{ opacity: splashComplete ? 1 : 0 }}
      >
        <span>{lang === 'zh' ? '点击或滚动继续' : 'Click or scroll to continue'}</span>
        <ArrowDown size={20} />
      </div>
      
      {/* Skip to main app */}
      <button
        onClick={onComplete}
        className="fixed top-5 right-6 z-20 text-[10px] font-mono uppercase tracking-widest px-4 py-2 rounded-lg transition-all hover:bg-white/10"
        style={{ 
          color: 'rgba(255, 255, 255, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {lang === 'zh' ? '进入应用' : 'Enter App'}
      </button>
    </div>
  );
};

export default GenesisIntro;

