import React, { useEffect, useRef, useState } from 'react';

/**
 * CustomCursor - Optimized Magnetic Polar Crosshair
 * 
 * Performance optimizations:
 * - Throttled updates using requestAnimationFrame
 * - Minimal DOM updates via Refs (No React Renders on MouseMove)
 * - CSS transforms for hardware acceleration
 */

export const CustomCursor: React.FC = () => {
  const crosshairRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const labelRRef = useRef<HTMLSpanElement>(null);
  const labelXRef = useRef<HTMLSpanElement>(null);
  
  // Only keep low-frequency state
  const [isMobile, setIsMobile] = useState(false);

  // Mutable state for animation loop
  const state = useRef({
    mouse: { x: -100, y: -100 },
    smooth: { x: -100, y: -100 },
    isHovering: false,
    isClicking: false,
    isNearSmith: false,
    isDragging: false,
    isOnChart: false,
    r: 0,
    x: 0
  });

  const rafId = useRef<number>(0);

  useEffect(() => {
    // Check for touch device - don't render cursor
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsMobile(true);
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      state.current.mouse.x = e.clientX;
      state.current.mouse.y = e.clientY;
      
      const target = e.target as HTMLElement;
      const canvas = target.closest('canvas');
      
      // Check Smith Chart interaction
      if (canvas?.classList.contains('smith-canvas')) {
        const r = canvas.dataset.cursorR;
        const x = canvas.dataset.cursorX;
        const isNear = canvas.dataset.cursorNear === 'true';
        const isDragging = canvas.dataset.cursorDragging === 'true';
        
        if (r && x) {
          state.current.isOnChart = true;
          state.current.r = parseFloat(r);
          state.current.x = parseFloat(x);
          state.current.isNearSmith = isNear;
          state.current.isDragging = isDragging;
        } else {
          state.current.isOnChart = false;
          state.current.isNearSmith = false;
          state.current.isDragging = false;
        }
      } else {
        state.current.isOnChart = false;
        state.current.isNearSmith = false;
        state.current.isDragging = false;
      }
    };

    const onMouseDown = () => { state.current.isClicking = true; };
    const onMouseUp = () => { state.current.isClicking = false; };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) {
        state.current.isHovering = false;
        return;
      }
      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.getAttribute('role') === 'button' ||
        target.closest('button') ||
        target.closest('a');
      
      state.current.isHovering = !!isInteractive;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseover', onMouseOver, { passive: true });

    const loop = () => {
      const s = state.current;
      
      // Faster spring for responsiveness
      const springFactor = 0.25;
      s.smooth.x += (s.mouse.x - s.smooth.x) * springFactor;
      s.smooth.y += (s.mouse.y - s.smooth.y) * springFactor;

      // 1. Update Crosshair Position (CSS Variables)
      if (crosshairRef.current) {
        crosshairRef.current.style.setProperty('--cursor-x', `${s.smooth.x}px`);
        crosshairRef.current.style.setProperty('--cursor-y', `${s.smooth.y}px`);
      }

      // 2. Update Cursor Dot Classes
      if (cursorDotRef.current) {
        // Position
        cursorDotRef.current.style.left = `${s.smooth.x}px`;
        cursorDotRef.current.style.top = `${s.smooth.y}px`;
        
        // Classes
        const classList = cursorDotRef.current.classList;
        s.isHovering ? classList.add('hovering') : classList.remove('hovering');
        s.isClicking ? classList.add('clicking') : classList.remove('clicking');
        s.isNearSmith ? classList.add('near-smith') : classList.remove('near-smith');
        s.isDragging ? classList.add('dragging') : classList.remove('dragging');
      }

      // 3. Update Label (Direct DOM text update)
      if (labelRef.current) {
        if (s.isOnChart && !s.isDragging) {
          labelRef.current.style.display = 'block';
          labelRef.current.style.left = `${s.smooth.x + 16}px`;
          labelRef.current.style.top = `${s.smooth.y - 32}px`;
          
          if (labelRRef.current) labelRRef.current.textContent = `R:${s.r.toFixed(1)}`;
          if (labelXRef.current) labelXRef.current.textContent = `X:${s.x.toFixed(1)}`;
        } else {
          labelRef.current.style.display = 'none';
        }
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

  if (isMobile) return null;

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
          /* Position set via JS to avoid CSS var overhead for this element */
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
          will-change: transform, width, height, border-color, opacity, left, top;
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
        
        /* State 3: Magnetic - Crosshair (+) Lock On */
        .cursor-center-dot.near-smith:not(.dragging) {
          width: 24px;
          height: 24px;
          background: 
            linear-gradient(to right, transparent 42%, rgba(255, 215, 0, 1) 42%, rgba(255, 215, 0, 1) 58%, transparent 58%),
            linear-gradient(to bottom, transparent 42%, rgba(255, 215, 0, 1) 42%, rgba(255, 215, 0, 1) 58%, transparent 58%);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 50%;
          transform: translate(-50%, -50%) rotate(0deg);
          opacity: 1;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
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
        ref={cursorDotRef}
        className="custom-cursor-element cursor-center-dot pointer-events-none z-[9999]"
      />
      
      <div 
        ref={labelRef}
        className="custom-cursor-element fixed pointer-events-none z-[9999] 
                   px-2 py-1 rounded-md 
                   bg-black/60 backdrop-blur-sm border border-white/10
                   font-mono text-[10px] tabular-nums"
        style={{ display: 'none' }}
      >
        <span ref={labelRRef} className="text-amber-400"></span>
        <span className="text-white/30 mx-1">|</span>
        <span ref={labelXRef} className="text-white/70"></span>
      </div>
    </>
  );
};
