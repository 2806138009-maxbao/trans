import React, { useRef, useState, useEffect, MouseEvent } from 'react';

interface HudTiltContainerProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  reducedMotion?: boolean;
}

// Inject breathing animation keyframes
if (typeof document !== 'undefined') {
  const styleId = 'hud-breathe-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes hud-breathe {
        0%, 100% { 
          opacity: 0.3; 
          border-color: rgba(255, 199, 0, 0.2);
        }
        50% { 
          opacity: 0.7; 
          border-color: rgba(255, 199, 0, 0.5);
          box-shadow: 0 0 12px rgba(255, 199, 0, 0.15);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * HUD 容器组件，带有 TiltCard 相同的 3D 倾斜和光晕效果
 * 用于包裹画布等大型交互区域
 * 移动端自动禁用 3D 效果以保证滚动流畅
 * 
 * 新增：角落支架"呼吸"动画 - 让系统看起来"在线"
 */
export const HudTiltContainer: React.FC<HudTiltContainerProps> = ({
  children,
  className = '',
  glowColor = 'rgba(94, 106, 210, 0.4)',
  reducedMotion = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      const isNarrowScreen = window.innerWidth < 768;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isNarrowScreen || isMobileUA);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isMobile || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate percentage for spotlight
    const perX = (x / rect.width) * 100;
    const perY = (y / rect.height) * 100;

    // Calculate rotation (reduced for larger containers - max 5 degrees)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -4; // Gentler tilt for larger containers
    const rotateY = ((x - centerX) / centerX) * 4;

    setRotation({ x: rotateX, y: rotateY });
    setSpotlight({ x: perX, y: perY, opacity: 1 });
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setRotation({ x: 0, y: 0 });
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  // 移动端简化版本 - 无 3D 效果，保证滚动流畅
  if (isMobile) {
    return (
      <div
        ref={containerRef}
        className={`relative rounded-3xl group ${className}`}
      >
        {/* Content Container (HUD Glass) - 简化版 */}
        <div
          className="relative z-10 w-full h-full rounded-3xl overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(30, 30, 40, 0.15) 0%, rgba(0, 0, 0, 0) 80%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.02), 0 20px 60px rgba(0, 0, 0, 0.4)',
          }}
        >
          {children}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          {/* Corner accents - Breathing animation for "alive" feel */}
          <div 
            className="absolute top-3 left-3 w-6 h-6 border-t border-l rounded-tl-lg pointer-events-none"
            style={{
              borderColor: 'rgba(255, 199, 0, 0.3)',
              animation: reducedMotion ? 'none' : 'hud-breathe 4s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute top-3 right-3 w-6 h-6 border-t border-r rounded-tr-lg pointer-events-none"
            style={{
              borderColor: 'rgba(255, 199, 0, 0.3)',
              animation: reducedMotion ? 'none' : 'hud-breathe 4s ease-in-out infinite',
              animationDelay: '1s', // Offset for organic feel
            }}
          />
          <div 
            className="absolute bottom-3 left-3 w-6 h-6 border-b border-l rounded-bl-lg pointer-events-none"
            style={{
              borderColor: 'rgba(255, 199, 0, 0.3)',
              animation: reducedMotion ? 'none' : 'hud-breathe 4s ease-in-out infinite',
              animationDelay: '1s', // Same offset as top-right for diagonal symmetry
            }}
          />
          <div 
            className="absolute bottom-3 right-3 w-6 h-6 border-b border-r rounded-br-lg pointer-events-none"
            style={{
              borderColor: 'rgba(255, 199, 0, 0.3)',
              animation: reducedMotion ? 'none' : 'hud-breathe 4s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-3xl transition-transform duration-300 ease-out preserve-3d group ${className}`}
      style={{
        transform: `perspective(1500px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1, 1, 1)`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {/* 1. Dynamic Border Gradient (The "Light Edge") */}
      <div
        className="absolute inset-[-1px] rounded-3xl z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, ${glowColor}, transparent 50%)`,
        }}
      />

      {/* 2. Glass Surface & Spotlight */}
      <div
        className="absolute inset-0 rounded-3xl z-10 pointer-events-none"
        style={{
          background: `radial-gradient(1000px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.04), transparent 40%)`,
          opacity: spotlight.opacity,
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* 3. Content Container (HUD Glass) */}
      <div
        className="relative z-10 w-full h-full rounded-3xl overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(30, 30, 40, 0.15) 0%, rgba(0, 0, 0, 0) 80%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow:
            '0 0 0 1px rgba(255, 255, 255, 0.02), 0 20px 60px rgba(0, 0, 0, 0.4)',
          transform: 'translateZ(10px)', // Parallax depth for content
        }}
      >
        {children}

        {/* Noise Texture for physical feel */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Corner accents - Breathing animation for "alive" feel + hover expansion */}
        <div 
          className="absolute top-3 left-3 w-6 h-6 border-t border-l rounded-tl-lg pointer-events-none transition-all duration-300 group-hover:w-8 group-hover:h-8"
          style={{
            borderColor: 'rgba(255, 199, 0, 0.3)',
            animation: reducedMotion ? 'none' : 'hud-breathe 4s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute top-3 right-3 w-6 h-6 border-t border-r rounded-tr-lg pointer-events-none transition-all duration-300 group-hover:w-8 group-hover:h-8"
          style={{
            borderColor: 'rgba(255, 199, 0, 0.3)',
            animation: reducedMotion ? 'none' : 'hud-breathe 4s ease-in-out infinite',
            animationDelay: '1s', // Offset for organic feel
          }}
        />
        <div 
          className="absolute bottom-3 left-3 w-6 h-6 border-b border-l rounded-bl-lg pointer-events-none transition-all duration-300 group-hover:w-8 group-hover:h-8"
          style={{
            borderColor: 'rgba(255, 199, 0, 0.3)',
            animation: reducedMotion ? 'none' : 'hud-breathe 4s ease-in-out infinite',
            animationDelay: '1s', // Same offset as top-right for diagonal symmetry
          }}
        />
        <div 
          className="absolute bottom-3 right-3 w-6 h-6 border-b border-r rounded-br-lg pointer-events-none transition-all duration-300 group-hover:w-8 group-hover:h-8"
          style={{
            borderColor: 'rgba(255, 199, 0, 0.3)',
            animation: reducedMotion ? 'none' : 'hud-breathe 4s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
};


      className={`relative rounded-3xl transition-transform duration-300 ease-out preserve-3d group ${className}`}
      style={{
        transform: `perspective(1500px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1, 1, 1)`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {/* 1. Dynamic Border Gradient (The "Light Edge") */}
      <div
        className="absolute inset-[-1px] rounded-3xl z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, ${glowColor}, transparent 50%)`,
        }}
      />

      {/* 2. Glass Surface & Spotlight */}
      <div
        className="absolute inset-0 rounded-3xl z-10 pointer-events-none"
        style={{
          background: `radial-gradient(1000px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.04), transparent 40%)`,
          opacity: spotlight.opacity,
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* 3. Content Container (HUD Glass) */}
      <div
        className="relative z-10 w-full h-full rounded-3xl overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(30, 30, 40, 0.15) 0%, rgba(0, 0, 0, 0) 80%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow:
            '0 0 0 1px rgba(255, 255, 255, 0.02), 0 20px 60px rgba(0, 0, 0, 0.4)',
          transform: 'translateZ(10px)', // Parallax depth for content
        }}
      >
        {children}

        {/* Noise Texture for physical feel */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Corner accents - Breathing animation for "alive" feel + hover expansion */}
        <div 
          className="absolute top-3 left-3 w-6 h-6 border-t border-l rounded-tl-lg pointer-events-none transition-all duration-300 group-hover:w-8 group-hover:h-8"
          style={{
            borderColor: 'rgba(255, 199, 0, 0.3)',
            animation: reducedMotion ? 'none' : 'hud-breathe 4s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute top-3 right-3 w-6 h-6 border-t border-r rounded-tr-lg pointer-events-none transition-all duration-300 group-hover:w-8 group-hover:h-8"
          style={{
            borderColor: 'rgba(255, 199, 0, 0.3)',
            animation: reducedMotion ? 'none' : 'hud-breathe 4s ease-in-out infinite',
            animationDelay: '1s', // Offset for organic feel
          }}
        />
        <div 
          className="absolute bottom-3 left-3 w-6 h-6 border-b border-l rounded-bl-lg pointer-events-none transition-all duration-300 group-hover:w-8 group-hover:h-8"
          style={{
            borderColor: 'rgba(255, 199, 0, 0.3)',
            animation: reducedMotion ? 'none' : 'hud-breathe 4s ease-in-out infinite',
            animationDelay: '1s', // Same offset as top-right for diagonal symmetry
          }}
        />
        <div 
          className="absolute bottom-3 right-3 w-6 h-6 border-b border-r rounded-br-lg pointer-events-none transition-all duration-300 group-hover:w-8 group-hover:h-8"
          style={{
            borderColor: 'rgba(255, 199, 0, 0.3)',
            animation: reducedMotion ? 'none' : 'hud-breathe 4s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
};
