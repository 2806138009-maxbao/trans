import React, { useRef, useState, useCallback, useEffect } from "react";
/* HMR Trigger: Force Refresh - Fixed */
import { SmithFieldBackground } from "./components/SmithFieldBackground";
import { CustomCursor } from "./components/CustomCursor";
import { SectionNavigation } from "./components/SectionNavigation";
import { Language, TRANSLATIONS } from "./types";
import { HeroSection } from "./components/sections/HeroSection";
// StepTimeline removed - content covered in Odyssey
// IntroNarrativeSection removed - content integrated into SmithOdyssey
import { PrerequisiteSection } from "./components/sections/PrerequisiteSection";
import { SmithChartExperiment } from "./components/SmithChartExperiment";

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
// GenesisExperience removed - replaced by unified intro flow
import { SmithOdyssey } from "./components/SmithOdyssey";

import { GenesisIntro } from "./components/GenesisIntro";
import { EfficiencyCard, QFactorCard, LineRotationCard } from "./components/LiveInfoCards";

const App: React.FC = () => {
  // L3 Audit: Physics Kernel & Brand System Active
  const [lang, setLang] = useState<Language>("zh");
  const [userMotionPref, setUserMotionPref] = useState<boolean | null>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  
  // Intro Flow State
  const [showGenesisIntro, setShowGenesisIntro] = useState(true);
  const [showOdyssey, setShowOdyssey] = useState(false);
  
  const experimentRef = useRef<HTMLDivElement>(null);
  const engineeringRef = useRef<HTMLDivElement>(null);
  
  const t = TRANSLATIONS[lang];
  
  // Callback when engineering mode is selected - scroll to experiment

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
      // Use native smooth scrolling for better performance
      ref.current.scrollIntoView({ 
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
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
    
    // L3 Narrative: Hidden Easter Egg - The Love Letter in Code
    console.log(
      '%cLuminousZao System Online.\n%cDedicated to the one who grounds my signals.',
      'color: #FFC700; font-size: 14px; font-weight: bold; font-family: "Space Grotesk", monospace;',
      'color: rgba(255, 255, 255, 0.6); font-size: 11px; font-family: "Space Grotesk", monospace;'
    );
    
    return () => { document.body.style.overflow = 'auto'; };
  }, []);


  // Handle Genesis Intro completion → Go to Odyssey
  const handleGenesisIntroComplete = useCallback(() => {
    setShowGenesisIntro(false);
    setShowOdyssey(true);
  }, []);

  // Handle Odyssey completion → Enter main app
  const handleOdysseyComplete = useCallback(() => {
    setShowOdyssey(false);
    document.body.style.overflow = 'auto';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const Wrapper = reducedMotion ? React.Fragment : AnimateOnScroll;

  // ========================================
  // RAUNO-TIER: Stacked Scene Manager
  // All scenes exist simultaneously, controlled by CSS transitions
  // No hard cuts, no component unmounting
  // ========================================

  return (
    <>
      {/* 
        LAYER 1: GENESIS INTRO (Conformal Mapping Animation)
        Fade in/out with opacity transition
      */}
      <div
        className="fixed inset-0 z-[10000] transition-opacity duration-1000 ease-in-out"
        style={{
          opacity: showGenesisIntro ? 1 : 0,
          pointerEvents: showGenesisIntro ? 'auto' : 'none',
          backgroundColor: '#050505',
        }}
      >
        <GenesisIntro 
          lang={lang}
          onComplete={handleGenesisIntroComplete}
          reducedMotion={reducedMotion}
        />
      </div>

      {/* 
        LAYER 2: SMITH ODYSSEY (Interactive Guided Tour)
        Slide in/out with transform transition
      */}
      <div
        className="fixed inset-0 z-[9999] transition-transform duration-1000 ease-in-out"
        style={{
          transform: showOdyssey ? 'translateY(0)' : 'translateY(100%)',
          pointerEvents: showOdyssey ? 'auto' : 'none',
          backgroundColor: '#050505',
        }}
      >
        <SmithOdyssey 
          lang={lang}
          onComplete={handleOdysseyComplete}
          reducedMotion={reducedMotion}
        />
        
        {/* Skip button */}
        <button
          onClick={handleOdysseyComplete}
          className="fixed top-5 right-6 z-[100] text-[10px] font-mono uppercase tracking-widest px-4 py-2 rounded-lg transition-all hover:bg-white/10"
          style={{ 
            color: 'rgba(255, 255, 255, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {lang === 'zh' ? '跳过' : 'Skip'}
        </button>
        
        {/* Language Toggle */}
        <button
          onClick={toggleLang}
          className="fixed top-5 right-24 z-[100] text-[10px] font-mono uppercase tracking-widest px-4 py-2 rounded-lg transition-all hover:bg-white/10"
          style={{ 
            color: 'rgba(255, 255, 255, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {lang === "en" ? "CN" : "EN"}
        </button>
      </div>

      {/* 
        LAYER 3: MAIN APPLICATION
        Always rendered, visible when other layers are hidden
      */}
      <div
        className="relative w-full min-h-screen text-white transition-opacity duration-1000 ease-in-out"
        style={{
          opacity: (!showGenesisIntro && !showOdyssey) ? 1 : 0,
          pointerEvents: (!showGenesisIntro && !showOdyssey) ? 'auto' : 'none',
          backgroundColor: THEME.colors.background,
        }}
      >
    <div 
      className="relative w-full min-h-screen text-white" 
      style={{ backgroundColor: THEME.colors.background }}
    >
      
      {showCustomCursor && <CustomCursor />}
      <SmithFieldBackground tier={tier} />
      <SectionNavigation lang={lang} reducedMotion={reducedMotion} onToggleMotion={toggleMotion} />
      {tier !== 'low' && <NoiseOverlay />}

      {/* L3 Blackout Protocol: Removed vignette - Deepen blacks instead of adding overlays */}

      {/* Top Right Controls */}
      <div className="fixed top-5 right-6 z-[60] flex items-center gap-2">
        {/* Replay Odyssey Button */}
        <button
          onClick={() => setShowOdyssey(true)}
          className="text-[11px] font-semibold tracking-wider px-4 py-2.5 md:px-3 md:py-1.5 rounded-lg hover:text-white hover:border-[#FFC700] transition-all cursor-none min-h-[44px] flex items-center justify-center gap-2 backdrop-blur-xl group"
          style={{ 
            color: THEME.colors.text.muted,
            backgroundColor: THEME.colors.overlay.glass,
            border: `1px solid ${THEME.colors.border.default}`,
          }}
          title={lang === 'zh' ? '重播教程' : 'Replay Tutorial'}
        >
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="group-hover:rotate-[-360deg] transition-transform duration-500"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span className="hidden md:inline">{lang === 'zh' ? '教程' : 'Tutorial'}</span>
        </button>
        
        {/* Language Toggle */}
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
                  <EfficiencyCard 
                    title={t.powerTitle}
                    desc={t.powerDesc}
                    lang={lang}
                  />
                  <QFactorCard 
                    title={t.qFactorTitle}
                    desc={t.qFactorDesc}
                    lang={lang}
                  />
                  <LineRotationCard 
                    title={t.lineTitle}
                    desc={t.lineDesc}
                    lang={lang}
                  />
                </div>
              </details>
            </Wrapper>

            {/* ★ Matching Steps Simulation - Interactive L-Section Design */}
            <MatchingStepsSection lang={lang} reducedMotion={reducedMotion} />
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
    </div>
    </>
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



export default App;
