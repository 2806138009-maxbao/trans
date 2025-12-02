import React, { useEffect, useRef } from 'react';
import { THEME } from '../theme';
import { PerformanceTier } from '../hooks/usePerformanceTier';

interface SmithFieldBackgroundProps {
  tier?: PerformanceTier;
}

export const SmithFieldBackground: React.FC<SmithFieldBackgroundProps> = ({ tier = 'high' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = tier === 'low';
  const mediumMotion = tier === 'medium';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;
    let frameId = 0;
    let time = 0;

    // Particles for "signal flow"
    const particles: { angle: number; radius: number; speed: number; size: number; alpha: number }[] = [];
    const PARTICLE_COUNT = reducedMotion ? 0 : (mediumMotion ? 10 : 30);

    // Flowing dashed circles configuration - Gold/Amber theme
    const flowingCircles = [
      { radius: 0.15, dashLength: 8, gapLength: 12, speed: 0.3, opacity: 0.15 },
      { radius: 0.25, dashLength: 12, gapLength: 16, speed: -0.2, opacity: 0.12 },
      { radius: 0.38, dashLength: 16, gapLength: 20, speed: 0.15, opacity: 0.10 },
      { radius: 0.52, dashLength: 20, gapLength: 24, speed: -0.1, opacity: 0.08 },
      { radius: 0.7, dashLength: 24, gapLength: 28, speed: 0.08, opacity: 0.06 },
      { radius: 0.9, dashLength: 28, gapLength: 32, speed: -0.05, opacity: 0.05 },
    ];

    // Track previous dimensions to avoid unnecessary particle resets
    let prevWidth = 0;
    let prevHeight = 0;

    const resize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      // Only reinitialize particles if dimensions actually changed significantly
      const dimensionsChanged = Math.abs(newWidth - prevWidth) > 50 || Math.abs(newHeight - prevHeight) > 50;
      
      width = newWidth;
      height = newHeight;
      prevWidth = newWidth;
      prevHeight = newHeight;
      
      // Cap DPR to 2 for performance (Retina screens often have 3x, which is overkill for ambient bg)
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      centerX = width / 2;
      centerY = height / 2;

      // Only re-init particles if dimensions actually changed or particles are empty
      if ((dimensionsChanged || particles.length === 0) && !reducedMotion) {
        particles.length = 0;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push({
            angle: Math.random() * Math.PI * 2,
            radius: 100 + Math.random() * Math.min(width, height) * 0.4,
            speed: (Math.random() * 0.2 + 0.05) * (Math.random() > 0.5 ? 1 : -1),
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.1,
          });
        }
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const drawFlowingDashedCircle = (
      radius: number,
      dashLength: number,
      gapLength: number,
      rotation: number,
      opacity: number
    ) => {
      const actualRadius = Math.min(width, height) * radius;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, actualRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 199, 0, ${opacity})`;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      
      // S-Tier Optimization: Use native line dash
      // This reduces hundreds of draw calls to a single one
      ctx.setLineDash([dashLength, gapLength]);
      
      // Animate rotation by shifting the dash offset
      // Note: lineDashOffset shifts the pattern *left* (counter-clockwise)
      // We want rotation * actualRadius
      ctx.lineDashOffset = -rotation * actualRadius;
      
      ctx.stroke();
      
      // Reset dash
      ctx.setLineDash([]);
    };

    const drawGrid = (t: number) => {
      // Background
      ctx.fillStyle = THEME.colors.background;
      ctx.fillRect(0, 0, width, height);

      const maxRadius = Math.max(width, height) * 0.6;

      // Rotating Radar Sector (Scan line) - Only High Tier
      if (!reducedMotion && !mediumMotion) {
        const scanAngle = t * 0.2;
        const gradient = ctx.createConicGradient(scanAngle, centerX, centerY);
        gradient.addColorStop(0, 'rgba(255, 199, 0, 0)');
        gradient.addColorStop(0.8, 'rgba(255, 199, 0, 0)');
        gradient.addColorStop(1, 'rgba(255, 199, 0, 0.03)');
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ★ Flowing Dashed Circles - The signature effect
      if (!reducedMotion) {
        flowingCircles.forEach((circle) => {
          const rotation = t * circle.speed;
          drawFlowingDashedCircle(
            circle.radius,
            circle.dashLength,
            circle.gapLength,
            rotation,
            circle.opacity
          );
        });
      } else {
        // Static circles for reduced motion
        flowingCircles.forEach((circle) => {
          drawFlowingDashedCircle(
            circle.radius,
            circle.dashLength,
            circle.gapLength,
            0,
            circle.opacity * 0.5
          );
        });
      }

      // Radial Lines (subtle)
      const rays = 12;
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * maxRadius, centerY + Math.sin(angle) * maxRadius);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Particles (Signal Pulses)
      if (!reducedMotion) {
        particles.forEach((p) => {
          p.angle += p.speed * 0.01;
          const x = centerX + Math.cos(p.angle) * p.radius;
          const y = centerY + Math.sin(p.angle) * p.radius;

          // Draw particle
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 199, 0, ${p.alpha})`;
          ctx.fill();
          
          if (!mediumMotion) {
            // Trail only on High Tier
            ctx.beginPath();
            ctx.arc(x, y, p.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 199, 0, ${p.alpha * 0.3})`;
            ctx.fill();
          }
        });
      }

      // Center glow (subtle -> Electric Gold Boost)
      // S-Tier Atmosphere: Stronger, warmer glow
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 250);
      glowGradient.addColorStop(0, 'rgba(255, 199, 0, 0.12)'); // Boosted from 0.03
      glowGradient.addColorStop(0.4, 'rgba(255, 199, 0, 0.04)');
      glowGradient.addColorStop(1, 'rgba(255, 199, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 250, 0, Math.PI * 2);
      ctx.fill();
    };

    let lastTime = 0;
    const targetFPS = 30; // Reduced from 60 for background
    const frameInterval = 1000 / targetFPS;
    
    const loop = (timestamp: number) => {
      const elapsed = timestamp - lastTime;
      
      // Throttle to 30fps for background animation
      if (elapsed >= frameInterval) {
        lastTime = timestamp - (elapsed % frameInterval);
        time += 0.016;
        drawGrid(time);
      }
      
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, [reducedMotion, mediumMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none w-full h-full"
      style={{ background: THEME.colors.background }}
    />
  );
};
