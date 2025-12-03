import React, { useMemo } from 'react';
import { THEME } from '../theme';

interface EquivalentCircuitProps {
  r: number;
  x: number;
  className?: string;
}

export const EquivalentCircuit: React.FC<EquivalentCircuitProps> = ({ 
  r, x, className 
}) => {
  const isInductive = x > 0.05;
  const isCapacitive = x < -0.05;
  const magnitude = Math.abs(x);
  
  // Thermal Feedback: Resistor glow
  // r=1 is "standard", r>1 gets hotter/brighter
  const isMatchedR = Math.abs(r - 1) < 0.1;
  const resistorColor = isMatchedR ? THEME.colors.primary : '#E0E0E0';
  
  // Dynamic Reactance Path
  const reactancePath = useMemo(() => {
    if (!isInductive && !isCapacitive) return `M 0,0 L 60,0`; // Wire
    
    if (isInductive) {
      // Inductor: Spring coils
      // More inductance = more loops
      const loops = Math.min(8, Math.max(3, Math.floor(magnitude * 2) + 3));
      const width = 60;
      const step = width / loops;
      let d = `M 0,0`;
      
      // Draw loops
      for (let i = 0; i < loops; i++) {
        // Quadratic bezier for the loop
        // Control point is high up to simulate the loop
        const cpX = (i * step) + (step / 2);
        const cpY = -15 - (magnitude * 2); // Height grows slightly with magnitude
        d += ` Q ${cpX},${cpY} ${(i + 1) * step},0`;
      }
      return d;
    } else {
      // Capacitor: Parallel plates
      // Standard Capacitor symbol: -||-
      return `M 0,0 L 24,0 M 24,-12 L 24,12 M 36,-12 L 36,12 M 36,0 L 60,0`;
    }
  }, [isInductive, isCapacitive, magnitude]);

  return (
    <div className={`relative w-full h-24 rounded-xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md ${className}`}>
       {/* Oscilloscope Grid Background */}
       <div className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ 
              backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', 
              backgroundSize: '20px 20px' 
            }} 
       />
       
       {/* Label */}
       <div className="absolute top-2 left-3 text-[9px] uppercase tracking-widest text-white/30 font-mono pointer-events-none">
         Equivalent Model
       </div>
       
       <svg width="100%" height="100%" viewBox="0 0 300 100" className="absolute inset-0 pointer-events-none">
         <g transform="translate(40, 50)">
           {/* Input Terminal */}
           <circle cx="0" cy="0" r="2" fill="#666" />
           <path d="M 0,0 L 30,0" stroke="#666" strokeWidth="1.5" />
           
           {/* Resistor (Series) */}
           <g transform="translate(30, 0)">
             {/* Zigzag path: 50px wide */}
             <path d="M 0,0 l 5,-8 l 10,16 l 10,-16 l 10,16 l 10,-16 l 5,8" 
                   fill="none" 
                   stroke={resistorColor} 
                   strokeWidth="2"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   style={{ 
                     filter: `drop-shadow(0 0 ${r * 4}px ${resistorColor})`,
                     transition: 'stroke 0.3s ease'
                   }}
             />
             {/* Value Label */}
             <text x="25" y="-20" textAnchor="middle" fill={resistorColor} className="text-[10px] font-mono opacity-80" style={{ textShadow: `0 0 10px ${resistorColor}` }}>
               {r.toFixed(2)}Ω
             </text>
           </g>

           {/* Wire between components */}
           <path d="M 80,0 L 120,0" stroke="#666" strokeWidth="1.5" />

           {/* Reactance (Series) */}
           <g transform="translate(120, 0)">
             <path d={reactancePath} 
                   fill="none" 
                   stroke={isInductive ? '#FF4D4D' : (isCapacitive ? '#4D94FF' : '#666')} 
                   strokeWidth="2"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   style={{ 
                     filter: isInductive ? 'drop-shadow(0 0 8px rgba(255, 77, 77, 0.4))' : isCapacitive ? 'drop-shadow(0 0 8px rgba(77, 148, 255, 0.4))' : 'none',
                     transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' // ease-out-expo
                   }}
             />
             {/* Value Label */}
             {(isInductive || isCapacitive) && (
               <text x="30" y="-20" textAnchor="middle" 
                     fill={isInductive ? '#FF4D4D' : '#4D94FF'} 
                     className="text-[10px] font-mono opacity-80"
                     style={{ textShadow: isInductive ? '0 0 10px rgba(255, 77, 77, 0.4)' : '0 0 10px rgba(77, 148, 255, 0.4)' }}
               >
                 {isInductive ? 'j' : '-j'}{magnitude.toFixed(2)}
               </text>
             )}
           </g>

           {/* Output Terminal */}
           <path d="M 180,0 L 210,0" stroke="#666" strokeWidth="1.5" />
           <circle cx="210" cy="0" r="2" fill="#666" />
         </g>
       </svg>
    </div>
  );
};
