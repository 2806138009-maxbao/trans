import React, { useRef, useState, useCallback, useEffect } from "react";
/* HMR Trigger: Force Refresh */
import { SmithFieldBackground } from "./components/SmithFieldBackground";
import { CustomCursor } from "./components/CustomCursor";
import { SectionNavigation } from "./components/SectionNavigation";
import { Language, TRANSLATIONS } from "./types";
import { HeroSection } from "./components/sections/HeroSection";
import { StepTimeline } from "./components/StepTimeline";
import { IntroNarrativeSection } from "./components/sections/IntroNarrativeSection";
import { PrerequisiteSection } from "./components/sections/PrerequisiteSection";
import { SmithChartExperiment } from "./components/SmithChartExperiment";
import { EngineeringAppsSection } from "./components/sections/EngineeringAppsSection";
import { SmithModeProvider, SmithMode } from "./state/smithModes";
import { RecapAndCTASection } from "./components/sections/RecapAndCTASection";
import { ImpedanceLabReadySection } from "./components/sections/ImpedanceLabReadySection";
import { usePerformanceTier } from "./hooks/usePerformanceTier";
import { TiltCard } from "./components/TiltCard";
import { SplashScreen } from "./components/SplashScreen";
import { NoiseOverlay } from "./components/NoiseOverlay";
import { THEME } from "./theme";
import { AnimateOnScroll } from "./components/AnimateOnScroll";
import { MatchingStepsSim } from "./components/MatchingStepsSim";
import { ExperimentHUDProvider } from "./hooks/useExperimentHUD";

const App: React.FC = () => {
  // L3 Audit: Physics Kernel & Brand System Active
  const [lang, setLang] = useState<Language>("zh");
  const [userMotionPref, setUserMotionPref] = useState<boolean | null>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  
  const experimentRef = useRef<HTMLDivElement>(null);
  const engineeringRef = useRef<HTMLDivElement>(null);
  
  const t = TRANSLATIONS[lang];
  
  // Callback when engineering mode is selected - scroll to experiment
  const handleEngineeringModeSelect = useCallback((mode: SmithMode) => {
    // Scroll to experiment section
    if (experimentRef.current) {
      scrollToRef(experimentRef);
    }
  }, []);
  const tier = usePerformanceTier();
  // Allow user override, otherwise use system tier
  const reducedMotion = userMotionPref !== null ? userMotionPref : tier === 'low';

  const toggleMotion = useCallback(() => {
    setUserMotionPref(prev => {
      if (prev === null) return true;
      return !prev;
    });
  }, []);

  const toggleLang = () => setLang((prev) => (prev === "en" ? "zh" : "en"));

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
        // If reduced motion, use native jump (respects system settings)
        if (reducedMotion) {
            ref.current.scrollIntoView({ behavior: 'auto' });
            return;
        }

        const target = ref.current;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY;
        const startPosition = window.scrollY;
        const distance = targetPosition - startPosition;
        const duration = 1000; // 1.0s duration
        let startTime: number | null = null;
        let animationFrameId: number;

        // Allow user to interrupt the scroll animation
        const abort = () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            window.removeEventListener('wheel', abort);
            window.removeEventListener('touchstart', abort);
            window.removeEventListener('keydown', abort);
        };

        window.addEventListener('wheel', abort, { passive: true });
        window.addEventListener('touchstart', abort, { passive: true });
        window.addEventListener('keydown', abort, { passive: true });

        function animation(currentTime: number) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            
            // L3 Standard: Unified Physics Kernel - Expo Out
            const t = Math.min(timeElapsed / duration, 1);
            const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            
            const run = ease * distance + startPosition;

            // Force 'auto' behavior to avoid conflict with CSS scroll-behavior: smooth
            window.scrollTo({ top: run, behavior: 'auto' });
            
            if (timeElapsed < duration) {
                animationFrameId = requestAnimationFrame(animation);
            } else {
                // Cleanup listeners when done
                window.removeEventListener('wheel', abort);
                window.removeEventListener('touchstart', abort);
                window.removeEventListener('keydown', abort);
            }
        }
        animationFrameId = requestAnimationFrame(animation);
    }
  };

  const showCustomCursor = !reducedMotion && tier !== 'low';

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
    document.body.style.overflowY = 'auto';
  }, []);

  useEffect(() => {
    if (!introComplete || introDismissed) return;
    const handleInteraction = () => setIntroDismissed(true);
    window.addEventListener('wheel', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('click', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('wheel', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [introComplete, introDismissed]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const Wrapper = reducedMotion ? React.Fragment : AnimateOnScroll;

  return (
    <div 
      className="relative w-full min-h-screen text-white" 
      style={{ backgroundColor: THEME.colors.background }}
    >
      
      {/* Splash Screen */}
      <div 
        className={`fixed inset-0 z-[9999] transition-transform duration-[1.5s] ${introDismissed ? '-translate-y-full' : 'translate-y-0'}`} 
        style={{ transitionTimingFunction: THEME.animation.curve }}
      >
        <SplashScreen onComplete={handleIntroComplete} />
      </div>

      {showCustomCursor && <CustomCursor />}
      <SmithFieldBackground tier={tier} />
      <SectionNavigation lang={lang} reducedMotion={reducedMotion} onToggleMotion={toggleMotion} />
      {tier !== 'low' && <NoiseOverlay />}

      {/* Vignette - Warm undertone */}
      <div
        className="fixed inset-0 pointer-events-none z-[3]"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, ${THEME.colors.overlay.vignette} 100%)` 
        }}
      />

      {/* Language Toggle - Warm surface */}
      <div className="fixed top-5 right-6 z-[60]">
        <button
          onClick={toggleLang}
          className="text-[11px] font-semibold tracking-wider px-4 py-2.5 md:px-3 md:py-1.5 rounded-lg hover:text-white transition-all cursor-none min-w-[44px] min-h-[44px] flex items-center justify-center backdrop-blur-xl"
          style={{ 
            color: THEME.colors.text.muted,
            backgroundColor: THEME.colors.overlay.glass,
            border: `1px solid ${THEME.colors.border.default}`,
          }}
        >
          {lang === "en" ? "CN" : "EN"}
        </button>
      </div>

      {/* 
        TACTIC 3: Let it Breathe
        - Container margin for "frame" effect
        - Increased section gaps
      */}
      <main 
        id="main-content" 
        className="relative z-10 flex flex-col"
        style={{ paddingBottom: THEME.spacing['3xl'] }}
      >
        {/* Hero */}
        <HeroSection
          lang={lang}
          onStart={() => scrollToRef(experimentRef)}
          onWhy={() => scrollToRef(engineeringRef)}
          reducedMotion={reducedMotion}
        />

        {/* Experiment Roadmap - Right after Hero */}
        <StepTimeline lang={lang} reducedMotion={reducedMotion} />

        {/* Chapter 0: Prerequisites - 前置知识 (Bloom Level 1: Remember) */}
        <PrerequisiteSection id="prerequisites" lang={lang} reducedMotion={reducedMotion} />

        {/* Chapter 1: Intuition - 几何直觉 (Bloom Level 2: Understand) */}
        <IntroNarrativeSection id="intuition" lang={lang} reducedMotion={reducedMotion} />

        {/* 
          SmithModeProvider wraps both Experiment and Engineering sections
          This allows mode selection in Swiss Army Knife to control the Smith Chart
        */}
        <SmithModeProvider>
          {/* Chapter 2: Experiment */}
          <div id="experiment" ref={experimentRef} className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16 space-y-12">
            <Wrapper {...(reducedMotion ? {} : { animation: 'fade-up' as const })}>
              <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  {t.experimentTitle}
            </h2>
                <p className="text-lg" style={{ color: THEME.colors.text.muted }}>
                  {t.experimentLead}
            </p>
              </div>
            </Wrapper>

            {/* HUD Provider wraps the experiment for event-driven feedback */}
            <ExperimentHUDProvider>
              <SmithChartExperiment 
                reducedMotion={reducedMotion} 
                lang={lang}
              />
            </ExperimentHUDProvider>
            
            {/* 
              注意: How To Card 和核心公式卡片已移入 SmithChartExperiment 组件
              现在是 OperationGuideCard (实时操作反馈 HUD) 和 LiveFormulaCards (实时仪表)
            */}
            
            {/* 
              进阶概念卡片 - 可折叠区域
              用户掌握基础后再展开
            */}
            <Wrapper {...(reducedMotion ? {} : { animation: 'fade-up' as const, delay: 200 })}>
              <details className="group">
                <summary 
                  className="flex items-center gap-2 cursor-pointer mb-4 py-2 select-none"
                  style={{ color: THEME.colors.text.muted }}
                >
                  <span 
                    className="w-2 h-2 rounded-full transition-transform group-open:rotate-90"
                    style={{ backgroundColor: THEME.colors.secondary }}
                  />
                  <span className="text-sm font-medium">
                    {lang === 'zh' ? '进阶概念 (点击展开)' : 'Advanced Concepts (click to expand)'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    +3
                  </span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-fade-in-up">
            <InfoCard 
                    title={t.powerTitle}
                    value={t.powerValue}
                    desc={t.powerDesc}
            />
            <InfoCard 
                    title={t.qFactorTitle}
                    value={t.qFactorValue}
                    desc={t.qFactorDesc}
            />
            <InfoCard 
                    title={t.lineTitle}
                    value={t.lineValue}
                    desc={t.lineDesc}
                  />
                </div>
              </details>
            </Wrapper>

            {/* ★ Matching Steps Simulation - Interactive L-Section Design */}
            <MatchingStepsSection lang={lang} reducedMotion={reducedMotion} />
          </div>

          {/* Chapter 3: Applications - Swiss Army Knife Mode Selector */}
          <div ref={engineeringRef}>
            <EngineeringAppsSection 
              id="application" 
              lang={lang} 
              reducedMotion={reducedMotion}
              onModeSelect={handleEngineeringModeSelect}
            />
          </div>
        </SmithModeProvider>

        {/* Chapter 4: Recap & CTA */}
        <RecapAndCTASection id="recap" lang={lang} reducedMotion={reducedMotion} />

        {/* Chapter 5: Final CTA - Impedance Lab Ready */}
        <ImpedanceLabReadySection 
          id="lab-ready" 
          lang={lang} 
          reducedMotion={reducedMotion}
          onLaunchConsole={() => {
            // Scroll to experiment section
            if (experimentRef.current) {
              scrollToRef(experimentRef);
            }
          }}
        />
      </main>
      
      <footer 
        className="w-full py-16 text-center backdrop-blur-sm"
        style={{ 
          borderTop: `1px solid ${THEME.colors.border.divider}`,
          backgroundColor: THEME.colors.overlay.glass,
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ 
              backgroundColor: THEME.colors.primary, 
              boxShadow: THEME.shadows.glow 
            }} 
          />
          <span 
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: THEME.colors.text.muted }}
          >
            {t.footerBrand}
          </span>
          </div>
        <p 
          className="text-sm"
          style={{ color: THEME.colors.text.disabled }}
        >
          {t.footerCopyright}
        </p>
      </footer>
    </div>
  );
};

/**
 * MatchingStepsSection - Interactive L-Section Matching Network Design
 * 
 * Four steps that build a complete matching trajectory on the Smith Chart
 */
const MatchingStepsSection: React.FC<{lang: Language, reducedMotion?: boolean}> = ({lang, reducedMotion}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  
  return (
    <div className="mt-16 pt-8" style={{ borderTop: `1px solid ${THEME.colors.border.divider}` }}>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: THEME.colors.primary, boxShadow: `0 0 8px ${THEME.colors.primary}` }}
          />
          <h3 className="text-lg font-semibold text-white">
            {lang === 'zh' ? '匹配网络设计：亲手走一遍轨迹' : 'Matching Network Design: Walk the Path'}
          </h3>
        </div>
        <p className="text-sm" style={{ color: THEME.colors.text.muted }}>
          {lang === 'zh' 
            ? '四步走完 L 型匹配：串联电感 → 切换导纳图 → 并联电容 → 到达圆心'
            : 'Four steps to L-section matching: Series L → Switch to Y → Shunt C → Reach center'
          }
        </p>
      </div>
      
      <MatchingStepsSim 
        activeStep={activeStep}
        onStepChange={setActiveStep}
        reducedMotion={reducedMotion}
        lang={lang}
        height={380}
      />
    </div>
  );
};

/**
 * InfoCard - Applies all 3 Design Tactics
 * 
 * 1. Warm Charcoal background (not pure grey)
 * 2. Hierarchy via Weight & Contrast
 * 3. Generous padding (Let it Breathe)
 */
const InfoCard: React.FC<{title: string, value: string, desc: string}> = ({title, value, desc}) => (
  <div 
    className="rounded-2xl transition-all duration-500 hover:scale-[1.02]"
    style={{ 
      backgroundColor: THEME.colors.surface,           // Warm surface
      border: `1px solid ${THEME.colors.border.default}`,
      padding: THEME.spacing.cardPaddingLg,            // Let it breathe
      transitionTimingFunction: THEME.animation.curve,
    }}
  >
    {/* Label: Small, uppercase, letter-spacing, LOW contrast */}
    <h3 
      className="font-mono text-[10px] uppercase mb-3"
      style={{ 
        color: THEME.colors.text.label,                // Gold-tinted label
        letterSpacing: '0.1em',
        fontWeight: 500,
      }}
    >
      {title}
    </h3>
    
    {/* Value: Large, HIGH contrast, Semi-bold */}
    <div 
      className="text-2xl font-mono mb-4"
      style={{ 
        color: THEME.colors.text.main,
        fontWeight: 600,
      }}
    >
      {value}
    </div>
    
    {/* Description: Body text, warm muted */}
    <p 
      className="text-sm leading-relaxed"
      style={{ color: THEME.colors.text.muted }}
    >
      {desc}
    </p>
  </div>
);

export default App;

        height={380}
      />
    </div>
  );
};

/**
 * InfoCard - Applies all 3 Design Tactics
 * 
 * 1. Warm Charcoal background (not pure grey)
 * 2. Hierarchy via Weight & Contrast
 * 3. Generous padding (Let it Breathe)
 */
const InfoCard: React.FC<{title: string, value: string, desc: string}> = ({title, value, desc}) => (
  <div 
    className="rounded-2xl transition-all duration-500 hover:scale-[1.02]"
    style={{ 
      backgroundColor: THEME.colors.surface,           // Warm surface
      border: `1px solid ${THEME.colors.border.default}`,
      padding: THEME.spacing.cardPaddingLg,            // Let it breathe
      transitionTimingFunction: THEME.animation.curve,
    }}
  >
    {/* Label: Small, uppercase, letter-spacing, LOW contrast */}
    <h3 
      className="font-mono text-[10px] uppercase mb-3"
      style={{ 
        color: THEME.colors.text.label,                // Gold-tinted label
        letterSpacing: '0.1em',
        fontWeight: 500,
      }}
    >
      {title}
    </h3>
    
    {/* Value: Large, HIGH contrast, Semi-bold */}
    <div 
      className="text-2xl font-mono mb-4"
      style={{ 
        color: THEME.colors.text.main,
        fontWeight: 600,
      }}
    >
      {value}
    </div>
    
    {/* Description: Body text, warm muted */}
    <p 
      className="text-sm leading-relaxed"
      style={{ color: THEME.colors.text.muted }}
    >
      {desc}
    </p>
  </div>
);

export default App;

        height={380}
      />
    </div>
  );
};

/**
 * InfoCard - Applies all 3 Design Tactics
 * 
 * 1. Warm Charcoal background (not pure grey)
 * 2. Hierarchy via Weight & Contrast
 * 3. Generous padding (Let it Breathe)
 */
const InfoCard: React.FC<{title: string, value: string, desc: string}> = ({title, value, desc}) => (
  <div 
    className="rounded-2xl transition-all duration-500 hover:scale-[1.02]"
    style={{ 
      backgroundColor: THEME.colors.surface,           // Warm surface
      border: `1px solid ${THEME.colors.border.default}`,
      padding: THEME.spacing.cardPaddingLg,            // Let it breathe
      transitionTimingFunction: THEME.animation.curve,
    }}
  >
    {/* Label: Small, uppercase, letter-spacing, LOW contrast */}
    <h3 
      className="font-mono text-[10px] uppercase mb-3"
      style={{ 
        color: THEME.colors.text.label,                // Gold-tinted label
        letterSpacing: '0.1em',
        fontWeight: 500,
      }}
    >
      {title}
    </h3>
    
    {/* Value: Large, HIGH contrast, Semi-bold */}
    <div 
      className="text-2xl font-mono mb-4"
      style={{ 
        color: THEME.colors.text.main,
        fontWeight: 600,
      }}
    >
      {value}
    </div>
    
    {/* Description: Body text, warm muted */}
    <p 
      className="text-sm leading-relaxed"
      style={{ color: THEME.colors.text.muted }}
    >
      {desc}
    </p>
  </div>
);

export default App;