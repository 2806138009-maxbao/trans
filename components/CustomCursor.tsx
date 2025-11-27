
import React, { useEffect, useRef, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  
  // Use Refs for mutable state to avoid re-renders on every mouse move
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Initial position off-screen
    mousePos.current = { x: -100, y: -100 };
    ringPos.current = { x: -100, y: -100 };

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) {
        setIsHovering(false);
        return;
      }
      // Check for interactive elements based on tags and styles
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
      // 1. Move Cursor Dot instantly
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%)`;
      }

      // 2. Move Ring with Lerp (Linear Interpolation) for smooth trail
      const lerp = 0.15;
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * lerp;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * lerp;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
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
      `}</style>
      
      <div 
        ref={cursorRef}
        className="custom-cursor-element fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference will-change-transform"
      />
      <div 
        ref={ringRef}
        className={`custom-cursor-element fixed top-0 left-0 border border-white/40 rounded-full pointer-events-none z-[9999] transition-all duration-300 ease-out will-change-transform
          ${isHovering ? 'w-10 h-10 bg-white/10 border-transparent backdrop-blur-[1px]' : 'w-6 h-6'}
          ${isClicking ? 'scale-75' : 'scale-100'}
        `}
      />
    </>
  );
};
