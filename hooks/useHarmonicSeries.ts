import { useMemo } from 'react';
import { WaveformType } from '../types';

export interface HarmonicData {
  order: number;      // 谐波阶数 (1, 3, 5... 或 1, 2, 3...)
  coefficient: number; // 傅里叶系数
  amplitude: number;   // 绝对振幅
}

/**
 * 根据波形类型和谐波数量计算傅里叶级数系数
 * 
 * 方波 (square): 只有奇次谐波，系数 = 4/(nπ)
 * 三角波 (triangle): 只有奇次谐波，系数 = 8/(n²π²) * (-1)^((n-1)/2)
 * 锯齿波 (sawtooth): 所有谐波，系数 = 2/(nπ) * (-1)^(n+1)
 */
const COEFFICIENT_BUILDERS: Record<WaveformType, (k: number) => HarmonicData> = {
  square: (k) => {
    const n = k * 2 + 1; // 只有奇次: 1, 3, 5, 7...
    const coeff = 4 / (n * Math.PI);
    return { order: n, coefficient: coeff, amplitude: Math.abs(coeff) };
  },
  triangle: (k) => {
    const n = k * 2 + 1; // 只有奇次: 1, 3, 5, 7...
    const sign = k % 2 === 0 ? 1 : -1;
    const coeff = sign * 8 / (n * n * Math.PI * Math.PI);
    return { order: n, coefficient: coeff, amplitude: Math.abs(coeff) };
  },
  sawtooth: (k) => {
    const n = k + 1; // 所有谐波: 1, 2, 3, 4...
    const sign = k % 2 === 0 ? 1 : -1;
    const coeff = sign * 2 / (n * Math.PI);
    return { order: n, coefficient: coeff, amplitude: Math.abs(coeff) };
  },
};

/**
 * 计算指定波形和谐波数量的傅里叶级数
 * @param waveform 波形类型
 * @param harmonics 谐波数量
 * @returns 谐波数据数组
 */
export const useHarmonicSeries = (
  waveform: WaveformType, 
  harmonics: number
): HarmonicData[] => {
  return useMemo(() => {
    const builder = COEFFICIENT_BUILDERS[waveform];
    return Array.from({ length: harmonics }, (_, k) => builder(k));
  }, [waveform, harmonics]);
};

/**
 * 非 hook 版本，供非组件代码使用
 */
export const computeHarmonicSeries = (
  waveform: WaveformType, 
  harmonics: number
): HarmonicData[] => {
  const builder = COEFFICIENT_BUILDERS[waveform];
  return Array.from({ length: harmonics }, (_, k) => builder(k));
};

/**
 * 获取波形的数学描述
 */
export const getWaveformDescription = (waveform: WaveformType, lang: 'zh' | 'en') => {
  const descriptions = {
    square: {
      zh: {
        name: '方波',
        harmonics: '只有奇次谐波 (1, 3, 5...)',
        formula: 'f(t) = Σ (4/nπ) sin(nωt), n = 1, 3, 5...',
        note: '对称性决定了只需要奇次谐波',
      },
      en: {
        name: 'Square Wave',
        harmonics: 'Odd harmonics only (1, 3, 5...)',
        formula: 'f(t) = Σ (4/nπ) sin(nωt), n = 1, 3, 5...',
        note: 'Symmetry dictates only odd harmonics are needed',
      },
    },
    triangle: {
      zh: {
        name: '三角波',
        harmonics: '只有奇次谐波，衰减更快 (1/n²)',
        formula: 'f(t) = Σ (8/n²π²) sin(nωt), n = 1, 3, 5...',
        note: '更平滑的过渡，所以高频成分更少',
      },
      en: {
        name: 'Triangle Wave',
        harmonics: 'Odd harmonics only, faster decay (1/n²)',
        formula: 'f(t) = Σ (8/n²π²) sin(nωt), n = 1, 3, 5...',
        note: 'Smoother transitions mean less high-frequency content',
      },
    },
    sawtooth: {
      zh: {
        name: '锯齿波',
        harmonics: '所有谐波 (1, 2, 3, 4...)',
        formula: 'f(t) = Σ (2/nπ) sin(nωt), n = 1, 2, 3...',
        note: '不对称，所以需要奇次和偶次谐波',
      },
      en: {
        name: 'Sawtooth Wave',
        harmonics: 'All harmonics (1, 2, 3, 4...)',
        formula: 'f(t) = Σ (2/nπ) sin(nωt), n = 1, 2, 3...',
        note: 'Asymmetry requires both odd and even harmonics',
      },
    },
  };
  
  return descriptions[waveform][lang];
};

