import React, { useEffect, useRef, useState } from 'react';
import { THEME } from '../theme';

interface FormulaValues {
  r: number;
  x: number;
  gammaMag: number;
  gammaPhase: number;  // in degrees
  vswr: number;
}

interface LiveFormulaCardsProps {
  values: FormulaValues;
  lang: 'en' | 'zh';
  className?: string;
}

/**
 * LiveFormulaCards - Real-time instrument displays bound to current impedance point
 * 
 * Three cards that update with smooth animations as the user moves the point:
 * 1. Impedance (r + jx)
 * 2. Reflection Coefficient (Γ with mini polar plot)
 * 3. VSWR (with progress bar)
 */
export const LiveFormulaCards: React.FC<LiveFormulaCardsProps> = ({ 
  values, 
  lang,
  className = '' 
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${className}`}>
      <ImpedanceCard r={values.r} x={values.x} lang={lang} />
      <GammaCard mag={values.gammaMag} phase={values.gammaPhase} lang={lang} />
      <VSWRCard vswr={values.vswr} lang={lang} />
    </div>
  );
};

// Animated number display hook
const useAnimatedValue = (target: number, duration: number = 180) => {
  const [display, setDisplay] = useState(target);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(target);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    fromRef.current = display;
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Expo out easing
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = fromRef.current + (target - fromRef.current) * eased;
      setDisplay(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [target, duration]);

  return display;
};

// Card 1: Impedance z = r + jx
const ImpedanceCard: React.FC<{ r: number; x: number; lang: 'en' | 'zh' }> = ({ r, x, lang }) => {
  const animR = useAnimatedValue(r);
  const animX = useAnimatedValue(x);

  return (
    <div className="pl-5 py-2 relative group">
      {/* Left Accent bar */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-0.5 transition-all duration-300 group-hover:w-1"
        style={{ backgroundColor: THEME.colors.primary }}
      />

      {/* Label */}
      <div 
        className="text-[10px] uppercase tracking-widest mb-2 font-medium"
        style={{ color: THEME.colors.text.label }}
      >
        {lang === 'zh' ? '阻抗 z' : 'Impedance z'}
      </div>

      {/* Value display */}
      <div className="flex items-baseline gap-1 mb-2">
        <span 
          className="font-mono text-2xl font-semibold tabular-nums"
          style={{ color: THEME.colors.primary }}
        >
          {animR.toFixed(2)}
        </span>
        <span className="text-white/50 text-lg">
          {animX >= 0 ? '+' : '−'}
        </span>
        <span className="text-white/50 text-lg">j</span>
        <span 
          className="font-mono text-2xl font-semibold tabular-nums"
          style={{ color: '#64B4FF' }}
        >
          {Math.abs(animX).toFixed(2)}
        </span>
      </div>

      {/* Mini labels */}
      <div className="flex gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: THEME.colors.primary }}
          />
          <span style={{ color: THEME.colors.text.muted }}>
            {lang === 'zh' ? '电阻 R' : 'Resistance R'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#64B4FF' }}
          />
          <span style={{ color: THEME.colors.text.muted }}>
            {lang === 'zh' ? '电抗 X' : 'Reactance X'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Card 2: Reflection Coefficient Γ with mini polar plot
const GammaCard: React.FC<{ mag: number; phase: number; lang: 'en' | 'zh' }> = ({ mag, phase, lang }) => {
  const animMag = useAnimatedValue(mag);
  const animPhase = useAnimatedValue(phase);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw mini polar plot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 60;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    // Unit circle
    ctx.strokeStyle = 'rgba(255, 199, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // Current point
    const angleRad = (animPhase * Math.PI) / 180;
    const px = cx + Math.cos(angleRad) * animMag * radius;
    const py = cy - Math.sin(angleRad) * animMag * radius;

    // Line from center to point
    ctx.strokeStyle = `rgba(255, 199, 0, 0.5)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Point glow
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, 8);
    gradient.addColorStop(0, 'rgba(255, 199, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 199, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();

    // Point core
    ctx.fillStyle = THEME.colors.primary;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

  }, [animMag, animPhase]);

  return (
    <div className="pl-5 py-2 relative group">
      {/* Left Accent bar */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-0.5 transition-all duration-300 group-hover:w-1"
        style={{ backgroundColor: THEME.colors.secondary }}
      />

      {/* Label */}
      <div 
        className="text-[10px] uppercase tracking-widest mb-2 font-medium"
        style={{ color: THEME.colors.text.label }}
      >
        {lang === 'zh' ? '反射系数 Γ' : 'Reflection Γ'}
      </div>

      <div className="flex items-start justify-between">
        {/* Values */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-white/40">|Γ|</span>
            <span 
              className="font-mono text-xl font-semibold tabular-nums"
              style={{ color: THEME.colors.text.main }}
            >
              {animMag.toFixed(3)}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-white/40">∠Γ</span>
            <span 
              className="font-mono text-lg tabular-nums"
              style={{ color: THEME.colors.text.muted }}
            >
              {animPhase.toFixed(1)}°
            </span>
          </div>
        </div>

        {/* Mini polar plot */}
        <canvas ref={canvasRef} className="flex-shrink-0" />
      </div>
    </div>
  );
};

// Card 3: VSWR with progress bar
const VSWRCard: React.FC<{ vswr: number; lang: 'en' | 'zh' }> = ({ vswr, lang }) => {
  const animVSWR = useAnimatedValue(vswr);
  const displayVSWR = animVSWR > 99 ? '∞' : animVSWR.toFixed(2);
  
  // Map VSWR to progress (1 = 0%, 3+ = 100%)
  const progress = Math.min((animVSWR - 1) / 2, 1);
  
  // Color based on VSWR
  const getColor = () => {
    if (animVSWR <= 1.5) return THEME.colors.status.good;
    if (animVSWR <= 2.5) return THEME.colors.status.warning;
    return THEME.colors.status.poor;
  };

  return (
    <div className="pl-5 py-2 relative group">
      {/* Left Accent bar */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-0.5 transition-all duration-300 group-hover:w-1"
        style={{ backgroundColor: getColor() }}
      />

      {/* Label */}
      <div 
        className="text-[10px] uppercase tracking-widest mb-2 font-medium"
        style={{ color: THEME.colors.text.label }}
      >
        {lang === 'zh' ? '驻波比 VSWR' : 'VSWR'}
      </div>

      {/* Value */}
      <div 
        className="font-mono text-3xl font-bold mb-3 tabular-nums"
        style={{ color: getColor() }}
      >
        {displayVSWR}
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full overflow-hidden bg-white/5">
        {/* Scale markers */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 border-r border-white/10" />
          <div className="flex-1 border-r border-white/10" />
          <div className="flex-1" />
        </div>
        
        {/* Fill */}
        <div 
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: getColor(),
            boxShadow: `0 0 10px ${getColor()}`,
            transition: `all 0.18s ${THEME.animation.curve}`,
          }}
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-1.5 text-[9px] text-white/30">
        <span>1.0</span>
        <span>2.0</span>
        <span>3.0+</span>
      </div>
    </div>
  );
};

export default LiveFormulaCards;





interface FormulaValues {
  r: number;
  x: number;
  gammaMag: number;
  gammaPhase: number;  // in degrees
  vswr: number;
}

interface LiveFormulaCardsProps {
  values: FormulaValues;
  lang: 'en' | 'zh';
  className?: string;
}

/**
 * LiveFormulaCards - Real-time instrument displays bound to current impedance point
 * 
 * Three cards that update with smooth animations as the user moves the point:
 * 1. Impedance (r + jx)
 * 2. Reflection Coefficient (Γ with mini polar plot)
 * 3. VSWR (with progress bar)
 */
export const LiveFormulaCards: React.FC<LiveFormulaCardsProps> = ({ 
  values, 
  lang,
  className = '' 
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${className}`}>
      <ImpedanceCard r={values.r} x={values.x} lang={lang} />
      <GammaCard mag={values.gammaMag} phase={values.gammaPhase} lang={lang} />
      <VSWRCard vswr={values.vswr} lang={lang} />
    </div>
  );
};

// Animated number display hook
const useAnimatedValue = (target: number, duration: number = 180) => {
  const [display, setDisplay] = useState(target);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(target);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    fromRef.current = display;
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Expo out easing
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = fromRef.current + (target - fromRef.current) * eased;
      setDisplay(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [target, duration]);

  return display;
};

// Card 1: Impedance z = r + jx
const ImpedanceCard: React.FC<{ r: number; x: number; lang: 'en' | 'zh' }> = ({ r, x, lang }) => {
  const animR = useAnimatedValue(r);
  const animX = useAnimatedValue(x);

  return (
    <div className="pl-5 py-2 relative group">
      {/* Left Accent bar */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-0.5 transition-all duration-300 group-hover:w-1"
        style={{ backgroundColor: THEME.colors.primary }}
      />

      {/* Label */}
      <div 
        className="text-[10px] uppercase tracking-widest mb-2 font-medium"
        style={{ color: THEME.colors.text.label }}
      >
        {lang === 'zh' ? '阻抗 z' : 'Impedance z'}
      </div>

      {/* Value display */}
      <div className="flex items-baseline gap-1 mb-2">
        <span 
          className="font-mono text-2xl font-semibold tabular-nums"
          style={{ color: THEME.colors.primary }}
        >
          {animR.toFixed(2)}
        </span>
        <span className="text-white/50 text-lg">
          {animX >= 0 ? '+' : '−'}
        </span>
        <span className="text-white/50 text-lg">j</span>
        <span 
          className="font-mono text-2xl font-semibold tabular-nums"
          style={{ color: '#64B4FF' }}
        >
          {Math.abs(animX).toFixed(2)}
        </span>
      </div>

      {/* Mini labels */}
      <div className="flex gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: THEME.colors.primary }}
          />
          <span style={{ color: THEME.colors.text.muted }}>
            {lang === 'zh' ? '电阻 R' : 'Resistance R'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#64B4FF' }}
          />
          <span style={{ color: THEME.colors.text.muted }}>
            {lang === 'zh' ? '电抗 X' : 'Reactance X'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Card 2: Reflection Coefficient Γ with mini polar plot
const GammaCard: React.FC<{ mag: number; phase: number; lang: 'en' | 'zh' }> = ({ mag, phase, lang }) => {
  const animMag = useAnimatedValue(mag);
  const animPhase = useAnimatedValue(phase);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw mini polar plot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 60;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    // Unit circle
    ctx.strokeStyle = 'rgba(255, 199, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // Current point
    const angleRad = (animPhase * Math.PI) / 180;
    const px = cx + Math.cos(angleRad) * animMag * radius;
    const py = cy - Math.sin(angleRad) * animMag * radius;

    // Line from center to point
    ctx.strokeStyle = `rgba(255, 199, 0, 0.5)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Point glow
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, 8);
    gradient.addColorStop(0, 'rgba(255, 199, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 199, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();

    // Point core
    ctx.fillStyle = THEME.colors.primary;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

  }, [animMag, animPhase]);

  return (
    <div className="pl-5 py-2 relative group">
      {/* Left Accent bar */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-0.5 transition-all duration-300 group-hover:w-1"
        style={{ backgroundColor: THEME.colors.secondary }}
      />

      {/* Label */}
      <div 
        className="text-[10px] uppercase tracking-widest mb-2 font-medium"
        style={{ color: THEME.colors.text.label }}
      >
        {lang === 'zh' ? '反射系数 Γ' : 'Reflection Γ'}
      </div>

      <div className="flex items-start justify-between">
        {/* Values */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-white/40">|Γ|</span>
            <span 
              className="font-mono text-xl font-semibold tabular-nums"
              style={{ color: THEME.colors.text.main }}
            >
              {animMag.toFixed(3)}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-white/40">∠Γ</span>
            <span 
              className="font-mono text-lg tabular-nums"
              style={{ color: THEME.colors.text.muted }}
            >
              {animPhase.toFixed(1)}°
            </span>
          </div>
        </div>

        {/* Mini polar plot */}
        <canvas ref={canvasRef} className="flex-shrink-0" />
      </div>
    </div>
  );
};

// Card 3: VSWR with progress bar
const VSWRCard: React.FC<{ vswr: number; lang: 'en' | 'zh' }> = ({ vswr, lang }) => {
  const animVSWR = useAnimatedValue(vswr);
  const displayVSWR = animVSWR > 99 ? '∞' : animVSWR.toFixed(2);
  
  // Map VSWR to progress (1 = 0%, 3+ = 100%)
  const progress = Math.min((animVSWR - 1) / 2, 1);
  
  // Color based on VSWR
  const getColor = () => {
    if (animVSWR <= 1.5) return THEME.colors.status.good;
    if (animVSWR <= 2.5) return THEME.colors.status.warning;
    return THEME.colors.status.poor;
  };

  return (
    <div className="pl-5 py-2 relative group">
      {/* Left Accent bar */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-0.5 transition-all duration-300 group-hover:w-1"
        style={{ backgroundColor: getColor() }}
      />

      {/* Label */}
      <div 
        className="text-[10px] uppercase tracking-widest mb-2 font-medium"
        style={{ color: THEME.colors.text.label }}
      >
        {lang === 'zh' ? '驻波比 VSWR' : 'VSWR'}
      </div>

      {/* Value */}
      <div 
        className="font-mono text-3xl font-bold mb-3 tabular-nums"
        style={{ color: getColor() }}
      >
        {displayVSWR}
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full overflow-hidden bg-white/5">
        {/* Scale markers */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 border-r border-white/10" />
          <div className="flex-1 border-r border-white/10" />
          <div className="flex-1" />
        </div>
        
        {/* Fill */}
        <div 
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: getColor(),
            boxShadow: `0 0 10px ${getColor()}`,
            transition: `all 0.18s ${THEME.animation.curve}`,
          }}
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-1.5 text-[9px] text-white/30">
        <span>1.0</span>
        <span>2.0</span>
        <span>3.0+</span>
      </div>
    </div>
  );
};

export default LiveFormulaCards;
