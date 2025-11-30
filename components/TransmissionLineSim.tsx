import React, { useEffect, useRef, useState, useCallback } from 'react';
import { THEME } from '../theme';

type MatchMode = 'matched' | 'mismatched';

interface TransmissionLineSimProps {
  mode?: MatchMode;
  reducedMotion?: boolean;
  showTabs?: boolean;
  onModeChange?: (mode: MatchMode) => void;
  height?: number;
  className?: string;
}

interface Pulse {
  id: number;
  position: number;      // 0 = source, 1 = load
  direction: 1 | -1;     // +1 = forward, -1 = reflected
  amplitude: number;     // 0-1, affects brightness
  width: number;         // pulse width
  isReflected: boolean;  // visual style difference
}

/**
 * TransmissionLineSim - Visualizes energy flow on a transmission line
 * 
 * Physics metaphor:
 * - Source sends pulses along the line
 * - At load: matched → absorbed, mismatched → partially reflected
 * - Reflected pulses travel back to source
 */
export const TransmissionLineSim: React.FC<TransmissionLineSimProps> = ({
  mode: externalMode,
  reducedMotion = false,
  showTabs = true,
  onModeChange,
  height = 80,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [internalMode, setInternalMode] = useState<MatchMode>('mismatched');
  const mode = externalMode ?? internalMode;
  
  const pulsesRef = useRef<Pulse[]>([]);
  const nextIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const frameRef = useRef(0);
  const fadeRef = useRef(1); // For mode transition fade

  const handleModeChange = useCallback((newMode: MatchMode) => {
    setInternalMode(newMode);
    onModeChange?.(newMode);
    fadeRef.current = 0; // Trigger fade transition
  }, [onModeChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let animationId = 0;
    let time = 0;

    // Layout constants
    const PADDING_X = 40;
    const LINE_Y_RATIO = 0.5;
    const PULSE_SPEED = 0.0008; // position units per ms (~1.25s to cross)
    const SPAWN_INTERVAL = 1800; // ms between pulses
    const REFLECTION_RATIO = 0.6; // amplitude of reflected pulse
    const PULSE_WIDTH = 20;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const spawnPulse = () => {
      pulsesRef.current.push({
        id: nextIdRef.current++,
        position: 0,
        direction: 1,
        amplitude: 1,
        width: PULSE_WIDTH,
        isReflected: false,
      });
    };

    const updatePulses = (dt: number) => {
      const pulses = pulsesRef.current;
      const newPulses: Pulse[] = [];

      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.position += p.direction * PULSE_SPEED * dt;

        // Forward pulse reaches load
        if (p.direction === 1 && p.position >= 1) {
          if (mode === 'mismatched') {
            // Create reflected pulse
            newPulses.push({
              id: nextIdRef.current++,
              position: 1,
              direction: -1,
              amplitude: p.amplitude * REFLECTION_RATIO,
              width: p.width * 0.7,
              isReflected: true,
            });
            // Transmitted pulse continues (dimmed)
            p.amplitude *= (1 - REFLECTION_RATIO);
          }
          // In matched mode, pulse just continues and fades
          p.position = 1.01; // Mark as passed
        }

        // Reflected pulse reaches source
        if (p.direction === -1 && p.position <= 0) {
          pulses.splice(i, 1);
          continue;
        }

        // Remove pulses that have left the scene
        if (p.position > 1.3 || p.position < -0.3) {
          pulses.splice(i, 1);
          continue;
        }
      }

      pulses.push(...newPulses);
    };

    const drawPulse = (p: Pulse, lineStartX: number, lineEndX: number, lineY: number) => {
      const lineLength = lineEndX - lineStartX;
      const x = lineStartX + p.position * lineLength;
      
      // Don't draw if outside visible area
      if (x < lineStartX - 30 || x > lineEndX + 30) return;

      const baseColor = p.isReflected 
        ? { r: 180, g: 160, b: 255 } // Purple-ish for reflected
        : { r: 255, g: 199, b: 0 };   // Gold for forward

      const alpha = p.amplitude * fadeRef.current;
      
      // Glow
      const gradient = ctx.createRadialGradient(x, lineY, 0, x, lineY, p.width);
      gradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha * 0.8})`);
      gradient.addColorStop(0.5, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha * 0.3})`);
      gradient.addColorStop(1, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, lineY, p.width, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(x, lineY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Trail for reflected pulses
      if (p.isReflected && p.direction === -1) {
        const trailGradient = ctx.createLinearGradient(x, lineY, x + 30, lineY);
        trailGradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha * 0.4})`);
        trailGradient.addColorStop(1, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`);
        ctx.strokeStyle = trailGradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, lineY);
        ctx.lineTo(x + 30, lineY);
        ctx.stroke();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const lineStartX = PADDING_X;
      const lineEndX = width - PADDING_X;
      const lineY = height * LINE_Y_RATIO;

      // Fade transition
      if (fadeRef.current < 1) {
        fadeRef.current = Math.min(1, fadeRef.current + 0.02);
      }

      // Main transmission line
      const lineGradient = ctx.createLinearGradient(lineStartX, lineY, lineEndX, lineY);
      const lineAlpha = mode === 'matched' ? 0.25 : 0.15;
      lineGradient.addColorStop(0, `rgba(255, 199, 0, ${lineAlpha})`);
      lineGradient.addColorStop(0.5, `rgba(255, 199, 0, ${lineAlpha * 1.5})`);
      lineGradient.addColorStop(1, `rgba(255, 199, 0, ${lineAlpha})`);
      
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lineStartX, lineY);
      ctx.lineTo(lineEndX, lineY);
      ctx.stroke();

      // Source node (left)
      const sourceGlow = pulsesRef.current.some(p => p.isReflected && p.position < 0.1);
      ctx.fillStyle = sourceGlow 
        ? 'rgba(180, 160, 255, 0.8)' 
        : 'rgba(255, 199, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(lineStartX, lineY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Source label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px "Space Grotesk", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SOURCE', lineStartX, lineY + 22);

      // Load node (right)
      const loadColor = mode === 'matched' 
        ? 'rgba(100, 255, 150, 0.7)'  // Green for matched
        : 'rgba(255, 100, 100, 0.6)'; // Red for mismatched
      ctx.fillStyle = loadColor;
      ctx.beginPath();
      ctx.arc(lineEndX, lineY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Load label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('LOAD', lineEndX, lineY + 22);

      // Impedance indicator
      const zText = mode === 'matched' ? 'Z₀ = Z_L' : 'Z₀ ≠ Z_L';
      ctx.fillStyle = mode === 'matched' 
        ? 'rgba(100, 255, 150, 0.7)' 
        : 'rgba(255, 100, 100, 0.7)';
      ctx.font = '11px "Space Grotesk", monospace';
      ctx.fillText(zText, lineEndX, lineY - 16);

      // Draw pulses
      pulsesRef.current.forEach(p => drawPulse(p, lineStartX, lineEndX, lineY));

      // Direction arrows on line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      const arrowSpacing = 60;
      for (let x = lineStartX + 40; x < lineEndX - 40; x += arrowSpacing) {
        ctx.beginPath();
        ctx.moveTo(x - 6, lineY - 4);
        ctx.lineTo(x, lineY);
        ctx.lineTo(x - 6, lineY + 4);
        ctx.stroke();
      }
    };

    const loop = (timestamp: number) => {
      const dt = timestamp - (frameRef.current || timestamp);
      frameRef.current = timestamp;
      time += dt;

      // Spawn new pulses
      if (!reducedMotion && time - lastSpawnRef.current > SPAWN_INTERVAL) {
        spawnPulse();
        lastSpawnRef.current = time;
      }

      updatePulses(dt);
      draw();

      animationId = requestAnimationFrame(loop);
    };

    // Reduced motion: single demo then stop
    if (reducedMotion) {
      resize();
      spawnPulse();
      const demoLoop = (timestamp: number) => {
        const dt = 16;
        updatePulses(dt);
        draw();
        if (pulsesRef.current.length > 0) {
          requestAnimationFrame(demoLoop);
        }
      };
      requestAnimationFrame(demoLoop);
    } else {
      resize();
      window.addEventListener('resize', resize);
      animationId = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [mode, reducedMotion, height]);

  // Clear pulses on mode change
  useEffect(() => {
    pulsesRef.current = [];
    lastSpawnRef.current = 0;
  }, [mode]);

  return (
    <div className={`relative ${className}`}>
      {showTabs && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => handleModeChange('mismatched')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: mode === 'mismatched' 
                ? 'rgba(255, 100, 100, 0.2)' 
                : 'rgba(255, 255, 255, 0.05)',
              color: mode === 'mismatched' 
                ? 'rgba(255, 150, 150, 1)' 
                : 'rgba(255, 255, 255, 0.5)',
              border: mode === 'mismatched'
                ? '1px solid rgba(255, 100, 100, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            不匹配
          </button>
          <button
            onClick={() => handleModeChange('matched')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: mode === 'matched' 
                ? 'rgba(100, 255, 150, 0.2)' 
                : 'rgba(255, 255, 255, 0.05)',
              color: mode === 'matched' 
                ? 'rgba(150, 255, 180, 1)' 
                : 'rgba(255, 255, 255, 0.5)',
              border: mode === 'matched'
                ? '1px solid rgba(100, 255, 150, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            已匹配
          </button>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: `${height}px`,
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.3)',
        }}
      />
    </div>
  );
};

/**
 * ReflectionPointSim - Focused view on the reflection phenomenon
 * Shows incident, reflected, and transmitted waves at a discontinuity
 */
interface ReflectionPointSimProps {
  reflectionRatio?: number; // 0 = no reflection (matched), 1 = total reflection
  reducedMotion?: boolean;
  height?: number;
  className?: string;
}

export const ReflectionPointSim: React.FC<ReflectionPointSimProps> = ({
  reflectionRatio = 0.5,
  reducedMotion = false,
  height = 100,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pulsesRef = useRef<Array<{
    id: number;
    position: number;
    direction: 1 | -1;
    amplitude: number;
    type: 'incident' | 'reflected' | 'transmitted';
  }>>([]);
  const nextIdRef = useRef(0);
  const [activeLabel, setActiveLabel] = useState<'incident' | 'reflected' | 'transmitted' | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let animationId = 0;
    let time = 0;
    let lastSpawn = 0;

    const PADDING_X = 30;
    const DISCONTINUITY_X = 0.5; // Middle of line
    const PULSE_SPEED = 0.0006;
    const SPAWN_INTERVAL = 2500;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const spawnPulse = () => {
      pulsesRef.current.push({
        id: nextIdRef.current++,
        position: 0,
        direction: 1,
        amplitude: 1,
        type: 'incident',
      });
      setActiveLabel('incident');
    };

    const updatePulses = (dt: number) => {
      const pulses = pulsesRef.current;
      const newPulses: typeof pulses = [];

      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.position += p.direction * PULSE_SPEED * dt;

        // Incident pulse reaches discontinuity
        if (p.type === 'incident' && p.position >= DISCONTINUITY_X && p.direction === 1) {
          // Create reflected pulse
          if (reflectionRatio > 0.01) {
            newPulses.push({
              id: nextIdRef.current++,
              position: DISCONTINUITY_X,
              direction: -1,
              amplitude: p.amplitude * reflectionRatio,
              type: 'reflected',
            });
            setActiveLabel('reflected');
            setTimeout(() => setActiveLabel('transmitted'), 400);
          }
          
          // Convert to transmitted
          p.type = 'transmitted';
          p.amplitude *= (1 - reflectionRatio);
        }

        // Remove pulses that left the scene
        if (p.position > 1.2 || p.position < -0.2) {
          pulses.splice(i, 1);
          continue;
        }
      }

      pulses.push(...newPulses);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const lineStartX = PADDING_X;
      const lineEndX = width - PADDING_X;
      const lineY = height * 0.5;
      const lineLength = lineEndX - lineStartX;
      const discX = lineStartX + DISCONTINUITY_X * lineLength;

      // Left segment (Z1)
      ctx.strokeStyle = 'rgba(255, 199, 0, 0.2)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lineStartX, lineY);
      ctx.lineTo(discX, lineY);
      ctx.stroke();

      // Right segment (Z2) - different impedance
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(discX, lineY);
      ctx.lineTo(lineEndX, lineY);
      ctx.stroke();

      // Discontinuity point
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(discX, lineY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Discontinuity glow
      const discGlow = ctx.createRadialGradient(discX, lineY, 0, discX, lineY, 25);
      discGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      discGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = discGlow;
      ctx.beginPath();
      ctx.arc(discX, lineY, 25, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.font = '9px "Space Grotesk", monospace';
      ctx.textAlign = 'center';
      
      ctx.fillStyle = 'rgba(255, 199, 0, 0.6)';
      ctx.fillText('Z₁', lineStartX + 30, lineY - 20);
      
      ctx.fillStyle = 'rgba(100, 180, 255, 0.6)';
      ctx.fillText('Z₂', lineEndX - 30, lineY - 20);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('不连续点', discX, lineY + 28);

      // Draw pulses
      pulsesRef.current.forEach(p => {
        const x = lineStartX + p.position * lineLength;
        
        let color: { r: number; g: number; b: number };
        switch (p.type) {
          case 'incident':
            color = { r: 255, g: 199, b: 0 };
            break;
          case 'reflected':
            color = { r: 180, g: 120, b: 255 };
            break;
          case 'transmitted':
            color = { r: 100, g: 200, b: 255 };
            break;
        }

        // Glow
        const gradient = ctx.createRadialGradient(x, lineY, 0, x, lineY, 18);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${p.amplitude * 0.8})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, lineY, 18, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `rgba(255, 255, 255, ${p.amplitude * 0.9})`;
        ctx.beginPath();
        ctx.arc(x, lineY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Active label indicator
      const labelY = lineY - 35;
      const labels = [
        { type: 'incident', text: '入射', x: lineStartX + 60, color: 'rgba(255, 199, 0, ' },
        { type: 'reflected', text: '反射', x: discX - 40, color: 'rgba(180, 120, 255, ' },
        { type: 'transmitted', text: '透射', x: discX + 40, color: 'rgba(100, 200, 255, ' },
      ];

      ctx.font = '10px "Space Grotesk", monospace';
      labels.forEach(label => {
        const isActive = activeLabel === label.type;
        ctx.fillStyle = label.color + (isActive ? '1)' : '0.3)');
        ctx.fillText(label.text, label.x, labelY);
      });
    };

    const loop = (timestamp: number) => {
      const dt = 16;
      time += dt;

      if (!reducedMotion && time - lastSpawn > SPAWN_INTERVAL) {
        spawnPulse();
        lastSpawn = time;
      }

      updatePulses(dt);
      draw();

      animationId = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener('resize', resize);
    
    if (reducedMotion) {
      spawnPulse();
      const demoLoop = () => {
        updatePulses(16);
        draw();
        if (pulsesRef.current.length > 0) {
          requestAnimationFrame(demoLoop);
        }
      };
      requestAnimationFrame(demoLoop);
    } else {
      animationId = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [reflectionRatio, reducedMotion, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ 
        width: '100%', 
        height: `${height}px`,
        borderRadius: '8px',
        background: 'rgba(0, 0, 0, 0.3)',
      }}
    />
  );
};

