import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * CustomCursor - Optimized Magnetic Polar Crosshair
 * 
 * Performance optimizations:
 * - Throttled updates using requestAnimationFrame
 * - Minimal DOM updates
 * - CSS transforms for hardware acceleration
 */

interface CursorData {
  r?: number;
  x?: number;
  isOnChart?: boolean;
}

export const CustomCursor: React.FC = () => {
  const crosshairRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [cursorData, setCursorData] = useState<CursorData>({});
  const [isNearSmithPoint, setIsNearSmithPoint] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const mousePos = useRef({ x: -100, y: -100 });
  const smoothPos = useRef({ x: -100, y: -100 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    // Check for touch device - don't render cursor
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      const target = e.target as HTMLElement;
      const canvas = target.closest('canvas');
      if (canvas?.classList.contains('smith-canvas')) {
        const r = canvas.dataset.cursorR;
        const x = canvas.dataset.cursorX;
        const isNear = canvas.dataset.cursorNear === 'true';
        if (r && x) {
          setCursorData({ r: parseFloat(r), x: parseFloat(x), isOnChart: true });
          setIsNearSmithPoint(isNear || false);
        } else {
          setIsNearSmithPoint(false);
        }
      } else {
        setCursorData(prev => prev.isOnChart ? { isOnChart: false } : prev);
        setIsNearSmithPoint(false);
      }
      
      // Check if dragging (canvas has data attribute)
      const isDraggingState = canvas?.dataset.cursorDragging === 'true';
      setIsDragging(isDraggingState || false);
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
        target.closest('a');
      
      setIsHovering(!!isInteractive);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseover', onMouseOver, { passive: true });

    const loop = () => {
      // Faster spring for responsiveness
      const springFactor = 0.2;
      smoothPos.current.x += (mousePos.current.x - smoothPos.current.x) * springFactor;
      smoothPos.current.y += (mousePos.current.y - smoothPos.current.y) * springFactor;

      if (crosshairRef.current) {
        crosshairRef.current.style.setProperty('--cursor-x', `${smoothPos.current.x}px`);
        crosshairRef.current.style.setProperty('--cursor-y', `${smoothPos.current.y}px`);
      }

      rafId.current = requestAnimationFrame(loop);
    };
    
    rafId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(rafId.current);
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
          will-change: --cursor-x, --cursor-y;
        }
        
        .polar-crosshair::before {
          content: '';
          position: fixed;
          left: 0;
          right: 0;
          top: var(--cursor-y);
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 199, 0, 0.05) 30%,
            rgba(255, 199, 0, 0.12) 50%,
            rgba(255, 199, 0, 0.05) 70%,
            transparent 100%
          );
          pointer-events: none;
        }
        
        .polar-crosshair::after {
          content: '';
          position: fixed;
          top: 0;
          bottom: 0;
          left: var(--cursor-x);
          width: 1px;
          background: linear-gradient(180deg,
            transparent 0%,
            rgba(255, 199, 0, 0.05) 30%,
            rgba(255, 199, 0, 0.12) 50%,
            rgba(255, 199, 0, 0.05) 70%,
            transparent 100%
          );
          pointer-events: none;
        }
        
        /* L3: Physics-Aware Cursor - 4 States */
        .cursor-center-dot {
          position: fixed;
          left: var(--cursor-x);
          top: var(--cursor-y);
          width: 6px;
          height: 6px;
          background: transparent;
          border: 1.5px solid rgba(255, 215, 0, 0.6);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), 
                      width 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      height 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, width, height, border-color, opacity;
          pointer-events: none;
        }
        
        /* State 1: Idle - Small, hollow circle (Precision) */
        .cursor-center-dot:not(.hovering):not(.near-smith):not(.dragging) {
          width: 6px;
          height: 6px;
          border-color: rgba(255, 215, 0, 0.4);
          opacity: 0.8;
        }
        
        /* State 2: Hover - Slightly larger, lower opacity (Affordance) */
        .cursor-center-dot.hovering:not(.near-smith):not(.dragging) {
          width: 10px;
          height: 10px;
          border-color: rgba(255, 215, 0, 0.5);
          opacity: 0.6;
          transform: translate(-50%, -50%) scale(1.2);
        }
        
        /* State 3: Magnetic - Crosshair when near snap point */
        .cursor-center-dot.near-smith:not(.dragging) {
          width: 20px;
          height: 20px;
          background: transparent;
          border: 2px solid rgba(255, 215, 0, 0.9);
          border-radius: 0;
          transform: translate(-50%, -50%) rotate(45deg);
          opacity: 1;
          box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
        }
        
        /* State 4: Dragging - Hide cursor (Direct Manipulation) */
        .cursor-center-dot.dragging {
          display: none;
        }
        
        /* Click feedback */
        .cursor-center-dot.clicking {
          transform: translate(-50%, -50%) scale(0.85);
        }
      `}</style>
      
      <div 
        ref={crosshairRef}
        className="custom-cursor-element polar-crosshair fixed inset-0 pointer-events-none z-[9998]"
      />
      
      <div 
        className={`custom-cursor-element cursor-center-dot pointer-events-none z-[9999]
          ${isHovering ? 'hovering' : ''}
          ${isClicking ? 'clicking' : ''}
          ${isNearSmithPoint ? 'near-smith' : ''}
          ${isDragging ? 'dragging' : ''}
        `}
      />
      
      {cursorData.isOnChart && cursorData.r !== undefined && (
        <div 
          className="custom-cursor-element fixed pointer-events-none z-[9999] 
                     px-2 py-1 rounded-md 
                     bg-black/60 backdrop-blur-sm border border-white/10
                     font-mono text-[10px] tabular-nums"
          style={{
            left: `${smoothPos.current.x + 16}px`,
            top: `${smoothPos.current.y - 32}px`,
          }}
        >
          <span className="text-amber-400">R:{cursorData.r?.toFixed(1)}</span>
          <span className="text-white/30 mx-1">|</span>
          <span className="text-white/70">X:{cursorData.x?.toFixed(1)}</span>
        </div>
      )}
    </>
  );
};
