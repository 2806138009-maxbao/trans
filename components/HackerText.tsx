import React, { useEffect, useState, useRef } from 'react';

interface HackerTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
  triggerOnHover?: boolean;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';

export const HackerText: React.FC<HackerTextProps> = ({
  text,
  className = '',
  style,
  duration = 500,
  triggerOnHover = false,
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(!triggerOnHover);
  const intervalRef = useRef<number>(0);
  const iterationRef = useRef(0);

  const animate = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    iterationRef.current = 0;
    setIsAnimating(true);
    
    const totalIterations = text.length * 3;
    const intervalTime = duration / totalIterations;
    
    intervalRef.current = window.setInterval(() => {
      setDisplayText(prev => {
        return text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iterationRef.current / 3) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('');
      });
      
      iterationRef.current++;
      
      if (iterationRef.current >= totalIterations) {
        clearInterval(intervalRef.current);
        setDisplayText(text);
        setIsAnimating(false);
      }
    }, intervalTime);
  };

  useEffect(() => {
    if (!triggerOnHover) {
      animate();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, triggerOnHover]);

  const handleMouseEnter = () => {
    if (triggerOnHover && !isAnimating) {
      animate();
    }
  };

  return (
    <span
      className={className}
      style={{ fontFamily: 'monospace', ...style }}
      onMouseEnter={handleMouseEnter}
    >
      {displayText}
    </span>
  );
};

