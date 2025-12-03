import React, { useState, useRef, useEffect, useMemo } from 'react';
import { THEME } from '../theme';

interface LiveCardProps {
  title: string;
  desc: string;
  lang: 'en' | 'zh';
}

// Helper: Scrubbable Number Logic
const useScrub = (initialValue: number, min: number, max: number, step: number = 0.01) => {
  const [value, setValue] = useState(initialValue);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startValue.current = value;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - startX.current;
    // Sensitivity: 1px = 1 step
    const newValue = Math.min(max, Math.max(min, startValue.current + delta * step));
    setValue(newValue);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return { value, setValue, handleMouseDown };
};

// ==========================================
// 1. Efficiency Card (Power Transfer)
// ==========================================
export const EfficiencyCard: React.FC<LiveCardProps> = ({ title, desc, lang }) => {
  // Control Gamma Magnitude (0 to 1)
  const { value: gamma, handleMouseDown } = useScrub(0.5, 0, 1, 0.005);
  
  const efficiency = (1 - gamma * gamma) * 100;
  const returnLoss = gamma > 0.001 ? -20 * Math.log10(gamma) : 100;
  
  // Visuals
  const radius = 40;
  const center = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (efficiency / 100) * circumference;

  return (
    <div className="relative group rounded-2xl bg-[#111] border border-white/10 p-6 overflow-hidden hover:border-[#FFC700]/30 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#FFC700] mb-1">{title}</h3>
          <div className="text-xs text-white/40">{desc}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-white">{efficiency.toFixed(1)}%</div>
          <div className="text-[10px] text-white/30 font-mono">Power Delivered</div>
        </div>
      </div>

      {/* Interactive Area */}
      <div 
        className="relative h-32 flex items-center justify-center cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
      >
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_100%]" />
        
        {/* Gauge */}
        <svg width="120" height="120" className="transform -rotate-90">
          {/* Track */}
          <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
          {/* Progress */}
          <circle 
            cx="60" cy="60" r={radius} 
            stroke={THEME.colors.primary} 
            strokeWidth="8" 
            fill="none" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute text-center pointer-events-none">
          <div className="text-[10px] text-white/50">VSWR</div>
          <div className="text-sm font-bold text-white">
            {gamma >= 0.99 ? '∞' : ((1 + gamma) / (1 - gamma)).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Slider Indicator */}
      <div className="mt-2 flex items-center gap-3">
        <span className="text-[10px] font-mono text-white/40">|Γ| = {gamma.toFixed(2)}</span>
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FFC700]" 
            style={{ width: `${gamma * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-[#FFC700]/70 animate-pulse">DRAG</span>
      </div>
    </div>
  );
};

// ==========================================
// 2. Q-Factor Card (Resonance)
// ==========================================
export const QFactorCard: React.FC<LiveCardProps> = ({ title, desc, lang }) => {
  // Control Q (0.1 to 20)
  const { value: q, handleMouseDown } = useScrub(5, 0.5, 20, 0.1);
  
  // Draw Resonance Curve
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    
    const w = cvs.width;
    const h = cvs.height;
    ctx.clearRect(0, 0, w, h);
    
    // Draw Curve: 1 / sqrt(1 + Q^2(w/w0 - w0/w)^2)
    // Simplified Lorentzian for visualization centered at w/2
    ctx.beginPath();
    ctx.strokeStyle = '#479CFF';
    ctx.lineWidth = 2;
    
    for (let x = 0; x < w; x++) {
      const freq = (x / w) * 2; // 0 to 2 normalized freq
      if (freq === 0) continue;
      // Detuning parameter delta = Q * (f/f0 - f0/f)
      const delta = q * (freq - 1/freq); 
      const mag = 1 / Math.sqrt(1 + delta * delta);
      
      const y = h - (mag * (h - 10)); // 10px padding
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw Bandwidth Marker (-3dB = 0.707 height)
    const y3db = h - (0.707 * (h - 10));
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.setLineDash([2, 2]);
    ctx.moveTo(0, y3db);
    ctx.lineTo(w, y3db);
    ctx.stroke();
    ctx.setLineDash([]);
    
  }, [q]);

  return (
    <div className="relative group rounded-2xl bg-[#111] border border-white/10 p-6 overflow-hidden hover:border-[#479CFF]/30 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#479CFF] mb-1">{title}</h3>
          <div className="text-xs text-white/40">{desc}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-white">Q={q.toFixed(1)}</div>
          <div className="text-[10px] text-white/30 font-mono">Selectivity</div>
        </div>
      </div>

      <div 
        className="relative h-32 cursor-ew-resize select-none bg-black/20 rounded-lg border border-white/5"
        onMouseDown={handleMouseDown}
      >
        <canvas ref={canvasRef} width={300} height={128} className="w-full h-full" />
        
        {/* Bandwidth Label */}
        <div className="absolute top-2 right-2 text-[9px] font-mono text-white/30">
          BW ≈ {(1/q * 100).toFixed(0)}%
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-between">
         <span className="text-[10px] font-mono text-white/40">Sharpness</span>
         <span className="text-[10px] text-[#479CFF]/70 animate-pulse">DRAG</span>
      </div>
    </div>
  );
};

// ==========================================
// 3. Line Rotation Card
// ==========================================
export const LineRotationCard: React.FC<LiveCardProps> = ({ title, desc, lang }) => {
  // Control Length (0 to 0.5 lambda)
  const { value: len, handleMouseDown } = useScrub(0.125, 0, 0.5, 0.001);
  
  const angleDeg = len * 720; // 2 * beta * l = 4 * pi * l -> 360 * 2 * l = 720 * l
  
  return (
    <div className="relative group rounded-2xl bg-[#111] border border-white/10 p-6 overflow-hidden hover:border-white/30 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-white mb-1">{title}</h3>
          <div className="text-xs text-white/40">{desc}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-white">{angleDeg.toFixed(0)}°</div>
          <div className="text-[10px] text-white/30 font-mono">Rotation</div>
        </div>
      </div>

      <div 
        className="relative h-32 flex items-center justify-center cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
      >
        {/* Smith Chart Background (Simple) */}
        <div className="absolute w-24 h-24 rounded-full border border-white/10" />
        <div className="absolute w-24 h-[1px] bg-white/10" />
        
        {/* Rotating Vector */}
        <div 
          className="absolute w-24 h-24 flex items-center justify-center transition-transform duration-75"
          style={{ transform: `rotate(${-angleDeg}deg)` }} // Clockwise rotation on chart
        >
          {/* Vector Line */}
          <div className="absolute top-1/2 left-1/2 w-[40px] h-[2px] bg-white origin-left" />
          {/* Point */}
          <div 
            className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]" 
            style={{ transform: 'translate(36px, -50%)' }}
          />
        </div>
        
        <div className="absolute bottom-2 text-[9px] font-mono text-white/30">
          λ = {len.toFixed(3)}
        </div>
      </div>
      
      <div className="mt-2 flex items-center gap-3">
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white" 
            style={{ width: `${(len/0.5) * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-white/70 animate-pulse">DRAG</span>
      </div>
    </div>
  );
};
