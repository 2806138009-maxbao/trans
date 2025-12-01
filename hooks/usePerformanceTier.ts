import { useState, useEffect } from 'react';

export type PerformanceTier = 'low' | 'medium' | 'high';

export const usePerformanceTier = (): PerformanceTier => {
  const [tier, setTier] = useState<PerformanceTier>('high');

  useEffect(() => {
    // Simple check: reduced motion preference or low logical processors
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const logicCores = navigator.hardwareConcurrency || 4;
    
    if (reducedMotion || logicCores < 4) {
      setTier('low');
    } else if (logicCores < 8) {
      setTier('medium');
    } else {
      setTier('high');
    }
  }, []);

  return tier;
};

