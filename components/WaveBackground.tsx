import React, { useEffect, useRef } from "react";
import p5 from "p5";

interface WaveBackgroundProps {
  dimmed?: boolean;
  paused?: boolean;
  reducedMotion?: boolean;
}

export const WaveBackground: React.FC<WaveBackgroundProps> = ({
  dimmed = false,
  paused = false,
  reducedMotion = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);
  const pausedRef = useRef(paused);

  // 更新暂停状态引用
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 如果 reducedMotion 开启，完全不创建 p5 实例
    if (reducedMotion) {
      return;
    }

    const sketch = (p: p5) => {
      let t = 0;
      const particles: any[] = [];
      // 降低粒子数量以提高性能
      const numParticles = 200;
      const noiseScale = 0.002;

      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent(containerRef.current!);
        canvas.style("pointer-events", "none");
        canvas.style("touch-action", "auto");
        p.background("#0B0C0E");

        for (let i = 0; i < numParticles; i++) {
          particles.push(createParticle(p));
        }
      };

      p.touchStarted = () => true;
      p.touchMoved = () => true;
      p.touchEnded = () => true;

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };

      p.draw = () => {
        // 暂停时跳过绘制
        if (pausedRef.current) {
          return;
        }

        p.noStroke();
        p.fill(11, 12, 14, 40);
        p.rect(0, 0, p.width, p.height);

        const ctx = p.drawingContext as CanvasRenderingContext2D;

        for (let i = 0; i < numParticles; i++) {
          const prt = particles[i];

          const n = p.noise(
            prt.pos.x * noiseScale,
            prt.pos.y * noiseScale,
            t * 0.1
          );
          const angle = n * p.TWO_PI * 4;

          const speed = 1.2;
          prt.vel.x = p.cos(angle) * speed;
          prt.vel.y = p.sin(angle) * speed;

          prt.pos.add(prt.vel);

          if (!onScreen(p, prt.pos)) {
            prt.pos.x = p.random(p.width);
            prt.pos.y = p.random(p.height);
          }

          let r, g, b;
          if (n < 0.5) {
            r = p.map(n, 0, 0.5, 0, 71);
            g = p.map(n, 0, 0.5, 214, 156);
            b = p.map(n, 0, 0.5, 240, 255);
          } else {
            r = p.map(n, 0.5, 1, 94, 180);
            g = p.map(n, 0.5, 1, 106, 50);
            b = p.map(n, 0.5, 1, 210, 220);
          }

          // 只对部分粒子使用 shadowBlur 以提高性能
          if (i % 4 === 0) {
            ctx.shadowBlur = prt.size * 1.5;
            ctx.shadowColor = `rgba(${r},${g},${b},0.4)`;
          } else {
            ctx.shadowBlur = 0;
          }

          p.fill(r, g, b, prt.alpha);
          p.noStroke();
          p.circle(prt.pos.x, prt.pos.y, prt.size);

          ctx.shadowBlur = 0;
        }

        t += 0.004;
      };
    };

    const createParticle = (p: p5) => ({
      pos: p.createVector(p.random(p.width), p.random(p.height)),
      vel: p.createVector(0, 0),
      size: p.random(2, 4),
      alpha: p.random(40, 120),
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

  // reducedMotion 时显示静态渐变背景
  if (reducedMotion) {
    return (
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at 30% 50%, rgba(94,106,210,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(71,156,255,0.06) 0%, transparent 50%), #0B0C0E",
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`fixed top-0 left-0 w-full h-full pointer-events-none z-0 mix-blend-screen transition-all duration-700 ease-in-out ${
        dimmed ? "opacity-20 blur-[1px]" : paused ? "opacity-40" : "opacity-100"
      }`}
    />
  );
};
