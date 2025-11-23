
import React, { useRef, useState, MouseEvent } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({ 
  children, 
  className = "", 
  glowColor = "rgba(94, 106, 210, 0.5)" 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate percentage for spotlight
    const perX = (x / rect.width) * 100;
    const perY = (y / rect.height) * 100;

    // Calculate rotation (Max 15 degrees)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10; // Invert Y for correct tilt
    const rotateY = ((x - centerX) / centerX) * 10;

    setRotation({ x: rotateX, y: rotateY });
    setSpotlight({ x: perX, y: perY, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setSpotlight(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-2xl transition-transform duration-200 ease-out preserve-3d group ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1, 1, 1)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* 1. Dynamic Border Gradient (The "Light Edge") */}
      <div 
        className="absolute inset-[-1px] rounded-2xl z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, ${glowColor}, transparent 60%)`
        }}
      />

      {/* 2. Glass Surface & Spotlight */}
      <div 
        className="absolute inset-0 rounded-2xl z-10 pointer-events-none"
        style={{
            background: `radial-gradient(800px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.06), transparent 40%)`,
            opacity: spotlight.opacity,
            transition: 'opacity 0.5s ease'
        }}
      />

      {/* 3. Content Container (Matte Glass) */}
      <div 
        className="relative z-10 w-full h-full rounded-2xl bg-[#121316]/80 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden"
        style={{
            transform: 'translateZ(20px)', // Parallax depth for content
        }}
      >
         {children}
         
         {/* Noise Texture for physical feel */}
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    </div>
  );
};
