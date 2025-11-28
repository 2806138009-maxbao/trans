import React, { useEffect, useRef, useState } from "react";
import { Language, TRANSLATIONS } from "../../types";
import { TiltCard } from "../TiltCard";
import { GlowDot, GradientText, HoverText } from "./SectionHelpers";
import { AnimateOnScroll } from "../AnimateOnScroll";

interface Point {
  x: number;
  y: number;
}

interface SignalAsDrawingSectionProps {
  lang: Language;
  reducedMotion?: boolean;
  id?: string;
  nextId?: string;
}

// 检测移动端
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const isNarrowScreen = window.innerWidth < 768;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isNarrowScreen || isMobileUA);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
};

export const SignalAsDrawingSection: React.FC<SignalAsDrawingSectionProps> = ({
  lang,
  reducedMotion,
  id = "signal-drawing",
  nextId,
}) => {
  const t = TRANSLATIONS[lang];
  const motionClass = reducedMotion ? "" : "fade-up";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState<Point[]>([]);
  const drawingRef = useRef(false);
  const isMobile = useIsMobile();
  const rafRef = useRef<number>();

  // Seed with a friendly default path
  useEffect(() => {
    const seed: Point[] = [];
    const width = 640;
    const height = 260;
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * width;
      const y =
        height / 2 +
        Math.sin((i / 200) * Math.PI * 3) * 60 +
        Math.sin((i / 200) * Math.PI * 9) * 12;
      seed.push({ x, y });
    }
    setPath(seed);
  }, []);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas && containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = 260;
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const draw = (progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (path.length < 2) return;

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(71,156,255,0.7)";
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();

    const idx = Math.min(
      Math.floor(progress * (path.length - 1)),
      path.length - 2
    );
    const frac = progress * (path.length - 1) - idx;
    const px = path[idx].x + (path[idx + 1].x - path[idx].x) * frac;
    const py = path[idx].y + (path[idx + 1].y - path[idx].y) * frac;

    ctx.shadowBlur = 12;
    ctx.shadowColor = "#5E6AD2";
    ctx.fillStyle = "#5E6AD2";
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // time arrow
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(16, canvas.height - 24);
    ctx.lineTo(canvas.width - 16, canvas.height - 24);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  useEffect(() => {
    const loop = (ts: number) => {
      const progress = (ts % 2000) / 2000;
      draw(progress);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [path]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    drawingRef.current = true;
    setPath([{ x: clientX - rect.left, y: clientY - rect.top }]);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setPath((prev) => [
      ...prev,
      { x: clientX - rect.left, y: clientY - rect.top },
    ]);
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  if (reducedMotion) {
    return (
      <section id="signal-drawing" className="w-full relative px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
          <TiltCard glowColor="rgba(94,106,210,0.5)">
            <div className="p-8 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <GlowDot color="#5E6AD2" />
                <h2 className="text-4xl md:text-5xl font-bold"><GradientText>{t.signalDrawingTitle}</GradientText></h2>
              </div>
              <p className="text-lg text-[#D0D6E0] leading-relaxed">{t.signalDrawingLead}</p>
              <p className="text-sm text-[#8A8F98]">{t.signalDrawingNote}</p>
            </div>
          </TiltCard>
          <TiltCard glowColor="rgba(71,156,255,0.5)">
            <div ref={containerRef} className="p-4 md:p-6 rounded-2xl bg-[#0D0F12]/40 border border-white/5 overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-[260px] rounded-xl bg-[#0B0C0E] cursor-crosshair" 
                style={{ touchAction: isMobile ? "pan-y pinch-zoom" : "none", pointerEvents: isMobile ? "none" : "auto" }}
                onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)} 
                onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                onMouseUp={stopDrawing} 
                onMouseLeave={stopDrawing} />
              <div className="flex justify-between items-center mt-4 text-xs text-[#8A8F98] uppercase tracking-[0.2em]">
                <span>{t.lblTime}</span><span>{t.lblSignal || "Signal"}</span>
              </div>
            </div>
          </TiltCard>
        </div>
      </section>
    );
  }

  return (
    <section id="signal-drawing" className="w-full relative px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
        <AnimateOnScroll animation="slide-left">
          <TiltCard glowColor="rgba(94,106,210,0.5)">
            <div className="p-8 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <GlowDot color="#5E6AD2" />
                <h2 className="text-4xl md:text-5xl font-bold">
                  <GradientText>{t.signalDrawingTitle}</GradientText>
                </h2>
              </div>
              <HoverText as="p" className="text-lg text-[#D0D6E0] leading-relaxed">
                {t.signalDrawingLead}
              </HoverText>
              <HoverText as="p" className="text-sm text-[#8A8F98]">
                {t.signalDrawingNote}
              </HoverText>
            </div>
          </TiltCard>
        </AnimateOnScroll>

        <AnimateOnScroll animation="slide-right" delay={150}>
          <TiltCard glowColor="rgba(71,156,255,0.5)">
          <div
            ref={containerRef}
            className="p-4 md:p-6 rounded-2xl bg-[#0D0F12]/40 border border-white/5 overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-[260px] rounded-xl bg-[#0B0C0E] cursor-crosshair"
              style={{ 
                touchAction: isMobile ? "pan-y pinch-zoom" : "none",
                pointerEvents: isMobile ? "none" : "auto" 
              }}
              onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
              onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <div className="flex justify-between items-center mt-4 text-xs text-[#8A8F98] uppercase tracking-[0.2em]">
              <span className="transition-all duration-300 hover:text-[#479CFF] hover:scale-105 cursor-default">{t.lblTime}</span>
              <span className="transition-all duration-300 hover:text-[#5E6AD2] hover:scale-105 cursor-default">{t.lblSignal || "Signal"}</span>
            </div>
          </div>
        </TiltCard>
        </AnimateOnScroll>
      </div>
    </section>
  );
};
