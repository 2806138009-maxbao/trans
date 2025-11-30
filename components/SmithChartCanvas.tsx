import React, { useEffect, useRef, useState, useMemo } from 'react';
import { THEME } from '../theme';
// Audio removed for cleaner experience

interface SmithChartCanvasProps {
  reducedMotion?: boolean;
  overrideImpedance?: { r: number; x: number } | null;
  showAdmittance?: boolean;
  showVSWRCircles?: boolean;
  lang?: 'en' | 'zh';
  /** 
   * Don Norman: Direct Manipulation
   * 当用户直接在圆图上拖拽时回调
   */
  onDirectDrag?: (impedance: { r: number; x: number }) => void;
  /**
   * 是否允许直接拖拽 (当 controlMode === 'mouse' 时启用)
   */
  allowDirectDrag?: boolean;
  /**
   * HUD Event Callbacks
   * 用于触发 Operation Guide HUD 的实时反馈
   */
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
  r: number;  // Normalized resistance (real part)
  x: number;  // Normalized reactance (imaginary part)
}

// Complex number operations
const Complex = {
  // Create complex number
  create: (re: number, im: number): Complex => ({ re, im }),
  
  // Addition: (a + bi) + (c + di) = (a+c) + (b+d)i
  add: (a: Complex, b: Complex): Complex => ({
    re: a.re + b.re,
    im: a.im + b.im
  }),
  
  // Subtraction: (a + bi) - (c + di) = (a-c) + (b-d)i
  sub: (a: Complex, b: Complex): Complex => ({
    re: a.re - b.re,
    im: a.im - b.im
  }),
  
  // Multiplication: (a + bi)(c + di) = (ac - bd) + (ad + bc)i
  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  }),
  
  // Division: (a + bi) / (c + di)
  div: (a: Complex, b: Complex): Complex => {
    const denom = b.re * b.re + b.im * b.im;
    if (denom === 0) return { re: Infinity, im: Infinity };
    return {
      re: (a.re * b.re + a.im * b.im) / denom,
      im: (a.im * b.re - a.re * b.im) / denom
    };
  },
  
  // Magnitude: |a + bi| = sqrt(a² + b²)
  mag: (c: Complex): number => Math.sqrt(c.re * c.re + c.im * c.im),
  
  // Phase angle in radians
  phase: (c: Complex): number => Math.atan2(c.im, c.re),
  
  // Phase angle in degrees
  phaseDeg: (c: Complex): number => Math.atan2(c.im, c.re) * (180 / Math.PI),
  
  // Conjugate: (a + bi)* = a - bi
  conj: (c: Complex): Complex => ({ re: c.re, im: -c.im }),
};

// ========================================
// IMPEDANCE TO GAMMA CONVERSION
// ========================================

// Convert normalized impedance z to reflection coefficient Γ
// Formula: Γ = (z - 1) / (z + 1)
function impedanceToGamma(z: Impedance): Complex {
  const zComplex: Complex = { re: z.r, im: z.x };
  const one: Complex = { re: 1, im: 0 };
  
  const numerator = Complex.sub(zComplex, one);   // z - 1
  const denominator = Complex.add(zComplex, one); // z + 1
  
  return Complex.div(numerator, denominator);
}

// Convert reflection coefficient Γ to normalized impedance z
// Formula: z = (1 + Γ) / (1 - Γ)
function gammaToImpedance(gamma: Complex): Impedance {
  const one: Complex = { re: 1, im: 0 };
  
  const numerator = Complex.add(one, gamma);   // 1 + Γ
  const denominator = Complex.sub(one, gamma); // 1 - Γ
  
  const z = Complex.div(numerator, denominator);
  return { r: z.re, x: z.im };
}

// Convert screen coordinates (u, v) to Gamma
// u, v are normalized to [-1, 1] where (0,0) is center
function screenToGamma(u: number, v: number): Complex {
  return { re: u, im: -v }; // Invert v because screen Y is inverted
}

// Convert Gamma to screen coordinates
function gammaToScreen(gamma: Complex, cx: number, cy: number, radius: number): { x: number; y: number } {
  return {
    x: cx + gamma.re * radius,
    y: cy - gamma.im * radius // Invert for screen coordinates
  };
}

// ========================================
// RF PARAMETER CALCULATIONS
// ========================================

function calculateRFParams(z: Impedance) {
  const gamma = impedanceToGamma(z);
  
  const gammaMag = Complex.mag(gamma);
  const gammaAngle = Complex.phaseDeg(gamma);
  
  // VSWR = (1 + |Γ|) / (1 - |Γ|)
  const vswr = gammaMag < 0.9999 ? (1 + gammaMag) / (1 - gammaMag) : Infinity;
  
  // Return Loss = -20 * log10(|Γ|) dB
  const returnLoss = gammaMag > 0.0001 ? -20 * Math.log10(gammaMag) : Infinity;
  
  // Mismatch Loss = -10 * log10(1 - |Γ|²) dB
  const mismatchLoss = gammaMag < 0.9999 ? -10 * Math.log10(1 - gammaMag * gammaMag) : Infinity;
  
  // Power delivered to load (%)
  const powerDelivered = (1 - gammaMag * gammaMag) * 100;
  
  // Determine region based on impedance
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
    region
  };
}

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
  const [impedance, setImpedance] = useState<Impedance | null>(null);
  
  // REFS for Physics Loop
  const targetPos = useRef<{ x: number; y: number } | null>(null);
  const currentPos = useRef<{ x: number; y: number } | null>(null);
  
  // ========================================
  // Don Norman: Direct Manipulation + Physics
  // 直接拖拽状态 + 物理阻尼
  // ========================================
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  
  // S-Tier Animation State: Smooth interpolation for "Soul"
  // Scale: 1 -> 1.3 -> 1.6
  // Glow: 0.15 -> 0.35 -> 0.5
  const cursorAnim = useRef({ scale: 1, glow: 0.15 });
  
  // S-Tier: Breathing animation phase (0-1, cycles continuously)
  const breathPhaseRef = useRef(0);
  
  // S-Tier: Physics Decay Trail (Phosphor Persistence)
  const trailRef = useRef<Array<{ x: number; y: number; opacity: number }>>([]);
  const lastSnapRef = useRef<string | null>(null);

  // 存储画布尺寸供事件处理器使用
  const canvasDimensions = useRef<{ cx: number; cy: number; radius: number }>({ cx: 0, cy: 0, radius: 0 });
  
  // ========================================
  // BOOT SEQUENCE: Cinematic grid draw animation
  // Grid lines draw from center outwards over 1.2s
  // ========================================
  const bootProgressRef = useRef(0);
  const bootStartTimeRef = useRef<number | null>(null);
  const BOOT_DURATION = 1200; // 1.2 seconds
  
  // ========================================
  // GHOST TRACES: Previous path comparison
  // Shows dotted line of previous state for comparison
  // ========================================
  const ghostTraceRef = useRef<{ r: number; x: number } | null>(null);
  const previousImpedanceRef = useRef<{ r: number; x: number } | null>(null);
  
  // Calculate RF parameters
  const rfParams = useMemo(() => {
    if (!impedance) return null;
    return calculateRFParams(impedance);
  }, [impedance]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const dpr = window.devicePixelRatio || 1;
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        ctx.scale(dpr, dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    };
    
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const centerX = w / 2;
      const centerY = h / 2;
      const radius = Math.min(w, h) * 0.4;
      
      // 存储尺寸供事件处理器使用
      canvasDimensions.current = { cx: centerX, cy: centerY, radius };

      // --- PHYSICS LERP ---
      if (overrideImpedance) {
        // If external control is active, calculate target position from impedance
        const z = overrideImpedance;
        // Gamma = (z-1)/(z+1)
        // Real(Gamma) = (r^2 + x^2 - 1) / ((r+1)^2 + x^2)
        // Imag(Gamma) = (2x) / ((r+1)^2 + x^2)
        const denom = (z.r + 1) * (z.r + 1) + z.x * z.x;
        const gammaU = (z.r * z.r + z.x * z.x - 1) / denom;
        const gammaV = (2 * z.x) / denom;

        targetPos.current = {
          x: centerX + gammaU * radius,
          y: centerY - gammaV * radius // Inverted Y
        };
      }

      if (targetPos.current) {
        if (!currentPos.current) {
          currentPos.current = { ...targetPos.current };
        } else {
          const lerpFactor = reducedMotion ? 1 : 0.15; 
          currentPos.current.x += (targetPos.current.x - currentPos.current.x) * lerpFactor;
          currentPos.current.y += (targetPos.current.y - currentPos.current.y) * lerpFactor;
        }
      } else {
        currentPos.current = null;
      }

      // Update Trail History (S-Tier Physics Decay)
      if (currentPos.current && !overrideImpedance && (isDragging || isHovering)) {
         trailRef.current.push({ ...currentPos.current, opacity: 0.5 });
      }
      // Decay
      trailRef.current.forEach(p => p.opacity *= 0.82); // Fast decay ~0.3s
      trailRef.current = trailRef.current.filter(p => p.opacity > 0.02);

      // Clear
      ctx.clearRect(0, 0, w, h);
      
      // ========================================
      // BOOT SEQUENCE: Cinematic grid draw animation
      // ========================================
      if (bootStartTimeRef.current === null) {
        bootStartTimeRef.current = performance.now();
      }
      
      const elapsed = performance.now() - bootStartTimeRef.current;
      // Ease-out-expo for smooth deceleration
      const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      bootProgressRef.current = reducedMotion ? 1 : easeOutExpo(Math.min(elapsed / BOOT_DURATION, 1));

      // Draw Background Grid with boot progress
      drawSmithChartGrid(ctx, centerX, centerY, radius, showAdmittance, showVSWRCircles, bootProgressRef.current);
      
      // ========================================
      // GHOST TRACES: Draw previous state comparison
      // Dotted line style with low opacity
      // ========================================
      if (ghostTraceRef.current && bootProgressRef.current >= 1) {
        const ghost = ghostTraceRef.current;
        const ghostGamma = impedanceToGamma(ghost);
        const ghostScreen = gammaToScreen(ghostGamma, centerX, centerY, radius);
        
        // Draw ghost point
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = 0.15;
        
        // Ghost circle
        ctx.beginPath();
        ctx.arc(ghostScreen.x, ghostScreen.y, 8, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Ghost vector from center
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(ghostScreen.x, ghostScreen.y);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Draw Trails
      trailRef.current.forEach(p => {
         ctx.beginPath();
         ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
         ctx.fillStyle = `rgba(255, 199, 0, ${p.opacity})`;
         ctx.fill();
      });

      // Draw Active Point at INTERPOLATED position
      if (currentPos.current) {
        // If driven by mouse, calculate impedance from position
        if (!overrideImpedance) {
             const u = (currentPos.current.x - centerX) / radius;
             const v = (centerY - currentPos.current.y) / radius;
             
             if (u * u + v * v <= 1.01) {
               const denom = (1 - u) * (1 - u) + v * v;
               if (denom === 0) {
                 setImpedance({ r: Infinity, x: Infinity });
               } else {
                 const r = (1 - u * u - v * v) / denom;
                 const xVal = (2 * v) / denom;
                 setImpedance({ r, x: xVal });
               }
             }
        } else {
             setImpedance(overrideImpedance);
        }

        // Draw the point if we have valid impedance
        if (impedance || overrideImpedance) {
             // S-Tier: Interpolate cursor visuals (Scale & Glow)
             // This adds the "Soul" - transitions are no longer linear/instant
             const targetScale = isDragging ? 1.6 : (isHovering ? 1.3 : 1);
             const targetGlow = isDragging ? 0.5 : (isHovering ? 0.35 : 0.15);
             
             // Physics-like lerp (approximate cubic-bezier feel)
             const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;
             const lerpFactor = reducedMotion ? 1 : 0.15;
             
             cursorAnim.current.scale = lerp(cursorAnim.current.scale, targetScale, lerpFactor);
             cursorAnim.current.glow = lerp(cursorAnim.current.glow, targetGlow, lerpFactor);
             
             // S-Tier: Update breathing phase (slow cycle ~3 seconds)
             breathPhaseRef.current = (breathPhaseRef.current + 0.005) % 1;

             drawActivePoint(
               ctx, 
               centerX, 
               centerY, 
               radius, 
               impedance || overrideImpedance!, 
               currentPos.current,
               isHovering,
               isDragging,
               cursorAnim.current.scale,
               cursorAnim.current.glow,
               breathPhaseRef.current
             );
        }
      }

      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [reducedMotion, overrideImpedance, showAdmittance, impedance, isHovering, isDragging]);

  // ========================================
  // Don Norman: Direct Manipulation Handlers
  // 直接在圆图上拖拽阻抗点
  // ========================================
  
  // 检查鼠标是否靠近当前活动点 (用于可供性)
  const isNearActivePoint = (x: number, y: number): boolean => {
    if (!currentPos.current) return false;
    const { cx, cy, radius } = canvasDimensions.current;
    if (radius === 0) return false;
    
    const dx = x - currentPos.current.x;
    const dy = y - currentPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 触控热区: 20px 或点半径的 3 倍
    return distance < 24;
  };
  
  // ========================================
  // Creative Selection: 启发式磁吸 (Snapping)
  // "智能容错" - 自动吸附到关键点
  // ========================================
  
  // 关键阻抗点 (用于磁吸)
  const SNAP_POINTS: Array<{ z: Impedance; label: string }> = [
    { z: { r: 1, x: 0 }, label: 'Match (50Ω)' },      // 完美匹配
    { z: { r: 0, x: 0 }, label: 'Short' },            // 短路
    { z: { r: 5, x: 0 }, label: 'Open' },             // 开路 (近似)
    { z: { r: 1, x: 1 }, label: '+jX (Inductive)' },  // 感性
    { z: { r: 1, x: -1 }, label: '-jX (Capacitive)' }, // 容性
    { z: { r: 0.5, x: 0 }, label: '25Ω' },
    { z: { r: 2, x: 0 }, label: '100Ω' },
    { z: { r: 1, x: 0.5 }, label: '50+j25Ω' },
    { z: { r: 1, x: -0.5 }, label: '50-j25Ω' },
  ];
  
  const SNAP_THRESHOLD = 0.15; // 磁吸阈值 (归一化距离)
  
  // 将屏幕坐标转换为阻抗 (带磁吸)
  const screenToImpedance = (x: number, y: number, enableSnap: boolean = true): Impedance | null => {
    const { cx, cy, radius } = canvasDimensions.current;
    if (radius === 0) return null;
    
    const u = (x - cx) / radius;
    const v = (cy - y) / radius;
    
    // 限制在单位圆内
    const mag = Math.sqrt(u * u + v * v);
    let finalU = u, finalV = v;
    if (mag > 1) {
      const scale = 0.99 / mag;
      finalU = u * scale;
      finalV = v * scale;
    }
    
    const rawZ = screenToImpedanceFromUV(finalU, finalV);
    
    // Creative Selection: 磁吸到关键点
    if (enableSnap) {
      let snapped = false;
      for (const snapPoint of SNAP_POINTS) {
        const dr = rawZ.r - snapPoint.z.r;
        const dx = rawZ.x - snapPoint.z.x;
        const distance = Math.sqrt(dr * dr + dx * dx);
        
        if (distance < SNAP_THRESHOLD) {
          if (lastSnapRef.current !== snapPoint.label) {
             lastSnapRef.current = snapPoint.label;
          }
          snapped = true;
          return snapPoint.z;
        }
      }
      if (!snapped) {
        lastSnapRef.current = null;
      }
    }
    
    return rawZ;
  };
  
  const screenToImpedanceFromUV = (u: number, v: number): Impedance => {
    const denom = (1 - u) * (1 - u) + v * v;
    if (denom < 0.0001) {
      return { r: 100, x: 0 }; // Near open circuit
    }
    const r = Math.max(0, (1 - u * u - v * v) / denom);
    const xVal = (2 * v) / denom;
    return { r, x: xVal };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 更新悬停状态 (可供性意符)
    const nearPoint = isNearActivePoint(x, y);
    setIsHovering(nearPoint);
    
    // HUD: 通知父组件鼠标在图上 (用于 pointerHover 事件)
    onHoverChange?.(true);
    
    // 如果正在拖拽，更新位置
    if (isDragging && allowDirectDrag) {
      // 计算速度 (用于惯性)
      if (lastPosRef.current) {
        velocityRef.current = {
          x: x - lastPosRef.current.x,
          y: y - lastPosRef.current.y
        };
      }
      lastPosRef.current = { x, y };
      
      // 直接更新目标位置
      targetPos.current = { x, y };
      
      // 回调父组件 (Don Norman: 即时反馈)
      const newZ = screenToImpedance(x, y);
      if (newZ && onDirectDrag) {
        onDirectDrag(newZ);
      }
      return;
    }
    
    // 非拖拽模式：原有的鼠标跟随逻辑
    if (overrideImpedance) return;

    const { cx, cy, radius } = canvasDimensions.current;
    const u = (x - cx) / radius;
    const v = (cy - y) / radius;

    if (u * u + v * v <= 1.01) {
      targetPos.current = { x, y };
    } else {
      targetPos.current = null;
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!allowDirectDrag) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击在活动点附近
    if (isNearActivePoint(x, y) || !currentPos.current) {
      setIsDragging(true);
      lastPosRef.current = { x, y };
      velocityRef.current = { x: 0, y: 0 };
      
      // ========================================
      // GHOST TRACES: Save current position as ghost
      // This allows comparison with previous state
      // ========================================
      if (impedance) {
        ghostTraceRef.current = { ...impedance };
      }
      
      // HUD: 通知父组件开始拖拽
      onDragChange?.(true);
      
      // 如果没有当前点，从点击位置开始
      if (!currentPos.current) {
        targetPos.current = { x, y };
        const newZ = screenToImpedance(x, y);
        if (newZ && onDirectDrag) {
          onDirectDrag(newZ);
        }
      }
    }
  };
  
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      
      // HUD: 通知父组件结束拖拽
      onDragChange?.(false);
      
      // ========================================
      // GHOST TRACES: Fade out ghost after 2 seconds
      // ========================================
      setTimeout(() => {
        ghostTraceRef.current = null;
      }, 2000);
      
      // Don Norman: 物理惯性
      // 释放后继续滑动一段距离
      if (!reducedMotion && (Math.abs(velocityRef.current.x) > 2 || Math.abs(velocityRef.current.y) > 2)) {
        const applyInertia = () => {
          const decay = 0.92; // 阻尼系数
          velocityRef.current.x *= decay;
          velocityRef.current.y *= decay;
          
          if (targetPos.current) {
            const newX = targetPos.current.x + velocityRef.current.x;
            const newY = targetPos.current.y + velocityRef.current.y;
            
            // 检查是否在圆内
            const { cx, cy, radius } = canvasDimensions.current;
            const u = (newX - cx) / radius;
            const v = (cy - newY) / radius;
            
            if (u * u + v * v <= 1) {
              targetPos.current = { x: newX, y: newY };
              
              const newZ = screenToImpedance(newX, newY);
              if (newZ && onDirectDrag) {
                onDirectDrag(newZ);
              }
              
              if (Math.abs(velocityRef.current.x) > 0.5 || Math.abs(velocityRef.current.y) > 0.5) {
                requestAnimationFrame(applyInertia);
              }
            }
          }
        };
        requestAnimationFrame(applyInertia);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    // HUD: 通知父组件鼠标离开
    onHoverChange?.(false);
    if (isDragging) {
      handleMouseUp();
    }
    if (!overrideImpedance && !isDragging) {
      targetPos.current = null;
    }
  };
  
  // 触摸事件支持 (移动端)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!allowDirectDrag) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setIsDragging(true);
    lastPosRef.current = { x, y };
    targetPos.current = { x, y };
    
    const newZ = screenToImpedance(x, y);
    if (newZ && onDirectDrag) {
      onDirectDrag(newZ);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    if (lastPosRef.current) {
      velocityRef.current = {
        x: x - lastPosRef.current.x,
        y: y - lastPosRef.current.y
      };
    }
    lastPosRef.current = { x, y };
    targetPos.current = { x, y };
    
    const newZ = screenToImpedance(x, y);
    if (newZ && onDirectDrag) {
      onDirectDrag(newZ);
    }
  };
  
  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // 动态光标样式
  const getCursorStyle = (): string => {
    if (isDragging) return 'cursor-grabbing';
    if (isHovering && allowDirectDrag) return 'cursor-grab';
    if (allowDirectDrag) return 'cursor-crosshair';
    if (overrideImpedance) return 'cursor-default';
    return 'cursor-crosshair';
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-3xl overflow-hidden">
      {/* CINEMATIC: Dynamic Vignette - Focuses eye on center */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
        }}
      />
      
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full smith-canvas ${getCursorStyle()}`}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* Simplified HUD - Progressive Disclosure
          Default: Only show impedance + match quality (what matters)
          Advanced data is shown on the canvas near the point */}
      {!overrideImpedance && impedance && rfParams && (
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="py-2">
            {/* Compact Header */}
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ 
                  backgroundColor: getRegionColor(rfParams.region),
                  boxShadow: `0 0 8px ${getRegionColor(rfParams.region)}40`
                }}
              />
              <span className="text-[9px] uppercase tracking-[0.15em] font-semibold" style={{ color: getRegionColor(rfParams.region) }}>
                {getRegionLabel(rfParams.region, lang)}
              </span>
            </div>
            
            {/* Primary Value - Impedance (THE thing users care about) */}
            <div className="font-mono text-xl text-white tracking-wide mb-2 tabular-nums">
              <span style={{ color: THEME.colors.primary }}>{impedance.r.toFixed(2)}</span>
              <span className="text-white/30 mx-0.5">{impedance.x >= 0 ? '+' : '−'}</span>
              <span className="text-white/60">j{Math.abs(impedance.x).toFixed(2)}</span>
            </div>
            
            {/* Match Quality - Visual Bar (intuitive, no numbers needed) */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${Math.max(5, Math.min(100, (1 - rfParams.gammaMag) * 100))}%`,
                    backgroundColor: getVSWRColor(rfParams.vswr),
                    transition: 'width 0.15s ease-out'
                  }}
                />
              </div>
              <span className="text-[9px] font-medium w-12 text-right" style={{ color: getVSWRColor(rfParams.vswr) }}>
                {getMatchQuality(rfParams.vswr, lang)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions for HUD - Unified color scheme: Gold + Silver/White
function getRegionColor(region: string): string {
  switch (region) {
    case 'match': return THEME.colors.primary;      // Gold for matched
    case 'inductive': return '#FFFFFF';              // White for inductive
    case 'capacitive': return '#FFFFFF';             // White for capacitive  
    case 'short': return THEME.colors.status.warning;  // Warm grey for extremes
    case 'open': return THEME.colors.status.warning;   // Warm grey for extremes
    default: return THEME.colors.status.warning;
  }
}

function getRegionLabel(region: string, lang: string): string {
  const labels: Record<string, Record<string, string>> = {
    match: { en: 'MATCHED', zh: '匹配' },
    inductive: { en: 'INDUCTIVE (+jX)', zh: '感性区 (+jX)' },
    capacitive: { en: 'CAPACITIVE (−jX)', zh: '容性区 (−jX)' },
    short: { en: 'SHORT CIRCUIT', zh: '短路' },
    open: { en: 'OPEN CIRCUIT', zh: '开路' },
  };
  return labels[region]?.[lang] || region;
}

function getVSWRColor(vswr: number): string {
  if (vswr <= 2) return THEME.colors.primary;    // Gold = Good
  if (vswr <= 5) return THEME.colors.status.warning;  // Warm grey = Acceptable
  return THEME.colors.status.poor;                    // Warm dark = Poor
}

function getMatchQuality(vswr: number, lang: string): string {
  if (vswr <= 1.2) return lang === 'zh' ? '极佳' : 'Excellent';
  if (vswr <= 1.5) return lang === 'zh' ? '优秀' : 'Very Good';
  if (vswr <= 2) return lang === 'zh' ? '良好' : 'Good';
  if (vswr <= 3) return lang === 'zh' ? '可接受' : 'Acceptable';
  if (vswr <= 5) return lang === 'zh' ? '较差' : 'Poor';
  return lang === 'zh' ? '失配' : 'Mismatched';
}

// --- Drawing Helpers ---

/**
 * CINEMATIC POLISH: Neon Bloom Rendering
 * 
 * Creates a glowing line effect with 3 layers:
 * - Layer 1: Core line (full opacity, thin)
 * - Layer 2: Inner glow (reduced opacity, medium width)
 * - Layer 3: Outer atmosphere (very low opacity, wide)
 */
function drawGlowingLine(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string = '#FFD700',
  intensity: number = 1
) {
  // Extract RGB from color for alpha manipulation
  const rgb = color.startsWith('#') 
    ? `${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}`
    : '255, 215, 0';
  
  // Layer 3: Outer Atmosphere
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = `rgba(${rgb}, ${0.05 * intensity})`;
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Layer 2: Inner Glow
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = `rgba(${rgb}, ${0.15 * intensity})`;
  ctx.lineWidth = 8;
  ctx.stroke();
  
  // Layer 1: Core Line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = `rgba(${rgb}, ${0.8 * intensity})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.lineCap = 'butt';
}

/**
 * CINEMATIC POLISH: Glowing Arc
 * Same concept but for arc paths
 */
function drawGlowingArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color: string = '#FFD700',
  intensity: number = 1
) {
  const rgb = color.startsWith('#') 
    ? `${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}`
    : '255, 215, 0';
  
  // Layer 3: Outer Atmosphere
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.strokeStyle = `rgba(${rgb}, ${0.05 * intensity})`;
  ctx.lineWidth = 14;
  ctx.stroke();
  
  // Layer 2: Inner Glow
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.strokeStyle = `rgba(${rgb}, ${0.12 * intensity})`;
  ctx.lineWidth = 6;
  ctx.stroke();
  
  // Layer 1: Core Line
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.strokeStyle = `rgba(${rgb}, ${0.7 * intensity})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * CINEMATIC POLISH: Cursor Spotlight
 * Renders a radial gradient "flashlight" effect at cursor position
 */
function drawCursorSpotlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number = 120
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.08)');
  gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.03)');
  gradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
}

/**
 * S-TIER SMITH CHART GRID
 * 
 * Design Language: "Scientific Precision"
 * Think of a radar on a sci-fi spaceship, not a textbook graph.
 * 
 * Color Palette (Strict):
 * - Background: Deep Void #050505
 * - Primary Brand: Amber Gold #FFD700
 * - Grid Lines (Main): #FFFFFF at 15% opacity
 * - Grid Lines (Sub): #FFFFFF at 5% opacity
 * - Text: #EAEAEA (High legibility)
 * 
 * Tufte's Grid Hierarchy:
 * - Prime Axes (r=1, x=0): opacity 0.25
 * - Other grid lines: opacity 0.08
 */

function drawSmithChartGrid(
  ctx: CanvasRenderingContext2D, 
  cx: number, 
  cy: number, 
  r: number, 
  showAdmittance: boolean = false,
  showVSWRCircles: boolean = false,
  bootProgress: number = 1 // 0-1, controls draw animation
) {
  const fontTech = "'Space Grotesk', monospace";
  
  // S-Tier: Precise line weights
  const hairline = 0.5;
  const thinLine = 0.75;
  const normalLine = 1;
  
  // CINEMATIC POLISH: Tufte's Grid Hierarchy
  // Prime Axes (r=1, x=0): Higher visibility
  // Other grid lines: "Distant" feel - very low opacity
  const GRID_WHITE_DISTANT = 'rgba(255, 255, 255, 0.08)';  // Distant grid lines
  const GRID_WHITE_PRIME = 'rgba(255, 255, 255, 0.25)';    // Prime axes (r=1, x=0)
  const GRID_GOLD_ACCENT = 'rgba(255, 215, 0, 0.3)';       // Key reference lines
  const GRID_GOLD_FAINT = 'rgba(255, 215, 0, 0.06)';       // Subtle gold hints
  const TEXT_HIGH = '#EAEAEA';                              // High legibility text
  const TEXT_MED = 'rgba(234, 234, 234, 0.5)';             // Medium text
  const TEXT_LOW = 'rgba(234, 234, 234, 0.25)';            // Low emphasis text
  
  ctx.lineWidth = hairline;
  
  // ========================================
  // BOOT SEQUENCE: Apply global opacity and stroke-dashoffset
  // Grid lines draw from center outwards
  // ========================================
  const bootOpacity = bootProgress;
  ctx.globalAlpha = bootOpacity;
  
  // Calculate dash offset for "drawing" effect
  // As bootProgress goes 0->1, dashOffset goes large->0
  const maxDashLength = r * 2 * Math.PI; // Circumference
  const dashOffset = maxDashLength * (1 - bootProgress);
  
  // --- VSWR CIRCLES (Draw first, behind everything) ---
  if (showVSWRCircles && bootProgress > 0.5) {
    const vswrValues = [1.5, 2, 3, 5];
    vswrValues.forEach(vswr => {
      const gammaMag = (vswr - 1) / (vswr + 1);
      const vswrRadius = gammaMag * r;
      
      ctx.beginPath();
      ctx.arc(cx, cy, vswrRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = GRID_GOLD_FAINT;
      ctx.lineWidth = hairline;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // S-Tier: Clean, minimal labels
      ctx.font = `600 9px ${fontTech}`;
      ctx.fillStyle = TEXT_LOW;
      ctx.textAlign = "left";
      ctx.fillText(`${vswr}:1`, cx + vswrRadius + 4, cy - 4);
    });
  }
  
  // --- BACKGROUND: Subtle radial glow from center ---
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.03)');
  gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.01)');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fill();
  
  // --- 1. UNIT CIRCLE (|Γ|=1 boundary) ---
  // CINEMATIC: Neon Bloom for the primary boundary
  // BOOT SEQUENCE: Draw with stroke-dashoffset animation
  
  const circumference = 2 * Math.PI * r;
  
  // Outer atmosphere
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * bootProgress);
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.04)';
  ctx.lineWidth = 10;
  ctx.stroke();
  
  // Inner glow
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * bootProgress);
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)';
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Core line with dash animation
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.strokeStyle = GRID_GOLD_ACCENT;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // --- 2. CONSTANT RESISTANCE CIRCLES ---
  // CINEMATIC: Tufte's Hierarchy - r=1 is Prime, others are Distant
  const rValues = [0, 0.2, 0.5, 1, 2, 5];
  rValues.forEach(rVal => {
    const centerU = rVal / (rVal + 1);
    const circleRadius = 1 / (rVal + 1);
    
    const screenCenterX = cx + centerU * r;
    const screenRadius = circleRadius * r;

    ctx.beginPath();
    ctx.arc(screenCenterX, cy, screenRadius, 0, 2 * Math.PI);
    
    if (rVal === 1) {
      // r=1 is the PRIME circle (match point) - Gold accent, higher visibility
      ctx.strokeStyle = GRID_GOLD_ACCENT;
      ctx.lineWidth = 1.2;
    } else if (rVal === 0) {
      // r=0 (short circuit circle) - Distant
      ctx.strokeStyle = GRID_GOLD_FAINT;
      ctx.lineWidth = hairline;
    } else {
      // Other resistance circles - Distant feel
      ctx.strokeStyle = GRID_WHITE_DISTANT;
      ctx.lineWidth = hairline;
    }
    ctx.stroke();
    
    // CINEMATIC: Very subtle labels
    if (rVal > 0 && rVal !== 1) {
      ctx.font = `500 7px ${fontTech}`;
      ctx.fillStyle = TEXT_LOW;
      ctx.textAlign = "center";
      const labelX = screenCenterX + screenRadius;
      if (labelX < cx + r - 10) {
        ctx.fillText(`${rVal}`, labelX, cy + 10);
      }
    }
  });

  // --- 3. CONSTANT REACTANCE ARCS ---
  // Formula: Center at (1, 1/x), Radius = 1/|x|
  const xValues = [0.2, 0.5, 1, 2, 5];
  
  // Clip to unit circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.clip();

  xValues.forEach(xVal => {
    // Positive reactance (inductive, top half)
    drawReactanceArc(ctx, cx, cy, r, xVal, true);
    // Negative reactance (capacitive, bottom half)
    drawReactanceArc(ctx, cx, cy, r, xVal, false);
  });
  
  // --- 4. REAL AXIS (x=0 line) ---
  // CINEMATIC: Prime Axis - Higher visibility (0.25 opacity)
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.strokeStyle = GRID_WHITE_PRIME;
  ctx.lineWidth = 1;
  ctx.stroke();

  // --- 5. ADMITTANCE CHART (Y = 1/Z, rotated 180°) ---
  if (showAdmittance) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI);
    ctx.translate(-cx, -cy);
    
    // Constant conductance circles (g)
    const gValues = [0.2, 0.5, 1, 2];
    gValues.forEach(gVal => {
      const centerU = gVal / (gVal + 1);
      const circleRadius = 1 / (gVal + 1);
      const screenCenterX = cx + centerU * r;
      ctx.beginPath();
      ctx.arc(screenCenterX, cy, circleRadius * r, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(100, 200, 150, 0.15)";
      ctx.stroke();
    });
    
    // Constant susceptance arcs (b)
    xValues.forEach(bVal => {
      drawReactanceArc(ctx, cx, cy, r, bVal, true, "rgba(100, 200, 150, 0.15)");
      drawReactanceArc(ctx, cx, cy, r, bVal, false, "rgba(100, 200, 150, 0.15)");
    });
    
    ctx.restore();
  }

  ctx.restore();

  // --- 6. LABELS ---
  // S-Tier: High legibility text with Space Grotesk
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Short Circuit (Γ = -1, z = 0)
  ctx.font = `600 10px ${fontTech}`;
  ctx.fillStyle = TEXT_MED;
  ctx.fillText("SHORT", cx - r - 32, cy);
  ctx.font = `400 8px ${fontTech}`;
  ctx.fillStyle = TEXT_LOW;
  ctx.fillText("z=0", cx - r - 32, cy + 12);
  
  // Open Circuit (Γ = +1, z = ∞)
  ctx.font = `600 10px ${fontTech}`;
  ctx.fillStyle = TEXT_MED;
  ctx.fillText("OPEN", cx + r + 30, cy);
  ctx.font = `400 8px ${fontTech}`;
  ctx.fillStyle = TEXT_LOW;
  ctx.fillText("z=∞", cx + r + 30, cy + 12);
  
  // Match Point (Γ = 0, z = 1) - Amber Gold accent
  ctx.font = `700 10px ${fontTech}`;
  ctx.fillStyle = '#FFD700';
  ctx.fillText("MATCH", cx, cy - 22);
  ctx.font = `400 8px ${fontTech}`;
  ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
  ctx.fillText("z=1, Γ=0", cx, cy - 11);
  
  // Inductive Region (+jX, top)
  ctx.font = `600 10px ${fontTech}`;
  ctx.fillStyle = TEXT_HIGH;
  ctx.fillText("+jX", cx, cy - r - 14);
  
  // Capacitive Region (-jX, bottom)
  ctx.fillText("−jX", cx, cy + r + 14);
  
  // --- 7. MATCH POINT MARKER with Neon Bloom ---
  // CINEMATIC: Multi-layer glow effect
  
  // Layer 3: Outer atmosphere
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255, 215, 0, 0.03)';
  ctx.fill();
  
  // Layer 2: Inner glow ring
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.12)';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Layer 1: Core ring
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Center dot - Amber Gold with bloom
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
  ctx.fillStyle = '#FFD700';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#FFD700';
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Reset global alpha after boot sequence
  ctx.globalAlpha = 1;
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
  // CINEMATIC: Tufte's Hierarchy - x=1 is Prime, others are Distant
  const hairline = 0.5;
  const GRID_WHITE_DISTANT = 'rgba(255, 255, 255, 0.08)';  // Distant
  const GRID_GOLD_ACCENT = 'rgba(255, 215, 0, 0.25)';      // Prime
  const TEXT_LOW = 'rgba(234, 234, 234, 0.25)';
  
  // Mathematical derivation for constant reactance arcs:
  // Center at (1, 1/x) in Γ-plane, Radius = 1/|x|
  const centerU = 1;
  const centerV = isPositive ? (1 / xVal) : (-1 / xVal);
  const arcRadius = 1 / xVal;

  // Convert to screen coordinates
  const screenCenterX = cx + centerU * scale;
  const screenCenterY = cy - centerV * scale; // Invert Y
  const screenRadius = arcRadius * scale;

  ctx.beginPath();
  ctx.arc(screenCenterX, screenCenterY, screenRadius, 0, 2 * Math.PI);
  
  // CINEMATIC: x=1 is Prime Axis, others are Distant
  if (xVal === 1) {
    ctx.strokeStyle = color || GRID_GOLD_ACCENT;
    ctx.lineWidth = 0.8;
  } else {
    ctx.strokeStyle = color || GRID_WHITE_DISTANT;
    ctx.lineWidth = hairline;
  }
  ctx.stroke();
  
  // S-Tier: Minimal labels
  if (!color && xVal === 1) {
    const fontTech = "'Space Grotesk', monospace";
    ctx.font = `500 7px ${fontTech}`;
    ctx.fillStyle = TEXT_LOW;
    ctx.textAlign = "center";
    
    const angle = 2 * Math.atan(1 / xVal);
    const labelX = cx + Math.cos(isPositive ? -angle : angle) * scale * 0.85;
    const labelY = cy + Math.sin(isPositive ? -angle : angle) * scale * 0.85;
    
    ctx.fillText(`${isPositive ? '+' : '-'}j${xVal}`, labelX, labelY);
  }
}

function drawActivePoint(
    ctx: CanvasRenderingContext2D, 
    cx: number, 
    cy: number, 
    radius: number, 
    impedance: Impedance,
    pos: { x: number; y: number },
    isHovering: boolean = false,
    isDragging: boolean = false,
    currentScale: number = 1,
    currentGlow: number = 0.1,
    breathPhase: number = 0  // 0-1 for breathing animation
) {
    const dpr = window.devicePixelRatio || 1;
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;
    
    // Calculate Gamma for this impedance
    const gamma = impedanceToGamma(impedance);
    const gammaMag = Complex.mag(gamma);
    
    // S-Tier Color: Amber Gold #FFD700
    const AMBER_GOLD = { r: 255, g: 215, b: 0 };
    
    // --- CINEMATIC: Cursor Spotlight (Flashlight Effect) ---
    // Illuminates the grid as you inspect it
    drawCursorSpotlight(ctx, pos.x, pos.y, 150);
    
    // --- 1. Draw Vector from Center to Point (Γ vector) ---
    // CINEMATIC: Use Neon Bloom rendering for the trace
    drawGlowingLine(ctx, cx, cy, pos.x, pos.y, '#FFD700', isDragging ? 1.2 : 0.8);
    ctx.lineWidth = 1;
    
    // --- 2. Draw |Γ| Circle (VSWR circle through this point) ---
    // CINEMATIC: Neon Bloom for the VSWR circle
    if (gammaMag > 0.01 && gammaMag < 0.99) {
      const vswrRadius = gammaMag * radius;
      
      // Outer atmosphere
      ctx.beginPath();
      ctx.arc(cx, cy, vswrRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.04)';
      ctx.lineWidth = 12;
      ctx.stroke();
      
      // Inner glow
      ctx.beginPath();
      ctx.arc(cx, cy, vswrRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Core line
      ctx.beginPath();
      ctx.arc(cx, cy, vswrRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // --- 3. Crosshair is now handled by CustomCursor component ---
    // (Removed from canvas to avoid duplication)
    
    // --- 4. Draw the Active Point with BREATHING GLOW ---
    // S-Tier: Pulsing glow effect
    
    const baseOuterRadius = 14;
    const baseMiddleRadius = 9;
    const baseCoreRadius = 5;
    const baseCenterRadius = 2;
    
    // Breathing effect: Subtle scale/glow pulse
    const breathScale = 1 + Math.sin(breathPhase * Math.PI * 2) * 0.08;
    const breathGlow = 0.3 + Math.sin(breathPhase * Math.PI * 2) * 0.15;
    
    // Apply current animation state
    const scale = currentScale * breathScale;
    const glowIntensity = Math.max(currentGlow, breathGlow);
    
    // S-Tier: Brightness based on match quality
    // VSWR 1 = Perfect = Full brightness
    // VSWR 5+ = Poor = Dimmed
    const vswr = gammaMag < 0.999 ? (1 + gammaMag) / (1 - gammaMag) : 10;
    const matchBrightness = Math.max(0.5, 1 - (vswr - 1) / 10);
    
    // Dynamic color: Amber Gold with brightness modulation
    const r_color = Math.round(AMBER_GOLD.r * matchBrightness);
    const g_color = Math.round(AMBER_GOLD.g * matchBrightness);
    const b_color = 0;
    const pointColor = `rgb(${r_color}, ${g_color}, ${b_color})`;
    
    // --- Outer Glow Layers (Breathing) ---
    // Layer 1: Outermost soft glow
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, baseOuterRadius * scale * 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(${r_color}, ${g_color}, 0, ${glowIntensity * 0.15})`;
    ctx.fill();
    
    // Layer 2: Middle glow
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, baseOuterRadius * scale, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(${r_color}, ${g_color}, 0, ${glowIntensity * 0.3})`;
    ctx.fill();
    
    // Layer 3: Inner glow ring
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, baseMiddleRadius * scale, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(${r_color}, ${g_color}, 0, ${glowIntensity * 0.5})`;
    ctx.fill();
    
    // --- Core Point with Shadow ---
    ctx.shadowBlur = (isDragging ? 35 : (isHovering ? 28 : 20)) * matchBrightness;
    ctx.shadowColor = `rgba(${AMBER_GOLD.r}, ${AMBER_GOLD.g}, 0, 0.8)`;
    ctx.fillStyle = pointColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, baseCoreRadius * scale, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // --- White Center Dot ---
    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + 0.4 * matchBrightness})`;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, baseCenterRadius * scale, 0, 2 * Math.PI);
    ctx.fill();
    
    // --- Drag Indicator (4 directional lines) ---
    if (isDragging) {
      const arrowOffset = baseOuterRadius * scale * 2;
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 1.5;
      
      const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      directions.forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(pos.x + dx * arrowOffset * 0.5, pos.y + dy * arrowOffset * 0.5);
        ctx.lineTo(pos.x + dx * arrowOffset, pos.y + dy * arrowOffset);
        ctx.stroke();
      });
      ctx.lineWidth = 1;
    }
    
    // --- 5. Draw Mini Data Labels near the point ---
    // Tufte: 高分辨率视觉 - 精确到小数点后 4 位
    const labelOffset = 20;
    const labelX = pos.x + labelOffset;
    const labelY = pos.y - labelOffset;
    
    // Only show if not too close to edges
    if (labelX < w - 80 && labelY > 20) {
      // Tufte: 数据墨水比 - 数据标签是最重要的，用最亮的颜色
      ctx.font = "bold 10px 'Space Grotesk', monospace";
      ctx.fillStyle = pointColor;  // 使用动态颜色
      ctx.textAlign = "left";
      
      // Tufte: 高精度读数 - 小数点后 4 位
      const zText = `z = ${impedance.r.toFixed(4)}${impedance.x >= 0 ? '+' : ''}j${impedance.x.toFixed(4)}`;
      ctx.fillText(zText, labelX, labelY);
      
      // Gamma magnitude - 高精度
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + 0.4 * matchBrightness})`;
      ctx.font = "9px 'Space Grotesk', monospace";
      ctx.fillText(`|Γ| = ${gammaMag.toFixed(4)}`, labelX, labelY + 14);
      
      // VSWR - 高精度，颜色随匹配度变化
      const vswrDisplay = vswr > 99 ? '∞' : vswr.toFixed(3);
      ctx.fillStyle = pointColor;
      ctx.fillText(`VSWR = ${vswrDisplay}:1`, labelX, labelY + 26);
    }
}
