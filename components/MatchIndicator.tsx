import React, { useEffect, useState, useRef } from 'react';
import { audio } from '../utils/audioEngine';

// ============================================================
// MATCH INDICATOR
// 
// Victory visuals when impedance is matched (VSWR < 1.1)
// 
// Features:
// - Color shift from Gold to Cyan
// - Pulse/shockwave animation
// - Success sound trigger
// ============================================================

interface MatchIndicatorProps {
  vswr: number;
  gammaMag: number;
  children: React.ReactNode;
}

export const MatchIndicator: React.FC<MatchIndicatorProps> = ({
  vswr,
  gammaMag,
  children,
}) => {
  const [isMatched, setIsMatched] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const wasMatchedRef = useRef(false);
  const pulseTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if matched (VSWR < 1.1 or |Γ| < 0.05)
  const matchThreshold = 0.05;
  const currentlyMatched = gammaMag < matchThreshold;

  useEffect(() => {
    // Detect transition to matched state
    if (currentlyMatched && !wasMatchedRef.current) {
      setIsMatched(true);
      setShowPulse(true);
      
      // Play success sound
      audio.playSuccess();
      
      // Clear pulse after animation
      pulseTimeoutRef.current = setTimeout(() => {
        setShowPulse(false);
      }, 1000);
    } else if (!currentlyMatched && wasMatchedRef.current) {
      setIsMatched(false);
      setShowPulse(false);
    }
    
    wasMatchedRef.current = currentlyMatched;
    
    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, [currentlyMatched]);

  return (
    <div className="relative">
      {/* Pulse/Shockwave Effect */}
      {showPulse && (
        <div 
          className="absolute inset-0 rounded-3xl pointer-events-none z-20"
          style={{
            animation: 'match-pulse 1s ease-out forwards',
          }}
        />
      )}
      
      {/* Glow Container */}
      <div 
        className="relative transition-all duration-500"
        style={{
          boxShadow: isMatched 
            ? '0 0 40px rgba(0, 243, 255, 0.4), 0 0 80px rgba(0, 243, 255, 0.2)' 
            : 'none',
        }}
      >
        {children}
      </div>
      
      {/* Match Badge */}
      {isMatched && (
        <div 
          className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: 'rgba(0, 243, 255, 0.15)',
            border: '1px solid rgba(0, 243, 255, 0.3)',
            animation: 'fade-in-up 0.3s ease-out',
          }}
        >
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: '#00F3FF' }}
          />
          <span 
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: '#00F3FF' }}
          >
            Matched
          </span>
        </div>
      )}
      
      {/* CSS Keyframes */}
      <style>{`
        @keyframes match-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 243, 255, 0.6);
            opacity: 1;
          }
          100% {
            box-shadow: 0 0 0 40px rgba(0, 243, 255, 0);
            opacity: 0;
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// MATCH POINT OVERLAY (for canvas)
// 
// Renders the cyan glow when matched directly on canvas
// ============================================================

export function drawMatchedState(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  isMatched: boolean,
  pulsePhase: number = 0
) {
  if (!isMatched) return;
  
  const CYAN = '#00F3FF';
  
  // Pulsing glow
  const pulseScale = 1 + Math.sin(pulsePhase * Math.PI * 2) * 0.1;
  const pulseOpacity = 0.3 + Math.sin(pulsePhase * Math.PI * 2) * 0.1;
  
  // Outer glow
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 * pulseScale);
  gradient.addColorStop(0, `rgba(0, 243, 255, ${pulseOpacity})`);
  gradient.addColorStop(0.5, `rgba(0, 243, 255, ${pulseOpacity * 0.3})`);
  gradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, 60 * pulseScale, 0, 2 * Math.PI);
  ctx.fill();
  
  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
  ctx.fillStyle = CYAN;
  ctx.shadowBlur = 20;
  ctx.shadowColor = CYAN;
  ctx.fill();
  ctx.shadowBlur = 0;
}

