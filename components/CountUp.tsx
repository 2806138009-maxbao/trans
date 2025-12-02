import React, { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 1200,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  style,
}) => {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number>(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setValue(eased * end);
      
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    
    animRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [end, duration]);

  return (
    <span className={className} style={style}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  );
};




