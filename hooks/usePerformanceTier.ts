import { useState, useEffect } from 'react';

export type PerformanceTier = 'low' | 'medium' | 'high';

declare global {
  interface Window {
    LUMINOUS_TIER?: PerformanceTier;
  }
}

/**
 * L3 Standard: Performance Tier Detection
 * 
 * Determines optimal rendering tier based on:
 * 1. User manual override (window.LUMINOUS_TIER)
 * 2. prefers-reduced-motion media query
 * 3. Screen width (mobile devices)
 * 4. Hardware concurrency (CPU cores)
 * 
 * Returns: 'low' | 'medium' | 'high'
 */
export function usePerformanceTier(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>('high');

  useEffect(() => {
    // 1. Check for manual override
    if (typeof window !== 'undefined' && window.LUMINOUS_TIER) {
      setTier(window.LUMINOUS_TIER);
      return;
    }

    // 2. Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) {
      setTier('low');
      return;
    }

    // 3. Check screen width (mobile)
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setTier('medium');
      return;
    }

    // 4. Check hardware concurrency (CPU cores)
    const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency 
      ? navigator.hardwareConcurrency 
      : 4;
    
    if (cores <= 2) {
      setTier('low');
    } else if (cores <= 4) {
      setTier('medium');
    } else {
      setTier('high');
    }
  }, []);

  return tier;
}

