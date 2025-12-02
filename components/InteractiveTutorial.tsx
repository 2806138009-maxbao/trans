import React, { useEffect, useRef, useState } from 'react';
import { THEME } from '../theme';

interface InteractiveTutorialProps {
  lang: 'en' | 'zh';
  onComplete?: () => void;
}

/**
 * InteractiveTutorial - 交互式教程演示（弹窗形式）
 * 当用户滚动到这个部分时，自动弹出分步骤教程模态框
 */
export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({ 
  lang, 
  onComplete 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  // 检测滚动位置
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3 && !hasShown) {
            setShowModal(true);
            setHasShown(true);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-100px 0px',
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [hasShown]);

  // 教程步骤
  const steps = lang === 'zh' ? [
    {
      title: '悬停光标',
      description: '将鼠标悬停在史密斯圆图上，观察实时阻抗读数',
      action: 'hover',
    },
    {
      title: '拖动滑块',
      description: '使用滑块精确控制阻抗值，观察圆图上的点如何移动',
      action: 'drag',
    },
    {
      title: '切换导纳',
      description: '点击导纳模式切换，从串联视角切换到并联视角',
      action: 'toggle',
    },
    {
      title: '完美匹配',
      description: '将阻抗点拖到圆心（50Ω），实现完美匹配',
      action: 'match',
    },
  ] : [
    {
      title: 'Hover Cursor',
      description: 'Hover over the Smith Chart to see real-time impedance readings',
      action: 'hover',
    },
    {
      title: 'Drag Slider',
      description: 'Use sliders to precisely control impedance values',
      action: 'drag',
    },
    {
      title: 'Toggle Admittance',
      description: 'Switch between impedance (Z) and admittance (Y) views',
      action: 'toggle',
    },
    {
      title: 'Perfect Match',
      description: 'Drag the point to the center (50Ω) for perfect matching',
      action: 'match',
    },
  ];

  // 自动播放教程步骤
  useEffect(() => {
    if (!showModal || isDismissed) return;

    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // 教程完成，3秒后自动关闭
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    }, 3000); // 每步3秒

    return () => clearTimeout(timer);
  }, [showModal, currentStep, isDismissed, steps.length]);

  const handleClose = () => {
    setShowModal(false);
    setIsDismissed(true);
    onComplete?.();
  };

  // 阻止背景滚动
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  return (
    <>
      {/* 隐藏的触发器 - 用于检测滚动位置 */}
      <div ref={containerRef} className="h-1 w-full" />

      {/* 弹窗模态框 */}
      {showModal && !isDismissed && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(5, 5, 5, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={handleClose}
        >
          {/* 弹窗内容 */}
          <div
            className="relative w-full max-w-2xl rounded-2xl p-8"
            style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* 标题 */}
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: THEME.colors.primary,
                  boxShadow: `0 0 20px ${THEME.colors.primary}`,
                }}
              />
              <h2
                className="text-2xl font-bold"
                style={{
                  fontFamily: '"Space Grotesk", "Noto Sans SC", sans-serif',
                  color: '#FFFFFF',
                }}
              >
                {lang === 'zh' ? '交互教程' : 'Interactive Tutorial'}
              </h2>
            </div>

            {/* 教程步骤 */}
            <div className="relative pl-6 mb-8">
              <div
                className="absolute left-[11px] top-2 bottom-2 w-px"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              />

              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isCompleted = idx < currentStep;

                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-4 py-4 px-4 rounded-xl relative transition-all"
                      style={{
                        backgroundColor: isActive ? 'rgba(255, 199, 0, 0.08)' : 'transparent',
                        border: isActive ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid transparent',
                        transitionDuration: '400ms',
                        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {/* Step number circle */}
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                        style={{
                          backgroundColor: isActive
                            ? THEME.colors.primary
                            : isCompleted
                              ? 'rgba(255, 199, 0, 0.2)'
                              : 'rgba(255, 255, 255, 0.08)',
                          color: isActive ? '#000' : isCompleted ? THEME.colors.primary : 'rgba(255, 255, 255, 0.4)',
                          transform: isActive ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: isActive ? `0 0 30px ${THEME.colors.primary}` : 'none',
                        }}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>

                      {/* Step content */}
                      <div className="flex-1 pt-1">
                        <div
                          className="text-lg font-semibold mb-2 transition-all"
                          style={{
                            fontFamily: '"Space Grotesk", "Noto Sans SC", sans-serif',
                            color: isActive
                              ? THEME.colors.primary
                              : isCompleted
                                ? 'rgba(255, 255, 255, 0.8)'
                                : 'rgba(255, 255, 255, 0.5)',
                            textShadow: isActive ? `0 0 20px ${THEME.colors.primary}40` : 'none',
                          }}
                        >
                          {step.title}
                        </div>
                        <div
                          className="text-sm leading-relaxed transition-all"
                          style={{
                            color: isActive
                              ? 'rgba(255, 255, 255, 0.7)'
                              : 'rgba(255, 255, 255, 0.4)',
                          }}
                        >
                          {step.description}
                        </div>
                      </div>

                      {/* Active indicator pulse */}
                      {isActive && (
                        <div
                          className="absolute left-[11px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: THEME.colors.primary,
                            animation: 'tutorialPulse 1.5s ease-in-out infinite',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 进度指示器 */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-sm"
                  style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                >
                  {lang === 'zh' ? '进度' : 'Progress'}
                </span>
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: THEME.colors.primary }}
                >
                  {currentStep + 1} / {steps.length}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                    background: `linear-gradient(90deg, ${THEME.colors.primary}, #FFE066)`,
                    boxShadow: `0 0 20px ${THEME.colors.primary}60`,
                  }}
                />
              </div>
            </div>

            {/* 底部提示 */}
            <div className="mt-6 text-center">
              <button
                onClick={handleClose}
                className="px-6 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-white/10"
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {lang === 'zh' ? '跳过教程' : 'Skip Tutorial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 动画样式 */}
      <style>{`
        @keyframes tutorialPulse {
          0%, 100% {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
          50% {
            opacity: 0.5;
            transform: translateY(-50%) scale(1.8);
          }
        }
      `}</style>
    </>
  );
};

export default InteractiveTutorial;

