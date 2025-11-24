import React, { useEffect, useRef } from "react";
import p5 from "p5";
import { COLORS } from "../types";

interface WaveBackgroundProps {
  dimmed?: boolean;
  reducedMotion?: boolean;
}

export const WaveBackground: React.FC<WaveBackgroundProps> = ({
  dimmed = false,
  reducedMotion = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let t = 0;

      const particles: any[] = [];
      const numParticles = reducedMotion ? 120 : 350; // Cut effects on low-motion
      const noiseScale = 0.002; // Smoother flow

      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent(containerRef.current!);
        // Ensure canvas doesn't capture touch events - allow scroll through
        canvas.style("pointer-events", "none");
        canvas.style("touch-action", "auto");
        p.background("#0B0C0E");

        for (let i = 0; i < numParticles; i++) {
          particles.push(createParticle(p));
        }
      };

      // Explicitly allow touch events to pass through for scrolling
      p.touchStarted = () => true;
      p.touchMoved = () => true;
      p.touchEnded = () => true;

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };

      p.draw = () => {
        // Trail effect: Semi-transparent background to create trails
        p.noStroke();
        // Slightly higher opacity for cleaner trails (less muddy)
        p.fill(11, 12, 14, 40);
        p.rect(0, 0, p.width, p.height);

        const ctx = p.drawingContext as CanvasRenderingContext2D;

        // --- Nebula Flow Field ---
        for (let i = 0; i < numParticles; i++) {
          const prt = particles[i];

          // Flow field math
          const n = p.noise(
            prt.pos.x * noiseScale,
            prt.pos.y * noiseScale,
            t * 0.1
          );
          const angle = n * p.TWO_PI * 4; // More swirl

          const speed = reducedMotion ? 0.6 : 1.5;
          prt.vel.x = p.cos(angle) * speed;
          prt.vel.y = p.sin(angle) * speed;

          prt.pos.add(prt.vel);

          // Wrap edges
          if (!onScreen(p, prt.pos)) {
            prt.pos.x = p.random(p.width);
            prt.pos.y = p.random(p.height);
          }

          // Color Logic: Augen.pro style (Cyan <-> Purple)
          // Map noise value 0..1 to color spectrum
          let r, g, b;
          if (n < 0.5) {
            // Cyan / Blue range
            r = p.map(n, 0, 0.5, 0, 71);
            g = p.map(n, 0, 0.5, 214, 156);
            b = p.map(n, 0, 0.5, 240, 255);
          } else {
            // Purple / Magenta range
            r = p.map(n, 0.5, 1, 94, 180);
            g = p.map(n, 0.5, 1, 106, 50);
            b = p.map(n, 0.5, 1, 210, 220);
          }

          // Draw Glowy Particle
          // Use shadowBlur sparingly for performance
          if (!reducedMotion && i % 2 === 0) {
            ctx.shadowBlur = prt.size * 2;
            ctx.shadowColor = `rgba(${r},${g},${b},0.5)`;
          } else {
            ctx.shadowBlur = 0;
          }

          p.fill(r, g, b, prt.alpha);
          p.noStroke();
          p.circle(prt.pos.x, prt.pos.y, prt.size);

          ctx.shadowBlur = 0; // Reset
        }

        t += 0.005;
      };
    };

    const createParticle = (p: p5) => ({
      pos: p.createVector(p.random(p.width), p.random(p.height)),
      vel: p.createVector(0, 0),
      size: p.random(2, 5), // Larger particles
      alpha: p.random(50, 150), // Brighter
    });

    const onScreen = (p: p5, v: any) => {
      return (
        v.x >= -50 && v.x <= p.width + 50 && v.y >= -50 && v.y <= p.height + 50
      );
    };

    if (!p5Ref.current) {
      p5Ref.current = new p5(sketch);
    }

    return () => {
      if (p5Ref.current) {
        p5Ref.current.remove();
        p5Ref.current = null;
      }
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`fixed top-0 left-0 w-full h-full pointer-events-none z-0 mix-blend-screen transition-all duration-1000 ease-in-out ${
        dimmed ? "opacity-30 blur-[2px]" : "opacity-100 blur-none"
      }`}
    />
  );
};
