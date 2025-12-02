import React, { useEffect, useRef } from "react";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  // RAUNO-TIER: Use Refs for all mutable state - no React re-renders
  const timeRef = useRef(0);
  const waveRef = useRef<number[]>([]);
  const paramsRef = useRef({ nVal, waveformType });
  const frameIdRef = useRef<number>(0);
  const lastWidthRef = useRef(0);
  const lastHeightRef = useRef(0);
  const maxWavePoints = 800;

  const t = TRANSLATIONS[lang];

  // Update params ref (doesn't trigger re-render)
  useEffect(() => {
    paramsRef.current = { nVal, waveformType };
  }, [nVal, waveformType]);

  // RAUNO-TIER: Independent render loop, completely outside React's render cycle
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper functions (pure, no p5 dependency)
    const getCoefficient = (i: number, type: WaveformType): { n: number; amplitude: number } => {
      switch (type) {
        case 'square': {
          const n = i * 2 + 1;
          return { n, amplitude: 4 / (n * Math.PI) };
        }
        case 'triangle': {
          const n = i * 2 + 1;
          const sign = (i % 2 === 0) ? 1 : -1;
          return { n, amplitude: sign * 8 / (n * n * Math.PI * Math.PI) };
        }
        case 'sawtooth': {
          const n = i + 1;
          const sign = (i % 2 === 0) ? 1 : -1;
          return { n, amplitude: sign * 2 / (n * Math.PI) };
        }
        default: {
          const n = i * 2 + 1;
          return { n, amplitude: 4 / (n * Math.PI) };
        }
      }
    };

    const drawGradientGrid = (width: number, height: number) => {
      const gridSize = 60;
      for (let x = gridSize; x < width; x += gridSize) {
        const dist = Math.abs(x - width / 2) / (width / 2);
        const alpha = Math.max(0, 0.25 * (1 - dist));
        if (alpha > 0.01) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }

      for (let y = gridSize; y < height; y += gridSize) {
        const dist = Math.abs(y - height / 2) / (height / 2);
        const alpha = Math.max(0, 0.25 * (1 - dist));
        if (alpha > 0.01) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
    };

    const drawAmbientGlow = (cx: number, cy: number) => {
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 350);
      gradient.addColorStop(0, "rgba(94, 106, 210, 0.12)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 700, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawConnectorLines = (
      cx: number,
      cy: number,
      wx: number,
      wy: number,
      width: number,
      height: number,
      isMobile: boolean
    ) => {
      if (isMobile) {
        const grad = ctx.createLinearGradient(0, wy, width, wy);
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, wy);
        ctx.lineTo(width, wy);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(wx, 0);
        ctx.lineTo(wx, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    const render = () => {
      // Update physics state (no React re-render)
      timeRef.current += 0.02;

      // Handle canvas resize
      const width = container.clientWidth;
      const height = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (width !== lastWidthRef.current || height !== lastHeightRef.current) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        lastWidthRef.current = width;
        lastHeightRef.current = height;
        
        // Hide loading after first render
        if (isLoading) {
          setTimeout(() => setIsLoading(false), 500);
        }
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Get current params from ref
      const { nVal: currentN, waveformType: currentWaveform } = paramsRef.current;

      const isMobile = width <= 768;
      const layout = {
        centerX: isMobile ? width / 2 : width * 0.25,
        centerY: isMobile ? height * 0.28 : height / 2,
        waveStartX: isMobile ? width * 0.08 : width * 0.55,
        waveBaselineY: isMobile ? height * 0.72 : height / 2,
        baseRadius: Math.min(width, height) * (isMobile ? 0.1 : 0.12),
        isMobile,
      };

      drawGradientGrid(width, height);

      const { centerX, centerY, waveStartX, waveBaselineY, baseRadius } = layout;

      drawAmbientGlow(centerX, centerY);
      drawConnectorLines(centerX, centerY, waveStartX, waveBaselineY, width, height, layout.isMobile);

      // Waveform Horizontal Axis
      const axisGrad = ctx.createLinearGradient(waveStartX, waveBaselineY, width, waveBaselineY);
      axisGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      axisGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.strokeStyle = axisGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(waveStartX, waveBaselineY);
      ctx.lineTo(width, waveBaselineY);
      ctx.stroke();

      let x = centerX;
      let y = centerY;
      const time = timeRef.current;

      // Draw Fourier circles
      for (let i = 0; i < currentN; i++) {
        const prevx = x;
        const prevy = y;

        const { n, amplitude } = getCoefficient(i, currentWaveform);
        const radius = baseRadius * Math.abs(amplitude);

        x += radius * Math.cos(n * time) * Math.sign(amplitude);
        y += radius * Math.sin(n * time) * Math.sign(amplitude);

        if (radius > 1) {
          const gradient = ctx.createRadialGradient(prevx, prevy, 0, prevx, prevy, radius);
          gradient.addColorStop(0.7, "rgba(94, 106, 210, 0)");
          gradient.addColorStop(0.9, "rgba(71, 156, 255, 0.15)");
          gradient.addColorStop(1, "rgba(255, 255, 255, 0.4)");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(prevx, prevy, radius * 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(prevx, prevy, radius * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(prevx, prevy);
          ctx.lineTo(x, y);
          ctx.stroke();

          ctx.shadowBlur = 8;
          ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
          ctx.fillStyle = "rgba(255, 255, 255, 1)";
          ctx.beginPath();
          ctx.arc(prevx, prevy, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Final point
      ctx.shadowBlur = 12;
      ctx.shadowColor = COLORS.primary;
      ctx.fillStyle = COLORS.primary;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Wave trace
      const relativeY = y - centerY;
      const wavePointY = waveBaselineY + relativeY;
      waveRef.current.unshift(wavePointY);
      if (waveRef.current.length > maxWavePoints) {
        waveRef.current.pop();
      }

      // Connection line
      if (waveRef.current.length > 0) {
        const connGrad = ctx.createLinearGradient(x, y, waveStartX, waveRef.current[0]);
        connGrad.addColorStop(0, "rgba(255,255,255,0.4)");
        connGrad.addColorStop(1, "rgba(255,255,255,0.1)");
        ctx.strokeStyle = connGrad;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(waveStartX, waveRef.current[0]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw wave trace (glow)
      ctx.shadowBlur = 16;
      ctx.shadowColor = COLORS.primary;
      ctx.strokeStyle = COLORS.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < waveRef.current.length; i++) {
        const wx = i + waveStartX;
        if (wx < width) {
          if (i === 0) {
            ctx.moveTo(wx, waveRef.current[i]);
          } else {
            ctx.lineTo(wx, waveRef.current[i]);
          }
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw wave trace (core)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.86)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < waveRef.current.length; i++) {
        const wx = i + waveStartX;
        if (wx < width) {
          if (i === 0) {
            ctx.moveTo(wx, waveRef.current[i]);
          } else {
            ctx.lineTo(wx, waveRef.current[i]);
          }
        }
      }
      ctx.stroke();

      // Continue animation loop
      frameIdRef.current = requestAnimationFrame(render);
    };

    // Start render loop
    render();

    // Handle window resize
    const handleResize = () => {
      // Render loop will handle resize on next frame
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoading]); // Only re-run if loading state changes

  return (
    <div className="relative w-full h-full">
      {/* 加载动画 */}
      {isLoading && <CanvasLoader lang={lang} />}
      
      <div
        ref={containerRef}
        className={`w-full h-full absolute top-0 left-0 z-0 pointer-events-none transition-opacity duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'pan-y pinch-zoom',
            pointerEvents: 'none',
          }}
        />
      </div>

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
