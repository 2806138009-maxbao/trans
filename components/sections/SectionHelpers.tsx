import React, { useRef, useState, MouseEvent } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';

/**
 * Section 之间的过渡提示组件
 */
export const SectionTransition: React.FC<{
  nextLabel: string;
  nextId: string;
  hint?: string;
  variant?: 'button' | 'inline';
}> = ({ nextLabel, nextId, hint, variant = 'button' }) => {
  const handleClick = () => {
    const element = document.getElementById(nextId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (variant === 'inline') {
    return (
      <div className="mt-8 text-center">
        {hint && (
          <p className="text-sm text-[var(--color-text-muted)] mb-3">{hint}</p>
        )}
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#FFC700] 
            hover:text-white transition-all duration-300 group"
        >
          <span>{nextLabel}</span>
          <ArrowDown size={14} className="animate-bounce group-hover:text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <button
        onClick={handleClick}
        className="w-full group flex items-center justify-between p-4 rounded-xl 
          bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 
          transition-all duration-300"
      >
        <div className="flex flex-col items-start gap-1">
          {hint && (
            <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
              {hint}
            </span>
          )}
          <span className="text-sm font-medium text-[#D0D6E0] group-hover:text-white">
            {nextLabel}
          </span>
        </div>
        <ArrowRight size={16} className="text-[#FFC700] transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
};

/**
 * 渐变文字组件 - 带 hover 效果
 * 使用 background-clip: text 实现渐变，但保留选中功能
 */
export const GradientText = ({ 
  children, 
  className = '' 
}: { 
  children?: React.ReactNode; 
  className?: string 
}) => (
  <span 
    className={`bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent 
      inline-block transition-all duration-300 ease-out select-text
      hover:from-white hover:to-white/80 hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]
      selection:bg-[#FFC700]/50 selection:text-white
      ${className}`}
    style={{ 
      transition: 'transform 0.3s ease-out, filter 0.3s',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }}
    onMouseEnter={(e) => {
      (e.target as HTMLElement).style.transform = 'scale(1.02)';
    }}
    onMouseLeave={(e) => {
      (e.target as HTMLElement).style.transform = 'scale(1)';
    }}
  >
    {children}
  </span>
);

/**
 * 光点组件 - 只显示一个发光的小圆点
 */
export const GlowDot = ({ 
  color = '#FFC700' 
}: { 
  color?: string 
}) => (
  <span
    className="w-2 h-2 rounded-full transition-all duration-300"
    style={{ 
      backgroundColor: color, 
      boxShadow: `0 0 12px ${color}`,
    }}
  />
);

/**
 * 眉标组件 - 带 hover 效果（用于需要显示标签文字的地方）
 * 支持 label 属性或 children
 */
export const Eyebrow = ({ 
  label,
  children,
  color = '#FFC700' 
}: { 
  label?: string; 
  children?: React.ReactNode;
  color?: string 
}) => (
  <span 
    className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]
      transition-all duration-300 ease-out cursor-default
      hover:text-white hover:tracking-[0.25em]"
    style={{ transition: 'transform 0.3s ease-out, color 0.3s, letter-spacing 0.3s' }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
    }}
  >
    {label || children}
  </span>
);

/**
 * 悬停放大文字组件
 */
export const HoverText = ({ 
  children, 
  className = '',
  as: Component = 'span'
}: { 
  children?: React.ReactNode; 
  className?: string;
  as?: React.ElementType;
}) => (
  <Component
    className={`inline-block transition-all duration-300 ease-out cursor-default
      hover:scale-[1.02] hover:text-white hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]
      ${className}`}
  >
    {children}
  </Component>
);

/**
 * 列表项组件 - 带 TiltCard 风格的 3D hover 效果
 */
export const HoverListItem = ({ 
  children, 
  className = '' 
}: { 
  children?: React.ReactNode; 
  className?: string 
}) => {
  const itemRef = useRef<HTMLLIElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLLIElement>) => {
    if (!itemRef.current) return;

    const rect = itemRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const perX = (x / rect.width) * 100;
    const perY = (y / rect.height) * 100;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    setRotation({ x: rotateX, y: rotateY });
    setSpotlight({ x: perX, y: perY, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setSpotlight(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <li
      ref={itemRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-xl transition-transform duration-200 ease-out group ${className}`}
      style={{
        transform: `perspective(600px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Dynamic Border Gradient */}
      <div 
        className="absolute inset-[-1px] rounded-xl z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(255, 199, 0, 0.5), transparent 60%)`
        }}
      />

      {/* Glass Surface & Spotlight */}
      <div 
        className="absolute inset-0 rounded-xl z-10 pointer-events-none"
        style={{
          background: `radial-gradient(300px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.08), transparent 40%)`,
          opacity: spotlight.opacity,
          transition: 'opacity 0.4s ease'
        }}
      />

      {/* Content Container */}
      <div 
        className="relative z-10 flex gap-2 p-4 rounded-xl bg-[#121316]/80 border border-white/5 
          backdrop-blur-sm transition-all duration-300 
          group-hover:border-white/15"
        style={{
          transform: 'translateZ(10px)',
        }}
      >
        <span className="text-[#FFC700] mt-0.5 flex-shrink-0 transition-all duration-300 group-hover:scale-125 select-none">•</span>
        <span className="flex-1 text-[#D0D6E0] transition-all duration-300 group-hover:text-white select-text cursor-text">{children}</span>
        
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    </li>
  );
};