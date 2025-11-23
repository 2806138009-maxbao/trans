
import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { COLORS, Language, TRANSLATIONS, WaveType } from '../types';
import { FormulaDisplay } from './FormulaDisplay';

// Reusing helper components for consistent typography
const GradientText = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <span className={`bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
);

const HoverMagnify = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <span className={`inline-block transition-all duration-300 ease-out cursor-default hover:scale-110 hover:text-white hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] origin-center ${className}`}>
    {children}
  </span>
);

interface FourierCanvasProps {
  nVal: number;
  waveType: WaveType;
  lang: Language;
}

export const FourierCanvas: React.FC<FourierCanvasProps> = ({ nVal, waveType, lang }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  
  // Refs for dynamic value updates without re-renders
  const timeValRef = useRef<HTMLDivElement>(null);
  const ampValRef = useRef<HTMLDivElement>(null);
  
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let time = 0;
      let wave: number[] = [];
      const maxWavePoints = 800; 

      p.setup = () => {
        const canvas = p.createCanvas(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
        canvas.parent(containerRef.current!);
        p.frameRate(60);
        // Signal that p5 is ready to draw
        setIsCanvasReady(true);
      };

      p.windowResized = () => {
        if (containerRef.current) {
          p.resizeCanvas(containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
      };

      p.draw = () => {
        p.clear(); 
        const ctx = p.drawingContext as CanvasRenderingContext2D;

        // 1. Draw Gradient Grid (Fades at edges)
        drawGradientGrid(p);

        // Layout Constants
        const centerX = p.width * 0.25; 
        const centerY = p.height / 2;
        const waveStartX = p.width * 0.55; 
        
        // 2. Ambient Light behind circles
        drawAmbientGlow(p, centerX, centerY);

        // 3. Connectors
        drawConnectorLines(p, centerX, centerY, waveStartX);
        
        // --- Draw Waveform Horizontal Axis (Gradient Line) ---
        const axisGrad = ctx.createLinearGradient(waveStartX, 0, p.width, 0);
        axisGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        axisGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = axisGrad;
        p.strokeWeight(1);
        p.line(waveStartX, centerY, p.width, centerY);

        let x = centerX;
        let y = centerY;
        const baseSize = Math.min(p.width, p.height) * 0.12;

        // --- Epicycles Logic (Glowing Rim) ---
        for (let i = 0; i < nVal; i++) {
          const prevx = x;
          const prevy = y;
          
          let n = 0;
          let radius = 0;
          
          if (waveType === 'square') {
              // Square Wave: Odd harmonics (1, 3, 5...), Amplitude ~ 4/(n*pi)
              n = i * 2 + 1;
              radius = baseSize * (4 / (n * p.PI));
          } else if (waveType === 'sawtooth') {
              // Sawtooth Wave: All harmonics (1, 2, 3...), Amplitude ~ 2/(n*pi)
              // Alternate signs for correct phase: + - + -
              n = i + 1;
              radius = baseSize * (2 / (n * p.PI));
              if (i % 2 !== 0) radius *= -1;
          } else if (waveType === 'triangle') {
              // Triangle Wave: Odd harmonics (1, 3, 5...), Amplitude ~ 8/((n*pi)^2)
              // Alternate signs: + - + -
              n = i * 2 + 1;
              radius = baseSize * (8 / Math.pow(n * p.PI, 2));
              if (i % 2 !== 0) radius *= -1;
          }

          x += radius * p.cos(n * time);
          y += radius * p.sin(n * time);

          if (Math.abs(radius) > 1) {
              // A. Rim-Light Gradient Fill
              // Transparent center -> Faint Blue -> White Edge
              const gradient = ctx.createRadialGradient(prevx, prevy, 0, prevx, prevy, Math.abs(radius));
              gradient.addColorStop(0.7, 'rgba(94, 106, 210, 0)');     // Center transparent
              gradient.addColorStop(0.9, 'rgba(71, 156, 255, 0.15)'); // Body faint blue
              gradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');    // Inner Rim White
              
              ctx.fillStyle = gradient;
              p.noStroke();
              p.circle(prevx, prevy, Math.abs(radius) * 2);

              // B. Adaptive Glowing White Outline (LOD)
              // Small circles get less blur to remain crisp
              const blurAmount = Math.abs(radius) < 15 ? 5 : 15;
              ctx.shadowBlur = blurAmount;
              ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
              
              p.stroke('rgba(255, 255, 255, 0.9)');
              // Adaptive stroke weight for tiny circles
              p.strokeWeight(Math.abs(radius) < 5 ? 1 : 1.5);
              p.noFill();
              p.circle(prevx, prevy, Math.abs(radius) * 2);
              
              ctx.shadowBlur = 0; // Reset for other elements

              // C. Vector Line
              p.stroke(255, 255, 255, 150);
              p.strokeWeight(1.5);
              p.line(prevx, prevy, x, y);

              // D. Glowing Joint (Conditional LOD)
              // Don't draw joints on tiny circles to prevent clutter
              if (Math.abs(radius) > 5) {
                  ctx.shadowBlur = 10;
                  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                  p.noStroke();
                  p.fill(255);
                  p.circle(prevx, prevy, 4);
                  ctx.shadowBlur = 0; 
              }
          }
        }

        // Final Connector Joint
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.primary;
        p.fill(COLORS.primary);
        p.noStroke();
        p.circle(x, y, 6);
        ctx.shadowBlur = 0;

        // --- Update Dynamic Labels ---
        if (timeValRef.current) {
            timeValRef.current.innerText = time.toFixed(2) + 's';
        }
        if (ampValRef.current) {
            // Normalize amplitude approx for display
            const val = (centerY - y) / baseSize;
            ampValRef.current.innerText = val.toFixed(2);
        }

        // --- Waveform Logic ---
        wave.unshift(y);
        if (wave.length > maxWavePoints) {
          wave.pop();
        }

        // Connecting Line (Dashed Gradient)
        const connGrad = ctx.createLinearGradient(x, y, waveStartX, wave[0]);
        connGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
        connGrad.addColorStop(1, 'rgba(255,255,255,0.1)');
        ctx.strokeStyle = connGrad;
        p.strokeWeight(1);
        ctx.setLineDash([4, 4]);
        p.line(x, y, waveStartX, wave[0]);
        ctx.setLineDash([]);

        // --- Neon Waveform ---
        p.noFill();
        
        // Pass 1: Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = COLORS.primary;
        p.stroke(COLORS.primary); 
        p.strokeWeight(3); 
        p.beginShape();
        for (let i = 0; i < wave.length; i++) {
            const wx = i + waveStartX;
            if (wx < p.width) p.vertex(wx, wave[i]);
        }
        p.endShape();

        // Pass 2: Core
        ctx.shadowBlur = 0;
        p.stroke(255, 255, 255, 220); 
        p.strokeWeight(1); 
        p.beginShape();
        for (let i = 0; i < wave.length; i++) {
            const wx = i + waveStartX;
            if (wx < p.width) p.vertex(wx, wave[i]);
        }
        p.endShape();

        time += 0.02;
      };
    };

    if (!p5Instance.current) {
      p5Instance.current = new p5(sketch);
    } else {
        p5Instance.current.remove();
        p5Instance.current = new p5(sketch);
    }

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, [nVal, waveType]); 

  return (
    <div className="relative w-full h-full">
        <div ref={containerRef} className="w-full h-full absolute top-0 left-0 z-0 cursor-crosshair" />

        {/* Initial Loading State */}
        {!isCanvasReady && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3">
               <div className="w-5 h-5 border-2 border-[#5E6AD2] border-t-transparent rounded-full animate-spin"></div>
               <span className="text-[10px] font-mono text-[#5E6AD2]/70 tracking-widest animate-pulse">INITIALIZING</span>
            </div>
          </div>
        )}

        {/* LaTeX Formula Display */}
        <FormulaDisplay n={nVal} waveType={waveType} />

        {/* Labels Overlay */}
        <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 ${isCanvasReady ? 'opacity-100' : 'opacity-0'}`}>
            {/* Frequency Domain Label */}
            <div className="absolute top-[15%] left-[25%] transform -translate-x-1/2 flex flex-col items-center gap-2">
                <div className="text-xs uppercase tracking-widest text-[#5E6AD2] font-mono">
                    <HoverMagnify>{t.lblFrequency}</HoverMagnify>
                </div>
                <div className="w-px h-8 bg-gradient-to-b from-[#5E6AD2] to-transparent" />
            </div>

            {/* Time Domain Label */}
            <div className="absolute top-[15%] left-[55%] flex flex-col items-start gap-2">
                 <div className="w-px h-8 bg-gradient-to-b from-[#8A8F98] to-transparent" />
                 <div className="text-xs uppercase tracking-widest text-[#8A8F98] font-mono">
                    <HoverMagnify>{t.timeDomain}</HoverMagnify>
                 </div>
            </div>

            {/* Amplitude Label */}
            <div className="absolute top-[50%] left-[25%] transform -translate-x-1/2 mt-[150px] md:mt-[200px] text-center opacity-80">
                 <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">
                    <HoverMagnify>{t.lblAmplitude}</HoverMagnify>
                 </div>
                 {/* Dynamic Amplitude Value */}
                 <div ref={ampValRef} className="text-xs font-mono text-[#479CFF] font-bold drop-shadow-[0_0_8px_rgba(71,156,255,0.8)]">
                    0.00
                 </div>
            </div>

            {/* Time Axis Label */}
            <div className="absolute top-[50%] right-12 mt-4 text-right opacity-80">
                 <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">
                    <HoverMagnify>{t.lblTime} &rarr;</HoverMagnify>
                 </div>
                 {/* Dynamic Time Value */}
                 <div ref={timeValRef} className="text-xs font-mono text-[#5E6AD2] font-bold drop-shadow-[0_0_8px_rgba(94,106,210,0.8)]">
                    0.00s
                 </div>
            </div>
        </div>
    </div>
  );
};

// --- Helper Functions ---

const drawGradientGrid = (p: p5) => {
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    const gridSize = 60;
    const w = p.width;
    const h = p.height;
    
    // Vertical Lines
    // Start from gridSize to avoid drawing line at x=0
    for (let x = gridSize; x < w; x += gridSize) {
        // Calculate opacity based on distance from center
        const dist = Math.abs(x - w/2) / (w/2);
        const alpha = Math.max(0, 0.3 * (1 - dist)); // Fade out near edges
        
        if (alpha > 0.01) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
    }
    
    // Horizontal Lines
    // Start from gridSize to avoid drawing line at y=0 (page separator issue)
    for (let y = gridSize; y < h; y += gridSize) {
        const dist = Math.abs(y - h/2) / (h/2);
        const alpha = Math.max(0, 0.3 * (1 - dist)); 
        
        if (alpha > 0.01) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }
};

const drawAmbientGlow = (p: p5, cx: number, cy: number) => {
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    // Create a subtle blue/purple spotlight behind the mechanism
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 400);
    gradient.addColorStop(0, 'rgba(94, 106, 210, 0.15)'); 
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); 
    ctx.fillStyle = gradient;
    p.noStroke();
    p.circle(cx, cy, 800);
};

const drawConnectorLines = (p: p5, cx: number, cy: number, wx: number) => {
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    const w = p.width;
    const h = p.height;
    
    // Separator line (Dashed & Faded)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.strokeStyle = grad;
    p.strokeWeight(1);
    ctx.setLineDash([4, 4]);
    p.line(wx, 0, wx, h);
    ctx.setLineDash([]); 
}
