import React from 'react';

export const GradientText = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <span className={`bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent ${className}`}>{children}</span>
);

export const Eyebrow = ({ label, color = '#5E6AD2' }: { label: string; color?: string }) => (
  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8A8F98]">
    <span
      className="w-1.5 h-1.5 rounded-full"
      style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
    />
    <span>{label}</span>
  </div>
);
