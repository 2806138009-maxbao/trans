import React, { useEffect, useRef, useState, useCallback } from "react";
import p5 from "p5";
import { COLORS, Language, TRANSLATIONS } from "../types";
import { Play, RotateCcw } from "lucide-react";

// 加载动画组件
const EpicycleLoader: React.FC<{ lang: Language }> = ({ lang }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent z-20">
    {/* 本轮动画 - 模拟 Epicycle */}
    <div className="relative w-32 h-32 mb-6">
      {/* 外圈 */}
      <div className="absolute inset-0 rounded-full border border-white/10" />
      {/* 旋转的轨道 1 */}
      <div className="absolute inset-2 animate-spin" style={{ animationDuration: '4s' }}>
        <div className="absolute inset-0 rounded-full border border-dashed border-[#5E6AD2]/30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* 小圆 1 */}
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border border-[#5E6AD2]/50" />
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#479CFF] shadow-[0_0_12px_#479CFF]" />
            </div>
          </div>
        </div>
      </div>
      {/* 旋转的轨道 2 */}
      <div className="absolute inset-6 animate-spin" style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}>
        <div className="absolute inset-0 rounded-full border border-[#479CFF]/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 -translate-y-1/2 rounded-full bg-[#5E6AD2] shadow-[0_0_10px_#5E6AD2]" />
      </div>
      {/* 中心点 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-white/50" />
      </div>
    </div>
    
    {/* 加载文字 */}
    <div className="text-[#8A8F98] text-sm animate-pulse">
      {lang === 'zh' ? '准备绘图引擎...' : 'Preparing drawing engine...'}
    </div>
    
    {/* 进度条 */}
    <div className="w-48 h-1 mt-4 rounded-full bg-white/10 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-[#479CFF] to-[#5E6AD2] rounded-full animate-loading-bar" />
    </div>
  </div>
);

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

type DrawMode = "IDLE" | "DRAWING" | "COMPUTING" | "ANIMATING";

// 纯函数 DFT 计算 - 提取到组件外部
const computeDFT = (x: Complex[]): FourierCoef[] => {
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
    const amp = Math.sqrt(re * re + im * im);
    const phase = Math.atan2(im, re);
    X.push({ re, im, freq, amp, phase });
  }
  return X.sort((a, b) => b.amp - a.amp);
};

const generateHeartPath = (): Complex[] => {
  const examplePath: Complex[] = [];
  const points = 200;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = 10;
    const x = 16 * Math.pow(Math.sin(angle), 3);
    const y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
    examplePath.push({ re: x * r, im: y * r });
  }
  return examplePath;
};

// 鐢熸垚绀轰緥璺緞 - 鏄熷舰
const generateStarPath = (): Complex[] => {
  const examplePath: Complex[] = [];
  const points = 200;
  const outerRadius = 120;
  const innerRadius = 50;
  const spikes = 5;
  
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const spikeAngle = (i / points) * spikes * Math.PI * 2;
    const radius = innerRadius + (outerRadius - innerRadius) * (0.5 + 0.5 * Math.cos(spikeAngle));
    examplePath.push({ 
      re: radius * Math.cos(angle), 
      im: radius * Math.sin(angle) 
    });
  }
  return examplePath;
};

export const EpicycleDrawing: React.FC<EpicycleDrawingProps> = ({ lang }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const [uiState, setUiState] = useState<DrawMode>("IDLE");
  const [showExampleCTA, setShowExampleCTA] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const modeRef = useRef<DrawMode>("IDLE");
  const drawingPath = useRef<Complex[]>([]);
  const fourierX = useRef<FourierCoef[]>([]);
  const path = useRef<Complex[]>([]);
  const timeRef = useRef(0);

  const t = TRANSLATIONS[lang];

  const runDFT = useCallback((points: Complex[]) => {
    if (!points.length) return;
    timeRef.current = 0;
    modeRef.current = "COMPUTING";
    setUiState("COMPUTING");
    setShowExampleCTA(false);

    requestAnimationFrame(() => {
      fourierX.current = computeDFT(points);
      path.current = [];
      modeRef.current = "ANIMATING";
      setUiState("ANIMATING");
    });
  }, []);

  const resetDrawing = useCallback(() => {
    drawingPath.current = [];
    fourierX.current = [];
    path.current = [];
    modeRef.current = "IDLE";
    timeRef.current = 0;
    setUiState("IDLE");
    setShowExampleCTA(true);
  }, []);

  const loadExample = useCallback((type: 'heart' | 'star' = 'heart') => {
    const examplePath = type === 'heart' ? generateHeartPath() : generateStarPath();
    drawingPath.current = examplePath;
    runDFT(examplePath);
  }, [runDFT]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
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
        if (pointer.y <= 0 || pointer.y >= p.height) {
          pointerActive = false;
          return;
        }
        if (
          modeRef.current === "COMPUTING" ||
          modeRef.current === "ANIMATING"
        ) {
          pointerActive = false;
          return;
        }
        // Guard: ignore clicks on bottom control bar (approx. bottom 100px)
        // Note: coordinates are relative to the canvas
        if (
          pointer.y > p.height - 100 &&
          pointer.x > p.width / 2 - 200 &&
          pointer.x < p.width / 2 + 200
        ) {
          pointerActive = false;
          return;
        }
        if (pointer.y < 80 && pointer.x > p.width - 100) {
          pointerActive = false;
          return;
        }

        modeRef.current = "DRAWING";
        pointerActive = true;
        setUiState("DRAWING");
        drawingPath.current = [];
        path.current = [];
        timeRef.current = 0;
      };

      const endDrawingSession = () => {
        if (modeRef.current === "DRAWING") {
          pointerActive = false;
          const skip = 1;
          const input: Complex[] = [];
          for (let i = 0; i < drawingPath.current.length; i += skip) {
            input.push(drawingPath.current[i]);
          }
          runDFT(input);
        }
      };

      // 浣跨敤鎻愬彇鍑虹殑绾嚱鏁?computeDFT (鍦ㄧ粍浠跺閮ㄥ畾涔?

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current!.clientWidth,
          containerRef.current!.clientHeight
        );
        canvas.parent(containerRef.current!);
        canvas.elt.style.touchAction = "pan-y pinch-zoom";
        p.frameRate(60);
        
        // Canvas 准备好后隐藏加载动画
        setTimeout(() => setIsLoading(false), 600);
      };

      p.windowResized = () => {
        if (containerRef.current) {
          p.resizeCanvas(
            containerRef.current.clientWidth,
            containerRef.current.clientHeight
          );
        }
      };

      p.mousePressed = () => {
        // 濡傛灉鐐瑰嚮鐨勬槸鎸夐挳鍖哄煙锛屼笉瑕佸紑濮嬬敾鍥?        // 瀹為檯涓婏紝鎸夐挳鍦?canvas 涔嬩笂锛岀偣鍑绘寜閽笉浼氳Е鍙?canvas 鐨?mousePressed
        // 浣嗘槸涓轰簡淇濋櫓锛屾垜浠鏌?event target
        // p5 鐨?mousePressed 浼氭崟鑾锋墍鏈夌偣鍑伙紝闄ら潪 preventDefault
        
        // 绠€鍗曠殑閫昏緫锛氬鏋?mode 鏄?IDLE锛屼笖鐐瑰嚮浜嗘湁鏁堝尯鍩燂紝鍒欏紑濮?        setPointerFromMouse();
        // 妫€鏌ユ槸鍚﹀湪鏈夋晥缁樺浘鍖哄煙
        if (p.mouseY > 0 && p.mouseY < p.height - 100) { // 閬垮紑搴曢儴鏍?             pointerActive = true;
             startDrawingSession();
        }
      };

      p.mouseDragged = () => {
        setPointerFromMouse();
      };

      p.mouseReleased = () => {
        endDrawingSession();
      };

      // Mobile touch handling: allow drawing on touch, but don't trap scroll when idle
      p.touchStarted = (event: TouchEvent) => {
        const touch = event.touches?.[0] || (p.touches && p.touches[0]);
        if (touch) {
          setPointerFromTouch(touch as Touch);
          // Check area
          const rect = containerRef.current!.getBoundingClientRect();
          const y = touch.clientY - rect.top;
          if (y > 0 && y < rect.height - 100) {
              pointerActive = true;
              startDrawingSession();
              if (p.canvas) {
                (p.canvas as HTMLCanvasElement).style.touchAction = "none";
              }
          }
        }
        return false; // prevent scroll during draw
      };

      p.touchMoved = (event: TouchEvent) => {
        const touch = event.touches?.[0] || (p.touches && p.touches[0]);
        if (!touch) return true;
        if (pointerActive) {
          setPointerFromTouch(touch as Touch);
          return false; // keep drawing
        }
        return true;
      };

      p.touchEnded = () => {
        endDrawingSession();
        pointerActive = false;
        if (p.canvas) {
          (p.canvas as HTMLCanvasElement).style.touchAction =
            "pan-y pinch-zoom";
        }
        return false;
      };

      p.draw = () => {
        p.clear();
        const ctx = p.drawingContext as CanvasRenderingContext2D;

        // 1. Draw Gradient Grid (Exactly matching FourierCanvas)
        drawGradientGrid(p);

        const cx = p.width / 2;
        const cy = p.height / 2;
        let time = timeRef.current;

        if (modeRef.current === "DRAWING" && pointerActive) {
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
          ctx.shadowColor = "white";
          p.noStroke();
          p.fill(255);
          p.circle(pointer.x, pointer.y, 7);
          ctx.shadowBlur = 0;
        } else if (
          modeRef.current === "ANIMATING" &&
          fourierX.current.length > 0
        ) {
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
              const gradient = ctx.createRadialGradient(
                prevx,
                prevy,
                0,
                0,
                0,
                radius
              );
              // Note: Gradient center fixed at 0,0 relative to circle seems wrong in canvas API context?
              // Actually createRadialGradient(x0, y0, r0, x1, y1, r1)
              // Here we want it centered at (prevx, prevy)
              const grad = ctx.createRadialGradient(
                  prevx, prevy, 0,
                  prevx, prevy, radius
              );
              
              grad.addColorStop(0.7, "rgba(94, 106, 210, 0)"); // Center transparent
              grad.addColorStop(0.9, "rgba(71, 156, 255, 0.15)"); // Body faint blue
              grad.addColorStop(1, "rgba(255, 255, 255, 0.4)"); // Inner Rim White

              ctx.fillStyle = grad;
              p.noStroke();
              p.circle(prevx, prevy, radius * 2);

              // B. Adaptive Glowing White Outline (LOD)
              // Small circles get less blur to remain crisp
              const blurAmount = radius < 15 ? 5 : 15;
              ctx.shadowBlur = blurAmount;
              ctx.shadowColor = "rgba(255, 255, 255, 0.8)";

              p.stroke("rgba(255, 255, 255, 0.9)");
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
                ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
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
            connGrad.addColorStop(0, "rgba(255,255,255,0.4)");
            connGrad.addColorStop(1, "rgba(255,255,255,0.1)");
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
          timeRef.current = time;
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
      {/* 加载动画 */}
      {isLoading && <EpicycleLoader lang={lang} />}
      
      <div
        ref={containerRef}
        className={`absolute inset-0 z-0 cursor-crosshair transition-opacity duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ touchAction: "pan-y pinch-zoom" }}
      />

      {/* IDLE State Overlay - Central CTA */}
      {uiState === "IDLE" && !isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto flex flex-col items-center gap-4 text-center">
            <button
              onClick={() => loadExample('heart')}
              className="group relative px-6 py-5 rounded-2xl bg-[#16171A]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="w-14 h-14 rounded-full bg-[#5E6AD2]/20 border border-[#5E6AD2]/30 flex items-center justify-center">
                <Play size={22} className="text-[#5E6AD2]" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-lg font-semibold text-white">
                  {lang === 'zh' ? '点击播放示例' : 'Play the example'}
                </span>
                <span className="text-sm text-[#8A8F98]">
                  {lang === 'zh' ? '或直接在画布中央落笔绘制' : 'Or start drawing anywhere on the canvas'}
                </span>
              </div>
              <span className="absolute inset-0 rounded-2xl ring-1 ring-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      {/* Status Bar - for DRAWING, COMPUTING, ANIMATING states */}
      {uiState !== "IDLE" && (
        <div className="absolute left-1/2 bottom-4 md:bottom-8 transform -translate-x-1/2 z-20 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-4 px-5 py-3 rounded-full bg-[#16171A]/90 backdrop-blur-xl border border-white/10 shadow-lg">
            {/* Status Indicator */}
            <div className="flex items-center gap-3">
              {uiState === "DRAWING" && (
                <div className="w-2 h-2 rounded-full bg-[#479CFF] animate-pulse shadow-[0_0_8px_#479CFF]" />
              )}
              {uiState === "COMPUTING" && (
                <div className="w-3 h-3 rounded-full border-2 border-[#5E6AD2] border-t-transparent animate-spin" />
              )}
              {uiState === "ANIMATING" && (
                <div className="w-2 h-2 rounded-full bg-[#00D68F] shadow-[0_0_8px_#00D68F]" />
              )}

              <span className="text-sm font-medium text-[#D0D6E0] tracking-wide">
                {uiState === "DRAWING"
                  ? (lang === 'zh' ? '正在录制...' : 'Recording...')
                  : uiState === "COMPUTING"
                  ? t.dftComputing
                  : (lang === 'zh' ? '正在重现信号' : 'Replaying Signal')}
              </span>
            </div>

            {/* Reset Button */}
            {(uiState === "ANIMATING" || uiState === "DRAWING") && (
              <>
                <div className="w-px h-5 bg-white/10" />
                <button
                  onClick={resetDrawing}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full 
                    bg-white/10 hover:bg-white/15 text-white text-xs font-medium
                    transition-all duration-200 border border-white/10 hover:border-white/20"
                >
                  <RotateCcw size={12} />
                  {t.dftReset}
                </button>
              </>
            )}
          </div>
        </div>
      )}
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
    const dist = Math.abs(x - w / 2) / (w / 2);
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
    const dist = Math.abs(y - h / 2) / (h / 2);
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
  gradient.addColorStop(0, "rgba(94, 106, 210, 0.15)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  p.noStroke();
  p.circle(cx, cy, 800);
};

