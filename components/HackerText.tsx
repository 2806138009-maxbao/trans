import React, { useState, useEffect, useRef } from 'react';

interface HackerTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  /** Duration of the scramble effect in ms */
  duration?: number;
  /** Trigger on hover instead of on mount */
  triggerOnHover?: boolean;
  /** Characters to use for scrambling */
  chars?: string;
}

/**
 * HackerText - Matrix-style text scramble effect
 * Inspired by Vercel's console text effect
 */
export const HackerText: React.FC<HackerTextProps> = ({
  text,
  className = '',
  style,
  duration = 500,
  triggerOnHover = false,
  chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}',
}) => {
  const [displayText, setDisplayText] = useState(triggerOnHover ? text : '');
  const [isAnimating, setIsAnimating] = useState(!triggerOnHover);
  const intervalRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  const scramble = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsAnimating(true);
    const iterations = Math.ceil(duration / 30); // ~30fps
    let frame = 0;

    intervalRef.current = window.setInterval(() => {
      const progress = frame / iterations;
      const revealedLength = Math.floor(text.length * progress);

      const newText = text
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          if (index < revealedLength) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      setDisplayText(newText);
      frame++;

      if (frame >= iterations) {
        setDisplayText(text);
        setIsAnimating(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 30);
  };

  // Mount animation
  useEffect(() => {
    if (!triggerOnHover) {
      // Small delay before starting
      const timeout = setTimeout(scramble, 100);
      return () => {
        clearTimeout(timeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, triggerOnHover]);

  const handleMouseEnter = () => {
    if (triggerOnHover && !isAnimating) {
      scramble();
    }
  };

  return (
    <span
      className={className}
      style={{
        ...style,
        fontVariantNumeric: 'tabular-nums',
      }}
      onMouseEnter={handleMouseEnter}
    >
      {displayText || text}
    </span>
  );
};

export default HackerText;

