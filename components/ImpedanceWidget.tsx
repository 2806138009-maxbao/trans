import React from 'react';
import { THEME } from '../theme';

interface ImpedanceWidgetProps {
  r: number;
  x: number;
  z0?: number;
  lang?: 'en' | 'zh';
  className?: string;
}

export const ImpedanceWidget: React.FC<ImpedanceWidgetProps> = ({
  r,
  x,
  z0 = 50,
  lang = 'zh',
  className = '',
}) => {
  const actualR = r * z0;
  const actualX = x * z0;

  return (
    <div 
      className={`p-4 rounded-xl ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: THEME.colors.text.label }}>
        {lang === 'zh' ? '阻抗' : 'Impedance'}
      </div>
      
      <div className="flex items-baseline gap-1 font-mono">
        <span className="text-2xl font-semibold" style={{ color: THEME.colors.primary }}>
          {actualR.toFixed(1)}
        </span>
        <span className="text-lg text-white/50">
          {actualX >= 0 ? '+' : '−'}
        </span>
        <span className="text-lg text-white/50">j</span>
        <span className="text-2xl font-semibold" style={{ color: '#64B4FF' }}>
          {Math.abs(actualX).toFixed(1)}
        </span>
        <span className="text-sm text-white/30 ml-1">Ω</span>
      </div>

      <div className="mt-2 text-xs" style={{ color: THEME.colors.text.muted }}>
        Z₀ = {z0}Ω
      </div>
    </div>
  );
};



