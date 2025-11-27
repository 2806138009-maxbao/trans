import React, { useRef, useState, MouseEvent, useEffect } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  disabled?: boolean; // 禁用 3D 效果
}

export const TiltCard: React.FC<TiltCardProps> = ({ 
  children, 
  className = "", 
  glowColor = "rgba(94, 106, 210, 0.5)",
  disabled = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动端 - 只在窄屏幕时禁用，不再检测触屏（因为很多桌面也有触屏）
  useEffect(() => {
    const checkMobile = () => {
      // 只根据屏幕宽度判断，768px 以下视为移动端
      const isNarrowScreen = window.innerWidth < 768;
      // 或者检测是否是真正的移动设备 UA
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isNarrowScreen || isMobileUA);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldDisable = disabled || isMobile;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (shouldDisable || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const perX = (x / rect.width) * 100;
    const perY = (y / rect.height) * 100;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setRotation({ x: rotateX, y: rotateY });
    setSpotlight({ x: perX, y: perY, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setSpotlight(prev => ({ ...prev, opacity: 0 }));
  };

  // 移动端简化版本
  if (shouldDisable) {
    return (
      <div className={`relative rounded-2xl group ${className}`}>
        <div className="relative z-10 w-full h-full rounded-2xl bg-[#121316]/80 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
          {children}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-2xl transition-transform duration-200 ease-out preserve-3d group ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1, 1, 1)`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {/* Dynamic Border Gradient */}
      <div 
        className="absolute inset-[-1px] rounded-2xl z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, ${glowColor}, transparent 60%)`
        }}
      />

      {/* Glass Surface & Spotlight */}
      <div 
        className="absolute inset-0 rounded-2xl z-10 pointer-events-none"
        style={{
          background: `radial-gradient(800px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.06), transparent 40%)`,
          opacity: spotlight.opacity,
          transition: 'opacity 0.5s ease'
        }}
      />

      {/* Content Container */}
      <div 
        className="relative z-10 w-full h-full rounded-2xl bg-[#121316]/80 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden"
        style={{ transform: 'translateZ(20px)' }}
      >
        {children}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    </div>
  );
};
