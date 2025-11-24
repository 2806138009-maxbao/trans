
import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { COLORS, Language, TRANSLATIONS } from '../types';
import { TiltCard } from './TiltCard';

interface EpicycleDrawingProps {
  lang: Language;
}

interface Complex {
  re: number;
  im: number;
}

interface FourierCoef {
  re: number;
  im: number;
  freq: number;
  amp: number;
  phase: number;
}

type DrawMode = 'IDLE' | 'DRAWING' | 'COMPUTING' | 'ANIMATING';

export const EpicycleDrawing: React.FC<EpicycleDrawingProps> = ({ lang }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const [uiState, setUiState] = useState<DrawMode>('IDLE');
  
  const modeRef = useRef<DrawMode>('IDLE');
  const drawingPath = useRef<Complex[]>([]);
  const fourierX = useRef<FourierCoef[]>([]);
  const path = useRef<Complex[]>([]); 
  
  const t = TRANSLATIONS[lang];

  const resetDrawing = () => {
    drawingPath.current = [];
    fourierX.current = [];
    path.current = [];
    modeRef.current = 'IDLE';
    setUiState('IDLE');
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let time = 0;
      const pointer = { x: 0, y: 0 };
      let pointerActive = false;
      
      const setPointerFromTouch = (touch: Touch) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        pointer.x = touch.clientX - rect.left;
        pointer.y = touch.clientY - rect.top;
      };

      const setPointerFromMouse = () => {
        pointer.x = p.mouseX;
        pointer.y = p.mouseY;
      };

      const startDrawingSession = () => {
        if (pointer.y <= 0 || pointer.y >= p.height) { pointerActive = false; return; }
        if (modeRef.current === 'COMPUTING' || modeRef.current === 'ANIMATING') { pointerActive = false; return; }
        if (pointer.y > p.height - 100 && pointer.x > p.width/2 - 200 && pointer.x < p.width/2 + 200) { pointerActive = false; return; }
        if (pointer.y < 80 && pointer.x > p.width - 100) { pointerActive = false; return; }

        modeRef.current = 'DRAWING';
        pointerActive = true;
        setUiState('DRAWING');
        drawingPath.current = [];
        path.current = [];
        time = 0;
      };

      const endDrawingSession = () => {
        if (modeRef.current === 'DRAWING') {
          pointerActive = false;
          modeRef.current = 'COMPUTING';
          setUiState('COMPUTING');
          setTimeout(() => {
            const skip = 1; 
            const input: Complex[] = [];
            for(let i=0; i<drawingPath.current.length; i+=skip) {
                input.push(drawingPath.current[i]);
            }
            fourierX.current = dft(input);
            modeRef.current = 'ANIMATING';
            setUiState('ANIMATING');
          }, 50);
        }
      };
      
      const dft = (x: Complex[]): FourierCoef[] => {
        const X: FourierCoef[] = [];
        const N = x.length;
        for (let k = 0; k < N; k++) {
          let re = 0;
          let im = 0;
          for (let n = 0; n < N; n++) {
            const phi = (2 * Math.PI * k * n) / N;
            re += x[n].re * Math.cos(phi) + x[n].im * Math.sin(phi);
            im -= x[n].re * Math.sin(phi) - x[n].im * Math.cos(phi);
          }
          re = re / N;
          im = im / N;
          const freq = k;
          const amp = p.sqrt(re * re + im * im);
          const phase = p.atan2(im, re);
          X.push({ re, im, freq, amp, phase });
        }
        return X.sort((a, b) => b.amp - a.amp);
      };

      p.setup = () => {
        const canvas = p.createCanvas(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
        canvas.parent(containerRef.current!);
        canvas.elt.style.touchAction = 'none';
        p.frameRate(60);
      };

      p.windowResized = () => {
        if (containerRef.current) {
          p.resizeCanvas(containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
      };

      p.mousePressed = () => {
        setPointerFromMouse();
        pointerActive = true;
        startDrawingSession();
      };

      p.mouseDragged = () => {
        setPointerFromMouse();
      };

      p.mouseReleased = () => {
        endDrawingSession();
      };

      p.touchStarted = (event: TouchEvent) => {
        if (event.touches && event.touches[0]) {
          setPointerFromTouch(event.touches[0]);
        } else if (p.touches && p.touches[0]) {
          setPointerFromTouch(p.touches[0] as Touch);
        }
        pointerActive = true;
        startDrawingSession();
        return false;
      };

      p.touchMoved = (event: TouchEvent) => {
        if (event.touches && event.touches[0]) {
          setPointerFromTouch(event.touches[0]);
        } else if (p.touches && p.touches[0]) {
          setPointerFromTouch(p.touches[0] as Touch);
        }
        return false;
      };

      p.touchEnded = () => {
        endDrawingSession();
        return false;
      };

      p.draw = () => {
        p.clear();
        const ctx = p.drawingContext as CanvasRenderingContext2D;

        // 1. Draw Gradient Grid (Exactly matching FourierCanvas)
        drawGradientGrid(p);

        const cx = p.width / 2;
        const cy = p.height / 2;

        if (modeRef.current === 'DRAWING' && pointerActive) {
          const mx = pointer.x - cx;
          const my = pointer.y - cy;
          if (!Number.isNaN(mx) && !Number.isNaN(my)) {
             drawingPath.current.push({ re: mx, im: my });
          }
          
          // Draw input trail - Neon Style (Multi-pass)
          p.noFill();
          
          // Pass 1: Outer Glow (Blue/Accent)
          ctx.shadowBlur = 20;
          ctx.shadowColor = COLORS.accent;
          p.stroke(COLORS.accent);
          p.strokeWeight(4);
          p.beginShape();
          for (let v of drawingPath.current) p.vertex(cx + v.re, cy + v.im);
          p.endShape();
          
          // Pass 2: White Core
          ctx.shadowBlur = 0;
          p.stroke(255, 255, 255, 220);
          p.strokeWeight(2);
          p.beginShape();
          for (let v of drawingPath.current) p.vertex(cx + v.re, cy + v.im);
          p.endShape();
          
          // Brush Tip (Cursor) - Glowing White
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'white'; 
          p.noStroke();
          p.fill(255);
          p.circle(pointer.x, pointer.y, 7);
          ctx.shadowBlur = 0;
        }
        else if (modeRef.current === 'ANIMATING' && fourierX.current.length > 0) {
          
          // 2. Ambient Glow (Exactly matching FourierCanvas)
          drawAmbientGlow(p, cx, cy);

          let vx = cx;
          let vy = cy;
          const fourier = fourierX.current;
          
          // Draw Epicycles
          for (let i = 0; i < fourier.length; i++) {
            const prevx = vx;
            const prevy = vy;
            const freq = fourier[i].freq;
            const radius = fourier[i].amp;
            const phase = fourier[i].phase;
            const angle = freq * time + phase; 
            vx += radius * p.cos(angle);
            vy += radius * p.sin(angle);
            
            // Draw all circles - Matching FourierCanvas logic 1:1
            if (radius > 1) {
                // A. Rim-Light Gradient Fill
                const gradient = ctx.createRadialGradient(prevx, prevy, 0, prevx, prevy, radius);
                gradient.addColorStop(0.7, 'rgba(94, 106, 210, 0)');     // Center transparent
                gradient.addColorStop(0.9, 'rgba(71, 156, 255, 0.15)'); // Body faint blue
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');    // Inner Rim White
                
                ctx.fillStyle = gradient;
                p.noStroke();
                p.circle(prevx, prevy, radius * 2);

                // B. Adaptive Glowing White Outline (LOD)
                // Small circles get less blur to remain crisp
                const blurAmount = radius < 15 ? 5 : 15;
                ctx.shadowBlur = blurAmount;
                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                
                p.stroke('rgba(255, 255, 255, 0.9)');
                // Adaptive stroke weight for tiny circles
                p.strokeWeight(radius < 5 ? 1 : 1.5);
                p.noFill();
                p.circle(prevx, prevy, radius * 2);

                ctx.shadowBlur = 0;
                
                // C. Vector Line
                p.stroke(255, 255, 255, 150);
                p.strokeWeight(1.5);
                p.line(prevx, prevy, vx, vy);
                
                // D. Joint (Conditional LOD)
                // Don't draw joints on tiny circles to prevent clutter
                if (radius > 5) {
                    ctx.shadowBlur = 10; 
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                    p.noStroke();
                    p.fill(255);
                    p.circle(prevx, prevy, 4); 
                    ctx.shadowBlur = 0;
                }
            }
          }
          
          path.current.unshift({ re: vx - cx, im: vy - cy });
          
          // --- RENDER ORDER ADJUSTMENT (Synced with FourierCanvas) ---
          
          // 1. Pen Tip (Purple, Glowing) - Matches FourierCanvas
          ctx.shadowBlur = 15;
          ctx.shadowColor = COLORS.primary;
          p.fill(COLORS.primary);
          p.noStroke();
          p.circle(vx, vy, 6);
          ctx.shadowBlur = 0;

          // 2. Connecting Line (Dashed Gradient) - Matches FourierCanvas
          if (path.current.length > 0) {
              const startX = cx + path.current[0].re;
              const startY = cy + path.current[0].im;
              
              const connGrad = ctx.createLinearGradient(vx, vy, startX, startY);
              connGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
              connGrad.addColorStop(1, 'rgba(255,255,255,0.1)');
              ctx.strokeStyle = connGrad;
              p.strokeWeight(1);
              ctx.setLineDash([4, 4]);
              p.line(vx, vy, startX, startY);
              ctx.setLineDash([]);
          }

          // 3. Neon Path Rendering
          p.noFill();
          
          // Pass 1: Glow
          ctx.shadowBlur = 20;
          ctx.shadowColor = COLORS.primary;
          p.stroke(COLORS.primary);
          p.strokeWeight(3);
          p.beginShape();
          for (let i = 0; i < path.current.length; i++) {
            p.vertex(cx + path.current[i].re, cy + path.current[i].im);
          }
          p.endShape();
          
          // Pass 2: Core
          ctx.shadowBlur = 0;
          p.stroke(255, 255, 255, 200);
          p.strokeWeight(1.5);
          p.beginShape();
          for (let i = 0; i < path.current.length; i++) {
            p.vertex(cx + path.current[i].re, cy + path.current[i].im);
          }
          p.endShape();

          const dt = (2 * Math.PI) / fourier.length;
          time += dt;
          if (time > 2 * Math.PI) {
            time = 0;
            path.current = [];
          }
        }
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
  }, []); 

  return (
    <div className="relative w-full h-full min-h-[70vh] bg-transparent overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 z-0 cursor-crosshair" style={{ touchAction: 'none' }} />
      
      {/* Bottom Command Bar */}
      <div className="absolute left-1/2 bottom-4 md:bottom-12 transform -translate-x-1/2 z-20 pointer-events-none w-full px-4 md:w-auto md:px-0">
        <TiltCard className="pointer-events-auto transition-all duration-300 hover:scale-[1.02] max-w-[520px] mx-auto" glowColor="rgba(255,255,255,0.4)">
             <div className="p-0 overflow-hidden">
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-center">
                        <div className="px-4 py-2 bg-black/20 rounded-md border border-white/5 min-w-[180px] flex items-center justify-center gap-3">
                            <div className="flex items-center gap-3">
                                {uiState === 'IDLE' && <div className="w-2 h-2 rounded-full bg-[#8A8F98]" />}
                                {uiState === 'DRAWING' && <div className="w-2 h-2 rounded-full bg-[#479CFF] animate-pulse shadow-[0_0_8px_#479CFF]" />}
                                {uiState === 'COMPUTING' && <div className="w-2 h-2 rounded-full border-2 border-[#5E6AD2] border-t-transparent animate-spin" />}
                                {uiState === 'ANIMATING' && <div className="w-2 h-2 rounded-full bg-[#00D68F] shadow-[0_0_8px_#00D68F]" />}
                                
                                <span className="text-sm md:text-xs font-medium text-[#D0D6E0] tracking-wide font-mono truncate">
                                    {uiState === 'IDLE' ? t.dftInstruction : 
                                    uiState === 'DRAWING' ? 'Recording Input...' : 
                                    uiState === 'COMPUTING' ? t.dftComputing : 
                                    'Replaying Signal'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {(uiState === 'ANIMATING' || uiState === 'DRAWING') && (
                        <div className="border-t border-white/5 pt-3 text-center">
                            <button 
                                onClick={resetDrawing}
                                className="px-4 py-1.5 rounded bg-white/5 hover:bg-white/10 text-[11px] font-medium text-white transition-colors border border-white/5 hover:border-white/20 whitespace-nowrap"
                            >
                                {t.dftReset}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </TiltCard>
      </div>
    </div>
  );
};

// --- Helper Functions (Identical to FourierCanvas) ---

const drawGradientGrid = (p: p5) => {
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    const gridSize = 60;
    const w = p.width;
    const h = p.height;
    
    // Vertical Lines
    for (let x = gridSize; x < w; x += gridSize) {
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
