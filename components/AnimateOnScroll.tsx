import React, { useEffect, useRef, useState } from 'react';

type AnimationType = 'fade-up' | 'slide-left' | 'slide-right' | 'scale' | 'blur';

interface AnimateOnScrollProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number; // delay in ms
  duration?: number; // duration in ms
  className?: string;
  threshold?: number;
  as?: keyof JSX.IntrinsicElements;
  triggerOnce?: boolean; // 是否只触发一次，默认 false（每次进入视口都触发）
}

const animationClasses: Record<AnimationType, { initial: string; visible: string }> = {
  'fade-up': {
    initial: 'opacity-0 translate-y-10',
    visible: 'opacity-100 translate-y-0',
  },
  'slide-left': {
    initial: 'opacity-0 -translate-x-16',
    visible: 'opacity-100 translate-x-0',
  },
  'slide-right': {
    initial: 'opacity-0 translate-x-16',
    visible: 'opacity-100 translate-x-0',
  },
  'scale': {
    initial: 'opacity-0 scale-90',
    visible: 'opacity-100 scale-100',
  },
  'blur': {
    initial: 'opacity-0 blur-sm translate-y-4',
    visible: 'opacity-100 blur-0 translate-y-0',
  },
};

export const AnimateOnScroll: React.FC<AnimateOnScrollProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 800,
  className = '',
  threshold = 0.1,
  as: Component = 'div',
  triggerOnce = false, // 默认每次进入视口都触发动画
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // 进入视口时显示
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          // 离开视口时隐藏（只有在非 triggerOnce 模式下）
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, triggerOnce]);

  const { initial, visible } = animationClasses[animation];
  const transitionStyle = {
    transitionProperty: 'opacity, transform, filter',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: isVisible ? `${delay}ms` : '0ms', // 离开时不需要延迟
  };

  return (
    <Component
      ref={ref as any}
      className={`${isVisible ? visible : initial} ${className}`}
      style={transitionStyle}
    >
      {children}
    </Component>
  );
};

/**
 * Staggered animation for list items
 */
interface StaggeredListProps {
  children: React.ReactNode[];
  animation?: AnimationType;
  baseDelay?: number;
  staggerDelay?: number;
  className?: string;
  itemClassName?: string;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  animation = 'fade-up',
  baseDelay = 0,
  staggerDelay = 100,
  className = '',
  itemClassName = '',
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <AnimateOnScroll
          animation={animation}
          delay={baseDelay + index * staggerDelay}
          className={itemClassName}
        >
          {child}
        </AnimateOnScroll>
      ))}
    </div>
  );
};

