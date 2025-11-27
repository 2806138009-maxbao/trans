import React, { useRef, useState, MouseEvent } from 'react';
import { Language } from '../types';
import { ArrowRight, Pencil, Layers, SlidersHorizontal, FunctionSquare, BarChart3, Circle } from 'lucide-react';

// 单个步骤卡片的 Tilt 效果组件
interface TiltStepCardProps {
  children: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
  isCompleted: boolean;
  ariaLabel: string;
}

const TiltStepCard: React.FC<TiltStepCardProps> = ({ 
  children, 
  onClick, 
  isActive, 
  isCompleted,
  ariaLabel 
}) => {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const perX = (x / rect.width) * 100;
    const perY = (y / rect.height) * 100;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setRotation({ x: rotateX, y: rotateY });
    setSpotlight({ x: perX, y: perY, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setSpotlight(prev => ({ ...prev, opacity: 0 }));
  };

  const glowColor = isActive 
    ? 'rgba(94, 106, 210, 0.6)' 
    : 'rgba(255, 255, 255, 0.3)';

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-xl transition-transform duration-200 ease-out text-left focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
      style={{
        transform: `perspective(800px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1, 1, 1)`,
        transformStyle: 'preserve-3d',
      }}
      aria-label={ariaLabel}
    >
      {/* Dynamic Border Gradient */}
      <div 
        className="absolute inset-[-1px] rounded-xl z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, ${glowColor}, transparent 60%)`
        }}
      />

      {/* Glass Surface & Spotlight */}
      <div 
        className="absolute inset-0 rounded-xl z-10 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.08), transparent 40%)`,
          opacity: spotlight.opacity,
          transition: 'opacity 0.5s ease'
        }}
      />

      {/* Content Container */}
      <div 
        className={`
          relative z-10 w-full h-full rounded-xl p-4 flex flex-col items-start gap-3
          border transition-all duration-300 overflow-hidden
          ${isActive 
            ? 'bg-[#5E6AD2]/20 border-[#5E6AD2]/40 shadow-[0_0_20px_rgba(94,106,210,0.2)]' 
            : isCompleted
              ? 'bg-[#121316]/80 border-white/20 opacity-90'
              : 'bg-[#121316]/80 border-white/5 group-hover:border-white/15'
          }
        `}
        style={{
          transform: 'translateZ(15px)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {children}
        
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    </button>
  );
};

interface StepTimelineProps {
  lang: Language;
  currentStep?: number;
  onStepClick?: (stepId: string) => void;
}

interface Step {
  id: string;
  label: { zh: string; en: string };
  icon: React.ReactNode;
  description: { zh: string; en: string };
}

const STEPS: Step[] = [
  {
    id: 'signal-drawing',
    label: { zh: '画信号', en: 'Draw Signal' },
    icon: <Pencil size={16} />,
    description: { zh: '理解信号是时间轴上的轨迹', en: 'Understand signals as paths over time' },
  },
  {
    id: 'sine-lego',
    label: { zh: '正弦积木', en: 'Sine Bricks' },
    icon: <Layers size={16} />,
    description: { zh: '认识振幅和频率', en: 'Learn amplitude & frequency' },
  },
  {
    id: 'build-waves',
    label: { zh: '拼波形', en: 'Build Waves' },
    icon: <SlidersHorizontal size={16} />,
    description: { zh: '用谐波叠加构建目标波形', en: 'Stack harmonics to build waveforms' },
  },
  {
    id: 'formula-section',
    label: { zh: '看公式', en: 'See Formula' },
    icon: <FunctionSquare size={16} />,
    description: { zh: '把滑块映射到 Σ 公式', en: 'Map sliders to the Σ formula' },
  },
  {
    id: 'spectrum-section',
    label: { zh: '看频谱', en: 'See Spectrum' },
    icon: <BarChart3 size={16} />,
    description: { zh: '时域 vs 频域的切换', en: 'Time vs frequency domain' },
  },
  {
    id: 'epicycle-section',
    label: { zh: '本轮绘制', en: 'Epicycles' },
    icon: <Circle size={16} />,
    description: { zh: '用旋转圆画出任意形状', en: 'Draw anything with spinning circles' },
  },
];

export const StepTimeline: React.FC<StepTimelineProps> = ({ 
  lang, 
  currentStep = -1,
  onStepClick 
}) => {
  const handleClick = (stepId: string) => {
    if (onStepClick) {
      onStepClick(stepId);
    } else {
      const element = document.getElementById(stepId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-[#5E6AD2]/10 border border-[#5E6AD2]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] shadow-[0_0_6px_#5E6AD2]" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#5E6AD2] font-medium">
            {lang === 'zh' ? '实验路线图' : 'Experiment Roadmap'}
          </span>
        </div>
        <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
          {lang === 'zh' ? '接下来的 6 步实验' : 'Your 6-Step Experiment Path'}
        </h3>
        <p className="text-sm text-[#8A8F98] max-w-lg mx-auto">
          {lang === 'zh' 
            ? '按顺序完成每一步，或点击跳转到感兴趣的部分' 
            : 'Follow each step in order, or click to jump to any section'}
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          
          return (
            <TiltStepCard
              key={step.id}
              onClick={() => handleClick(step.id)}
              isActive={isActive}
              isCompleted={isCompleted}
              ariaLabel={`${lang === 'zh' ? '步骤' : 'Step'} ${idx + 1}: ${step.label[lang]}`}
            >
              {/* Step Number Badge */}
              <div className={`
                flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium
                ${isActive ? 'text-[#5E6AD2]' : 'text-[#8A8F98]'}
              `}>
                <span className={`
                  w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                  transition-all duration-300
                  ${isActive 
                    ? 'bg-[#5E6AD2] text-white shadow-[0_0_10px_rgba(94,106,210,0.5)]' 
                    : isCompleted
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-[#8A8F98] group-hover:bg-white/15'
                  }
                `}>
                  {isCompleted ? '✓' : idx + 1}
                </span>
                <span>{lang === 'zh' ? `第 ${idx + 1} 步` : `Step ${idx + 1}`}</span>
              </div>

              {/* Icon + Label */}
              <div className="flex items-center gap-2">
                <div className={`
                  transition-colors duration-300
                  ${isActive ? 'text-[#5E6AD2]' : 'text-[#D0D6E0] group-hover:text-white'}
                `}>
                  {step.icon}
                </div>
                <span className={`
                  font-medium text-sm transition-colors duration-300
                  ${isActive ? 'text-white' : 'text-[#D0D6E0] group-hover:text-white'}
                `}>
                  {step.label[lang]}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-[#8A8F98] leading-relaxed line-clamp-2">
                {step.description[lang]}
              </p>

              {/* Hover Arrow */}
              <ArrowRight 
                size={14} 
                className={`
                  absolute bottom-4 right-4 transition-all duration-300
                  ${isActive 
                    ? 'text-[#5E6AD2] opacity-100' 
                    : 'text-[#5E6AD2] opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0'
                  }
                `}
              />
            </TiltStepCard>
          );
        })}
      </div>

      {/* Start CTA */}
      <div className="mt-8 text-center">
        <button
          onClick={() => handleClick('signal-drawing')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full
            bg-[#5E6AD2] text-white font-medium text-sm
            hover:bg-[#6B78E0] transition-all duration-300
            shadow-[0_0_20px_rgba(94,106,210,0.3)] hover:shadow-[0_0_30px_rgba(94,106,210,0.4)]
            focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2 focus:ring-offset-[#0B0C0E]"
        >
          {lang === 'zh' ? '开始第 1 步' : 'Start Step 1'}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};



