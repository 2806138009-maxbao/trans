import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  title,
  position = 'top',
  delay = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.top - tooltipRect.height - 12;
          break;
        case 'bottom':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.bottom + 12;
          break;
        case 'left':
          x = triggerRect.left - tooltipRect.width - 12;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case 'right':
          x = triggerRect.right + 12;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
      }

      // Keep tooltip within viewport
      x = Math.max(12, Math.min(x, window.innerWidth - tooltipRect.width - 12));
      y = Math.max(12, Math.min(y, window.innerHeight - tooltipRect.height - 12));

      setCoords({ x, y });
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-flex items-center gap-1 cursor-help group relative"
      >
        {/* The text content */}
        <span className="relative border-b border-dashed border-white/30 group-hover:border-[#5E6AD2] transition-all duration-300 group-hover:text-white">
          {children}
        </span>
        
        {/* Info icon indicator */}
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white/5 border border-white/10 group-hover:bg-[#5E6AD2]/20 group-hover:border-[#5E6AD2]/50 transition-all duration-300 flex-shrink-0">
          <svg 
            className="w-2 h-2 text-white/40 group-hover:text-[#5E6AD2] transition-colors duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>

        {/* Subtle glow on hover */}
        <span className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#5E6AD2]/5 blur-md rounded" />
      </span>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none animate-tooltip-pop"
          style={{
            left: coords.x,
            top: coords.y,
          }}
        >
          <div className="max-w-xs p-4 rounded-xl bg-[#1A1B1F]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
            {title && (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#5E6AD2] uppercase tracking-wider mb-2">
                <span className="w-1 h-1 rounded-full bg-[#5E6AD2] shadow-[0_0_6px_#5E6AD2]" />
                {title}
              </div>
            )}
            <div className="text-sm text-[#D0D6E0] leading-relaxed">
              {content}
            </div>
            {/* Arrow */}
            <div 
              className={`absolute w-2.5 h-2.5 bg-[#1A1B1F]/95 border-white/10 transform rotate-45
                ${position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2 border-r border-b' : ''}
                ${position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2 border-l border-t' : ''}
                ${position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2 border-t border-r' : ''}
                ${position === 'right' ? 'left-[-6px] top-1/2 -translate-y-1/2 border-b border-l' : ''}
              `}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes tooltip-pop {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(8px);
          }
          50% {
            transform: scale(1.02) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-tooltip-pop {
          animation: tooltip-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </>
  );
};

// 预定义的术语解释
export const TERM_DEFINITIONS = {
  zh: {
    fourier: {
      title: '傅里叶级数',
      content: '一种将周期函数分解为正弦和余弦函数之和的数学方法。由法国数学家约瑟夫·傅里叶在1822年提出。',
    },
    harmonic: {
      title: '谐波',
      content: '基频的整数倍频率分量。第n次谐波的频率是基频的n倍。谐波决定了波形的形状和音色。',
    },
    amplitude: {
      title: '振幅',
      content: '波动的最大位移。振幅越大，波的能量越强。在声音中表现为音量，在光中表现为亮度。',
    },
    frequency: {
      title: '频率',
      content: '单位时间内波动的次数，单位是赫兹(Hz)。频率越高，声音越尖锐，光越偏向蓝紫色。',
    },
    timeDomain: {
      title: '时域',
      content: '以时间为横轴观察信号的变化。时域图显示信号随时间如何变化，是最直观的信号表示方式。',
    },
    freqDomain: {
      title: '频域',
      content: '以频率为横轴观察信号的组成。频域图（频谱）显示信号包含哪些频率成分及其强度。',
    },
    epicycle: {
      title: '本轮 (Epicycle)',
      content: '一种用旋转圆叠加来描述复杂运动的几何方法。傅里叶级数可以用本轮来可视化：每个圆代表一个谐波。',
    },
    squareWave: {
      title: '方波',
      content: '在高低两个电平之间瞬间切换的波形。只包含奇次谐波（1, 3, 5...），是数字电路中最常见的信号。',
    },
    triangleWave: {
      title: '三角波',
      content: '线性上升和下降形成的波形。只包含奇次谐波，但振幅衰减更快（1/n²），听起来比方波柔和。',
    },
    sawtoothWave: {
      title: '锯齿波',
      content: '线性上升后瞬间下降的波形。包含所有谐波（奇次和偶次），音色丰富，常用于合成器。',
    },
  },
  en: {
    fourier: {
      title: 'Fourier Series',
      content: 'A mathematical method to decompose periodic functions into sums of sines and cosines. Developed by Joseph Fourier in 1822.',
    },
    harmonic: {
      title: 'Harmonic',
      content: 'Frequency components that are integer multiples of the fundamental. The nth harmonic has n times the base frequency.',
    },
    amplitude: {
      title: 'Amplitude',
      content: 'The maximum displacement of a wave. Higher amplitude means more energy. In sound: louder. In light: brighter.',
    },
    frequency: {
      title: 'Frequency',
      content: 'Number of oscillations per second, measured in Hertz (Hz). Higher frequency = higher pitch in sound, bluer in light.',
    },
    timeDomain: {
      title: 'Time Domain',
      content: 'Viewing signals with time on the x-axis. Shows how the signal changes over time - the most intuitive representation.',
    },
    freqDomain: {
      title: 'Frequency Domain',
      content: 'Viewing signals with frequency on the x-axis. The spectrum shows which frequencies are present and their strengths.',
    },
    epicycle: {
      title: 'Epicycle',
      content: 'A geometric method using stacked rotating circles. Fourier series can be visualized as epicycles: each circle = one harmonic.',
    },
    squareWave: {
      title: 'Square Wave',
      content: 'Instantly switches between high and low. Contains only odd harmonics (1, 3, 5...). Most common in digital circuits.',
    },
    triangleWave: {
      title: 'Triangle Wave',
      content: 'Linear rise and fall. Only odd harmonics but decays faster (1/n²). Sounds softer than square waves.',
    },
    sawtoothWave: {
      title: 'Sawtooth Wave',
      content: 'Linear rise, instant drop. Contains all harmonics (odd and even). Rich timbre, popular in synthesizers.',
    },
  },
};

// 便捷组件：带术语解释的文字
interface TermProps {
  term: keyof typeof TERM_DEFINITIONS.zh;
  lang: 'zh' | 'en';
  children: React.ReactNode;
}

export const Term: React.FC<TermProps> = ({ term, lang, children }) => {
  const def = TERM_DEFINITIONS[lang][term];
  if (!def) return <>{children}</>;
  
  return (
    <Tooltip title={def.title} content={def.content}>
      {children}
    </Tooltip>
  );
};
