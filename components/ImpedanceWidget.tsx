import React, { useState, useEffect, useRef } from 'react';
import { THEME } from '../theme';

interface ImpedanceWidgetProps {
  lang: 'en' | 'zh';
}

export const ImpedanceWidget: React.FC<ImpedanceWidgetProps> = ({ lang }) => {
  const [r, setR] = useState(50); // Resistance 0-100
  const [x, setX] = useState(30); // Reactance -100 to 100
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    if (canvas.width !== width * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
    }

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Coordinates
    const centerX = 40;
    const centerY = height / 2;
    const scale = 1.5; // pixels per ohm

    // Draw Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // X-axis (R)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(width - 20, centerY);
    ctx.stroke();

    // Y-axis (jX)
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, height - 20);
    ctx.stroke();

    // Vectors
    const rEnd = centerX + r * scale;
    const xEnd = centerY - x * scale; // canvas Y is inverted

    // 1. Resistance Vector (Horizontal)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(rEnd, centerY);
    ctx.strokeStyle = THEME.colors.primary; // Gold
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 2. Reactance Vector (Vertical from R end)
    ctx.beginPath();
    ctx.moveTo(rEnd, centerY);
    ctx.lineTo(rEnd, xEnd);
    ctx.strokeStyle = '#479CFF'; // Blue
    ctx.lineWidth = 3;
    ctx.stroke();
    // Dashed line to axis
    ctx.beginPath();
    ctx.moveTo(centerX, xEnd);
    ctx.lineTo(rEnd, xEnd);
    ctx.strokeStyle = 'rgba(71, 156, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Impedance Vector Z (Hypotenuse)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(rEnd, xEnd);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Arrow head for Z
    const angle = Math.atan2(centerY - xEnd, rEnd - centerX);
    const headLen = 10;
    ctx.beginPath();
    ctx.moveTo(rEnd, xEnd);
    ctx.lineTo(rEnd - headLen * Math.cos(angle - Math.PI / 6), xEnd + headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(rEnd - headLen * Math.cos(angle + Math.PI / 6), xEnd + headLen * Math.sin(angle + Math.PI / 6));
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Labels
    ctx.font = "bold 12px 'Space Grotesk', monospace";
    const midX = (centerX + rEnd) / 2;
    const midY = (centerY + xEnd) / 2;
    
    // R Label (keep near base line)
    ctx.fillStyle = THEME.colors.primary;
    ctx.fillText(`R = ${r}Ω`, midX, centerY + 20);

    // X Label (nudge right and slightly above to avoid Z label overlap)
    ctx.fillStyle = '#479CFF';
    ctx.fillText(`X = ${x}Ω`, rEnd + 12, midY - 6);

    // Z Label (tuck above the hypotenuse midpoint)
    ctx.fillStyle = '#FFFFFF';
    const zMag = Math.sqrt(r*r + x*x).toFixed(1);
    ctx.fillText(`|Z| = ${zMag}Ω`, midX - 28, midY - 26);

  }, [r, x]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="relative h-[200px] bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <canvas 
            ref={canvasRef} 
            className="w-full h-full block"
        />
        <div className="absolute top-2 right-2 text-xs font-mono text-white/50">
            Z = {r} {x >= 0 ? '+' : '-'} j{Math.abs(x)} Ω
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Resistance Slider */}
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
                <span style={{ color: THEME.colors.primary }}>R (Resistance)</span>
                <span className="text-white">{r} Ω</span>
            </div>
            <input 
                type="range" 
                min="0" max="100" 
                value={r} 
                onChange={(e) => setR(Number(e.target.value))}
                className="w-full accent-[#FFC700]"
            />
        </div>

        {/* Reactance Slider */}
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
                <span style={{ color: '#479CFF' }}>X (Reactance)</span>
                <span className="text-white">{x} Ω</span>
            </div>
            <input 
                type="range" 
                min="-100" max="100" 
                value={x} 
                onChange={(e) => setX(Number(e.target.value))}
                className="w-full accent-[#479CFF]"
            />
        </div>
      </div>
    </div>
  );
};

