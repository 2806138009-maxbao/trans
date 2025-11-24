import React, { useEffect, useRef } from "react";
import p5 from "p5";
import { COLORS, Language, TRANSLATIONS } from "../types";

// Reusing helper components for consistent typography
const GradientText = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent ${className}`}
  >
    {children}
  </span>
);

const HoverMagnify = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-block transition-all duration-300 ease-out cursor-default hover:scale-110 hover:text-white hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] origin-center ${className}`}
  >
    {children}
  </span>
);

interface FourierCanvasProps {
  nVal: number;
  lang: Language;
}

export const FourierCanvas: React.FC<FourierCanvasProps> = ({ nVal, lang }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const t = TRANSLATIONS[lang];

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
        // Allow touch scrolling to pass through
        canvas.elt.style.touchAction = "pan-y";
        canvas.elt.style.pointerEvents = "none";
        p.frameRate(60);
      };

      // Allow touch events to pass through for scrolling
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

        // 1. Draw Gradient Grid (Fades at edges)
        drawGradientGrid(p);

        // Layout Constants
        const { centerX, centerY, waveStartX, waveBaselineY, baseRadius } =
          layout;

        // 2. Ambient Light behind circles
        drawAmbientGlow(p, centerX, centerY);

        // 3. Connectors
        drawConnectorLines(
          p,
          centerX,
          centerY,
          waveStartX,
          waveBaselineY,
          layout.isMobile
        );

        // --- Draw Waveform Horizontal Axis (Gradient Line) ---
        const axisGrad = ctx.createLinearGradient(
          waveStartX,
          waveBaselineY,
          p.width,
          waveBaselineY
        );
        axisGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
        axisGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.strokeStyle = axisGrad;
        p.strokeWeight(1);
        p.line(waveStartX, waveBaselineY, p.width, waveBaselineY);

        let x = centerX;
        let y = centerY;

        // --- Epicycles Logic (Glowing Rim) ---
        for (let i = 0; i < nVal; i++) {
          const prevx = x;
          const prevy = y;

          const n = i * 2 + 1;
          const radius = baseRadius * (4 / (n * p.PI));

          x += radius * p.cos(n * time);
          y += radius * p.sin(n * time);

          if (radius > 1) {
            // A. Rim-Light Gradient Fill
            // Transparent center -> Faint Blue -> White Edge
            const gradient = ctx.createRadialGradient(
              prevx,
              prevy,
              0,
              prevx,
              prevy,
              radius
            );
            gradient.addColorStop(0.7, "rgba(94, 106, 210, 0)"); // Center transparent
            gradient.addColorStop(0.9, "rgba(71, 156, 255, 0.15)"); // Body faint blue
            gradient.addColorStop(1, "rgba(255, 255, 255, 0.4)"); // Inner Rim White

            ctx.fillStyle = gradient;
            p.noStroke();
            p.circle(prevx, prevy, radius * 2);

            // B. Glowing White Outline
            ctx.shadowBlur = 15; // The "Light Effect"
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";

            p.stroke("rgba(255, 255, 255, 0.9)");
            p.strokeWeight(1.5);
            p.noFill();
            p.circle(prevx, prevy, radius * 2);

            ctx.shadowBlur = 0; // Reset for other elements

            // C. Vector Line
            p.stroke(255, 255, 255, 150);
            p.strokeWeight(1.5);
            p.line(prevx, prevy, x, y);

            // D. Glowing Joint
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            p.noStroke();
            p.fill(255);
            p.circle(prevx, prevy, 4);
            ctx.shadowBlur = 0;
          }
        }

        // Final Connector Joint
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.primary;
        p.fill(COLORS.primary);
        p.noStroke();
        p.circle(x, y, 6);
        ctx.shadowBlur = 0;

        // --- Waveform Logic ---
        const relativeY = y - centerY;
        const wavePointY = waveBaselineY + relativeY;
        wave.unshift(wavePointY);
        if (wave.length > maxWavePoints) {
          wave.pop();
        }

        // Connecting Line (Dashed Gradient)
        const connGrad = ctx.createLinearGradient(x, y, waveStartX, wave[0]);
        connGrad.addColorStop(0, "rgba(255,255,255,0.4)");
        connGrad.addColorStop(1, "rgba(255,255,255,0.1)");
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
  }, [nVal]);

  return (
    <div className="relative w-full h-full min-h-[70vh]">
      <div
        ref={containerRef}
        className="w-full h-full absolute top-0 left-0 z-0 pointer-events-none"
      />

      {/* Labels Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Mobile compact labels */}
        <div className="md:hidden flex flex-col items-center gap-1 pt-3">
          <div className="text-[11px] uppercase tracking-widest text-[#5E6AD2]">
            <HoverMagnify>{t.lblFrequency}</HoverMagnify>
          </div>
          <div className="text-[11px] uppercase tracking-widest text-[#8A8F98]">
            <HoverMagnify>{t.timeDomain}</HoverMagnify>
          </div>
        </div>

        {/* Desktop labels */}
        <div className="hidden md:block">
          {/* Frequency Domain Label */}
          <div className="absolute top-[15%] left-[25%] transform -translate-x-1/2 flex flex-col items-center gap-2">
            <div className="text-xs uppercase tracking-widest text-[#5E6AD2]">
              <HoverMagnify>{t.lblFrequency}</HoverMagnify>
            </div>
            <div className="w-px h-8 bg-gradient-to-b from-[#5E6AD2] to-transparent" />
          </div>

          {/* Time Domain Label */}
          <div className="absolute top-[15%] left-[55%] flex flex-col items-start gap-2">
            <div className="w-px h-8 bg-gradient-to-b from-[#8A8F98] to-transparent" />
            <div className="text-xs uppercase tracking-widest text-[#8A8F98]">
              <HoverMagnify>{t.timeDomain}</HoverMagnify>
            </div>
          </div>

          {/* Amplitude Label */}
          <div className="absolute top-[50%] left-[25%] transform -translate-x-1/2 mt-[150px] md:mt-[200px] text-center opacity-60">
            <div className="text-[10px] uppercase tracking-widest text-white/40">
              <HoverMagnify>{t.lblAmplitude}</HoverMagnify>
            </div>
          </div>

          {/* Time Axis Label */}
          <div className="absolute top-[50%] right-12 mt-4 text-right opacity-60">
            <div className="text-[10px] uppercase tracking-widest text-white/40">
              <HoverMagnify>{t.lblTime} &rarr;</HoverMagnify>
            </div>
          </div>
        </div>

        {/* Mobile amplitude/time hint */}
        <div className="md:hidden">
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center opacity-60">
            <div className="text-[10px] uppercase tracking-widest text-white/50">
              <HoverMagnify>{t.lblAmplitude}</HoverMagnify>
            </div>
          </div>
          <div className="absolute bottom-4 right-6 text-right opacity-60">
            <div className="text-[10px] uppercase tracking-widest text-white/50">
              <HoverMagnify>{t.lblTime} &rarr;</HoverMagnify>
            </div>
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
  // Start from gridSize to avoid drawing line at y=0 (page separator issue)
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

  // Separator line (Dashed & Faded)
  if (isMobile) {
    const grad = ctx.createLinearGradient(0, wy, w, wy);
    grad.addColorStop(0, "rgba(255, 255, 255, 0)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.12)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.strokeStyle = grad;
    p.strokeWeight(1);
    ctx.setLineDash([4, 4]);
    p.line(0, wy, w, wy);
    ctx.setLineDash([]);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(255, 255, 255, 0)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.strokeStyle = grad;
    p.strokeWeight(1);
    ctx.setLineDash([4, 4]);
    p.line(wx, 0, wx, h);
    ctx.setLineDash([]);
  }
};
