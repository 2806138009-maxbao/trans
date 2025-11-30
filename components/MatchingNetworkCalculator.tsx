import React, { useState, useMemo } from 'react';
import { Zap } from 'lucide-react';
import { THEME } from '../theme';
import { TRANSLATIONS } from '../types';

interface MatchingNetworkCalculatorProps {
  z: { r: number; x: number };
  lang: 'zh' | 'en';
}

export const MatchingNetworkCalculator: React.FC<MatchingNetworkCalculatorProps> = ({ z, lang }) => {
  const [frequency, setFrequency] = useState(1000); // MHz
  const t = TRANSLATIONS[lang];
  
  // 计算 L 型匹配网络的元件值
  const matchingNetwork = useMemo(() => {
    const Z0 = 50; // 特性阻抗
    const R_L = z.r * Z0;
    const X_L = z.x * Z0;
    const f = frequency * 1e6; // Hz
    const omega = 2 * Math.PI * f;
    
    // 如果已经匹配，不需要网络
    if (Math.abs(z.r - 1) < 0.05 && Math.abs(z.x) < 0.05) {
      return { matched: true, type: 'none' as const };
    }
    
    if (R_L > Z0) {
      // 情况 1: R_L > Z0 (串联 + 并联)
      const Q = Math.sqrt((R_L - Z0) / Z0);
      const X_s_positive = Q * Z0 - X_L;
      const X_s_negative = -Q * Z0 - X_L;
      const B_p = Q / R_L;
      
      const solution1 = {
        seriesType: X_s_positive > 0 ? 'L' as const : 'C' as const,
        seriesValue: X_s_positive > 0 
          ? X_s_positive / omega * 1e9 
          : 1 / (omega * Math.abs(X_s_positive)) * 1e12,
        shuntType: 'C' as const,
        shuntValue: B_p / omega * 1e12,
      };
      
      const solution2 = {
        seriesType: X_s_negative > 0 ? 'L' as const : 'C' as const,
        seriesValue: X_s_negative > 0 
          ? X_s_negative / omega * 1e9 
          : 1 / (omega * Math.abs(X_s_negative)) * 1e12,
        shuntType: 'L' as const,
        shuntValue: 1 / (B_p * omega) * 1e9,
      };
      
      return {
        matched: false,
        type: 'series-shunt' as const,
        condition: 'R_L > Z₀',
        Q: Q.toFixed(2),
        solutions: [solution1, solution2],
      };
    } else if (R_L < Z0 && R_L > 0) {
      // 情况 2: R_L < Z0 (并联 + 串联)
      const Q = Math.sqrt(Z0 / R_L - 1);
      const B_p_positive = (Q - X_L / R_L) / Z0;
      const B_p_negative = (-Q - X_L / R_L) / Z0;
      const X_s_for_positive = Q * R_L;
      const X_s_for_negative = -Q * R_L;
      
      const solution1 = {
        shuntType: B_p_positive > 0 ? 'C' as const : 'L' as const,
        shuntValue: B_p_positive > 0 
          ? B_p_positive / omega * 1e12 
          : 1 / (omega * Math.abs(B_p_positive)) * 1e9,
        seriesType: 'L' as const,
        seriesValue: X_s_for_positive / omega * 1e9,
      };
      
      const solution2 = {
        shuntType: B_p_negative > 0 ? 'C' as const : 'L' as const,
        shuntValue: B_p_negative > 0 
          ? B_p_negative / omega * 1e12 
          : 1 / (omega * Math.abs(B_p_negative)) * 1e9,
        seriesType: 'C' as const,
        seriesValue: 1 / (omega * Math.abs(X_s_for_negative)) * 1e12,
      };
      
      return {
        matched: false,
        type: 'shunt-series' as const,
        condition: 'R_L < Z₀',
        Q: Q.toFixed(2),
        solutions: [solution1, solution2],
      };
    }
    
    return { matched: false, type: 'complex' as const };
  }, [z.r, z.x, frequency]);
  
  if (matchingNetwork.matched) {
    return (
      <div 
        className="mt-6 pt-6"
        style={{ borderTop: `1px solid ${THEME.colors.border.divider}` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Zap size={16} style={{ color: THEME.colors.primary }} />
          <span className="text-sm font-medium text-white">
            {t.matchingCalculator.title}
          </span>
        </div>
        <div 
          className="p-4 rounded-lg text-center"
          style={{ backgroundColor: 'rgba(255, 199, 0, 0.1)' }}
        >
          <div className="flex items-center gap-2 justify-center" style={{ color: THEME.colors.primary }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 8 L7 10 L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{t.matchingCalculator.matched}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="mt-6 pt-6"
      style={{ borderTop: `1px solid ${THEME.colors.border.divider}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Zap size={16} style={{ color: THEME.colors.primary }} />
          <span className="text-sm font-medium text-white">
            {t.matchingCalculator.designTitle}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: THEME.colors.text.muted }}>f =</span>
          <input
            type="number"
            value={frequency}
            onChange={(e) => setFrequency(Math.max(1, parseFloat(e.target.value) || 1))}
            className="w-20 px-2 py-1 rounded text-xs font-mono text-right"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: `1px solid ${THEME.colors.border.default}`,
              color: THEME.colors.text.main,
            }}
          />
          <span className="text-xs" style={{ color: THEME.colors.text.muted }}>MHz</span>
        </div>
      </div>
      
      <div 
        className="mb-4 p-3 rounded-lg text-xs"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <span style={{ color: THEME.colors.text.muted }}>
          {t.matchingCalculator.condition}: 
        </span>
        <span className="font-mono ml-2" style={{ color: THEME.colors.secondary }}>
          {matchingNetwork.type === 'series-shunt' ? 'R_L > Z₀ → ' : 'R_L < Z₀ → '}
          {matchingNetwork.type === 'series-shunt' 
            ? `${t.matchingCalculator.series} + ${t.matchingCalculator.shunt}`
            : `${t.matchingCalculator.shunt} + ${t.matchingCalculator.series}`
          }
        </span>
        <span className="ml-2" style={{ color: THEME.colors.text.label }}>
          Q = {matchingNetwork.Q}
        </span>
      </div>
      
      {matchingNetwork.solutions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matchingNetwork.solutions.map((sol, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: idx === 0 ? 'rgba(255, 199, 0, 0.05)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${idx === 0 ? THEME.colors.border.hover : THEME.colors.border.default}`,
              }}
            >
              <div className="text-xs mb-3" style={{ color: THEME.colors.text.label }}>
                {t.matchingCalculator.solution} {idx + 1}
                {idx === 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: THEME.colors.primaryFaint, color: THEME.colors.primary }}>
                    {t.matchingCalculator.recommended}
                  </span>
                )}
              </div>
              
              {/* 电路图 */}
              <div className="flex items-center gap-2 mb-3 font-mono text-sm">
                <span style={{ color: THEME.colors.text.muted }}>Z₀</span>
                <span style={{ color: THEME.colors.text.disabled }}>─</span>
                
                {matchingNetwork.type === 'series-shunt' ? (
                  <>
                    <ComponentBadge type={sol.seriesType} />
                    <span style={{ color: THEME.colors.text.disabled }}>─┬─</span>
                    <ComponentBadge type={sol.shuntType} arrow />
                  </>
                ) : (
                  <>
                    <span style={{ color: THEME.colors.text.disabled }}>─┬─</span>
                    <ComponentBadge type={sol.shuntType} arrow />
                    <span style={{ color: THEME.colors.text.disabled }}>─</span>
                    <ComponentBadge type={sol.seriesType} />
                  </>
                )}
                
                <span style={{ color: THEME.colors.text.disabled }}>─</span>
                <span style={{ color: THEME.colors.text.muted }}>Z_L</span>
              </div>
              
              {/* 元件值 */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: THEME.colors.text.muted }}>
                    {matchingNetwork.type === 'series-shunt' ? t.matchingCalculator.series : t.matchingCalculator.shunt} ({matchingNetwork.type === 'series-shunt' ? sol.seriesType : sol.shuntType}):
                  </span>
                  <span className="font-mono" style={{ color: THEME.colors.text.main }}>
                    {matchingNetwork.type === 'series-shunt' 
                      ? formatValue(sol.seriesValue, sol.seriesType)
                      : formatValue(sol.shuntValue, sol.shuntType)
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: THEME.colors.text.muted }}>
                    {matchingNetwork.type === 'series-shunt' ? t.matchingCalculator.shunt : t.matchingCalculator.series} ({matchingNetwork.type === 'series-shunt' ? sol.shuntType : sol.seriesType}):
                  </span>
                  <span className="font-mono" style={{ color: THEME.colors.text.main }}>
                    {matchingNetwork.type === 'series-shunt' 
                      ? formatValue(sol.shuntValue, sol.shuntType)
                      : formatValue(sol.seriesValue, sol.seriesType)
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-xs" style={{ color: THEME.colors.text.muted }}>
        <div className="flex items-start gap-2">
          <div 
            className="flex-shrink-0 w-1 h-1 rounded-full mt-1.5"
            style={{ backgroundColor: THEME.colors.primary }}
          />
          <p>{t.matchingCalculator.explanation}</p>
        </div>
      </div>
    </div>
  );
};

const ComponentBadge: React.FC<{ type: 'L' | 'C', arrow?: boolean }> = ({ type, arrow }) => (
  <span 
    className="px-2 py-0.5 rounded"
    style={{ 
      backgroundColor: type === 'L' ? 'rgba(255,199,0,0.2)' : 'rgba(201,209,217,0.2)',
      color: type === 'L' ? THEME.colors.primary : THEME.colors.secondary,
    }}
  >
    {type}{arrow && '↓'}
  </span>
);

const formatValue = (val: number, type: 'L' | 'C') => {
  if (val < 0.01) return '< 0.01 ' + (type === 'L' ? 'nH' : 'pF');
  if (val > 999) return '> 999 ' + (type === 'L' ? 'nH' : 'pF');
  return `${val.toFixed(2)} ${type === 'L' ? 'nH' : 'pF'}`;
};
