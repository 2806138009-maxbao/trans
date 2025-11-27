import React, { useEffect, useRef, useState } from "react";
import p5 from "p5";
import { COLORS, Language, TRANSLATIONS, WaveformType } from "../types";

interface FourierCanvasProps {
  nVal: number;
  waveformType?: WaveformType;
  lang: Language;
}

// 加载动画组件
const CanvasLoader: React.FC<{ lang: Language }> = ({ lang }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0C0E] z-10">
    {/* 动态圆环 */}
    <div className="relative w-24 h-24 mb-6">
      {/* 外圈旋转 */}
      <div className="absolute inset-0 rounded-full border-2 border-[#5E6AD2]/20 animate-ping" 
           style={{ animationDuration: '2s' }} />
      {/* 中圈旋转 */}
      <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#5E6AD2]/40 animate-spin"
           style={{ animationDuration: '3s' }} />
      {/* 内圈反向旋转 */}
      <div className="absolute inset-4 rounded-full border-2 border-[#479CFF]/30 animate-spin"
           style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
      {/* 中心点 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-[#5E6AD2] shadow-[0_0_20px_rgba(94,106,210,0.8)] animate-pulse" />
      </div>
      {/* 轨道上的小点 */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '1.5s' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#479CFF] shadow-[0_0_10px_#479CFF]" />
      </div>
    </div>
    
    {/* 加载文字 */}
    <div className="flex items-center gap-2 text-[#8A8F98] text-sm">
      <span className="animate-pulse">
        {lang === 'zh' ? '正在初始化傅里叶引擎...' : 'Initializing Fourier engine...'}
      </span>
    </div>
    
    {/* 进度条 */}
    <div className="w-48 h-1 mt-4 rounded-full bg-white/10 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-[#5E6AD2] to-[#479CFF] rounded-full animate-loading-bar" />
    </div>
  </div>
);

export const FourierCanvas: React.FC<FourierCanvasProps> = ({ 
  nVal, 
  waveformType = 'square', 
  lang 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 使用 ref 存储可变参数，避免重建 p5 实例
  const paramsRef = useRef({ nVal, waveformType });
  const t = TRANSLATIONS[lang];

  // 更新参数 ref（不触发 p5 重建）
  useEffect(() => {
    paramsRef.current = { nVal, waveformType };
  }, [nVal, waveformType]);

  // p5 实例只创建一次
  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let time = 0;
      let wave: number[] = [];
      const maxWavePoints = 800;

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current!.clientWidth,
          containerRef.current!.clientHeight
        );
        canvas.parent(containerRef.current!);
        canvas.elt.style.touchAction = "pan-y pinch-zoom";
        canvas.elt.style.pointerEvents = "none";
        p.frameRate(60);
        
        // Canvas 准备好后隐藏加载动画
        setTimeout(() => setIsLoading(false), 500);
      };

      p.touchStarted = () => true;
      p.touchMoved = () => true;
      p.touchEnded = () => true;

      p.windowResized = () => {
        if (containerRef.current) {
          p.resizeCanvas(
            containerRef.current.clientWidth,
            containerRef.current.clientHeight
          );
        }
      };

      p.draw = () => {
        // 从 ref 读取当前参数
        const { nVal: currentN, waveformType: currentWaveform } = paramsRef.current;
        
        p.clear();
        const ctx = p.drawingContext as CanvasRenderingContext2D;

        const isMobile = p.width <= 768;
        const layout = {
          centerX: isMobile ? p.width / 2 : p.width * 0.25,
          centerY: isMobile ? p.height * 0.28 : p.height / 2,
          waveStartX: isMobile ? p.width * 0.08 : p.width * 0.55,
          waveBaselineY: isMobile ? p.height * 0.72 : p.height / 2,
          baseRadius: Math.min(p.width, p.height) * (isMobile ? 0.1 : 0.12),
          isMobile,
        };

        drawGradientGrid(p);

        const { centerX, centerY, waveStartX, waveBaselineY, baseRadius } = layout;

        drawAmbientGlow(p, centerX, centerY);
        drawConnectorLines(p, centerX, centerY, waveStartX, waveBaselineY, layout.isMobile);

        // Waveform Horizontal Axis
        const axisGrad = ctx.createLinearGradient(waveStartX, waveBaselineY, p.width, waveBaselineY);
        axisGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
        axisGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.strokeStyle = axisGrad;
        p.strokeWeight(1);
        p.line(waveStartX, waveBaselineY, p.width, waveBaselineY);

        let x = centerX;
        let y = centerY;

        const getCoefficient = (i: number, type: WaveformType): { n: number; amplitude: number } => {
          switch (type) {
            case 'square': {
              const n = i * 2 + 1;
              return { n, amplitude: 4 / (n * p.PI) };
            }
            case 'triangle': {
              const n = i * 2 + 1;
              const sign = (i % 2 === 0) ? 1 : -1;
              return { n, amplitude: sign * 8 / (n * n * p.PI * p.PI) };
            }
            case 'sawtooth': {
              const n = i + 1;
              const sign = (i % 2 === 0) ? 1 : -1;
              return { n, amplitude: sign * 2 / (n * p.PI) };
            }
            default: {
              const n = i * 2 + 1;
              return { n, amplitude: 4 / (n * p.PI) };
            }
          }
        };

        for (let i = 0; i < currentN; i++) {
          const prevx = x;
          const prevy = y;

          const { n, amplitude } = getCoefficient(i, currentWaveform);
          const radius = baseRadius * Math.abs(amplitude);

          x += radius * p.cos(n * time) * Math.sign(amplitude);
          y += radius * p.sin(n * time) * Math.sign(amplitude);

          if (radius > 1) {
            const gradient = ctx.createRadialGradient(prevx, prevy, 0, prevx, prevy, radius);
            gradient.addColorStop(0.7, "rgba(94, 106, 210, 0)");
            gradient.addColorStop(0.9, "rgba(71, 156, 255, 0.15)");
            gradient.addColorStop(1, "rgba(255, 255, 255, 0.4)");

            ctx.fillStyle = gradient;
            p.noStroke();
            p.circle(prevx, prevy, radius * 2);

            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
            p.stroke("rgba(255, 255, 255, 0.9)");
            p.strokeWeight(1.5);
            p.noFill();
            p.circle(prevx, prevy, radius * 2);
            ctx.shadowBlur = 0;

            p.stroke(255, 255, 255, 150);
            p.strokeWeight(1.5);
            p.line(prevx, prevy, x, y);

            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
            p.noStroke();
            p.fill(255);
            p.circle(prevx, prevy, 4);
            ctx.shadowBlur = 0;
          }
        }

        ctx.shadowBlur = 12;
        ctx.shadowColor = COLORS.primary;
        p.fill(COLORS.primary);
        p.noStroke();
        p.circle(x, y, 6);
        ctx.shadowBlur = 0;

        const relativeY = y - centerY;
        const wavePointY = waveBaselineY + relativeY;
        wave.unshift(wavePointY);
        if (wave.length > maxWavePoints) {
          wave.pop();
        }

        const connGrad = ctx.createLinearGradient(x, y, waveStartX, wave[0]);
        connGrad.addColorStop(0, "rgba(255,255,255,0.4)");
        connGrad.addColorStop(1, "rgba(255,255,255,0.1)");
        ctx.strokeStyle = connGrad;
        p.strokeWeight(1);
        ctx.setLineDash([4, 4]);
        p.line(x, y, waveStartX, wave[0]);
        ctx.setLineDash([]);

        p.noFill();
        ctx.shadowBlur = 16;
        ctx.shadowColor = COLORS.primary;
        p.stroke(COLORS.primary);
        p.strokeWeight(3);
        p.beginShape();
        for (let i = 0; i < wave.length; i++) {
          const wx = i + waveStartX;
          if (wx < p.width) p.vertex(wx, wave[i]);
        }
        p.endShape();

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

    // 只在挂载时创建一次
    if (!p5Instance.current) {
      p5Instance.current = new p5(sketch);
    }

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, []); // 空依赖数组 - 只运行一次

  return (
    <div className="relative w-full h-full">
      {/* 加载动画 */}
      {isLoading && <CanvasLoader lang={lang} />}
      
      <div
        ref={containerRef}
        className={`w-full h-full absolute top-0 left-0 z-0 pointer-events-none transition-opacity duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Minimal Labels */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Desktop */}
        <div className="hidden md:flex absolute top-4 left-0 right-0 justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] shadow-[0_0_8px_#5E6AD2]" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#5E6AD2] font-medium">
              {t.lblFrequency}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#8A8F98] font-medium">
              {t.timeDomain}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#479CFF] shadow-[0_0_8px_#479CFF]" />
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex justify-center gap-6 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#5E6AD2]" />
            <span className="text-[9px] uppercase tracking-widest text-[#5E6AD2]">
              {t.lblFrequency}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-widest text-[#8A8F98]">
              {t.timeDomain}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#479CFF]" />
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

  for (let x = gridSize; x < w; x += gridSize) {
    const dist = Math.abs(x - w / 2) / (w / 2);
    const alpha = Math.max(0, 0.25 * (1 - dist));
    if (alpha > 0.01) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  for (let y = gridSize; y < h; y += gridSize) {
    const dist = Math.abs(y - h / 2) / (h / 2);
    const alpha = Math.max(0, 0.25 * (1 - dist));
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
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 350);
  gradient.addColorStop(0, "rgba(94, 106, 210, 0.12)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  p.noStroke();
  p.circle(cx, cy, 700);
};

const drawConnectorLines = (
  p: p5,
  _cx: number,
  _cy: number,
  wx: number,
  wy: number,
  isMobile: boolean
) => {
  const ctx = p.drawingContext as CanvasRenderingContext2D;
  const w = p.width;
  const h = p.height;

  if (isMobile) {
    const grad = ctx.createLinearGradient(0, wy, w, wy);
    grad.addColorStop(0, "rgba(255, 255, 255, 0)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.strokeStyle = grad;
    p.strokeWeight(1);
    ctx.setLineDash([4, 4]);
    p.line(0, wy, w, wy);
    ctx.setLineDash([]);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(255, 255, 255, 0)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.strokeStyle = grad;
    p.strokeWeight(1);
    ctx.setLineDash([4, 4]);
    p.line(wx, 0, wx, h);
    ctx.setLineDash([]);
  }
};
