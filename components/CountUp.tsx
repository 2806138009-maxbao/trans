import React, { useState, useEffect, useRef } from 'react';

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Delay before starting animation */
  delay?: number;
  /** Easing function */
  easing?: 'linear' | 'easeOut' | 'easeOutExpo';
  /** Called when animation completes */
  onComplete?: () => void;
}

/**
 * CountUp - Animated number counter
 * Used for "Boot Sequence" effect (0 -> 50Ω)
 */
export const CountUp: React.FC<CountUpProps> = ({
  end,
  start = 0,
  duration = 1200,
  decimals = 0,
  suffix = '',
  prefix = '',
  className = '',
  style,
  delay = 0,
  easing = 'easeOutExpo',
  onComplete,
}) => {
  const [value, setValue] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Easing functions
  const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  };

  useEffect(() => {
    const delayTimeout = setTimeout(() => {
      setHasStarted(true);
      startTimeRef.current = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFunctions[easing](progress);
        
        const currentValue = start + (end - start) * easedProgress;
        setValue(currentValue);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        } else {
          setValue(end);
          onComplete?.();
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(delayTimeout);
      cancelAnimationFrame(frameRef.current);
    };
  }, [end, start, duration, delay, easing]);

  const formattedValue = value.toFixed(decimals);

  return (
    <span
      className={className}
      style={{
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

export default CountUp;

