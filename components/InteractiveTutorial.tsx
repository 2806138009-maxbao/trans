import React, { useEffect, useRef, useState } from 'react';
import { THEME } from '../theme';
import { useExperimentHUD, HudEvent } from '../hooks/useExperimentHUD';

interface InteractiveTutorialProps {
  lang: 'en' | 'zh';
  onComplete?: () => void;
  /** 是否在组件挂载时立即显示教程（不等待滚动） */
  autoStart?: boolean;
}

/**
 * InteractiveTutorial - 交互式教程演示（弹窗形式）
 * 当用户滚动到这个部分时，自动弹出分步骤教程模态框
 * 等待用户完成操作后才切换到下一步
 */
export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({ 
  lang, 
  onComplete,
  autoStart = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { lastEvent, eventTimestamp } = useExperimentHUD();
  const [showCurrentStep, setShowCurrentStep] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [stepCompleted, setStepCompleted] = useState(false);
  const lastEventTimestampRef = useRef(0);

  // 自动启动模式：组件挂载后延迟显示
  useEffect(() => {
    if (autoStart && !hasShown) {
      const timer = setTimeout(() => {
        setShowCurrentStep(true);
        setHasShown(true);
      }, 1000); // 延迟1秒显示，让页面先加载完成

      return () => clearTimeout(timer);
    }
  }, [autoStart, hasShown]);

  // 检测滚动位置（仅在非自动启动模式下使用）
  useEffect(() => {
    if (autoStart) return; // 自动启动模式下不使用滚动检测

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3 && !hasShown) {
            setShowCurrentStep(true);
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
  }, [hasShown, autoStart]);

  // 教程步骤 - 每个步骤对应一个操作事件
  const steps = lang === 'zh' ? [
    {
      title: '悬停光标',
      description: '将鼠标悬停在史密斯圆图上，观察实时阻抗读数',
      requiredEvent: 'pointerHover' as HudEvent,
    },
    {
      title: '拖动滑块',
      description: '使用滑块精确控制阻抗值，观察圆图上的点如何移动',
      requiredEvent: 'sliderDrag' as HudEvent,
    },
    {
      title: '切换导纳',
      description: '点击导纳模式切换，从串联视角切换到并联视角',
      requiredEvent: 'modeToggle' as HudEvent,
    },
    {
      title: '完美匹配',
      description: '将阻抗点拖到圆心（50Ω），实现完美匹配',
      requiredEvent: 'nearPerfectMatch' as HudEvent,
    },
  ] : [
    {
      title: 'Hover Cursor',
      description: 'Hover over the Smith Chart to see real-time impedance readings',
      requiredEvent: 'pointerHover' as HudEvent,
    },
    {
      title: 'Drag Slider',
      description: 'Use sliders to precisely control impedance values',
      requiredEvent: 'sliderDrag' as HudEvent,
    },
    {
      title: 'Toggle Admittance',
      description: 'Switch between impedance (Z) and admittance (Y) views',
      requiredEvent: 'modeToggle' as HudEvent,
    },
    {
      title: 'Perfect Match',
      description: 'Drag the point to the center (50Ω) for perfect matching',
      requiredEvent: 'nearPerfectMatch' as HudEvent,
    },
  ];

  // 监听用户操作 - 当用户完成当前步骤的操作后，切换到下一步
  useEffect(() => {
    if (!showCurrentStep || isDismissed || stepCompleted) return;

    const currentStepData = steps[currentStep];
    if (!currentStepData) return;

    // 检查是否触发了当前步骤要求的操作
    if (lastEvent === currentStepData.requiredEvent && eventTimestamp > lastEventTimestampRef.current) {
      lastEventTimestampRef.current = eventTimestamp;
      setStepCompleted(true);

      // 延迟后切换到下一步
      const timer = setTimeout(() => {
        setShowCurrentStep(false);
        setStepCompleted(false);

        setTimeout(() => {
          if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            setShowCurrentStep(true);
          } else {
            // 所有步骤完成
            setIsDismissed(true);
            onComplete?.();
          }
        }, 300); // 300ms 的关闭动画时间
      }, 1500); // 显示完成状态1.5秒后切换

      return () => clearTimeout(timer);
    }
  }, [showCurrentStep, currentStep, isDismissed, stepCompleted, lastEvent, eventTimestamp, steps, onComplete]);

  // 当切换到新步骤时，重置完成状态
  useEffect(() => {
    if (showCurrentStep) {
      setStepCompleted(false);
      lastEventTimestampRef.current = 0;
    }
  }, [currentStep, showCurrentStep]);

  const handleClose = () => {
    setShowCurrentStep(false);
    setIsDismissed(true);
    onComplete?.();
  };

  const handleNext = () => {
    setShowCurrentStep(false);
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setShowCurrentStep(true);
      } else {
        setIsDismissed(true);
        onComplete?.();
      }
    }, 300);
  };

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* 隐藏的触发器 - 用于检测滚动位置 */}
      <div ref={containerRef} className="h-1 w-full" />

      {/* 单个步骤的小弹窗 - 定位在右上角 */}
      {showCurrentStep && !isDismissed && currentStepData && (
        <div
          className="fixed top-6 right-6 z-[10000] w-96 max-w-[calc(100vw-3rem)]"
          style={{
            animation: showCurrentStep ? 'tutorialSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'tutorialSlideOut 0.3s ease-in',
          }}
        >
          <div
            className="relative rounded-xl p-6"
            style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.15)',
            }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* 步骤编号和标题 */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  backgroundColor: stepCompleted ? '#4ade80' : THEME.colors.primary,
                  color: stepCompleted ? '#000' : '#000',
                  boxShadow: stepCompleted 
                    ? `0 0 20px #4ade80` 
                    : `0 0 20px ${THEME.colors.primary}`,
                  transform: stepCompleted ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {stepCompleted ? '✓' : currentStep + 1}
              </div>
              <div className="flex-1 pt-1">
                <h3
                  className="text-lg font-semibold mb-1 transition-all"
                  style={{
                    fontFamily: '"Space Grotesk", "Noto Sans SC", sans-serif',
                    color: stepCompleted ? '#4ade80' : THEME.colors.primary,
                    textShadow: stepCompleted 
                      ? `0 0 20px #4ade8040` 
                      : `0 0 20px ${THEME.colors.primary}40`,
                  }}
                >
                  {stepCompleted 
                    ? (lang === 'zh' ? '完成！' : 'Completed!')
                    : currentStepData.title}
                </h3>
                <p
                  className="text-sm leading-relaxed transition-all"
                  style={{ 
                    color: stepCompleted 
                      ? 'rgba(74, 222, 128, 0.8)' 
                      : 'rgba(255, 255, 255, 0.7)' 
                  }}
                >
                  {stepCompleted
                    ? (lang === 'zh' 
                        ? '操作已识别，即将进入下一步...' 
                        : 'Action detected, moving to next step...')
                    : currentStepData.description}
                </p>
              </div>
            </div>

            {/* 进度指示器 */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs"
                  style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                >
                  {lang === 'zh' ? '步骤' : 'Step'} {currentStep + 1} / {steps.length}
                </span>
                <div className="flex gap-1">
                  {steps.map((_, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{
                        backgroundColor: idx <= currentStep ? THEME.colors.primary : 'rgba(255, 255, 255, 0.2)',
                        boxShadow: idx === currentStep ? `0 0 8px ${THEME.colors.primary}` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                    background: `linear-gradient(90deg, ${THEME.colors.primary}, #FFE066)`,
                    boxShadow: `0 0 10px ${THEME.colors.primary}60`,
                  }}
                />
              </div>
            </div>

            {/* 操作按钮 - 完成时隐藏 */}
            {!stepCompleted && (
              <div className="mt-4 flex gap-2">
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-white/10"
                    style={{
                      color: THEME.colors.primary,
                      border: `1px solid ${THEME.colors.primary}40`,
                    }}
                  >
                    {lang === 'zh' ? '下一步' : 'Next'}
                  </button>
                ) : (
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-white/10"
                    style={{
                      color: THEME.colors.primary,
                      border: `1px solid ${THEME.colors.primary}40`,
                    }}
                  >
                    {lang === 'zh' ? '完成' : 'Complete'}
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/10"
                  style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {lang === 'zh' ? '跳过' : 'Skip'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 动画样式 */}
      <style>{`
        @keyframes tutorialSlideIn {
          from {
            opacity: 0;
            transform: translateX(100%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }
        
        @keyframes tutorialSlideOut {
          from {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%) translateY(-20px);
          }
        }
      `}</style>
    </>
  );
};

export default InteractiveTutorial;

