import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { audio } from '../utils/audioEngine';

interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * SplashScreen - Pure CSS Animation Approach
 * 
 * Philosophy: Zero JavaScript state changes during animation.
 * All timing is handled by CSS animation-delay.
 * This eliminates React re-renders and ensures buttery-smooth 60fps.
 * 
 * Timeline:
 * 0.0s - Init text visible
 * 1.0s - Laser injection starts
 * 1.5s - Grid formation begins
 * 3.0s - Flash + stabilize
 * 3.5s - Title reveal
 * 4.5s - Ready, scroll prompt appears
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const hasCompletedRef = useRef(false);
  const [introShifted, setIntroShifted] = useState(false);

  useEffect(() => {
    // Single timeout for completion - no state changes during animation
    const timer = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete();
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    // Trigger Intro Audio
    audio.playIntro();

    const shiftTimer = setTimeout(() => {
      setIntroShifted(true);
    }, 3000); // Chart retreats at 3.0s (Cinematic timing)
    return () => clearTimeout(shiftTimer);
  }, []);

  // Pre-calculate SVG paths (static, no re-renders)
  const rCircles = [0.2, 0.5, 1, 2, 5].map(r => {
    const cx = r / (r + 1);
    const cr = 1 / (r + 1);
    return `M ${cx + cr} 0 A ${cr} ${cr} 0 1 0 ${cx - cr} 0 A ${cr} ${cr} 0 1 0 ${cx + cr} 0`;
  });

  const xArcs = [0.5, 1, 2, 5].flatMap(x => {
    const cr = 1 / x;
    return [
      { cx: 1, cy: 1 / x, r: cr },
      { cx: 1, cy: -1 / x, r: cr }
    ];
  });

  return (
    <div className={`splash-container${introShifted ? ' intro-complete' : ''}`}>
      {/* Phase 1: Init Text - Fades out at 1s */}
      <div className="splash-init-text">
        INITIALIZING RF MODULE...
      </div>

      {/* Phase 2: Laser Injection - 1s to 1.5s */}
      <div className="splash-laser" />

      {/* Phase 3: Grid Formation - 1.5s onwards */}
      <div className="splash-grid-container smith-chart-container">
        <svg viewBox="-1.1 -1.1 2.2 2.2" className="splash-grid-svg">
          <defs>
            <clipPath id="splash-clip">
              <circle cx="0" cy="0" r="1" />
            </clipPath>
          </defs>

          {/* Unit Circle */}
          <circle 
            cx="0" cy="0" r="1" 
            fill="none" 
            stroke="#FFC700" 
            strokeWidth="0.005"
            className="splash-unit-circle"
          />

          {/* Grid Lines */}
          <g clipPath="url(#splash-clip)" className="splash-grid-lines">
            {/* Resistance Circles */}
            {rCircles.map((d, i) => (
              <path 
                key={`r-${i}`} 
                d={d} 
                fill="none" 
                stroke="#FFC700" 
                strokeWidth="0.008"
                style={{ 
                  animationDelay: `${1.5 + i * 0.08}s`,
                }}
                className="splash-path-draw"
              />
            ))}

            {/* Reactance Arcs */}
            {xArcs.map((arc, i) => (
              <circle 
                key={`x-${i}`} 
                cx={arc.cx} 
                cy={arc.cy} 
                r={arc.r} 
                fill="none" 
                stroke="#FFC700" 
                strokeWidth="0.008"
                style={{ 
                  animationDelay: `${1.9 + i * 0.06}s`,
                }}
                className="splash-path-draw"
              />
            ))}
            
            {/* Horizon Line */}
            <line 
              x1="-1" y1="0" x2="1" y2="0" 
              stroke="#FFC700" 
              strokeWidth="0.008" 
              className="splash-path-draw"
              style={{ animationDelay: '1.5s' }}
            />
          </g>
        </svg>
      </div>

      {/* Phase 4: Flash Effect - 3s */}
      <div className="splash-flash" />

      {/* Phase 5: Title Reveal - 3.5s */}
      <div className="splash-title-container">
        <h1 className="splash-title">
          史密斯圆图
        </h1>
        <p className="splash-subtitle">
          Impedance Lab
        </p>
      </div>

      {/* Phase 6: Scroll Prompt - 4.5s */}
      <div className="splash-scroll-prompt">
        <span>SCROLL TO ENTER</span>
        <ArrowDown size={20} />
      </div>
    </div>
  );
};