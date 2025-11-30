import React, { useEffect, useRef, useState } from 'react';

/**
 * CustomCursor - Magnetic Polar Crosshair
 * 
 * S-Tier Design: Full-screen polar crosshair that creates a 
 * "radar scope" aesthetic. Features:
 * - Thin crosshair lines extending to screen edges
 * - Floating R/X tooltip with backdrop blur
 * - Spring physics for smooth trailing
 * - Magnetic attraction to interactive elements
 */

interface CursorData {
  r?: number;
  x?: number;
  isOnChart?: boolean;
}

export const CustomCursor: React.FC = () => {
  const crosshairRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [cursorData, setCursorData] = useState<CursorData>({});
  
  // Use Refs for mutable state to avoid re-renders on every mouse move
  const mousePos = useRef({ x: -100, y: -100 });
  const smoothPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    mousePos.current = { x: -100, y: -100 };
    smoothPos.current = { x: -100, y: -100 };

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      // Check if hovering over Smith Chart canvas
      const target = e.target as HTMLElement;
      const canvas = target.closest('canvas');
      if (canvas && canvas.classList.contains('smith-canvas')) {
        // Get cursor data from canvas data attributes
        const r = canvas.dataset.cursorR;
        const x = canvas.dataset.cursorX;
        if (r && x) {
          setCursorData({ 
            r: parseFloat(r), 
            x: parseFloat(x), 
            isOnChart: true 
          });
        }
      } else {
        setCursorData({ isOnChart: false });
      }
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) {
        setIsHovering(false);
        return;
      }
      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.getAttribute('role') === 'button' ||
        target.closest('button') ||
        target.closest('a') ||
        window.getComputedStyle(target).cursor === 'pointer';
      
      setIsHovering(!!isInteractive);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseover', onMouseOver);

    let rafId: number;
    const loop = () => {
      // Spring physics interpolation (mass: 1, tension: 170, friction: 26)
      // Approximated as lerp with factor ~0.12
      const springFactor = 0.12;
      smoothPos.current.x += (mousePos.current.x - smoothPos.current.x) * springFactor;
      smoothPos.current.y += (mousePos.current.y - smoothPos.current.y) * springFactor;

      // Update crosshair position
      if (crosshairRef.current) {
        crosshairRef.current.style.setProperty('--cursor-x', `${smoothPos.current.x}px`);
        crosshairRef.current.style.setProperty('--cursor-y', `${smoothPos.current.y}px`);
      }
      
      // Update tooltip position with extra smoothing (organic feel)
      // Tooltip follows with more "weight" than the cursor
      if (tooltipRef.current) {
        const tooltipLerp = 0.08; // Slower than cursor for organic feel
        const tooltipX = smoothPos.current.x + 16;
        const tooltipY = smoothPos.current.y - 40;
        
        // Get current transform
        const currentTransform = tooltipRef.current.style.transform;
        const match = currentTransform.match(/translate3d\(([\d.-]+)px,\s*([\d.-]+)px/);
        
        if (match) {
          const currentX = parseFloat(match[1]);
          const currentY = parseFloat(match[2]);
          const newX = currentX + (tooltipX - currentX) * tooltipLerp;
          const newY = currentY + (tooltipY - currentY) * tooltipLerp;
          tooltipRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        } else {
          tooltipRef.current.style.transform = `translate3d(${tooltipX}px, ${tooltipY}px, 0)`;
        }
      }

      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <style>{`
        @media (pointer: coarse) {
          .custom-cursor-element { display: none !important; }
        }
        
        .polar-crosshair {
          --cursor-x: -100px;
          --cursor-y: -100px;
        }
        
        /* Horizontal line */
        .polar-crosshair::before {
          content: '';
          position: fixed;
          left: 0;
          right: 0;
          top: var(--cursor-y);
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 199, 0, 0.03) 20%,
            rgba(255, 199, 0, 0.08) 45%,
            rgba(255, 199, 0, 0.15) 50%,
            rgba(255, 199, 0, 0.08) 55%,
            rgba(255, 199, 0, 0.03) 80%,
            transparent 100%
          );
          pointer-events: none;
          transform: translateY(-0.5px);
        }
        
        /* Vertical line */
        .polar-crosshair::after {
          content: '';
          position: fixed;
          top: 0;
          bottom: 0;
          left: var(--cursor-x);
          width: 1px;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(255, 199, 0, 0.03) 20%,
            rgba(255, 199, 0, 0.08) 45%,
            rgba(255, 199, 0, 0.15) 50%,
            rgba(255, 199, 0, 0.08) 55%,
            rgba(255, 199, 0, 0.03) 80%,
            transparent 100%
          );
          pointer-events: none;
          transform: translateX(-0.5px);
        }
        
        /* Center dot */
        .cursor-center-dot {
          position: fixed;
          left: var(--cursor-x);
          top: var(--cursor-y);
          width: 6px;
          height: 6px;
          background: #FFD700;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
          transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .cursor-center-dot.hovering {
          transform: translate(-50%, -50%) scale(1.5);
          box-shadow: 0 0 16px rgba(255, 215, 0, 0.7);
        }
        
        .cursor-center-dot.clicking {
          transform: translate(-50%, -50%) scale(0.8);
        }
      `}</style>
      
      {/* Polar Crosshair Lines */}
      <div 
        ref={crosshairRef}
        className="custom-cursor-element polar-crosshair fixed inset-0 pointer-events-none z-[9998]"
      />
      
      {/* Center Dot */}
      <div 
        className={`custom-cursor-element cursor-center-dot pointer-events-none z-[9999]
          ${isHovering ? 'hovering' : ''}
          ${isClicking ? 'clicking' : ''}
        `}
        style={{
          left: 'var(--cursor-x)',
          top: 'var(--cursor-y)',
        }}
      />
      
      {/* Floating Tooltip with R/X values */}
      {cursorData.isOnChart && cursorData.r !== undefined && (
        <div 
          ref={tooltipRef}
          className="custom-cursor-element fixed top-0 left-0 pointer-events-none z-[9999] 
                     px-3 py-1.5 rounded-lg 
                     bg-black/70 backdrop-blur-md border border-white/10
                     font-mono text-xs tabular-nums"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-amber-400">
              R: {cursorData.r?.toFixed(2)}
            </span>
            <span className="text-white/40">|</span>
            <span className="text-white">
              X: {cursorData.x && cursorData.x >= 0 ? '+' : ''}{cursorData.x?.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

        const tooltipY = smoothPos.current.y - 40;
        
        // Get current transform
        const currentTransform = tooltipRef.current.style.transform;
        const match = currentTransform.match(/translate3d\(([\d.-]+)px,\s*([\d.-]+)px/);
        
        if (match) {
          const currentX = parseFloat(match[1]);
          const currentY = parseFloat(match[2]);
          const newX = currentX + (tooltipX - currentX) * tooltipLerp;
          const newY = currentY + (tooltipY - currentY) * tooltipLerp;
          tooltipRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        } else {
          tooltipRef.current.style.transform = `translate3d(${tooltipX}px, ${tooltipY}px, 0)`;
        }
      }

      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <style>{`
        @media (pointer: coarse) {
          .custom-cursor-element { display: none !important; }
        }
        
        .polar-crosshair {
          --cursor-x: -100px;
          --cursor-y: -100px;
        }
        
        /* Horizontal line */
        .polar-crosshair::before {
          content: '';
          position: fixed;
          left: 0;
          right: 0;
          top: var(--cursor-y);
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 199, 0, 0.03) 20%,
            rgba(255, 199, 0, 0.08) 45%,
            rgba(255, 199, 0, 0.15) 50%,
            rgba(255, 199, 0, 0.08) 55%,
            rgba(255, 199, 0, 0.03) 80%,
            transparent 100%
          );
          pointer-events: none;
          transform: translateY(-0.5px);
        }
        
        /* Vertical line */
        .polar-crosshair::after {
          content: '';
          position: fixed;
          top: 0;
          bottom: 0;
          left: var(--cursor-x);
          width: 1px;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(255, 199, 0, 0.03) 20%,
            rgba(255, 199, 0, 0.08) 45%,
            rgba(255, 199, 0, 0.15) 50%,
            rgba(255, 199, 0, 0.08) 55%,
            rgba(255, 199, 0, 0.03) 80%,
            transparent 100%
          );
          pointer-events: none;
          transform: translateX(-0.5px);
        }
        
        /* Center dot */
        .cursor-center-dot {
          position: fixed;
          left: var(--cursor-x);
          top: var(--cursor-y);
          width: 6px;
          height: 6px;
          background: #FFD700;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
          transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .cursor-center-dot.hovering {
          transform: translate(-50%, -50%) scale(1.5);
          box-shadow: 0 0 16px rgba(255, 215, 0, 0.7);
        }
        
        .cursor-center-dot.clicking {
          transform: translate(-50%, -50%) scale(0.8);
        }
      `}</style>
      
      {/* Polar Crosshair Lines */}
      <div 
        ref={crosshairRef}
        className="custom-cursor-element polar-crosshair fixed inset-0 pointer-events-none z-[9998]"
      />
      
      {/* Center Dot */}
      <div 
        className={`custom-cursor-element cursor-center-dot pointer-events-none z-[9999]
          ${isHovering ? 'hovering' : ''}
          ${isClicking ? 'clicking' : ''}
        `}
        style={{
          left: 'var(--cursor-x)',
          top: 'var(--cursor-y)',
        }}
      />
      
      {/* Floating Tooltip with R/X values */}
      {cursorData.isOnChart && cursorData.r !== undefined && (
        <div 
          ref={tooltipRef}
          className="custom-cursor-element fixed top-0 left-0 pointer-events-none z-[9999] 
                     px-3 py-1.5 rounded-lg 
                     bg-black/70 backdrop-blur-md border border-white/10
                     font-mono text-xs tabular-nums"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-amber-400">
              R: {cursorData.r?.toFixed(2)}
            </span>
            <span className="text-white/40">|</span>
            <span className="text-white">
              X: {cursorData.x && cursorData.x >= 0 ? '+' : ''}{cursorData.x?.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </>
  );
};